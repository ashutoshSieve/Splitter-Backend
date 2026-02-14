const jwt = require("jsonwebtoken");
const {JWT_SIGN} = require("../config");

const jsonwebtoken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ redirect: "/" });
  }

  try {
    const data = jwt.verify(token, JWT_SIGN);
    req.payload = data;
    next();
  } catch (error) {
    console.log(err);
    return res.status(401).json({ redirect: "/" });
  }
};

const generateJWT = (userData) => {
  return jwt.sign(userData, JWT_SIGN, { expiresIn: "1d" });
};

module.exports = { jsonwebtoken, generateJWT };