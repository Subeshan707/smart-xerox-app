const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', walletController.getWallet);
router.post('/topup', walletController.createTopUpOrder);
router.post('/verify', walletController.verifyTopUpPayment);

module.exports = router;
