import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Copy,
  Building2,
  BriefcaseBusiness,
  Mail,
  BrainCircuit,
  ClipboardCheck,
  Sparkles,
  UserRoundCheck,
  Trophy,
  FileCheck2,
  Clock,
  FileText,
  Send,
  Handshake,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const LIVE = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/applications",
    label: "Applications",
    icon: Users,
  },
  {
    to: "/duplicates",
    label: "Duplicates",
    icon: Copy,
  },
  {
    to: "/departments",
    label: "Departments",
    icon: Building2,
  },
  {
    to: "/job-requirements",
    label: "Positions / Job Requirements",
    icon: BriefcaseBusiness,
  },
  {
    to: "/settings/email",
    label: "Email Tracking",
    icon: Mail,
  },

  // Recruitment workflow
  {
    to: "/shortlisting",
    label: "ML Resume Shortlisting",
    icon: BrainCircuit,
  },
  {
    to: "/assessments",
    label: "Assessments",
    icon: ClipboardCheck,
  },
  {
    to: "/ai-interviews",
    label: "AI Interviews",
    icon: Sparkles,
  },
  {
    to: "/interviews",
    label: "HR Interviews",
    icon: UserRoundCheck,
  },
  {
    to: "/final-selection",
    label: "Final Selection",
    icon: Trophy,
  },
  {
    to: "/final-candidates",
    label: "Final Candidates",
    icon: FileCheck2,
  },
];

const UPCOMING = [
  {
    label: "Offer Letters",
    icon: FileText,
  },
  {
    label: "Offer Responses",
    icon: Send,
  },
  {
    label: "Onboarding Handoff",
    icon: Handshake,
  },
  {
    label: "Reports & Export",
    icon: BarChart3,
  },
  {
    label: "Data Requests",
    icon: Clock,
  },
  {
    label: "Audit Logs",
    icon: ShieldCheck,
  },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">

      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-5">

        <div className="flex items-center gap-3">

          {/* Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            H
          </div>

          <div>
            <div className="font-display text-sm font-bold tracking-wide text-slate-900">
              HRMS
            </div>

            <div className="mt-0.5 text-xs text-slate-500">
              Recruitment Console
            </div>
          </div>

        </div>

      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">

        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Recruitment
        </div>

        {LIVE.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `
                group mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5
                text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
                `
              }
            >
              <Icon
                size={18}
                className="shrink-0"
              />

              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Upcoming Section */}
        <div className="mt-6">

          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Upcoming
          </div>

          {UPCOMING.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                title="Coming soon"
                className="
                  mb-1 flex cursor-not-allowed items-center gap-3
                  rounded-lg px-3 py-2.5 text-sm text-slate-400
                  opacity-70
                "
              >
                <Icon size={18} />

                <span>{item.label}</span>
              </div>
            );
          })}

        </div>

      </nav>

      {/* Bottom User Section */}
      <div className="border-t border-slate-100 p-4">

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            HR
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-800">
              HR Admin
            </div>

            <div className="text-xs text-slate-500">
              Recruitment Team
            </div>
          </div>

        </div>

      </div>

    </aside>
  );
}