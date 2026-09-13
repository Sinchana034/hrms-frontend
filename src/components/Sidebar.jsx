import { NavLink } from "react-router-dom";

const LIVE = [
  { to: "/", label: "Dashboard" },
  { to: "/applications", label: "Applications" },
  { to: "/duplicates", label: "Duplicates" },
  { to: "/departments", label: "Departments" },
  { to: "/job-requirements", label: "Positions / Job Requirements" },
  { to: "/settings/email", label: "Email Tracking" },

  // Recruitment workflow
  { to: "/shortlisting", label: "ML Resume Shortlisting" },
  { to: "/assessments", label: "Assessments" },
  { to: "/ai-interviews", label: "AI Interviews" },
  { to: "/interviews", label: "HR Interviews" },
  { to: "/final-selection", label: "Final Selection" },

  { 
  to: "/final-candidates", 
  label: "Final Candidates" 
},
  { to: "/offer-letters", label: "Offer Letters" },
];



export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-white h-screen sticky top-0 flex flex-col">

      {/* Header */}
      <div className="px-5 py-5 border-b border-line">
        <div className="font-display font-semibold text-ink text-sm tracking-wide">
          HRMS
        </div>

        <div className="text-xs text-slate mt-0.5">
          Recruitment Console
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">

        {LIVE.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `block mx-2 mb-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-ink hover:bg-canvas"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

      </nav>
    </aside>
  );
}