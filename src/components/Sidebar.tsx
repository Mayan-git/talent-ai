/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, FileText, Briefcase, Mic, User as UserIcon, LogOut, Menu, X, Sparkles } from "lucide-react";
import { User } from "../types";
import { useState } from "react";

export type SidebarTab = "dashboard" | "resume" | "job-match" | "interview" | "profile";

interface SidebarProps {
  user: User;
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeTab, onSelectTab, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "dashboard" as SidebarTab, label: "Core Dashboard", icon: LayoutDashboard },
    { id: "resume" as SidebarTab, label: "Resume Auditor", icon: FileText },
    { id: "job-match" as SidebarTab, label: "Job Fit Alignment", icon: Briefcase },
    { id: "interview" as SidebarTab, label: "Simulated Interview", icon: Mic },
    { id: "profile" as SidebarTab, label: "Profile Tracker", icon: UserIcon },
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
          <span className="font-display font-bold text-sm tracking-tight text-white">TalentAI</span>
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
        <div className="p-6 border-b border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg tracking-tight text-white block">TalentAI</span>
              <span className="text-slate-400 font-mono text-[9px] block uppercase font-bold leading-none">Career Copilot</span>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const IsActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`
                  w-full h-11 px-3.5 rounded-lg flex items-center gap-3 font-display font-semibold text-xs tracking-wide transition-all cursor-pointer
                  ${IsActive 
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10 shadow-sm" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${IsActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
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
