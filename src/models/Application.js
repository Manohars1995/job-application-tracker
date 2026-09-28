const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC APPLICATION DETAILS
    // ==========================================

    date: {
      type: Date,
      required: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfApply: {
      type: Date,
      required: true,
    },

    // ==========================================
    // HR DETAILS
    // ==========================================

    hrName: {
      type: String,
      trim: true,
      default: "",
    },

    hrContact: {
      type: String,
      trim: true,
      default: "",
    },

    hrLinkedInId: {
      type: String,
      trim: true,
      default: "",
    },

    companyEmail: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // LOCATION
    // ==========================================

    city: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // APPLICATION STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "Applied",
        "Cancelled",
        "In Review",
        "No Result",
      ],
      default: "Applied",
    },

    applicationStatus: {
      type: String,
      enum: [
        "In Review",
        "Shortlisted",
        "Rejected",
        "No Result",
      ],
      default: "In Review",
    },

    // ==========================================
    // JOB DETAILS
    // ==========================================

    jobDescription: {
      type: String,
      trim: true,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    jobPlatform: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // LINKEDIN MESSAGE
    // ==========================================

    hrMessageDraft: {
      type: String,
      trim: true,
      default: "",
    },

    hrMessageSent: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    // ==========================================
    // FOLLOW-UP
    // ==========================================

    followUp: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    // ==========================================
    // JOB DESCRIPTION SCREENSHOTS
    // ==========================================

    jobDescriptionImages: [
      {
        url: {
          type: String,
          required: true,
        },

        originalName: {
          type: String,
          default: "",
        },
      },
    ],
  },

  {
    timestamps: true,
  }
);

// ==========================================
// TEXT SEARCH INDEX
// ==========================================

ApplicationSchema.index({
  companyName: "text",
  hrName: "text",
  hrContact: "text",
  hrLinkedInId: "text",
  city: "text",
  companyEmail: "text",
  jobDescription: "text",
  hrMessageDraft: "text",
  skills: "text",
  jobPlatform: "text",
});

module.exports = mongoose.model(
  "Application",
  ApplicationSchema
);