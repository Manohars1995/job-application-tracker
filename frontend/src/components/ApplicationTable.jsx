import {
  Pencil,
  Trash2,
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

export default function ApplicationTable({
  applications,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-scroll">
      <table className="applications-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Date</th>
            <th>Company Name</th>
            <th>Date of Apply</th>
            <th>HR Name</th>
            <th>HR Contact</th>
            <th>City</th>
            <th>Status</th>
            <th>Application Status</th>
            <th>Company Email</th>
            <th>Skills</th>
            <th>Follow-up</th>
            <th>Job Platform</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {applications.map(
            (application, index) => (
              <tr
                key={application._id}
              >
                <td>{index + 1}</td>

                <td>
                  {formatDate(
                    application.date
                  )}
                </td>

                <td>
                  <strong className="company-name">
                    {
                      application.companyName
                    }
                  </strong>
                </td>

                <td>
                  {formatDate(
                    application.dateOfApply
                  )}
                </td>

                <td>
                  {application.hrName ||
                    "-"}
                </td>

                <td>
                  {application.hrContact ||
                    "-"}
                </td>

                <td>
                  {application.city ||
                    "-"}
                </td>

                <td>
                  <span
                    className={`status-badge status-${getStatusClass(
                      application.status
                    )}`}
                  >
                    {application.status}
                  </span>
                </td>

                <td>
                  <span
                    className={`status-badge application-status-${getStatusClass(
                      application.applicationStatus
                    )}`}
                  >
                    {
                      application.applicationStatus
                    }
                  </span>
                </td>

                <td>
                  {application.companyEmail ||
                    "-"}
                </td>

                <td>
                  <div className="skills-list">
                    {(
                      application.skills ||
                      []
                    ).map((skill) => (
                      <span
                        className="skill-tag"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </td>

                <td>
                  <span
                    className={`follow-badge ${
                      application.followUp ===
                      "Yes"
                        ? "follow-yes"
                        : "follow-no"
                    }`}
                  >
                    {
                      application.followUp
                    }
                  </span>
                </td>

                <td>
                  {application.jobPlatform ||
                    "-"}
                </td>

                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-button"
                      onClick={() =>
                        onEdit(
                          application
                        )
                      }
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        onDelete(
                          application
                        )
                      }
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}