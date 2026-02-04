const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../shared/models/user.model');
const config = require('./config');
const logger = require('../core/logger.js');

passport.use(new GoogleStrategy({
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: config.googleRedirectUri,
    scope: ['profile', 'email'],
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      if (!profile.emails || !profile.emails[0]) {
        return done(new Error('No email found in Google profile'), null);
      }
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        return done(null, { user, isNewUser: false });
      }

      const userInfo = {
        email: profile.emails[0].value,
        firstName: profile.name.givenName || '',
        lastName: profile.name.familyName || '',
        googleId: profile.id
      };

      logger.info(`Google login: new user ${userInfo.email}`);
      return done(null, { userInfo, isNewUser: true });

    } catch (error) {
      logger.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

module.exports = passport;