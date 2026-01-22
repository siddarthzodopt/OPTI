const express = require("express");
const { chatWithExcel } = require("../controllers/chatController");

const router = express.Router();

router.post("/", chatWithExcel);

module.exports = router;
