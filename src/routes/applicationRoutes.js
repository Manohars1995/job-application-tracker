const express = require("express");

const upload = require("../config/upload");

const {
  getApplications,
  getDashboard,
  createApplication,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");

const router = express.Router();

// ==========================================
// GET ALL APPLICATIONS
// ==========================================

router.get(
  "/",
  getApplications
);

// ==========================================
// GET DASHBOARD STATISTICS
// ==========================================

router.get(
  "/dashboard",
  getDashboard
);

// ==========================================
// CREATE APPLICATION
// Supports multiple images
// Field name:
// jobDescriptionImages
// ==========================================

router.post(
  "/",
  upload.array(
    "jobDescriptionImages",
    10
  ),
  createApplication
);

// ==========================================
// UPDATE APPLICATION
// Supports additional images
// ==========================================

router.put(
  "/:id",
  upload.array(
    "jobDescriptionImages",
    10
  ),
  updateApplication
);

// ==========================================
// DELETE APPLICATION
// ==========================================

router.delete(
  "/:id",
  deleteApplication
);

module.exports = router;