const express = require('express');
const router = express.Router();
const pushController = require('../controllers/push.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/subscribe', requireAuth, pushController.subscribe);

module.exports = router;
