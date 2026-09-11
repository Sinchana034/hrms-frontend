import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function EmailSettings() {
  const [status, setStatus] = useState(null);
  const [suppressions, setSuppressions] = useState([]);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  async function load() {
    setError(null);
    try {
      const [s, sup] = await Promise.all([api.emailSyncStatus(), api.listSuppressions()]);
      setStatus(s);
      setSuppressions(sup);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // Google redirects back here with ?connected=1 after OAuth (Section 6.2)
    if (new URLSearchParams(window.location.search).get("connected")) {
      window.history.replaceState({}, "", "/settings/email");
    }
  }, []);

  async function handleConnect() {
    try {
      const { authorization_url } = await api.gmailConnectUrl();
      window.location.href = authorization_url;
    } catch (e) {
      window.alert(e.message);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await api.gmailSync();
      setSyncResult(result);
      load();
    } catch (e) {
      window.alert(e.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleClearSuppression(email) {
    try {
      await api.clearSuppression(email);
      setSuppressions((prev) => prev.filter((s) => s.email !== email));
    } catch (e) {
      window.alert(e.message);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-display font-semibold text-ink">Email Tracking</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      <section className="mt-6 bg-white border border-line rounded-lg p-5">
        <h2 className="font-medium text-ink text-sm">HR mailbox (Section 6.2)</h2>
        {status?.connected ? (
          <>
            <p className="text-sm text-muted mt-1">
              Connected: <span className="text-ink">{status.account_email}</span>
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="mt-3 text-xs px-3 py-1.5 rounded-md bg-accent text-white disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Sync now"}
            </button>
            {syncResult && (
              <p className="mt-2 text-xs text-muted">
                {syncResult.applications_created} new application(s) from {syncResult.messages_seen}{" "}
                message(s) · {syncResult.skipped} skipped · {syncResult.errors} error(s)
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted mt-1">No mailbox connected yet.</p>
            <button
              onClick={handleConnect}
              className="mt-3 text-xs px-3 py-1.5 rounded-md bg-accent text-white"
            >
              Connect Gmail
            </button>
          </>
        )}
        <p className="mt-3 text-xs text-muted/70">
          Manual sync only for now — periodic auto-polling lands once Celery/Redis is running
          (see README).
        </p>
      </section>

      <section className="mt-6 bg-white border border-line rounded-lg p-5">
        <h2 className="font-medium text-ink text-sm">Suppression list (Section 10)</h2>
        <p className="text-sm text-muted mt-1">
          Addresses that hard-bounced or complained. The system won't send to these until HR
          clears the flag.
        </p>
        {suppressions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing suppressed.</p>
        ) : (
          <table className="w-full text-sm mt-3">
            <tbody>
              {suppressions.map((s) => (
                <tr key={s.email} className="border-t border-line">
                  <td className="py-2 text-ink">{s.email}</td>
                  <td className="py-2 text-muted">{s.reason}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleClearSuppression(s.email)}
                      className="text-xs text-accent hover:underline"
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
