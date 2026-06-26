const router = require('express').Router();
const { register, login, getMe, forgotPassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);

module.exports = router;