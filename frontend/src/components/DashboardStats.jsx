import {
  FileText,
  Send,
  UsersRound,
  Clock3,
  Plus,
} from "lucide-react";

const cards = [
  {
    key: "totalApplications",
    title: "Total Applications",
    icon: FileText,
    className: "blue",
  },
  {
    key: "applied",
    title: "Applied",
    icon: Send,
    className: "green",
  },
  {
    key: "shortlisted",
    title: "Shortlisted",
    icon: UsersRound,
    className: "red",
  },
  {
    key: "followUpPending",
    title: "Follow-up Pending",
    icon: Clock3,
    className: "yellow",
  },
];

export default function DashboardStats({
  dashboard,
  onAdd,
}) {
  return (
    <section className="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className={`stat-card stat-${card.className}`}
          >
            <div className="stat-icon">
              <Icon size={27} />
            </div>

            <div>
              <div className="stat-title">
                {card.title}
              </div>

              <div className="stat-value">
                {dashboard?.[card.key] ?? 0}
              </div>
            </div>
          </div>
        );
      })}

      <button
        className="add-application-button"
        onClick={onAdd}
      >
        <Plus size={21} />
        Add Application
      </button>
    </section>
  );
}