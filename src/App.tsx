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
import ErrorBoundary from "./components/ErrorBoundary";

// SaaS Premium Views
import AtsChecker from "./components/AtsChecker";
import ResumeBuilder from "./components/ResumeBuilder";
import CareerCoach from "./components/CareerCoach";
import LearningRoadmap from "./components/LearningRoadmap";
import InterviewAnalyticsView from "./components/InterviewAnalyticsView";
import VoiceInterview from "./components/VoiceInterview";
import CareerChatbot from "./components/CareerChatbot";
import PortfolioProjects from "./components/PortfolioProjects";
import AdminPanel from "./components/AdminPanel";
import NotificationCenter from "./components/NotificationCenter";

import { Bell, ShieldAlert } from "lucide-react";
import { saasStore } from "./lib/saasStore";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [statsReloadKey, setStatsReloadKey] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Update notification count
  useEffect(() => {
    if (user) {
      const db = saasStore.get();
      const count = db.notifications.filter(n => n.userId === user.id && !n.read).length;
      setUnreadCount(count);
    }
  }, [user, statsReloadKey]);

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
        
        {/* Real-time small alerts header */}
        <div className="flex justify-end mb-4 relative z-50">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-full relative cursor-pointer text-zinc-400 hover:text-white transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white font-mono text-[9px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center border border-[#0a0a0a]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating drawer position */}
          {showNotifications && (
            <div className="absolute right-0 top-11 z-50 animate-fade-in shadow-2xl">
              <NotificationCenter 
                user={user} 
                onRefreshNotificationCount={forceReloadStats} 
              />
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto">
          <ErrorBoundary key={activeTab} name={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ")}>
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

            {activeTab === "ats-checker" && (
              <AtsChecker 
                user={user} 
                onRefreshDashboard={forceReloadStats} 
              />
            )}

            {activeTab === "resume-builder" && (
              <ResumeBuilder 
                user={user} 
                onRefreshDashboard={forceReloadStats} 
              />
            )}

            {activeTab === "portfolio-projects" && (
              <PortfolioProjects 
                user={user} 
                onRefreshDashboard={forceReloadStats} 
              />
            )}

            {activeTab === "career-coach" && (
              <CareerCoach 
                user={user} 
                onRefreshDashboard={forceReloadStats} 
              />
            )}

            {activeTab === "learning-roadmap" && (
              <LearningRoadmap 
                user={user} 
                onRefreshDashboard={forceReloadStats} 
              />
            )}

            {activeTab === "chatbot" && (
              <CareerChatbot user={user} />
            )}

            {activeTab === "voice-interview" && (
              <VoiceInterview 
                user={user} 
                onRefreshDashboard={forceReloadStats} 
              />
            )}

            {activeTab === "interview-analytics" && (
              <InterviewAnalyticsView 
                user={user} 
                onRefreshDashboard={forceReloadStats} 
              />
            )}

            {activeTab === "admin-panel" && (
              user?.role === "admin" ? (
                <AdminPanel 
                  user={user} 
                  onRefreshDashboard={forceReloadStats} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <ShieldAlert className="w-12 h-12 text-red-500 animate-bounce" />
                  <h3 className="font-display font-black text-xl text-white">Security Violation</h3>
                  <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">
                    Access Denied. You do not have permission to view this zone. This operation has been logged.
                  </p>
                </div>
              )
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
          </ErrorBoundary>
        </div>
      </main>

    </div>
  );
}

