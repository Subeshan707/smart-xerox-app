const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

function configurePassport(app) {
  // Only configure if credentials are present
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === '...') {
    console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID)');
    return;
  }

  app.use(passport.initialize());

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Check if email already exists
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
              // Link Google to existing account
              user.googleId = profile.id;
              await user.save();
            } else {
              // Create new user
              user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                password: Math.random().toString(36).slice(-12), // Random password for OAuth users
                role: 'customer',
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // Google OAuth routes
  app.get(
    '/api/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })
  );

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
      const token = jwt.sign(
        { userId: req.user._id, role: req.user.role, shopId: req.user.shopId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      // Redirect to frontend with token
      res.redirect(`http://localhost:5173/login?token=${token}`);
    }
  );

  console.log('✅ Google OAuth configured');
}

module.exports = { configurePassport };
