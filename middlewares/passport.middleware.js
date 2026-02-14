const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = require("../config");

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ google_id: profile.id });
        if (!user) {
          user = await User.create({
            google_id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          });
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);