const webpush = require('web-push');
const User = require('../models/User');

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-5ME8oZk7_Z_XhL0z8y3mH0';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'lP7Yy1Z9rW_mG8f-e4A4Sj6G7L7H4Vz2q-0mE0P-AQU'; // Random valid length private key

try {
  webpush.setVapidDetails('mailto:test@test.com', publicVapidKey, privateVapidKey);
} catch (e) {
  console.log('Failed to set Vapid details: ', e.message);
}

exports.subscribe = async (req, res) => {
  try {
    const subscription = req.body;
    const user = await User.findById(req.user._id);

    // add if not exists
    const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json({});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions) return;

    for (let sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          // subscription expired or is invalid
          user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
          await user.save();
        }
      }
    }
  } catch (err) {
    console.error('Error sending push notification', err);
  }
};
