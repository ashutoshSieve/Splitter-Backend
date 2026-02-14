const express = require("express");
const router = express.Router();
const { jsonwebtoken } = require("../middlewares/jwt.middleware");
const {
  createCommunity,
  getCommunity,
  commAddExpense,
  commDelete,
  todayExpense,
  commHistory,
  readInDetails
} = require("../controllers/community.controller");

router.post("/createCommunity", jsonwebtoken, createCommunity);
router.get("/community/:name", jsonwebtoken, getCommunity);
router.post("/commAddExpense/:name", jsonwebtoken, commAddExpense);
router.delete("/commDeleteExpense/:name", jsonwebtoken, commDelete);
router.get("/todayExpense/:name", jsonwebtoken, todayExpense);
router.get("/commHistory/:name", jsonwebtoken, commHistory);
router.get("/readInDetails/:name/:ID", readInDetails);

module.exports = router;