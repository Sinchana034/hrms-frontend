import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Dashboard() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [received, review, withdrawn] = await Promise.all([
          api.listApplications({ status: "Application Received" }),
          api.listApplications({ status: "Under Review" }),
          api.listApplications({ status: "Withdrawn" }),
        ]);

        setCounts({
          received: received.length,
          review: review.length,
          withdrawn: withdrawn.length,
        });
      } catch (e) {
        setError(e.message);
      }
    }

    load();
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-display font-semibold text-ink">
        Dashboard
      </h1>

      <p className="text-slate text-sm mt-1">
        Phase 1 build — application intake and HR access only. Shortlisting,
        assessments, interviews, and offers arrive in later phases.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          Couldn't load stats: {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard
          label="New applications"
          value={counts?.received}
        />

        <StatCard
          label="Under review"
          value={counts?.review}
        />

        <StatCard
          label="Withdrawn"
          value={counts?.withdrawn}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-line rounded-lg p-5">
      <div className="text-xs uppercase tracking-wide text-slate">
        {label}
      </div>

      <div className="mt-2 text-3xl font-display font-semibold text-ink">
        {value === undefined ? "—" : value}
      </div>
    </div>
  );
}