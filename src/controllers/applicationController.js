const Application = require("../models/Application");

// ==========================================
// HELPER
// ==========================================

const parseSkills = (skills) => {
  if (!skills) {
    return [];
  }

  // Already an array
  if (Array.isArray(skills)) {
    return skills
      .map((skill) =>
        String(skill).trim()
      )
      .filter(Boolean);
  }

  // JSON array sent through FormData
  if (
    typeof skills === "string" &&
    skills.trim().startsWith("[")
  ) {
    try {
      const parsed = JSON.parse(skills);

      if (Array.isArray(parsed)) {
        return parsed
          .map((skill) =>
            String(skill).trim()
          )
          .filter(Boolean);
      }
    } catch (error) {
      // Continue with comma-separated parsing
    }
  }

  // Comma separated skills
  return String(skills)
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
};

// ==========================================
// PREPARE APPLICATION DATA
// ==========================================

const prepareApplicationData = (
  req
) => {
  const data = {
    ...req.body,
  };

  // ========================================
  // SKILLS
  // ========================================

  if (req.body.skills !== undefined) {
    data.skills = parseSkills(
      req.body.skills
    );
  }

  // ========================================
  // HR MESSAGE SENT
  // ========================================

  if (!data.hrMessageSent) {
    data.hrMessageSent = "No";
  }

  // ========================================
  // UPLOADED IMAGES
  // ========================================

  if (
    req.files &&
    req.files.length > 0
  ) {
    data.jobDescriptionImages =
      req.files.map((file) => ({
        url: `/uploads/job-descriptions/${file.filename}`,

        originalName:
          file.originalname,
      }));
  }

  return data;
};

// ==========================================
// GET APPLICATIONS
// ==========================================

const getApplications = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      status = "",
      applicationStatus = "",
      followUp = "",
      jobPlatform = "",
    } = req.query;

    const filter = {};

    // ========================================
    // STATUS FILTER
    // ========================================

    if (status) {
      filter.status = status;
    }

    // ========================================
    // APPLICATION STATUS FILTER
    // ========================================

    if (applicationStatus) {
      filter.applicationStatus =
        applicationStatus;
    }

    // ========================================
    // FOLLOW-UP FILTER
    // ========================================

    if (followUp) {
      filter.followUp = followUp;
    }

    // ========================================
    // JOB PLATFORM FILTER
    // ========================================

    if (jobPlatform) {
      filter.jobPlatform = jobPlatform;
    }

    // ========================================
    // SEARCH
    // ========================================

    if (search.trim()) {
      const regex = new RegExp(
        search.trim(),
        "i"
      );

      filter.$or = [
        {
          companyName: regex,
        },
        {
          hrName: regex,
        },
        {
          hrContact: regex,
        },
        {
          hrLinkedInId: regex,
        },
        {
          city: regex,
        },
        {
          companyEmail: regex,
        },
        {
          jobDescription: regex,
        },
        {
          hrMessageDraft: regex,
        },
        {
          jobPlatform: regex,
        },
        {
          skills: regex,
        },
      ];
    }

    // ========================================
    // FETCH
    // ========================================

    const applications =
      await Application.find(filter)
        .sort({
          dateOfApply: -1,
          createdAt: -1,
        })
        .lean();

    res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error(
      "Get Applications Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET DASHBOARD
// ==========================================

const getDashboard = async (
  req,
  res
) => {
  try {
    const [
      totalApplications,
      applied,
      shortlisted,
      followUpPending,
    ] = await Promise.all([
      Application.countDocuments(),

      Application.countDocuments({
        status: "Applied",
      }),

      Application.countDocuments({
        applicationStatus:
          "Shortlisted",
      }),

      Application.countDocuments({
        followUp: "No",
      }),
    ]);

    res.json({
      success: true,

      data: {
        totalApplications,
        applied,
        shortlisted,
        followUpPending,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// CREATE APPLICATION
// ==========================================

const createApplication = async (
  req,
  res
) => {
  try {
    const data =
      prepareApplicationData(req);

    // ========================================
    // CREATE
    // ========================================

    const application =
      await Application.create(
        data
      );

    // ========================================
    // SOCKET.IO
    // ========================================

    const io = req.app.get("io");

    if (io) {
      io.emit(
        "applications:changed"
      );
    }

    // ========================================
    // RESPONSE
    // ========================================

    res.status(201).json({
      success: true,

      message:
        "Application created successfully",

      data: application,
    });
  } catch (error) {
    console.error(
      "Create Application Error:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE APPLICATION
// ==========================================

const updateApplication = async (
  req,
  res
) => {
  try {
    // ========================================
    // FIND EXISTING APPLICATION
    // ========================================

    const existingApplication =
      await Application.findById(
        req.params.id
      );

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found",
      });
    }

    // ========================================
    // PREPARE DATA
    // ========================================

    const data =
      prepareApplicationData(req);

    // ========================================
    // IMAGE HANDLING
    // ========================================
    //
    // If new images are uploaded,
    // append them to existing images.
    //
    // Existing screenshots will NOT
    // be deleted automatically.
    // ========================================

    if (
      req.files &&
      req.files.length > 0
    ) {
      const newImages =
        req.files.map((file) => ({
          url: `/uploads/job-descriptions/${file.filename}`,

          originalName:
            file.originalname,
        }));

      data.jobDescriptionImages = [
        ...(existingApplication
          .jobDescriptionImages || []),

        ...newImages,
      ];
    }

    // ========================================
    // UPDATE
    // ========================================

    const application =
      await Application.findByIdAndUpdate(
        req.params.id,
        data,
        {
          new: true,
          runValidators: true,
        }
      );

    // ========================================
    // SOCKET.IO
    // ========================================

    const io = req.app.get("io");

    if (io) {
      io.emit(
        "applications:changed"
      );
    }

    // ========================================
    // RESPONSE
    // ========================================

    res.json({
      success: true,

      message:
        "Application updated successfully",

      data: application,
    });
  } catch (error) {
    console.error(
      "Update Application Error:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE APPLICATION
// ==========================================

const deleteApplication = async (
  req,
  res
) => {
  try {
    const application =
      await Application.findByIdAndDelete(
        req.params.id
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found",
      });
    }

    // ========================================
    // SOCKET.IO
    // ========================================

    const io = req.app.get("io");

    if (io) {
      io.emit(
        "applications:changed"
      );
    }

    // ========================================
    // RESPONSE
    // ========================================

    res.json({
      success: true,

      message:
        "Application deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Application Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getApplications,
  getDashboard,
  createApplication,
  updateApplication,
  deleteApplication,
};