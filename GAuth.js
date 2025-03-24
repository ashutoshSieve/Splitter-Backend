require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/callback",
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
