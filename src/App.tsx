/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User } from "./types";
import LandingPage from "./components/LandingPage";
import Sidebar, { SidebarTab } from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import ResumeView from "./components/ResumeView";
import JobMatcher from "./components/JobMatcher";
import InterviewView from "./components/InterviewView";
import ProfileView from "./components/ProfileView";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [statsReloadKey, setStatsReloadKey] = useState(0);

  // Read session cache to retain login state on browser refresher
  useEffect(() => {
    const cached = localStorage.getItem("talentai_session_user");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) {
          setUser(parsed);
        }
      } catch (err) {
        console.error("Session read mismatch:", err);
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("talentai_session_user", JSON.stringify(loggedInUser));
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("talentai_session_user");
  };

  const forceReloadStats = () => {
    setStatsReloadKey((prev) => prev + 1);
  };

  // Render Landing introduction if session is not active
  if (!user) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans flex flex-col md:flex-row relative">
      
      {/* Absolute ambient lights behind standard UI layout */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area Container */}
      <main className="flex-1 min-w-0 p-6 md:p-8 lg:p-10 relative z-10 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {activeTab === "dashboard" && (
            <div key={`${statsReloadKey}_dash`}>
              <DashboardView 
                user={user} 
                onNavigate={(tab) => setActiveTab(tab)} 
              />
            </div>
          )}

          {activeTab === "resume" && (
            <ResumeView 
              user={user} 
              onRefreshDashboard={forceReloadStats} 
            />
          )}

          {activeTab === "job-match" && (
            <JobMatcher 
              user={user} 
              onRefreshDashboard={forceReloadStats} 
            />
          )}

          {activeTab === "interview" && (
            <InterviewView 
              user={user} 
              onRefreshDashboard={forceReloadStats} 
            />
          )}

          {activeTab === "profile" && (
            <ProfileView 
              user={user} 
              onUpdateUser={(updated) => {
                setUser(updated);
                localStorage.setItem("talentai_session_user", JSON.stringify(updated));
              }} 
            />
          )}
        </div>
      </main>

    </div>
  );
}
