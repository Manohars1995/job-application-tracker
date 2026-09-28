import {
  Search,
  Download,
  RotateCcw,
} from "lucide-react";

export default function FilterBar({
  search,
  setSearch,
  status,
  setStatus,
  applicationStatus,
  setApplicationStatus,
  followUp,
  setFollowUp,
  platform,
  setPlatform,
  platforms,
  onDownload,
  onReset,
}) {
  return (
    <div className="filter-area">
      <div className="search-wrapper">
        <Search size={19} />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search by company, HR, city, skills..."
        />
      </div>

      <select
        value={status}
        onChange={(e) =>
          setStatus(e.target.value)
        }
      >
        <option value="">
          Status: All
        </option>

        <option value="Applied">
          Applied
        </option>

        <option value="Cancelled">
          Cancelled
        </option>

        <option value="In Review">
          In Review
        </option>

        <option value="No Result">
          No Result
        </option>
      </select>

      <select
        value={applicationStatus}
        onChange={(e) =>
          setApplicationStatus(
            e.target.value
          )
        }
      >
        <option value="">
          Application Status: All
        </option>

        <option value="In Review">
          In Review
        </option>

        <option value="Shortlisted">
          Shortlisted
        </option>

        <option value="Rejected">
          Rejected
        </option>

        <option value="No Result">
          No Result
        </option>
      </select>

      <select
        value={followUp}
        onChange={(e) =>
          setFollowUp(e.target.value)
        }
      >
        <option value="">
          Follow-up: All
        </option>

        <option value="Yes">
          Follow-up: Yes
        </option>

        <option value="No">
          Follow-up: No
        </option>
      </select>

      <select
        value={platform}
        onChange={(e) =>
          setPlatform(e.target.value)
        }
      >
        <option value="">
          Platform: All
        </option>

        {platforms.map((item) => (
          <option
            key={item}
            value={item}
          >
            {item}
          </option>
        ))}
      </select>

      <button
        className="reset-button"
        onClick={onReset}
        title="Reset filters"
      >
        <RotateCcw size={17} />
      </button>

      <button
        className="excel-button"
        onClick={onDownload}
      >
        <Download size={18} />
        Download Excel
      </button>
    </div>
  );
}