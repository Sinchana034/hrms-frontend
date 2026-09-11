const STYLES = {
  "Application Received": "bg-line text-muted",
  "Under Review": "bg-warn/10 text-warn",
  Withdrawn: "bg-bad/10 text-bad",
};

export default function StatusPill({ status }) {
  const cls = STYLES[status] || "bg-line text-muted";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
