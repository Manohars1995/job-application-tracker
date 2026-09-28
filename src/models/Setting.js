const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["skill", "platform"],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

SettingSchema.index(
  {
    type: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Setting",
  SettingSchema
);