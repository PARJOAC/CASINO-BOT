const mongoose = require("mongoose");

const StatusSchema = new mongoose.Schema({
  statusBot: { type: Boolean, required: true, default: false },
});

const Status = mongoose.model("Status", StatusSchema);
module.exports = Status;
