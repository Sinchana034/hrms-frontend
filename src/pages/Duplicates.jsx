import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Duplicates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.listDuplicates("pending"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleResolve(duplicateId, resolution, canonicalId) {
    setBusyId(duplicateId);
    try {
      await api.resolveDuplicate(duplicateId, resolution, canonicalId);
      setItems((prev) => prev.filter((d) => d.duplicate_id !== duplicateId));
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-display font-semibold text-ink">Duplicates</h1>
      <p className="mt-1 text-sm text-slate">
        Flagged by matching email, phone, or similar name (Section 6.3). Nothing is ever merged
        or deleted automatically — every pair needs a decision.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      {loading && <div className="mt-6 text-sm text-slate">Loading…</div>}
      {!loading && items.length === 0 && !error && (
        <div className="mt-6 text-sm text-slate">No pending duplicate flags.</div>
      )}

      <div className="mt-5 space-y-3">
        {items.map((d) => (
          <div key={d.duplicate_id} className="bg-white border border-line rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate">
                Matched on {d.match_type.replace("_", " ")}
                {d.match_score != null && ` · ${d.match_score}% similarity`}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <CandidateCard app={d.application} />
              <CandidateCard app={d.matched_application} />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                disabled={busyId === d.duplicate_id}
                onClick={() => handleResolve(d.duplicate_id, "mark_duplicate", d.application.application_id)}
                className="text-xs px-3 py-1.5 rounded-md border border-line hover:bg-canvas disabled:opacity-50"
              >
                Keep left, mark right as duplicate
              </button>
              <button
                disabled={busyId === d.duplicate_id}
                onClick={() =>
                  handleResolve(d.duplicate_id, "mark_duplicate", d.matched_application.application_id)
                }
                className="text-xs px-3 py-1.5 rounded-md border border-line hover:bg-canvas disabled:opacity-50"
              >
                Keep right, mark left as duplicate
              </button>
              <button
                disabled={busyId === d.duplicate_id}
                onClick={() => handleResolve(d.duplicate_id, "keep_separate")}
                className="text-xs px-3 py-1.5 rounded-md border border-line hover:bg-canvas disabled:opacity-50 ml-auto"
              >
                Keep separate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ app }) {
  return (
    <div className="border border-line rounded-md p-3">
      <div className="font-medium text-ink text-sm">{app.candidate_name}</div>
      <div className="text-xs text-slate mt-0.5">{app.email}</div>
      {app.phone && <div className="text-xs text-slate">{app.phone}</div>}
      <div className="text-xs text-slate mt-1">{app.current_status}</div>
    </div>
  );
}
