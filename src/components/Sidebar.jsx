import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
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
  FileText,
  LogOut,
} from "lucide-react";

const RECRUITMENT = [
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
];

const WORKFLOW = [
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

const OTHER = [
  {
    to: "/offer-letters",
    label: "Offer Letters",
    icon: FileText,
  },
];

function SidebarLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        `
        group flex items-center gap-3
        mx-3 mb-1 px-3 py-2.5
        rounded-xl text-sm font-medium
        transition-all duration-200
        ${
          isActive
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }
        `
      }
    >
      <Icon
        size={18}
        className="shrink-0 transition-transform duration-200 group-hover:scale-110"
      />

      <span>{item.label}</span>
    </NavLink>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="px-5 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">

      {/* Logo / Header */}
      <div className="border-b border-slate-200 px-5 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-md">
            H
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900">
              HRMS
            </div>

            <div className="text-xs text-slate-500">
              Recruitment Console
            </div>
          </div>

        </div>

      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pb-4">

        {/* Recruitment */}
        <SectionTitle>
          Recruitment
        </SectionTitle>

        {RECRUITMENT.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
          />
        ))}

        {/* Workflow */}
        <SectionTitle>
          Recruitment Workflow
        </SectionTitle>

        {WORKFLOW.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
          />
        ))}

        {/* Other */}
        <SectionTitle>
          Documents
        </SectionTitle>

        {OTHER.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
          />
        ))}

      </nav>

     {/* Bottom User */}
      <div className="border-t border-slate-200 p-4">

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            HR
          </div>

          <div className="min-w-0 flex-1">

            <div className="truncate text-sm font-semibold text-slate-800">
              HR Admin
            </div>

            <div className="truncate text-xs text-slate-500">
              Recruitment Team
            </div>

          </div>

        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={16} />
          Logout
        </button>

      </div>

    </aside>
  );
}