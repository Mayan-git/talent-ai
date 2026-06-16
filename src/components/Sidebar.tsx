/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, FileText, Briefcase, Mic, User as UserIcon, LogOut, Menu, X, Sparkles } from "lucide-react";
import { User } from "../types";
import { useState } from "react";

export type SidebarTab = 
  | "dashboard" 
  | "resume" 
  | "job-match" 
  | "interview" 
  | "profile"
  | "ats-checker"
  | "resume-builder"
  | "career-coach"
  | "learning-roadmap"
  | "interview-analytics"
  | "voice-interview"
  | "chatbot"
  | "portfolio-projects"
  | "admin-panel";

interface SidebarProps {
  user: User;
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeTab, onSelectTab, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Categorized sidebars Navigation list
  const coreNavItems = [
    { id: "dashboard" as SidebarTab, label: "Core Dashboard", icon: LayoutDashboard },
    { id: "profile" as SidebarTab, label: "Profile Settings", icon: UserIcon },
  ];

  const resumeNavItems = [
    { id: "resume" as SidebarTab, label: "Resume Auditor", icon: FileText },
    { id: "ats-checker" as SidebarTab, label: "SaaS ATS Checker", icon: Sparkles },
    { id: "resume-builder" as SidebarTab, label: "AI Resume Builder", icon: FileText },
    { id: "portfolio-projects" as SidebarTab, label: "Portfolio Architect", icon: FileText },
  ];

  const careerCoachNavItems = [
    { id: "career-coach" as SidebarTab, label: "AI Career Coach", icon: Sparkles },
    { id: "learning-roadmap" as SidebarTab, label: "Study Roadmaps", icon: Briefcase },
    { id: "chatbot" as SidebarTab, label: "Career Assistant", icon: Sparkles },
  ];

  const interviewNavItems = [
    { id: "interview" as SidebarTab, label: "Smart Interview", icon: Mic },
    { id: "voice-interview" as SidebarTab, label: "Voice Mock Setup", icon: Mic },
    { id: "interview-analytics" as SidebarTab, label: "Interview Analytics", icon: LayoutDashboard },
  ];

  const adminNavItems = [
    { id: "admin-panel" as SidebarTab, label: "Admin panel", icon: LayoutDashboard },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleSelect = (tab: SidebarTab) => {
    onSelectTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#111111] border-b border-white/5 px-6 h-16 flex items-center justify-between sticky top-0 z-30 w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-white">HireWise AI</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-64 bg-[#111111] border-r border-white/5 flex flex-col justify-between z-20 transition-transform duration-300
        md:translate-x-0 md:sticky md:h-screen
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Branding Area */}
        <div className="p-6 border-b border-white/5 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="font-display font-extrabold text-sm tracking-tight text-white block">HireWise AI</span>
              <span className="text-indigo-400 font-mono text-[8px] block uppercase font-bold leading-none">Enterprise SaaS v3.0</span>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto text-left">
          
          {/* Core Panel */}
          <div>
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest pl-3 block mb-2">Systems Controls</span>
            <div className="space-y-0.5">
              {coreNavItems.map((item) => {
                const Icon = item.icon;
                const IsActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`
                      w-full h-9 px-3 rounded-lg flex items-center gap-2.5 font-display font-bold text-xs tracking-wide transition-all cursor-pointer
                      ${IsActive 
                        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10 shadow-sm" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${IsActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resume & Portfolio Panel */}
          <div>
            <span className="text-[9px] font-mono font-bold text-indigo-400/90 uppercase tracking-widest pl-3 block mb-2">Optimisation Suite</span>
            <div className="space-y-0.5">
              {resumeNavItems.map((item) => {
                const Icon = item.icon;
                const IsActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`
                      w-full h-9 px-3 rounded-lg flex items-center gap-2.5 font-display font-bold text-xs tracking-wide transition-all cursor-pointer
                      ${IsActive 
                        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10 shadow-sm" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${IsActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Training & Advice */}
          <div>
            <span className="text-[9px] font-mono font-bold text-teal-400/95 uppercase tracking-widest pl-3 block mb-2">Career Mentorship</span>
            <div className="space-y-0.5">
              {careerCoachNavItems.map((item) => {
                const Icon = item.icon;
                const IsActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`
                      w-full h-9 px-3 rounded-lg flex items-center gap-2.5 font-display font-bold text-xs tracking-wide transition-all cursor-pointer
                      ${IsActive 
                        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10 shadow-sm" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${IsActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated Audits */}
          <div>
            <span className="text-[9px] font-mono font-bold text-[#e1b73c] uppercase tracking-widest pl-3 block mb-2">Simulated Audits</span>
            <div className="space-y-0.5">
              {interviewNavItems.map((item) => {
                const Icon = item.icon;
                const IsActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`
                      w-full h-9 px-3 rounded-lg flex items-center gap-2.5 font-display font-bold text-xs tracking-wide transition-all cursor-pointer
                      ${IsActive 
                        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10 shadow-sm" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${IsActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin panel */}
          {user.role === "admin" && (
            <div>
              <span className="text-[9px] font-mono font-bold text-red-400/90 uppercase tracking-widest pl-3 block mb-2">Internal Admin</span>
              <div className="space-y-0.5">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const IsActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`
                        w-full h-9 px-3 rounded-lg flex items-center gap-2.5 font-display font-bold text-xs tracking-wide transition-all cursor-pointer
                        ${IsActive 
                          ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10 shadow-sm" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }
                      `}
                    >
                      <Icon className={`w-3.5 h-3.5 ${IsActive ? "text-indigo-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </nav>

        {/* User Badge Profile + Quit Action */}
        <div className="p-4 border-t border-white/5 bg-[#0e0e0e]/50">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-400 uppercase">
              {user.name ? user.name.slice(0, 2) : "CV"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-xs text-white truncate">{user.name || "Aspirant"}</p>
              <p className="font-mono text-[9px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full h-10 mt-3 px-3 rounded-lg border border-white/5 hover:border-red-500/20 bg-[#141414] hover:bg-red-500/5 text-slate-400 hover:text-red-400 flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Abandon Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
