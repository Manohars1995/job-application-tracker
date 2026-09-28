import {
  Pencil,
  Trash2,
  CalendarDays,
  UserRound,
  Phone,
  MapPin,
  Mail,
  BriefcaseBusiness,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusClass(value = "") {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function ApplicationCards({
  applications,
  onEdit,
  onDelete,
}) {
  return (
    <div className="mobile-applications">
      {applications.map(
        (application, index) => (
          <article
            className="application-mobile-card"
            key={application._id}
          >
            <div className="mobile-card-top">
              <div>
                <span className="mobile-number">
                  #{index + 1}
                </span>

                <h3>
                  {
                    application.companyName
                  }
                </h3>
              </div>

              <span
                className={`status-badge status-${getStatusClass(
                  application.status
                )}`}
              >
                {application.status}
              </span>
            </div>

            <div className="mobile-info-grid">
              <div>
                <CalendarDays size={16} />
                <span>
                  {formatDate(
                    application.dateOfApply
                  )}
                </span>
              </div>

              <div>
                <UserRound size={16} />
                <span>
                  {application.hrName ||
                    "No HR name"}
                </span>
              </div>

              <div>
                <Phone size={16} />
                <span>
                  {application.hrContact ||
                    "No contact"}
                </span>
              </div>

              <div>
                <MapPin size={16} />
                <span>
                  {application.city ||
                    "No city"}
                </span>
              </div>

              <div>
                <Mail size={16} />
                <span>
                  {application.companyEmail ||
                    "No email"}
                </span>
              </div>

              <div>
                <BriefcaseBusiness
                  size={16}
                />

                <span>
                  {application.jobPlatform ||
                    "No platform"}
                </span>
              </div>
            </div>

            <div className="mobile-badges">
              <span
                className={`status-badge application-status-${getStatusClass(
                  application.applicationStatus
                )}`}
              >
                {
                  application.applicationStatus
                }
              </span>

              <span
                className={`follow-badge ${
                  application.followUp ===
                  "Yes"
                    ? "follow-yes"
                    : "follow-no"
                }`}
              >
                Follow-up:{" "}
                {application.followUp}
              </span>
            </div>

            <div className="mobile-skills">
              {(
                application.skills || []
              ).map((skill) => (
                <span
                  className="skill-tag"
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mobile-card-actions">
              <button
                onClick={() =>
                  onEdit(application)
                }
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                onClick={() =>
                  onDelete(application)
                }
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </article>
        )
      )}
    </div>
  );
}