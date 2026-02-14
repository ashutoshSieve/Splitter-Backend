require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const app = express();


app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(passport.initialize());
app.use(cookieParser());


require("./middlewares/passport.middleware");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const communityRoutes = require("./routes/community.routes");

app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", communityRoutes);

const errorHandler = require("./middlewares/errorHandler.middleware");
app.use(errorHandler);

module.exports = app;