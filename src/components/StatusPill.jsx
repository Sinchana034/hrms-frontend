const STYLES = {
  "Application Received": "bg-line text-slate",
  "Under Review": "bg-warn/10 text-warn",
  Withdrawn: "bg-bad/10 text-bad",
};

export default function StatusPill({ status }) {
  const cls = STYLES[status] || "bg-line text-slate";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
