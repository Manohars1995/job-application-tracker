const express = require("express");

const Setting = require("../models/Setting");

const router = express.Router();

// ==========================================
// GET SETTINGS
// ==========================================

router.get("/", async (req, res) => {
  try {
    const settings = await Setting.find()
      .sort({
        type: 1,
        name: 1,
      })
      .lean();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error(
      "Get Settings Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// CREATE CUSTOM SETTING
// ==========================================

router.post("/", async (req, res) => {
  try {
    const { type, name } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message:
          "Type and name are required",
      });
    }

    if (
      !["skill", "platform"].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Type must be skill or platform",
      });
    }

    const cleanName = name.trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    const setting =
      await Setting.create({
        type,
        name: cleanName,
      });

    const io = req.app.get("io");

    if (io) {
      io.emit("settings:changed");
    }

    res.status(201).json({
      success: true,
      message:
        "Custom setting created successfully",
      data: setting,
    });
  } catch (error) {
    console.error(
      "Create Setting Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This item already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;