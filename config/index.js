require("dotenv").config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.URL,
  JWT_SIGN: process.env.JWT_SIGN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: "https://tight-adorne-pulsekein-43f4bedf.koyeb.app/auth/callback",
  REDIRECT_URL: "https://splitter-friend.netlify.app/main",
};
