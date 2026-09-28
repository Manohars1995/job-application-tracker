import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { io } from "socket.io-client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  Loader2,
} from "lucide-react";

import * as XLSX from "xlsx";

import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "./services/api";


// ============================================================
// CONFIG
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";


// ============================================================
// CONSTANTS
// ============================================================

const STATUS_OPTIONS = [
  "Applied",
  "Cancelled",
  "In Review",
  "No Result",
];

const APPLICATION_STATUS_OPTIONS = [
  "In Review",
  "Shortlisted",
  "Rejected",
  "No Result",
];

const SKILL_OPTIONS = [
  "AWS",
  "Azure",
  "GCP",
  "Linux",
  "Network Administration",
  "Git",
  "GitHub",
  "Docker",
  "Jenkins",
  "Python Scripting",
  "Ansible",
  "Kubernetes",
  "Terraform",
  "Prometheus",
  "Grafana",
];

const JOB_PLATFORM_OPTIONS = [
  "Naukri",
  "LinkedIn",
  "Indeed",
  "Foundit",
  "Glassdoor",
  "Company Website",
];

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const DRAFT_KEY =
  "job_application_tracker_draft";


// ============================================================
// EMPTY FORM
// ============================================================

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),

  companyName: "",

  dateOfApply: new Date()
    .toISOString()
    .slice(0, 10),

  hrName: "",

  hrContact: "",

  hrLinkedInId: "",

  city: "",

  status: "Applied",

  applicationStatus: "In Review",

  companyEmail: "",

  skills: [],

  customSkill: "",

  followUp: "No",

  jobPlatform: "Naukri",

  customJobPlatform: "",

  jobDescription: "",

  hrMessageDraft: "",

  hrMessageSent: "No",

  jobDescriptionImages: [],
};


// ============================================================
// HELPERS
// ============================================================

function normalizeApplications(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.applications)) {
    return payload.applications;
  }

  return [];
}


function getId(application) {
  return application?._id || application?.id;
}


function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


function toInputDate(value) {
  if (!value) {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value?.slice?.(0, 10) || "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}


function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return skills.filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}


function getStatusType(status) {
  switch (status) {
    case "Applied":
      return "success";

    case "Cancelled":
      return "danger";

    case "In Review":
      return "warning";

    case "No Result":
      return "neutral";

    default:
      return "neutral";
  }
}


function getApplicationStatusType(status) {
  switch (status) {
    case "Shortlisted":
      return "success";

    case "Rejected":
      return "danger";

    case "In Review":
      return "warning";

    case "No Result":
      return "neutral";

    default:
      return "neutral";
  }
}


// ============================================================
// APPLICATION -> FORM
// ============================================================

function applicationToForm(application) {
  const skills = normalizeSkills(
    application?.skills
  );

  const knownSkills = skills.filter(
    (skill) =>
      SKILL_OPTIONS.includes(skill)
  );

  const customSkills = skills.filter(
    (skill) =>
      !SKILL_OPTIONS.includes(skill)
  );

  const knownPlatform =
    JOB_PLATFORM_OPTIONS.includes(
      application?.jobPlatform
    );

  return {
    date: toInputDate(
      application?.date
    ),

    companyName:
      application?.companyName || "",

    dateOfApply: toInputDate(
      application?.dateOfApply ||
        application?.date
    ),

    hrName:
      application?.hrName || "",

    hrContact:
      application?.hrContact || "",

    hrLinkedInId:
      application?.hrLinkedInId || "",

    city:
      application?.city || "",

    status:
      application?.status || "Applied",

    applicationStatus:
      application?.applicationStatus ||
      "In Review",

    companyEmail:
      application?.companyEmail || "",

    skills: knownSkills,

    customSkill:
      customSkills.join(", "),

    followUp:
      application?.followUp === true
        ? "Yes"
        : application?.followUp || "No",

    jobPlatform: knownPlatform
      ? application?.jobPlatform
      : "Custom",

    customJobPlatform: knownPlatform
      ? ""
      : application?.jobPlatform || "",

    jobDescription:
      application?.jobDescription || "",

    hrMessageDraft:
      application?.hrMessageDraft || "",

    hrMessageSent:
      application?.hrMessageSent || "No",

    jobDescriptionImages:
      Array.isArray(
        application?.jobDescriptionImages
      )
        ? application.jobDescriptionImages
        : [],
  };
}


// ============================================================
// FORM -> PAYLOAD
// ============================================================

function formToPayload(form) {
  const customSkills =
    form.customSkill
      ? form.customSkill
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const skills = [
    ...form.skills,
    ...customSkills,
  ].filter(Boolean);

  const platform =
    form.jobPlatform === "Custom"
      ? form.customJobPlatform.trim()
      : form.jobPlatform;

  return {
    date: form.date,

    companyName:
      form.companyName.trim(),

    dateOfApply:
      form.dateOfApply,

    hrName:
      form.hrName.trim(),

    hrContact:
      form.hrContact.trim(),

    hrLinkedInId:
      form.hrLinkedInId.trim(),

    city:
      form.city.trim(),

    status:
      form.status,

    applicationStatus:
      form.applicationStatus,

    companyEmail:
      form.companyEmail.trim(),

    skills,

    followUp:
      form.followUp,

    jobPlatform:
      platform,

    jobDescription:
      form.jobDescription.trim(),

    hrMessageDraft:
      form.hrMessageDraft.trim(),

    hrMessageSent:
      form.hrMessageSent,

    jobDescriptionImages:
      form.jobDescriptionImages || [],
  };
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  children,
  type = "default",
}) {
  return (
    <span
      className={`status-badge status-${type
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
    >
      {children}
    </span>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  title,
  value,
  variant,
}) {
  return (
    <div
      className={`stat-card stat-${variant}`}
    >
      <div className="stat-icon">
        <Icon
          size={28}
          strokeWidth={2}
        />
      </div>

      <div className="stat-content">
        <div className="stat-title">
          {title}
        </div>

        <div className="stat-value">
          {value}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// APPLICATION MODAL
// ============================================================

function ApplicationModal({
  open,
  editingApplication,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [error, setError] =
    useState("");

  const [
    selectedImages,
    setSelectedImages,
  ] = useState([]);

  const [
    draftSaved,
    setDraftSaved,
  ] = useState(false);


  // ==========================================================
  // LOAD FORM
  // ==========================================================

  useEffect(() => {
    if (!open) return;

    if (editingApplication) {
      setForm(
        applicationToForm(
          editingApplication
        )
      );

      setSelectedImages([]);

      setDraftSaved(false);

      return;
    }

    const savedDraft =
      localStorage.getItem(
        DRAFT_KEY
      );

    if (savedDraft) {
      try {
        const parsed =
          JSON.parse(savedDraft);

        setForm({
          ...EMPTY_FORM,
          ...parsed,
        });

        setDraftSaved(true);
      } catch (error) {
        console.error(
          "Draft load error:",
          error
        );

        setForm({
          ...EMPTY_FORM,
        });
      }
    } else {
      setForm({
        ...EMPTY_FORM,

        date: new Date()
          .toISOString()
          .slice(0, 10),

        dateOfApply:
          new Date()
            .toISOString()
            .slice(0, 10),
      });

      setDraftSaved(false);
    }

    setSelectedImages([]);

    setError("");
  }, [
    open,
    editingApplication,
  ]);


  // ==========================================================
  // AUTO SAVE DRAFT
  // ==========================================================

  useEffect(() => {
    if (
      !open ||
      editingApplication
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        try {
          const draft = {
            ...form,

            // File objects cannot be
            // stored in localStorage.
            jobDescriptionImages:
              form.jobDescriptionImages ||
              [],
          };

          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify(draft)
          );

          setDraftSaved(true);
        } catch (error) {
          console.error(
            "Draft auto-save error:",
            error
          );
        }
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [
    form,
    open,
    editingApplication,
  ]);


  // ==========================================================
  // FIELD UPDATE
  // ==========================================================

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setDraftSaved(false);
  };


  // ==========================================================
  // SKILLS
  // ==========================================================

  const toggleSkill = (
    skill
  ) => {
    setForm((previous) => {
      const exists =
        previous.skills.includes(
          skill
        );

      return {
        ...previous,

        skills: exists
          ? previous.skills.filter(
              (item) =>
                item !== skill
            )
          : [
              ...previous.skills,
              skill,
            ],
      };
    });

    setDraftSaved(false);
  };


  // ==========================================================
  // IMAGE UPLOAD
  // ==========================================================

  const handleImageChange = (
    event
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) {
      return;
    }

    const existingCount =
      Array.isArray(
        form.jobDescriptionImages
      )
        ? form.jobDescriptionImages
            .length
        : 0;

    const newCount =
      selectedImages.length;

    if (
      existingCount +
        newCount +
        files.length >
      MAX_IMAGES
    ) {
      alert(
        `Maximum ${MAX_IMAGES} images are allowed.`
      );

      event.target.value = "";

      return;
    }

    const validFiles = [];

    for (const file of files) {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (
        !validTypes.includes(
          file.type
        )
      ) {
        alert(
          `${file.name} is not a supported image.`
        );

        continue;
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        alert(
          `${file.name} is larger than 5 MB.`
        );

        continue;
      }

      validFiles.push(file);
    }

    setSelectedImages(
      (previous) => [
        ...previous,
        ...validFiles,
      ]
    );

    setDraftSaved(false);

    event.target.value = "";
  };


  // ==========================================================
  // REMOVE NEW IMAGE
  // ==========================================================

  const removeSelectedImage = (
    index
  ) => {
    setSelectedImages(
      (previous) =>
        previous.filter(
          (_, imageIndex) =>
            imageIndex !== index
        )
    );

    setDraftSaved(false);
  };


  // ==========================================================
  // REMOVE EXISTING IMAGE
  // ==========================================================

  const removeExistingImage = (
    index
  ) => {
    setForm((previous) => ({
      ...previous,

      jobDescriptionImages:
        previous.jobDescriptionImages.filter(
          (_, imageIndex) =>
            imageIndex !== index
        ),
    }));

    setDraftSaved(false);
  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const submit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !form.companyName.trim()
    ) {
      setError(
        "Company name is required."
      );

      return;
    }

    if (!form.date) {
      setError(
        "Date is required."
      );

      return;
    }

    if (
      !form.dateOfApply
    ) {
      setError(
        "Date of Apply is required."
      );

      return;
    }

    if (
      form.jobPlatform ===
        "Custom" &&
      !form.customJobPlatform.trim()
    ) {
      setError(
        "Please enter custom job platform."
      );

      return;
    }

    try {
      setError("");

      const payload =
        formToPayload(form);

      payload.newJobDescriptionImages =
        selectedImages;

      await onSave(
        payload,
        editingApplication
      );

      if (!editingApplication) {
        localStorage.removeItem(
          DRAFT_KEY
        );
      }

      setDraftSaved(false);
    } catch (error) {
      console.error(
        "Save application error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Unable to save application."
      );
    }
  };


  if (!open) {
    return null;
  }


  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          if (!saving) {
            onClose();
          }
        }
      }}
    >
      <div
        className="application-modal"
        role="dialog"
        aria-modal="true"
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="modal-header">
          <div>
            <h2>
              {editingApplication
                ? "Edit Job Application"
                : "Add Job Application"}
            </h2>

            {!editingApplication &&
              draftSaved && (
                <span className="draft-status">
                  Draft saved
                </span>
              )}
          </div>

          <button
            type="button"
            className="icon-button close-button"
            onClick={onClose}
            disabled={saving}
          >
            <X size={21} />
          </button>
        </div>


        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          className="application-form"
          onSubmit={submit}
        >

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}


          <div className="form-grid">

            {/* DATE */}

            <div className="form-group">
              <label>
                Date <span>*</span>
              </label>

              <div className="input-icon-wrap">
                <CalendarDays size={17} />

                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    updateField(
                      "date",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>


            {/* COMPANY */}

            <div className="form-group">
              <label>
                Company Name{" "}
                <span>*</span>
              </label>

              <div className="input-icon-wrap">
                <Building2 size={17} />

                <input
                  type="text"
                  placeholder="Enter company name"
                  value={
                    form.companyName
                  }
                  onChange={(event) =>
                    updateField(
                      "companyName",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>


            {/* DATE OF APPLY */}

            <div className="form-group">
              <label>
                Date of Apply{" "}
                <span>*</span>
              </label>

              <div className="input-icon-wrap">
                <CalendarDays size={17} />

                <input
                  type="date"
                  value={
                    form.dateOfApply
                  }
                  onChange={(event) =>
                    updateField(
                      "dateOfApply",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>


            {/* HR NAME */}

            <div className="form-group">
              <label>
                HR Name
              </label>

              <div className="input-icon-wrap">
                <Users size={17} />

                <input
                  type="text"
                  placeholder="Enter HR name"
                  value={form.hrName}
                  onChange={(event) =>
                    updateField(
                      "hrName",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>


            {/* HR CONTACT */}

            <div className="form-group">
              <label>
                HR Contact Number
              </label>

              <div className="input-icon-wrap">
                <Phone size={17} />

                <input
                  type="tel"
                  placeholder="Enter contact number"
                  value={
                    form.hrContact
                  }
                  onChange={(event) =>
                    updateField(
                      "hrContact",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>


            {/* HR LINKEDIN */}

            <div className="form-group">
              <label>
                HR LinkedIn ID
              </label>

              <div className="input-icon-wrap">
                <ExternalLink
                  size={17}
                />

                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/hr-name"
                  value={
                    form.hrLinkedInId
                  }
                  onChange={(event) =>
                    updateField(
                      "hrLinkedInId",
                      event.target.value
                    )
                  }
                />
              </div>

              {form.hrLinkedInId && (
                <a
                  href={
                    form.hrLinkedInId
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="linkedin-preview-link"
                >
                  <ExternalLink
                    size={14}
                  />

                  Open LinkedIn
                </a>
              )}
            </div>


            {/* CITY */}

            <div className="form-group">
              <label>
                City
              </label>

              <div className="input-icon-wrap">
                <MapPin size={17} />

                <input
                  type="text"
                  placeholder="Enter city"
                  value={form.city}
                  onChange={(event) =>
                    updateField(
                      "city",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>


            {/* STATUS */}

            <div className="form-group">
              <label>
                Status{" "}
                <span>*</span>
              </label>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value
                  )
                }
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>


            {/* APPLICATION STATUS */}

            <div className="form-group">
              <label>
                Application Status{" "}
                <span>*</span>
              </label>

              <select
                value={
                  form.applicationStatus
                }
                onChange={(event) =>
                  updateField(
                    "applicationStatus",
                    event.target.value
                  )
                }
              >
                {APPLICATION_STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>


            {/* COMPANY EMAIL */}

            <div className="form-group">
              <label>
                Company Email ID
              </label>

              <div className="input-icon-wrap">
                <Mail size={17} />

                <input
                  type="email"
                  placeholder="company@example.com"
                  value={
                    form.companyEmail
                  }
                  onChange={(event) =>
                    updateField(
                      "companyEmail",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>


            {/* FOLLOW UP */}

            <div className="form-group">
              <label>
                Follow-up
              </label>

              <select
                value={
                  form.followUp
                }
                onChange={(event) =>
                  updateField(
                    "followUp",
                    event.target.value
                  )
                }
              >
                <option value="Yes">
                  Yes
                </option>

                <option value="No">
                  No
                </option>
              </select>
            </div>


            {/* HR MESSAGE SENT */}

            <div className="form-group">
              <label>
                HR Message Sent
              </label>

              <select
                value={
                  form.hrMessageSent
                }
                onChange={(event) =>
                  updateField(
                    "hrMessageSent",
                    event.target.value
                  )
                }
              >
                <option value="No">
                  No
                </option>

                <option value="Yes">
                  Yes
                </option>
              </select>
            </div>


            {/* JOB PLATFORM */}

            <div className="form-group">
              <label>
                Job Platform
              </label>

              <select
                value={
                  form.jobPlatform
                }
                onChange={(event) =>
                  updateField(
                    "jobPlatform",
                    event.target.value
                  )
                }
              >
                {JOB_PLATFORM_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}

                <option value="Custom">
                  Custom
                </option>
              </select>
            </div>


            {/* CUSTOM PLATFORM */}

            {form.jobPlatform ===
              "Custom" && (
              <div className="form-group">
                <label>
                  Custom Job Platform{" "}
                  <span>*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter platform name"
                  value={
                    form.customJobPlatform
                  }
                  onChange={(event) =>
                    updateField(
                      "customJobPlatform",
                      event.target.value
                    )
                  }
                />
              </div>
            )}

          </div>


          {/* ==================================================
              JOB DESCRIPTION
          ================================================== */}

          <div className="form-group full-width">
            <label>
              Job Description
            </label>

            <textarea
              rows="8"
              placeholder="Paste or enter the job description here..."
              value={
                form.jobDescription
              }
              onChange={(event) =>
                updateField(
                  "jobDescription",
                  event.target.value
                )
              }
            />
          </div>


          {/* ==================================================
              JOB DESCRIPTION IMAGES
          ================================================== */}

          <div className="form-group full-width">

            <div className="label-with-action">
              <label>
                Job Description Screenshots
              </label>

              <span className="image-count">
                {(
                  form
                    .jobDescriptionImages
                    ?.length || 0
                ) +
                  selectedImages.length}
                /{MAX_IMAGES}
              </span>
            </div>


            <div className="upload-box">

              <input
                id="job-description-images"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={
                  handleImageChange
                }
                hidden
              />

              <label
                htmlFor="job-description-images"
                className="upload-button"
              >
                <Upload size={20} />

                <span>
                  Upload Screenshots
                </span>
              </label>

              <small>
                You can upload up to{" "}
                {MAX_IMAGES} images.
                JPG, PNG or WEBP.
                Maximum 5 MB per image.
              </small>

            </div>


            {/* EXISTING IMAGES */}

            {form
              .jobDescriptionImages
              ?.length > 0 && (
              <div className="image-preview-grid">

                {form.jobDescriptionImages.map(
                  (image, index) => (
                    <div
                      className="image-preview-card"
                      key={
                        image._id ||
                        `${image.url}-${index}`
                      }
                    >

                      <img
                        src={image.url}
                        alt={
                          image.originalName ||
                          `Job description ${
                            index + 1
                          }`
                        }
                      />

                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() =>
                          removeExistingImage(
                            index
                          )
                        }
                      >
                        <Trash2
                          size={16}
                        />
                      </button>

                    </div>
                  )
                )}

              </div>
            )}


            {/* NEW IMAGES */}

            {selectedImages.length >
              0 && (
              <div className="image-preview-grid">

                {selectedImages.map(
                  (file, index) => (
                    <div
                      className="image-preview-card"
                      key={`${file.name}-${index}`}
                    >

                      <img
                        src={URL.createObjectURL(
                          file
                        )}
                        alt={file.name}
                      />

                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() =>
                          removeSelectedImage(
                            index
                          )
                        }
                      >
                        <Trash2
                          size={16}
                        />
                      </button>

                    </div>
                  )
                )}

              </div>
            )}


            {form
              .jobDescriptionImages
              ?.length === 0 &&
              selectedImages.length ===
                0 && (
                <div className="empty-image-message">
                  <ImageIcon
                    size={20}
                  />

                  No screenshots added yet.
                </div>
              )}

          </div>


          {/* ==================================================
              HR LINKEDIN MESSAGE
          ================================================== */}

          <div className="form-group full-width">

            <div className="label-with-action">

              <label>
                HR LinkedIn Message Draft
              </label>

              {form.hrLinkedInId && (
                <a
                  href={
                    form.hrLinkedInId
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="linkedin-preview-link"
                >
                  <ExternalLink
                    size={15}
                  />

                  Open LinkedIn
                </a>
              )}

            </div>

            <textarea
              rows="8"
              placeholder="Write a professional LinkedIn message to the HR..."
              value={
                form.hrMessageDraft
              }
              onChange={(event) =>
                updateField(
                  "hrMessageDraft",
                  event.target.value
                )
              }
            />

            <small>
              Professional example:
              <br />
              <br />

              Hello [HR Name],
              <br />
              <br />

              I recently applied for
              the [Job Title] position
              at [Company]. I am very
              interested in this
              opportunity and would
              appreciate the chance to
              connect and discuss how
              my experience aligns with
              the role.
              <br />
              <br />

              Thank you for your time.
            </small>

          </div>


          {/* ==================================================
              SKILLS
          ================================================== */}

          <div className="skills-section">

            <div className="skills-section-header">

              <div>
                <label>
                  Skills Mentioned in
                  Application
                </label>

                <p>
                  Select one or more
                  skills.
                </p>
              </div>

              <span>
                {form.skills.length}
                {" "}
                selected
              </span>

            </div>


            <div className="skills-grid">

              {SKILL_OPTIONS.map(
                (skill) => {
                  const selected =
                    form.skills.includes(
                      skill
                    );

                  return (
                    <button
                      type="button"
                      key={skill}
                      className={`skill-option ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        toggleSkill(
                          skill
                        )
                      }
                    >

                      {selected && (
                        <Check
                          size={14}
                        />
                      )}

                      {skill}

                    </button>
                  );
                }
              )}

            </div>


            <input
              type="text"
              className="custom-skill-input"
              placeholder="Add custom skills, separated by commas"
              value={
                form.customSkill
              }
              onChange={(event) =>
                updateField(
                  "customSkill",
                  event.target.value
                )
              }
            />

          </div>


          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="modal-footer">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />

                  {editingApplication
                    ? "Update"
                    : "Save Application"}
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {
  const [
    applications,
    setApplications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [
    applicationStatusFilter,
    setApplicationStatusFilter,
  ] = useState("All");

  const [
    followUpFilter,
    setFollowUpFilter,
  ] = useState("All");

  const [
    platformFilter,
    setPlatformFilter,
  ] = useState("All");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingApplication,
    setEditingApplication,
  ] = useState(null);

  const [saving, setSaving] =
    useState(false);


  // ==========================================================
  // LOAD APPLICATIONS
  // ==========================================================

  const loadApplications =
    useCallback(async () => {
      try {
        setError("");

        const response =
          await getApplications();

        const data =
          normalizeApplications(
            response
          );

        setApplications(data);
      } catch (err) {
        console.error(
          "Application load error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            "Unable to load applications."
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadApplications();
  }, [loadApplications]);


  // ==========================================================
  // SOCKET.IO
  // ==========================================================

  useEffect(() => {
    let socket;

    try {
      socket = io(
        SOCKET_URL,
        {
          transports: [
            "websocket",
            "polling",
          ],
          reconnection: true,
        }
      );

      const refresh =
        () => {
          loadApplications();
        };

      socket.on(
        "application:created",
        refresh
      );

      socket.on(
        "application:updated",
        refresh
      );

      socket.on(
        "application:deleted",
        refresh
      );

      socket.on(
        "applications:updated",
        refresh
      );

      socket.on(
        "applications:changed",
        refresh
      );
    } catch (err) {
      console.warn(
        "Socket connection unavailable:",
        err
      );
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [loadApplications]);


  // ==========================================================
  // STATS
  // ==========================================================

  const stats = useMemo(() => {
    const total =
      applications.length;

    const applied =
      applications.filter(
        (item) =>
          item.status ===
          "Applied"
      ).length;

    const shortlisted =
      applications.filter(
        (item) =>
          item.applicationStatus ===
          "Shortlisted"
      ).length;

    const followUp =
      applications.filter(
        (item) =>
          item.followUp ===
            "Yes" ||
          item.followUp === true
      ).length;

    return {
      total,
      applied,
      shortlisted,
      followUp,
    };
  }, [applications]);


  // ==========================================================
  // PLATFORM OPTIONS
  // ==========================================================

  const platformOptions =
    useMemo(() => {
      const customPlatforms =
        applications
          .map(
            (item) =>
              item.jobPlatform
          )
          .filter(Boolean);

      return [
        ...new Set([
          ...JOB_PLATFORM_OPTIONS,
          ...customPlatforms,
        ]),
      ];
    }, [applications]);


  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredApplications =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return applications.filter(
        (application) => {
          const skills =
            normalizeSkills(
              application.skills
            );

          const searchableText = [
            application.companyName,
            application.hrName,
            application.hrContact,
            application.hrLinkedInId,
            application.city,
            application.companyEmail,
            application.status,
            application.applicationStatus,
            application.jobPlatform,
            application.jobDescription,
            application.hrMessageDraft,
            ...skills,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            searchableText.includes(
              query
            );

          const matchesStatus =
            statusFilter === "All" ||
            application.status ===
              statusFilter;

          const matchesApplicationStatus =
            applicationStatusFilter ===
              "All" ||
            application.applicationStatus ===
              applicationStatusFilter;

          const matchesFollowUp =
            followUpFilter ===
              "All" ||
            (application.followUp ===
            true
              ? "Yes"
              : application.followUp) ===
              followUpFilter;

          const matchesPlatform =
            platformFilter ===
              "All" ||
            application.jobPlatform ===
              platformFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesApplicationStatus &&
            matchesFollowUp &&
            matchesPlatform
          );
        }
      );
    }, [
      applications,
      search,
      statusFilter,
      applicationStatusFilter,
      followUpFilter,
      platformFilter,
    ]);


  // ==========================================================
  // ADD
  // ==========================================================

  const openAddModal = () => {
    setEditingApplication(
      null
    );

    setModalOpen(true);
  };


  // ==========================================================
  // EDIT
  // ==========================================================

  const openEditModal = (
    application
  ) => {
    setEditingApplication(
      application
    );

    setModalOpen(true);
  };


  // ==========================================================
  // CLOSE
  // ==========================================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingApplication(
      null
    );
  };


  // ==========================================================
  // SAVE
  // ==========================================================

  const saveApplication =
    async (
      payload,
      editing
    ) => {
      setSaving(true);

      try {
        let response;

        if (editing) {
          const id =
            getId(editing);

          response =
            await updateApplication(
              id,
              payload
            );

          const updated =
            response?.data ||
            response?.application ||
            response;

          setApplications(
            (previous) =>
              previous.map(
                (item) =>
                  getId(item) === id
                    ? {
                        ...item,
                        ...updated,
                        ...payload,
                      }
                    : item
              )
          );
        } else {
          response =
            await createApplication(
              payload
            );

          const created =
            response?.data ||
            response?.application ||
            response;

          if (created) {
            setApplications(
              (previous) => [
                created,
                ...previous,
              ]
            );
          } else {
            await loadApplications();
          }
        }

        localStorage.removeItem(
          DRAFT_KEY
        );

        setModalOpen(false);

        setEditingApplication(
          null
        );
      } finally {
        setSaving(false);
      }
    };


  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete =
    async (
      application
    ) => {
      const id =
        getId(application);

      if (!id) return;

      const confirmed =
        window.confirm(
          `Delete application for ${
            application.companyName ||
            "this company"
          }?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteApplication(
          id
        );

        setApplications(
          (previous) =>
            previous.filter(
              (item) =>
                getId(item) !== id
            )
        );
      } catch (err) {
        console.error(
          "Delete error:",
          err
        );

        alert(
          err?.response?.data
            ?.message ||
            "Unable to delete application."
        );
      }
    };


  // ==========================================================
  // EXCEL EXPORT
  // ==========================================================

  const downloadExcel = () => {
    const rows =
      filteredApplications.map(
        (application, index) => ({
          "S.No":
            index + 1,

          Date:
            formatDate(
              application.date
            ),

          "Company Name":
            application.companyName ||
            "",

          "Date of Apply":
            formatDate(
              application.dateOfApply
            ),

          "HR Name":
            application.hrName ||
            "",

          "HR Contact":
            application.hrContact ||
            "",

          "HR LinkedIn ID":
            application.hrLinkedInId ||
            "",

          City:
            application.city ||
            "",

          Status:
            application.status ||
            "",

          "Application Status":
            application.applicationStatus ||
            "",

          "Company Email ID":
            application.companyEmail ||
            "",

          Skills:
            normalizeSkills(
              application.skills
            ).join(", "),

          "Follow-up":
            application.followUp ===
            true
              ? "Yes"
              : application.followUp ||
                "No",

          "Job Platform":
            application.jobPlatform ||
            "",

          "Job Description":
            application.jobDescription ||
            "",

          "HR Message Draft":
            application.hrMessageDraft ||
            "",

          "HR Message Sent":
            application.hrMessageSent ||
            "No",

          "Screenshots":
            application
              .jobDescriptionImages
              ?.length || 0,
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Applications"
    );

    const date =
      new Date()
        .toISOString()
        .slice(0, 10);

    XLSX.writeFile(
      workbook,
      `job-applications-${date}.xlsx`
    );
  };


  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch("");

    setStatusFilter("All");

    setApplicationStatusFilter(
      "All"
    );

    setFollowUpFilter("All");

    setPlatformFilter("All");
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="app-shell">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="top-header">

        <div className="brand-area">

          <div className="brand-icon">
            <BriefcaseBusiness
              size={32}
            />
          </div>

          <div>
            <h1>
              Job Application
              Tracker
            </h1>

            <p>
              Track your job
              applications in one
              place
            </p>
          </div>

        </div>


        <div className="motivation-card">

          <Sparkles size={22} />

          <div>
            <strong>
              “Small steps today,
            </strong>

            <span>
              Big opportunities
              tomorrow.”
            </span>
          </div>

        </div>

      </header>


      {/* ====================================================
          DASHBOARD
      ==================================================== */}

      <main className="dashboard">

        <section className="stats-grid">

          <StatCard
            icon={BriefcaseBusiness}
            title="Total Applications"
            value={stats.total}
            variant="blue"
          />

          <StatCard
            icon={Check}
            title="Applied"
            value={stats.applied}
            variant="green"
          />

          <StatCard
            icon={Users}
            title="Shortlisted"
            value={
              stats.shortlisted
            }
            variant="red"
          />

          <StatCard
            icon={Clock3}
            title="Follow-up Pending"
            value={
              stats.followUp
            }
            variant="orange"
          />


          <button
            type="button"
            className="add-application-button"
            onClick={
              openAddModal
            }
          >
            <Plus size={22} />

            <span>
              Add Application
            </span>
          </button>

        </section>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="page-error">

            <strong>
              Unable to load
              applications
            </strong>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                loadApplications
              }
            >
              Retry
            </button>

          </div>
        )}


        {/* ==================================================
            FILTERS
        ================================================== */}

        <section className="filter-panel">

          <div className="search-box">

            <Search size={20} />

            <input
              type="text"
              placeholder="Search by company, HR name, city or skills..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={17} />
              </button>
            )}

          </div>


          <div className="filter-select">

            <label>
              Status
            </label>

            <div className="select-wrapper">

              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All
                </option>

                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={16}
              />

            </div>

          </div>


          <div className="filter-select">

            <label>
              Application Status
            </label>

            <div className="select-wrapper">

              <select
                value={
                  applicationStatusFilter
                }
                onChange={(event) =>
                  setApplicationStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All
                </option>

                {APPLICATION_STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={16}
              />

            </div>

          </div>


          <div className="filter-select">

            <label>
              Follow-up
            </label>

            <div className="select-wrapper">

              <select
                value={
                  followUpFilter
                }
                onChange={(event) =>
                  setFollowUpFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All
                </option>

                <option value="Yes">
                  Yes
                </option>

                <option value="No">
                  No
                </option>
              </select>

              <ChevronDown
                size={16}
              />

            </div>

          </div>


          <div className="filter-select">

            <label>
              Job Platform
            </label>

            <div className="select-wrapper">

              <select
                value={
                  platformFilter
                }
                onChange={(event) =>
                  setPlatformFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All
                </option>

                {platformOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={16}
              />

            </div>

          </div>


          <button
            type="button"
            className="download-button"
            onClick={
              downloadExcel
            }
          >
            <FileSpreadsheet
              size={20}
            />

            <span>
              Download Excel
            </span>
          </button>

        </section>


        {/* ==================================================
            RESULT TOOLBAR
        ================================================== */}

        <div className="result-toolbar">

          <div>
            Showing{" "}
            <strong>
              {
                filteredApplications.length
              }
            </strong>{" "}
            of{" "}
            <strong>
              {applications.length}
            </strong>{" "}
            applications
          </div>


          {(search ||
            statusFilter !==
              "All" ||
            applicationStatusFilter !==
              "All" ||
            followUpFilter !==
              "All" ||
            platformFilter !==
              "All") && (
            <button
              type="button"
              className="reset-filter-button"
              onClick={
                resetFilters
              }
            >
              Reset Filters
            </button>
          )}

        </div>


        {/* ==================================================
            DESKTOP TABLE
        ================================================== */}

        <section className="table-container">

          <div className="table-scroll">

            <table className="applications-table">

              <thead>

                <tr>

                  <th>S.No</th>

                  <th>
                    Date
                  </th>

                  <th>
                    Company Name
                  </th>

                  <th>
                    Date of Apply
                  </th>

                  <th>
                    HR Name
                  </th>

                  <th>
                    HR Contact
                  </th>

                  <th>
                    HR LinkedIn
                  </th>

                  <th>
                    City
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Application Status
                  </th>

                  <th>
                    Company Email
                  </th>

                  <th>
                    Skills
                  </th>

                  <th>
                    Follow-up
                  </th>

                  <th>
                    HR Message
                  </th>

                  <th>
                    Platform
                  </th>

                  <th>
                    Screenshots
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {loading ? (
                  <tr>

                    <td
                      colSpan="17"
                      className="table-empty"
                    >
                      Loading
                      applications...
                    </td>

                  </tr>
                ) : filteredApplications.length ===
                  0 ? (
                  <tr>

                    <td
                      colSpan="17"
                      className="table-empty"
                    >

                      <div className="empty-state">

                        <BriefcaseBusiness
                          size={42}
                        />

                        <h3>
                          No applications
                          found
                        </h3>

                        <p>
                          Add your first
                          job application
                          to start
                          tracking.
                        </p>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={
                            openAddModal
                          }
                        >
                          <Plus
                            size={18}
                          />

                          Add Application
                        </button>

                      </div>

                    </td>

                  </tr>
                ) : (
                  filteredApplications.map(
                    (
                      application,
                      index
                    ) => {

                      const skills =
                        normalizeSkills(
                          application.skills
                        );

                      return (
                        <tr
                          key={
                            getId(
                              application
                            ) ||
                            index
                          }
                        >

                          <td>
                            {index + 1}
                          </td>


                          <td>
                            {formatDate(
                              application.date
                            )}
                          </td>


                          <td>

                            <div className="company-cell">

                              <div className="company-avatar">
                                {(
                                  application.companyName ||
                                  "C"
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <strong>
                                {
                                  application.companyName
                                }
                              </strong>

                            </div>

                          </td>


                          <td>
                            {formatDate(
                              application.dateOfApply
                            )}
                          </td>


                          <td>
                            {
                              application.hrName ||
                              "-"
                            }
                          </td>


                          <td>
                            {
                              application.hrContact ||
                              "-"
                            }
                          </td>


                          <td>

                            {application.hrLinkedInId ? (
                              <a
                                href={
                                  application.hrLinkedInId
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="linkedin-table-link"
                              >
                                <ExternalLink
                                  size={14}
                                />

                                LinkedIn
                              </a>
                            ) : (
                              "-"
                            )}

                          </td>


                          <td>

                            <div className="city-cell">

                              {application.city && (
                                <MapPin
                                  size={15}
                                />
                              )}

                              {
                                application.city ||
                                "-"
                              }

                            </div>

                          </td>


                          <td>

                            <StatusBadge
                              type={getStatusType(
                                application.status
                              )}
                            >
                              {
                                application.status
                              }
                            </StatusBadge>

                          </td>


                          <td>

                            <StatusBadge
                              type={getApplicationStatusType(
                                application.applicationStatus
                              )}
                            >
                              {
                                application.applicationStatus
                              }
                            </StatusBadge>

                          </td>


                          <td>

                            <span className="email-cell">
                              {
                                application.companyEmail ||
                                "-"
                              }
                            </span>

                          </td>


                          <td>

                            <div className="skill-tags">

                              {skills
                                .slice(
                                  0,
                                  3
                                )
                                .map(
                                  (
                                    skill
                                  ) => (
                                    <span
                                      key={
                                        skill
                                      }
                                      className="skill-tag"
                                    >
                                      {
                                        skill
                                      }
                                    </span>
                                  )
                                )}

                              {skills.length >
                                3 && (
                                <span className="skill-more">
                                  +
                                  {skills.length -
                                    3}
                                </span>
                              )}

                            </div>

                          </td>


                          <td>

                            <StatusBadge
                              type={
                                application.followUp ===
                                  "Yes" ||
                                application.followUp ===
                                  true
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {application.followUp ===
                              true
                                ? "Yes"
                                : application.followUp ||
                                  "No"}
                            </StatusBadge>

                          </td>


                          <td>

                            <StatusBadge
                              type={
                                application.hrMessageSent ===
                                "Yes"
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {
                                application.hrMessageSent ||
                                "No"
                              }
                            </StatusBadge>

                          </td>


                          <td>

                            <span className="platform-badge">
                              {
                                application.jobPlatform ||
                                "-"
                              }
                            </span>

                          </td>


                          <td>

                            <div className="screenshot-count">

                              <ImageIcon
                                size={16}
                              />

                              {
                                application
                                  .jobDescriptionImages
                                  ?.length ||
                                0
                              }

                            </div>

                          </td>


                          <td>

                            <div className="action-buttons">

                              <button
                                type="button"
                                className="action-edit"
                                title="Edit"
                                onClick={() =>
                                  openEditModal(
                                    application
                                  )
                                }
                              >
                                <Edit3
                                  size={17}
                                />
                              </button>


                              <button
                                type="button"
                                className="action-delete"
                                title="Delete"
                                onClick={() =>
                                  handleDelete(
                                    application
                                  )
                                }
                              >
                                <Trash2
                                  size={17}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>


        {/* ==================================================
            MOBILE CARDS
        ================================================== */}

        <section className="mobile-applications">

          {loading ? (
            <div className="mobile-loading">
              Loading
              applications...
            </div>
          ) : filteredApplications.length ===
            0 ? (
            <div className="mobile-empty">

              <BriefcaseBusiness
                size={40}
              />

              <h3>
                No applications
                found
              </h3>

              <button
                type="button"
                className="primary-button"
                onClick={
                  openAddModal
                }
              >
                <Plus size={18} />

                Add Application
              </button>

            </div>
          ) : (
            filteredApplications.map(
              (
                application,
                index
              ) => {

                const skills =
                  normalizeSkills(
                    application.skills
                  );

                return (
                  <article
                    className="application-card"
                    key={
                      getId(
                        application
                      ) ||
                      index
                    }
                  >

                    <div className="mobile-card-header">

                      <div className="company-cell">

                        <div className="company-avatar">
                          {(
                            application.companyName ||
                            "C"
                          )
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>

                        <div>

                          <h3>
                            {
                              application.companyName
                            }
                          </h3>

                          <p>
                            #
                            {index + 1}
                          </p>

                        </div>

                      </div>


                      <div className="mobile-card-actions">

                        <button
                          type="button"
                          className="action-edit"
                          onClick={() =>
                            openEditModal(
                              application
                            )
                          }
                        >
                          <Edit3
                            size={17}
                          />
                        </button>


                        <button
                          type="button"
                          className="action-delete"
                          onClick={() =>
                            handleDelete(
                              application
                            )
                          }
                        >
                          <Trash2
                            size={17}
                          />
                        </button>

                      </div>

                    </div>


                    <div className="mobile-status-row">

                      <StatusBadge
                        type={getStatusType(
                          application.status
                        )}
                      >
                        {
                          application.status
                        }
                      </StatusBadge>


                      <StatusBadge
                        type={getApplicationStatusType(
                          application.applicationStatus
                        )}
                      >
                        {
                          application.applicationStatus
                        }
                      </StatusBadge>

                    </div>


                    <div className="mobile-details">

                      <div>
                        <CalendarDays
                          size={16}
                        />

                        <span>
                          Date
                        </span>

                        <strong>
                          {formatDate(
                            application.dateOfApply
                          )}
                        </strong>
                      </div>


                      <div>
                        <Users
                          size={16}
                        />

                        <span>
                          HR
                        </span>

                        <strong>
                          {
                            application.hrName ||
                            "-"
                          }
                        </strong>
                      </div>


                      <div>
                        <Phone
                          size={16}
                        />

                        <span>
                          Contact
                        </span>

                        <strong>
                          {
                            application.hrContact ||
                            "-"
                          }
                        </strong>
                      </div>


                      <div>
                        <MapPin
                          size={16}
                        />

                        <span>
                          City
                        </span>

                        <strong>
                          {
                            application.city ||
                            "-"
                          }
                        </strong>
                      </div>


                      <div>
                        <Mail
                          size={16}
                        />

                        <span>
                          Email
                        </span>

                        <strong>
                          {
                            application.companyEmail ||
                            "-"
                          }
                        </strong>
                      </div>


                      <div>
                        <BriefcaseBusiness
                          size={16}
                        />

                        <span>
                          Platform
                        </span>

                        <strong>
                          {
                            application.jobPlatform ||
                            "-"
                          }
                        </strong>
                      </div>


                      <div>
                        <ImageIcon
                          size={16}
                        />

                        <span>
                          Screenshots
                        </span>

                        <strong>
                          {
                            application
                              .jobDescriptionImages
                              ?.length ||
                            0
                          }
                        </strong>
                      </div>


                      <div>
                        <Mail
                          size={16}
                        />

                        <span>
                          HR Message
                        </span>

                        <strong>
                          {
                            application.hrMessageSent ||
                            "No"
                          }
                        </strong>
                      </div>

                    </div>


                    {application.hrLinkedInId && (
                      <a
                        href={
                          application.hrLinkedInId
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="linkedin-card-link"
                      >
                        <ExternalLink
                          size={15}
                        />

                        Open HR LinkedIn
                      </a>
                    )}


                    <div className="mobile-skills">

                      <span>
                        Skills
                      </span>

                      <div className="skill-tags">

                        {skills.map(
                          (skill) => (
                            <span
                              key={
                                skill
                              }
                              className="skill-tag"
                            >
                              {
                                skill
                              }
                            </span>
                          )
                        )}

                        {skills.length ===
                          0 && (
                          <span className="muted">
                            No skills
                            added
                          </span>
                        )}

                      </div>

                    </div>


                    <div className="mobile-followup">

                      <span>
                        Follow-up
                      </span>

                      <StatusBadge
                        type={
                          application.followUp ===
                            "Yes" ||
                          application.followUp ===
                            true
                            ? "success"
                            : "danger"
                        }
                      >
                        {application.followUp ===
                        true
                          ? "Yes"
                          : application.followUp ||
                            "No"}
                      </StatusBadge>

                    </div>

                  </article>
                );
              }
            )
          )}

        </section>

      </main>


      {/* ====================================================
          APPLICATION MODAL
      ==================================================== */}

      <ApplicationModal
        open={modalOpen}
        editingApplication={
          editingApplication
        }
        onClose={closeModal}
        onSave={
          saveApplication
        }
        saving={saving}
      />

    </div>
  );
}


export default App;