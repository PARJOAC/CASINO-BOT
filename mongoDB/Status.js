const mongoose = require("mongoose");

const StatusSchema = new mongoose.Schema({
  statusBot: { type: Boolean, required: true, default: false },
  maintenanceStartTime: { type: Number, default: 0 },
});

const Status = mongoose.model("Status", StatusSchema);
module.exports = Status;
