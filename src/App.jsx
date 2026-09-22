import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import Duplicates from "./pages/Duplicates";
import EmailSettings from "./pages/EmailSettings";
import Login from "./pages/Login";
import ApplyForm from "./pages/ApplyForm";
import JobRequirements from "./pages/JobRequirements";
import Departments from "./pages/Departments";
import Shortlisting from "./pages/Shortlisting";
import Assessment from "./pages/Assessment";
import Assessments from "./pages/Assessments";
import AIInterviews from "./pages/AIInterviews";
import Interviews from "./pages/Interviews";
import FinalSelection from "./pages/FinalSelection";
import FinalCandidates from "./pages/FinalCandidates";
import OfferLetters from "./pages/OfferLetters";

function useSession() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return session;
}

function HrLayout({ children }) {
  const session = useSession();

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Loading…</div>;
  }
  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  return (
  <div className="min-h-screen bg-slate-50">
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="ml-64 flex-1 overflow-x-hidden">
        <div className="min-h-screen p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  </div>
);
}

export default function App() {
  return (
    <Routes>
      {/* Public candidate-facing route — no auth, no persistent account (Section 3) */}
      <Route path="/apply" element={<ApplyForm />} />
      <Route path="/login" element={<Login />} />
     
      <Route
          path="/assessments"
          element={
            <HrLayout>
              <Assessments />
            </HrLayout>
          }
        />
       {/* Candidate assessment route */}
      <Route
          path="/assessment/:token"
          element={<Assessment />}
        />

       <Route
        path="/ai-interviews"
        element={
          <HrLayout>
            <AIInterviews />
          </HrLayout>
        }
       />

       <Route
        path="/final-selection"
        element={
          <HrLayout>
            <FinalSelection />
          </HrLayout>
        }
      />
      <Route
        path="/final-candidates"
        element={
          <HrLayout>
            <FinalCandidates />
          </HrLayout>
        }
      />

      <Route
        path="/offer-letters"
        element={
          <HrLayout>
            <OfferLetters />
          </HrLayout>
        }
      />

      {/* HR-only routes */}
      <Route
        path="/"
        element={
          <HrLayout>
            <Dashboard />
          </HrLayout>
        }
      />
      <Route
        path="/applications"
        element={
          <HrLayout>
            <Applications />
          </HrLayout>
        }
      />
      <Route
        path="/duplicates"
        element={
          <HrLayout>
            <Duplicates />
          </HrLayout>
        }
      />
      <Route
        path="/job-requirements"
        element={
          <HrLayout>
            <JobRequirements />
          </HrLayout>
        }
      />

      <Route
        path="/shortlisting"
        element={
          <HrLayout>
            <Shortlisting />
          </HrLayout>
        }
      />
      <Route
        path="/interviews"
        element={
           <HrLayout>
            <Interviews />
          </HrLayout>
        }
      />
      <Route
        path="/departments"
        element={
          <HrLayout>
            <Departments />
          </HrLayout>
        }
      />
      <Route
        path="/settings/email"
        element={
          <HrLayout>
            <EmailSettings />
          </HrLayout>
        }
      />
    </Routes>
  );
}
