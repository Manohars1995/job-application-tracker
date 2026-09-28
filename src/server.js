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

// ==========================================
// ALLOWED FRONTEND ORIGINS
// ==========================================

const allowedOrigins = [
  // Local browser
  "http://localhost:5173",
  "http://localhost:5174",

  // Local IP
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",

  // Mobile / LAN access
  "http://192.168.29.87:5173",
  "http://192.168.29.87:5174",
];

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests without Origin
      // Example: Postman / curl
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(
        "Blocked Socket.IO origin:",
        origin
      );

      return callback(
        new Error(
          "Not allowed by Socket.IO CORS"
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

// ==========================================
// DATABASE
// ==========================================

connectDB();

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin
      // Example: Postman / curl
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(
        "Blocked CORS origin:",
        origin
      );

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
  })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==========================================
// STATIC UPLOADED FILES
// ==========================================
//
// Uploaded job description screenshots will be
// available through:
//
// http://localhost:5000/uploads/...
//
// Mobile/LAN:
//
// http://192.168.29.87:5000/uploads/...
//
// ==========================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// ==========================================
// BASIC ROUTES
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Job Application Tracker Backend",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
  });
});

// ==========================================
// APPLICATION ROUTES
// ==========================================

app.use(
  "/api/applications",
  applicationRoutes
);

// ==========================================
// SETTINGS ROUTES
// ==========================================

app.use(
  "/api/settings",
  settingRoutes
);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// ==========================================
// SOCKET.IO CONNECTION
// ==========================================

io.on("connection", (socket) => {
  console.log(
    "Frontend connected:",
    socket.id
  );

  socket.on("disconnect", () => {
    console.log(
      "Frontend disconnected:",
      socket.id
    );
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "Server Error:",
      err.message
    );

    // Multer file upload errors
    if (
      err.name === "MulterError"
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
);

// ==========================================
// SERVER
// ==========================================

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
      `Server running at: http://localhost:${PORT}`
    );

    console.log(
      `Network API: http://192.168.29.87:${PORT}/api`
    );

    console.log(
      `Health Check: http://192.168.29.87:${PORT}/api/health`
    );

    console.log(
      `Uploads: http://192.168.29.87:${PORT}/uploads`
    );

    console.log(
      "---------------------------------"
    );

    console.log(
      "Allowed frontend origins:"
    );

    allowedOrigins.forEach(
      (origin) => {
        console.log(`  ✓ ${origin}`);
      }
    );

    console.log(
      "================================="
    );
  }
);