const Stripe = require('stripe');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const PaymentWebhookEvent = require('../models/PaymentWebhookEvent');
const {
  getRazorpayClient,
  getStripeClient,
  getClientUrl,
  markPaymentPaid,
  markPaymentFailed,
  applyRefundState,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
  generateInvoicePdf,
} = require('../services/payment.service');

const getDocumentId = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const isOperatorForBooking = (req, booking) =>
  req.user.role === 'shopOperator' && getDocumentId(booking.shopId) === getDocumentId(req.user.shopId);

const isCustomerForBooking = (req, booking) =>
  getDocumentId(booking.customerId) === getDocumentId(req.user._id);

const canAccessBooking = (req, booking) =>
  isCustomerForBooking(req, booking) || isOperatorForBooking(req, booking);

const getIdempotencyKey = (req, fallback) =>
  req.get('Idempotency-Key') || req.get('x-idempotency-key') || fallback;

const getBookingForPayment = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return null;
  }
  if (!isCustomerForBooking(req, booking)) {
    res.status(403).json({ error: 'Only the booking customer can start payment' });
    return null;
  }
  if (booking.paymentStatus === 'paid') {
    res.status(409).json({ error: 'Booking is already paid' });
    return null;
  }
  return booking;
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const booking = await getBookingForPayment(req, res);
    if (!booking) return;

    const idempotencyKey = getIdempotencyKey(req, `razorpay:${booking._id}:${booking.totalPrice}`);
    const existingPayment = await Payment.findOne({ idempotencyKey });
    if (existingPayment?.providerOrderId) {
      return res.json({
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: existingPayment._id,
        orderId: existingPayment.providerOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        bookingId: booking._id,
      });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: booking.totalPrice,
      currency: 'INR',
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        customerId: booking.customerId.toString(),
        shopId: booking.shopId.toString(),
      },
    });

    const payment = await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      shopId: booking.shopId,
      provider: 'razorpay',
      providerOrderId: order.id,
      amount: booking.totalPrice,
      currency: order.currency || 'INR',
      idempotencyKey,
      gatewayResponse: order,
    });

    booking.paymentProvider = 'razorpay';
    booking.paymentOrderId = order.id;
    await booking.save();

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      bookingId: booking._id,
    });
  } catch (err) {
    res.status(err.message.includes('configured') ? 503 : 500).json({ error: err.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay verification fields' });
    }

    const valid = verifyRazorpayCheckoutSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) return res.status(400).json({ error: 'Invalid payment signature' });

    const payment = await Payment.findOne({ provider: 'razorpay', providerOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });
    if (payment.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await markPaymentPaid(payment, {
      id: razorpay_payment_id,
      order_id: razorpay_order_id,
      signatureVerified: true,
    });

    res.json({
      message: 'Payment verified',
      bookingId: result.booking._id,
      paymentStatus: result.booking.paymentStatus,
      invoiceNumber: result.payment.invoiceNumber,
    });
  } catch (err) {
    res.status(err.message.includes('configured') ? 503 : 500).json({ error: err.message });
  }
};

exports.createStripeCheckoutSession = async (req, res) => {
  try {
    const booking = await getBookingForPayment(req, res);
    if (!booking) return;

    const stripe = getStripeClient();
    const idempotencyKey = getIdempotencyKey(req, `stripe:${booking._id}:${booking.totalPrice}`);
    const existingPayment = await Payment.findOne({ idempotencyKey });
    if (existingPayment?.providerSessionId) {
      const session = await stripe.checkout.sessions.retrieve(existingPayment.providerSessionId);
      return res.json({
        paymentId: existingPayment._id,
        sessionId: session.id,
        url: session.url,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      });
    }

    const clientUrl = getClientUrl(req);
    const payment = await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      shopId: booking.shopId,
      provider: 'stripe',
      amount: booking.totalPrice,
      currency: 'INR',
      idempotencyKey,
      status: 'requires_action',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `Print booking #${booking.tokenNumber}`,
            description: booking.jobConfig?.fileName || 'Document print job',
          },
          unit_amount: booking.totalPrice,
        },
        quantity: 1,
      }],
      metadata: {
        bookingId: booking._id.toString(),
        paymentId: payment._id.toString(),
      },
      payment_intent_data: {
        metadata: {
          bookingId: booking._id.toString(),
          paymentId: payment._id.toString(),
        },
      },
      success_url: `${clientUrl}/app/queue/${booking._id}?payment=stripe_success`,
      cancel_url: `${clientUrl}/app/queue/${booking._id}?payment=stripe_cancelled`,
    }, { idempotencyKey });

    payment.providerSessionId = session.id;
    payment.gatewayResponse = session;
    await payment.save();

    booking.paymentProvider = 'stripe';
    booking.paymentSessionId = session.id;
    await booking.save();

    res.status(201).json({
      paymentId: payment._id,
      sessionId: session.id,
      url: session.url,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    res.status(err.message.includes('configured') ? 503 : 500).json({ error: err.message });
  }
};

exports.payWithWallet = async (req, res) => {
  try {
    const booking = await getBookingForPayment(req, res);
    if (!booking) return;

    const User = require('../models/User');
    const Transaction = require('../models/Transaction');
    
    const user = await User.findById(req.user._id);
    if (!user.walletBalance || user.walletBalance < booking.totalPrice) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    const idempotencyKey = getIdempotencyKey(req, `wallet:${booking._id}:${booking.totalPrice}`);
    const existingPayment = await Payment.findOne({ idempotencyKey });
    if (existingPayment?.status === 'paid') {
      return res.json({ success: true, bookingId: booking._id, paymentStatus: 'paid' });
    }

    // Deduct from wallet
    user.walletBalance -= booking.totalPrice;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      amount: booking.totalPrice,
      type: 'deduction',
      status: 'completed',
      paymentProvider: 'wallet',
      referenceId: booking._id.toString(),
      description: `Payment for booking #${booking.tokenNumber}`,
    });
    await transaction.save();

    const payment = await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      shopId: booking.shopId,
      provider: 'wallet',
      amount: booking.totalPrice,
      currency: 'INR',
      idempotencyKey,
      status: 'paid',
      paidAt: new Date(),
    });

    booking.paymentProvider = 'wallet';
    booking.paymentStatus = 'paid';
    booking.paidAt = new Date();
    await booking.save();

    res.json({ success: true, bookingId: booking._id, paymentStatus: 'paid', newBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.get('x-razorpay-signature');
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const eventType = req.body.event;
    const entity = req.body.payload?.payment?.entity || req.body.payload?.refund?.entity || {};
    const eventId = req.get('x-razorpay-event-id') || `${eventType}:${entity.id || Date.now()}`;

    const webhookEvent = await PaymentWebhookEvent.findOneAndUpdate(
      { provider: 'razorpay', eventId },
      {
        $set: {
          provider: 'razorpay',
          eventId,
          eventType,
          signature,
          payload: req.body,
        },
        $setOnInsert: { processedAt: null },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (webhookEvent.processedAt) return res.json({ received: true, duplicate: true });

    if (eventType === 'payment.captured') {
      const payment = await Payment.findOne({
        provider: 'razorpay',
        $or: [
          { providerPaymentId: entity.id },
          { providerOrderId: entity.order_id },
        ],
      });
      if (payment) await markPaymentPaid(payment, entity);
    }

    if (eventType === 'payment.failed') {
      const payment = await Payment.findOne({ provider: 'razorpay', providerOrderId: entity.order_id });
      if (payment) await markPaymentFailed(payment, entity.error_description || 'Razorpay payment failed', entity);
    }

    if (eventType === 'refund.processed') {
      const payment = await Payment.findOne({ provider: 'razorpay', providerPaymentId: entity.payment_id });
      if (payment) {
        const refund = payment.refunds.find((item) => item.providerRefundId === entity.id);
        if (refund) {
          refund.status = 'processed';
          refund.processedAt = new Date();
          refund.gatewayResponse = entity;
        } else {
          payment.refunds.push({
            providerRefundId: entity.id,
            amount: entity.amount,
            status: 'processed',
            processedAt: new Date(),
            gatewayResponse: entity,
          });
        }
        await applyRefundState(payment);
      }
    }

    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    res.json({ received: true });
  } catch (err) {
    res.status(err.message.includes('configured') ? 503 : 500).json({ error: err.message });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const signature = req.get('stripe-signature');
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Stripe webhook secret is not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    const webhookEvent = await PaymentWebhookEvent.findOneAndUpdate(
      { provider: 'stripe', eventId: event.id },
      {
        $set: {
          provider: 'stripe',
          eventId: event.id,
          eventType: event.type,
          signature,
          payload: event,
        },
        $setOnInsert: { processedAt: null },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (webhookEvent.processedAt) return res.json({ received: true, duplicate: true });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const payment = await Payment.findById(session.metadata?.paymentId)
        || await Payment.findOne({ provider: 'stripe', providerSessionId: session.id });
      if (payment && session.payment_status === 'paid') {
        payment.providerPaymentIntentId = session.payment_intent;
        await markPaymentPaid(payment, session);
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const payment = await Payment.findById(intent.metadata?.paymentId)
        || await Payment.findOne({ provider: 'stripe', providerPaymentIntentId: intent.id });
      if (payment) {
        payment.providerPaymentIntentId = intent.id;
        await markPaymentPaid(payment, intent);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const payment = await Payment.findById(intent.metadata?.paymentId)
        || await Payment.findOne({ provider: 'stripe', providerPaymentIntentId: intent.id });
      if (payment) {
        await markPaymentFailed(payment, intent.last_payment_error?.message || 'Stripe payment failed', intent);
      }
    }

    if (event.type === 'refund.updated' || event.type === 'charge.refunded') {
      const object = event.data.object;
      const paymentIntentId = object.payment_intent;
      const payment = await Payment.findOne({ provider: 'stripe', providerPaymentIntentId: paymentIntentId });
      if (payment) {
        const refundId = object.id;
        const refund = payment.refunds.find((item) => item.providerRefundId === refundId);
        if (refund) {
          refund.status = object.status === 'succeeded' ? 'processed' : 'pending';
          refund.processedAt = object.status === 'succeeded' ? new Date() : undefined;
          refund.gatewayResponse = object;
        }
        await applyRefundState(payment, refund);
      }
    }

    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    res.json({ received: true });
  } catch (err) {
    res.status(err.message.includes('configured') ? 503 : 500).json({ error: err.message });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!canAccessBooking(req, booking)) return res.status(403).json({ error: 'Access denied' });

    const payment = await Payment.findOne({ bookingId: booking._id }).sort({ createdAt: -1 });
    res.json({
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus,
      paymentProvider: booking.paymentProvider,
      invoiceNumber: booking.invoiceNumber,
      paidAt: booking.paidAt,
      amountRefunded: booking.amountRefunded,
      payment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!isOperatorForBooking(req, booking)) return res.status(403).json({ error: 'Operator access required' });

    const payment = await Payment.findOne({ bookingId: booking._id, status: { $in: ['paid', 'partially_refunded'] } })
      .sort({ createdAt: -1 });
    if (!payment) return res.status(404).json({ error: 'No paid payment found for this booking' });

    const remainingAmount = payment.amount - (payment.amountRefunded || 0);
    const amount = Number(req.body.amount || remainingAmount);
    if (!Number.isInteger(amount) || amount <= 0 || amount > remainingAmount) {
      return res.status(400).json({ error: 'Invalid refund amount' });
    }

    const reason = req.body.reason || 'Operator refund';
    let refundResponse;
    let refundStatus = 'pending';

    if (payment.provider === 'razorpay') {
      const razorpay = getRazorpayClient();
      if (!payment.providerPaymentId) return res.status(400).json({ error: 'Razorpay payment ID is missing' });
      refundResponse = await razorpay.payments.refund(payment.providerPaymentId, {
        amount,
        notes: { bookingId: booking._id.toString(), reason },
      });
      refundStatus = refundResponse.status === 'processed' ? 'processed' : 'pending';
    } else {
      const stripe = getStripeClient();
      if (!payment.providerPaymentIntentId) return res.status(400).json({ error: 'Stripe payment intent is missing' });
      refundResponse = await stripe.refunds.create({
        payment_intent: payment.providerPaymentIntentId,
        amount,
        reason: 'requested_by_customer',
        metadata: { bookingId: booking._id.toString(), reason },
      }, {
        idempotencyKey: getIdempotencyKey(req, `refund:${payment._id}:${amount}:${remainingAmount}`),
      });
      refundStatus = refundResponse.status === 'succeeded' ? 'processed' : 'pending';
    }

    const refundRecord = {
      providerRefundId: refundResponse.id,
      amount,
      status: refundStatus,
      reason,
      gatewayResponse: refundResponse,
      processedAt: refundStatus === 'processed' ? new Date() : undefined,
    };
    payment.refunds.push(refundRecord);
    await applyRefundState(payment, refundRecord);

    res.status(201).json({
      message: refundStatus === 'processed' ? 'Refund processed' : 'Refund initiated',
      paymentStatus: payment.status,
      refund: refundRecord,
    });
  } catch (err) {
    res.status(err.message.includes('configured') ? 503 : 500).json({ error: err.message });
  }
};

exports.reconcilePayments = async (req, res) => {
  try {
    if (req.user.role !== 'shopOperator') {
      return res.status(403).json({ error: 'Operator access required' });
    }

    const payments = await Payment.find({
      shopId: req.user.shopId,
      status: { $in: ['created', 'requires_action', 'authorized', 'refund_pending'] },
    }).sort({ createdAt: -1 }).limit(100);

    const summary = { checked: payments.length, paid: 0, failed: 0, refunded: 0, skipped: 0, errors: [] };

    for (const payment of payments) {
      try {
        if (payment.provider === 'razorpay') {
          const razorpay = getRazorpayClient();
          if (payment.providerPaymentId) {
            const gatewayPayment = await razorpay.payments.fetch(payment.providerPaymentId);
            if (gatewayPayment.status === 'captured') {
              await markPaymentPaid(payment, gatewayPayment);
              summary.paid += 1;
            } else if (gatewayPayment.status === 'failed') {
              await markPaymentFailed(payment, gatewayPayment.error_description, gatewayPayment);
              summary.failed += 1;
            } else {
              summary.skipped += 1;
            }
          } else if (payment.providerOrderId) {
            const gatewayPayments = await razorpay.orders.fetchPayments(payment.providerOrderId);
            const captured = gatewayPayments.items?.find((item) => item.status === 'captured');
            if (captured) {
              payment.providerPaymentId = captured.id;
              await markPaymentPaid(payment, captured);
              summary.paid += 1;
            } else {
              summary.skipped += 1;
            }
          }
        } else {
          const stripe = getStripeClient();
          let paymentIntent = null;
          if (payment.providerPaymentIntentId) {
            paymentIntent = await stripe.paymentIntents.retrieve(payment.providerPaymentIntentId);
          } else if (payment.providerSessionId) {
            const session = await stripe.checkout.sessions.retrieve(payment.providerSessionId);
            payment.providerPaymentIntentId = session.payment_intent;
            paymentIntent = session.payment_intent
              ? await stripe.paymentIntents.retrieve(session.payment_intent)
              : null;
          }

          if (paymentIntent?.status === 'succeeded') {
            await markPaymentPaid(payment, paymentIntent);
            summary.paid += 1;
          } else if (paymentIntent?.status === 'canceled') {
            await markPaymentFailed(payment, 'Stripe payment cancelled', paymentIntent);
            summary.failed += 1;
          } else {
            summary.skipped += 1;
          }
        }

        payment.reconciledAt = new Date();
        await payment.save();
      } catch (err) {
        summary.errors.push({ paymentId: payment._id, error: err.message });
      }
    }

    res.json(summary);
  } catch (err) {
    res.status(err.message.includes('configured') ? 503 : 500).json({ error: err.message });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('customerId', 'name email phone');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!canAccessBooking(req, booking)) return res.status(403).json({ error: 'Access denied' });

    const payment = await Payment.findOne({
      bookingId: booking._id,
      status: { $in: ['paid', 'partially_refunded', 'refunded'] },
    }).sort({ createdAt: -1 });
    if (!payment) return res.status(404).json({ error: 'No paid payment found for invoice' });

    if (!payment.invoiceNumber) {
      const { issueInvoice } = require('../services/payment.service');
      await issueInvoice(booking, payment);
    }

    const pdf = await generateInvoicePdf(booking, payment);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${payment.invoiceNumber}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
