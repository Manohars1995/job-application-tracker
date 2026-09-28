import { useEffect, useState } from "react";
import {
  X,
  Save,
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
} from "lucide-react";

const DRAFT_KEY = "job_application_tracker_draft";

const defaultForm = {
  date: new Date().toISOString().split("T")[0],
  companyName: "",
  dateOfApply: new Date().toISOString().split("T")[0],

  hrName: "",
  hrContact: "",
  hrLinkedInId: "",

  city: "",

  status: "Applied",
  applicationStatus: "In Review",

  companyEmail: "",

  skills: [],

  followUp: "No",

  jobPlatform: "",

  jobDescription: "",

  hrMessageDraft: "",

  hrMessageSent: "No",

  jobDescriptionImages: [],
};

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
];

function ApplicationModal({
  open,
  onClose,
  onSave,
  editingApplication = null,
  saving = false,
}) {
  const [form, setForm] = useState(defaultForm);

  const [customSkill, setCustomSkill] = useState("");
  const [customPlatform, setCustomPlatform] = useState("");

  const [draftSaved, setDraftSaved] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);

  // ==========================================
  // LOAD EDIT DATA / DRAFT
  // ==========================================

  useEffect(() => {
    if (!open) return;

    if (editingApplication) {
      setForm({
        date:
          editingApplication.date?.substring(0, 10) ||
          "",

        companyName:
          editingApplication.companyName || "",

        dateOfApply:
          editingApplication.dateOfApply?.substring(
            0,
            10
          ) || "",

        hrName:
          editingApplication.hrName || "",

        hrContact:
          editingApplication.hrContact || "",

        hrLinkedInId:
          editingApplication.hrLinkedInId || "",

        city:
          editingApplication.city || "",

        status:
          editingApplication.status || "Applied",

        applicationStatus:
          editingApplication.applicationStatus ||
          "In Review",

        companyEmail:
          editingApplication.companyEmail || "",

        skills:
          Array.isArray(editingApplication.skills)
            ? editingApplication.skills
            : [],

        followUp:
          editingApplication.followUp || "No",

        jobPlatform:
          editingApplication.jobPlatform || "",

        jobDescription:
          editingApplication.jobDescription || "",

        hrMessageDraft:
          editingApplication.hrMessageDraft || "",

        hrMessageSent:
          editingApplication.hrMessageSent || "No",

        jobDescriptionImages:
          Array.isArray(
            editingApplication.jobDescriptionImages
          )
            ? editingApplication.jobDescriptionImages
            : [],
      });

      setSelectedImages([]);

      return;
    }

    const savedDraft =
      localStorage.getItem(DRAFT_KEY);

    if (savedDraft) {
      try {
        const parsedDraft =
          JSON.parse(savedDraft);

        setForm({
          ...defaultForm,
          ...parsedDraft,
        });

        setDraftSaved(true);
      } catch (error) {
        console.error(
          "Failed to load draft:",
          error
        );
      }
    } else {
      setForm({
        ...defaultForm,
        date:
          new Date()
            .toISOString()
            .split("T")[0],

        dateOfApply:
          new Date()
            .toISOString()
            .split("T")[0],
      });

      setDraftSaved(false);
    }

    setSelectedImages([]);
  }, [open, editingApplication]);

  // ==========================================
  // AUTO SAVE DRAFT
  // ==========================================

  useEffect(() => {
    if (!open || editingApplication) {
      return;
    }

    const draftForm = {
      ...form,

      // Do not store actual File objects
      // in localStorage.
      jobDescriptionImages:
        form.jobDescriptionImages || [],
    };

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify(draftForm)
        );

        setDraftSaved(true);
      } catch (error) {
        console.error(
          "Draft auto-save failed:",
          error
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    form,
    open,
    editingApplication,
  ]);

  // ==========================================
  // FIELD UPDATE
  // ==========================================

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

  // ==========================================
  // SKILLS
  // ==========================================

  const toggleSkill = (skill) => {
    setForm((previous) => {
      const exists =
        previous.skills.includes(skill);

      return {
        ...previous,

        skills: exists
          ? previous.skills.filter(
              (item) => item !== skill
            )
          : [
              ...previous.skills,
              skill,
            ],
      };
    });

    setDraftSaved(false);
  };

  const addCustomSkill = () => {
    const skill =
      customSkill.trim();

    if (!skill) return;

    setForm((previous) => {
      if (
        previous.skills.some(
          (item) =>
            item.toLowerCase() ===
            skill.toLowerCase()
        )
      ) {
        return previous;
      }

      return {
        ...previous,

        skills: [
          ...previous.skills,
          skill,
        ],
      };
    });

    setCustomSkill("");
    setDraftSaved(false);
  };

  const removeSkill = (skill) => {
    setForm((previous) => ({
      ...previous,

      skills:
        previous.skills.filter(
          (item) => item !== skill
        ),
    }));

    setDraftSaved(false);
  };

  // ==========================================
  // JOB PLATFORM
  // ==========================================

  const addCustomPlatform = () => {
    const platform =
      customPlatform.trim();

    if (!platform) return;

    updateField(
      "jobPlatform",
      platform
    );

    setCustomPlatform("");
  };

  // ==========================================
  // IMAGE UPLOAD
  // ==========================================

  const handleImageChange = (
    event
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;

    const currentCount =
      selectedImages.length;

    const existingCount =
      Array.isArray(
        form.jobDescriptionImages
      )
        ? form.jobDescriptionImages.length
        : 0;

    const totalCount =
      currentCount + existingCount;

    if (
      totalCount + files.length >
      10
    ) {
      alert(
        "You can upload a maximum of 10 job description images."
      );

      event.target.value = "";
      return;
    }

    const validFiles = files.filter(
      (file) => {
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

          return false;
        }

        if (
          file.size >
          5 * 1024 * 1024
        ) {
          alert(
            `${file.name} is larger than 5 MB.`
          );

          return false;
        }

        return true;
      }
    );

    setSelectedImages(
      (previous) => [
        ...previous,
        ...validFiles,
      ]
    );

    setDraftSaved(false);

    event.target.value = "";
  };

  // ==========================================
  // REMOVE NEW IMAGE
  // ==========================================

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

  // ==========================================
  // REMOVE EXISTING IMAGE
  // ==========================================

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

  // ==========================================
  // SAVE
  // ==========================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !form.companyName.trim()
    ) {
      alert(
        "Company Name is required."
      );
      return;
    }

    if (!form.date) {
      alert("Date is required.");
      return;
    }

    if (!form.dateOfApply) {
      alert(
        "Date of Apply is required."
      );
      return;
    }

    const payload = {
      ...form,

      companyName:
        form.companyName.trim(),

      hrName:
        form.hrName.trim(),

      hrContact:
        form.hrContact.trim(),

      hrLinkedInId:
        form.hrLinkedInId.trim(),

      city:
        form.city.trim(),

      companyEmail:
        form.companyEmail.trim(),

      jobDescription:
        form.jobDescription.trim(),

      hrMessageDraft:
        form.hrMessageDraft.trim(),

      skills:
        form.skills,

      hrMessageSent:
        form.hrMessageSent,

      jobDescriptionImages:
        form.jobDescriptionImages,

      newJobDescriptionImages:
        selectedImages,
    };

    try {
      await onSave(payload);

      if (!editingApplication) {
        localStorage.removeItem(
          DRAFT_KEY
        );
      }

      setDraftSaved(false);
    } catch (error) {
      console.error(
        "Save application failed:",
        error
      );

      alert(
        "Application could not be saved. Your draft is still saved."
      );
    }
  };

  // ==========================================
  // CLOSE
  // ==========================================

  const handleClose = () => {
    // Do not clear draft.
    onClose();
  };

  // ==========================================
  // UI
  // ==========================================

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
          handleClose();
        }
      }}
    >
      <div
        className="application-modal"
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}

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
            className="modal-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* FORM */}

        <form
          className="application-form"
          onSubmit={handleSubmit}
        >
          <div className="form-grid">

            {/* DATE */}

            <div className="form-group">
              <label>
                Date <span>*</span>
              </label>

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

            {/* COMPANY */}

            <div className="form-group">
              <label>
                Company Name{" "}
                <span>*</span>
              </label>

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

            {/* DATE OF APPLY */}

            <div className="form-group">
              <label>
                Date of Apply{" "}
                <span>*</span>
              </label>

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

            {/* HR NAME */}

            <div className="form-group">
              <label>
                HR Name
              </label>

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

            {/* HR CONTACT */}

            <div className="form-group">
              <label>
                HR Contact
              </label>

              <input
                type="tel"
                placeholder="Enter HR contact"
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

            {/* HR LINKEDIN */}

            <div className="form-group">
              <label>
                HR LinkedIn ID
              </label>

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

            {/* CITY */}

            <div className="form-group">
              <label>
                City
              </label>

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

            {/* FOLLOW UP */}

            <div className="form-group">
              <label>
                Follow-up
              </label>

              <select
                value={form.followUp}
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
                onChange={(event) => {
                  const value =
                    event.target.value;

                  updateField(
                    "jobPlatform",
                    value
                  );

                  if (
                    value !==
                    "__custom__"
                  ) {
                    setCustomPlatform(
                      ""
                    );
                  }
                }}
              >
                <option value="">
                  Select platform
                </option>

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

                <option value="__custom__">
                  + Add Custom Platform
                </option>
              </select>

              {form.jobPlatform ===
                "__custom__" && (
                <div className="custom-input-row">
                  <input
                    type="text"
                    placeholder="Enter platform name"
                    value={
                      customPlatform
                    }
                    onChange={(event) =>
                      setCustomPlatform(
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      addCustomPlatform
                    }
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ==========================================
              JOB DESCRIPTION
          ========================================== */}

          <div className="form-group full-width">
            <label>
              Job Description
            </label>

            <textarea
              rows="7"
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

          {/* ==========================================
              JOB DESCRIPTION SCREENSHOTS
          ========================================== */}

          <div className="form-group full-width">
            <label>
              Job Description Screenshots
            </label>

            <div className="upload-box">
              <input
                id="job-description-images"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={
                  handleImageChange
                }
              />

              <label
                htmlFor="job-description-images"
                className="upload-label"
              >
                <Upload size={20} />

                <span>
                  Upload Job Description Screenshots
                </span>
              </label>

              <small>
                Maximum 10 images. JPG,
                PNG or WEBP. Maximum 5 MB
                per image.
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
                          `Job description ${index + 1}`
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
                  (
                    file,
                    index
                  ) => (
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

          {/* ==========================================
              HR LINKEDIN MESSAGE DRAFT
          ========================================== */}

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
              Example: Hello [HR Name], I
              recently applied for the
              [Job Title] position at
              [Company]. I am very
              interested in the opportunity
              and would appreciate the chance
              to connect and discuss how my
              experience aligns with the role.
              Thank you for your time.
            </small>
          </div>

          {/* ==========================================
              SKILLS
          ========================================== */}

          <div className="form-group skills-section">
            <label>
              Skills Mentioned in
              Application
            </label>

            <div className="skills-options">
              {SKILL_OPTIONS.map(
                (skill) => (
                  <button
                    type="button"
                    key={skill}
                    className={
                      form.skills.includes(
                        skill
                      )
                        ? "skill-option active"
                        : "skill-option"
                    }
                    onClick={() =>
                      toggleSkill(
                        skill
                      )
                    }
                  >
                    {skill}
                  </button>
                )
              )}
            </div>

            <div className="custom-input-row">
              <input
                type="text"
                placeholder="Add custom skill"
                value={customSkill}
                onChange={(event) =>
                  setCustomSkill(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    addCustomSkill();
                  }
                }}
              />

              <button
                type="button"
                onClick={
                  addCustomSkill
                }
              >
                Add Skill
              </button>
            </div>

            {form.skills.length >
              0 && (
              <div className="selected-skills">
                {form.skills.map(
                  (skill) => (
                    <span
                      className="selected-skill"
                      key={skill}
                    >
                      {skill}

                      <button
                        type="button"
                        onClick={() =>
                          removeSkill(
                            skill
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  )
                )}
              </div>
            )}
          </div>

          {/* ==========================================
              FOOTER
          ========================================== */}

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
            >
              Back
            </button>

            <button
              type="submit"
              className="save-button"
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
                  <Save size={18} />

                  {editingApplication
                    ? "Update Application"
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

export default ApplicationModal;