require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const applicationRoutes = require("./routes/applicationRoutes");
const settingRoutes = require("./routes/settingRoutes");

const app = express();
const server = http.createServer(app);

// ======================================================
// ALLOWED FRONTEND ORIGINS
// ======================================================

const allowedOrigins = [
  // Production Firebase frontend
  "https://jobtracker-28685.web.app",
  "https://jobtracker-28685.firebaseapp.com",

  // Local development
  "http://localhost:5173",
  "http://localhost:5174",

  // Localhost IP
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",

  // LAN development
  "http://192.168.29.87:5173",
  "http://192.168.29.87:5174",
];

// Add FRONTEND_URL from Render/environment if provided
if (
  process.env.FRONTEND_URL &&
  !allowedOrigins.includes(process.env.FRONTEND_URL)
) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Remove accidental trailing slashes
const normalizedOrigins = allowedOrigins
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

console.log("=================================");
console.log("Allowed frontend origins:");

normalizedOrigins.forEach((origin) => {
  console.log(`  ✓ ${origin}`);
});

console.log("=================================");

// ======================================================
// CORS OPTIONS
// ======================================================

const corsOptions = {
  origin: function (origin, callback) {
    // Requests without Origin:
    // curl, Postman, server-to-server, etc.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (normalizedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);

    return callback(
      new Error(`CORS blocked: ${origin}`)
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

// ======================================================
// SOCKET.IO
// ======================================================

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow curl/Postman/server requests
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (normalizedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.log(
        "Blocked Socket.IO origin:",
        origin
      );

      return callback(
        new Error(
          `Socket.IO CORS blocked: ${origin}`
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],

    credentials: true,
  },
});

app.set("io", io);

// ======================================================
// DATABASE
// ======================================================

connectDB();

// ======================================================
// CORS
// ======================================================

// Express CORS middleware automatically handles
// OPTIONS/preflight requests.
//
// IMPORTANT:
// Do NOT use:
//
// app.options("*", cors(corsOptions));
//
// Express 5 does not accept the "*" wildcard route.

app.use(cors(corsOptions));

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ======================================================
// STATIC UPLOADS
// ======================================================

const uploadsPath = path.join(
  __dirname,
  "uploads"
);

app.use(
  "/uploads",
  express.static(uploadsPath)
);

// ======================================================
// BASIC ROUTES
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Application Tracker Backend",
  });
});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

// ======================================================
// APPLICATION ROUTES
// ======================================================

app.use(
  "/api/applications",
  applicationRoutes
);

// ======================================================
// SETTINGS ROUTES
// ======================================================

app.use(
  "/api/settings",
  settingRoutes
);

// ======================================================
// SOCKET.IO CONNECTION
// ======================================================

io.on("connection", (socket) => {
  console.log(
    "Frontend connected:",
    socket.id
  );

  socket.on("disconnect", (reason) => {
    console.log(
      "Frontend disconnected:",
      socket.id,
      "Reason:",
      reason
    );
  });
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "================================="
    );

    console.error(
      "Server Error:",
      err.message
    );

    console.error(
      "================================="
    );

    // ----------------------------------------------
    // Multer errors
    // ----------------------------------------------

    if (
      err.name === "MulterError"
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // ----------------------------------------------
    // CORS errors
    // ----------------------------------------------

    if (
      err.message &&
      (
        err.message.startsWith(
          "CORS blocked"
        ) ||
        err.message.startsWith(
          "Socket.IO CORS blocked"
        )
      )
    ) {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
    }

    // ----------------------------------------------
    // General server error
    // ----------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Internal server error",
    });
  }
);

// ======================================================
// SERVER
// ======================================================

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "================================="
    );

    console.log(
      "Job Application Tracker Backend"
    );

    console.log(
      "================================="
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `API: http://localhost:${PORT}/api`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Uploads: http://localhost:${PORT}/uploads`
    );

    console.log(
      "================================="
    );
  }
);