const express = require("express");
const router = express.Router();
const passport = require("passport");
const { NODE_ENV, REDIRECT_URL } = require("../config/index");
const { generateJWT } = require("../middlewares/jwt.middleware");
const { login, signup, logout } = require("../controllers/auth.controller");


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/auth/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user;
    const token = generateJWT({ id: user._id, name: user.name, email: user.email });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.redirect(REDIRECT_URL);
  }
);

router.post("/login", login);
router.post("/signup", signup);
router.post("/logout", logout);

module.exports = router;