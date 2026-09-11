import { useEffect, useState } from "react";
import {
  Users,
  Clock3,
  UserMinus,
  ArrowUpRight,
  BriefcaseBusiness,
  Sparkles,
  TrendingUp,
} from "lucide-react";
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
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl p-8">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Sparkles size={16} />
              Recruitment Overview
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track your recruitment pipeline and candidate activity.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <BriefcaseBusiness size={18} className="text-blue-600" />
            HR Recruitment Console
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Couldn't load dashboard data: {error}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">

          <StatCard
            label="New Applications"
            value={counts?.received}
            description="Candidates recently applied"
            icon={Users}
            iconColor="bg-blue-100 text-blue-600"
          />

          <StatCard
            label="Under Review"
            value={counts?.review}
            description="Applications being reviewed"
            icon={Clock3}
            iconColor="bg-amber-100 text-amber-600"
          />

          <StatCard
            label="Withdrawn"
            value={counts?.withdrawn}
            description="Candidates withdrew applications"
            icon={UserMinus}
            iconColor="bg-red-100 text-red-600"
          />

        </div>

        {/* Recruitment Pipeline */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* Main Card */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recruitment Pipeline
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Overview of your current recruitment process.
                </p>
              </div>

              <TrendingUp size={22} className="text-blue-600" />

            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">

              <PipelineItem
                label="Applications"
                value={counts?.received}
              />

              <PipelineItem
                label="Shortlisting"
                value="—"
              />

              <PipelineItem
                label="Interviews"
                value="—"
              />

              <PipelineItem
                label="Selected"
                value="—"
              />

            </div>

          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Jump to frequently used sections.
            </p>

            <div className="mt-6 space-y-3">

              <QuickAction
                label="View Applications"
              />

              <QuickAction
                label="Resume Shortlisting"
              />

              <QuickAction
                label="Manage Assessments"
              />

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


function StatCard({
  label,
  value,
  description,
  icon: Icon,
  iconColor,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {value === undefined || value === null ? "—" : value}
          </div>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon size={21} />
        </div>

      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">

        <ArrowUpRight size={16} />

        {description}

      </div>

    </div>
  );
}


function PipelineItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {value === undefined || value === null ? "—" : value}
      </div>

    </div>
  );
}


function QuickAction({ label }) {
  return (
    <button
      className="
        flex w-full items-center justify-between
        rounded-xl border border-slate-200
        px-4 py-3 text-left text-sm font-medium
        text-slate-700 transition
        hover:border-blue-200 hover:bg-blue-50
        hover:text-blue-700
      "
    >
      {label}

      <ArrowUpRight size={17} />
    </button>
  );
}