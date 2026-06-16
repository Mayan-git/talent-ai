/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { 
  FileText, Briefcase, Mic, Sparkles, TrendingUp, AlertCircle, Calendar, ArrowRight, ClipboardList
} from "lucide-react";
import { User, DashboardStats } from "../types";
import { motion } from "motion/react";

interface DashboardViewProps {
  user: User;
  onNavigate: (tab: "resume" | "job-match" | "interview") => void;
}

export default function DashboardView({ user, onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const response = await fetch(`/api/dashboard/stats/${user.id}`);
        if (!response.ok) throw new Error("Stats fetch unsuccessful");
        const data = await response.json();
        if (active) setStats(data);
      } catch (err) {
        console.error("Dashboard statistics retrieval issue:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStats();
    return () => { active = false; };
  }, [user.id]);

  // Fallback visual trends configuration if history is thin
  const chartData = [
    { name: "Week 1", "CV Readiness": 60, "Practice score": 55 },
    { name: "Week 2", "CV Readiness": 68, "Practice score": 62 },
    { name: "Week 3", "CV Readiness": stats?.averageResumeScore || 72, "Practice score": stats?.averageInterviewScore || 68 },
    { name: "Week 4", "CV Readiness": stats?.averageResumeScore || 78, "Practice score": stats?.averageInterviewScore || 74 },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-10 h-10 border-t-2 border-indigo-500 rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs text-indigo-400 animate-pulse">Retrieving Career Performance Matrices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Dynamic Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-white">
            Welcome Back, {user.name}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tracking profile index score, target matches, and feedback loops.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-lg text-indigo-400 text-xs font-mono font-bold">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Profile Strength: {stats?.averageResumeScore || 0}% Ready</span>
        </div>
      </div>

      {/* Grid of Key Performance indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CV Score Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Average CV Audit</p>
              <h3 className="font-display font-extrabold text-2xl text-white mt-1.5">
                {stats?.averageResumeScore || 0}%
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-2">
            Based on <span className="text-indigo-400 font-bold">{stats?.resumeCount || 0} uploaded CVs</span>.
          </div>
        </div>

        {/* Interview Grade Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Interview Rating</p>
              <h3 className="font-display font-extrabold text-2xl text-white mt-1.5">
                {stats?.averageInterviewScore || 0}%
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-2">
            Across <span className="text-violet-400 font-bold">{stats?.interviewsCount || 0} completed</span> mockups.
          </div>
        </div>

        {/* Job Gaps Handled */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Gaps Identifiers</p>
              <h3 className="font-display font-extrabold text-2xl text-white mt-1.5">
                {stats?.skillGapsTrackedCount || 0}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>Technological gaps flagged.</span>
          </div>
        </div>

        {/* Quick Launch Card */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-indigo-500/20 p-5 rounded-2xl flex flex-col justify-between h-32 relative group cursor-pointer hover:border-indigo-500/45 transition-all" onClick={() => onNavigate("interview")}>
          <div>
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
              <span>Simulated Interview</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </h4>
            <p className="text-xs text-indigo-200 mt-1">Get real executive simulation practice questions in minutes.</p>
          </div>
          <span className="text-xs font-semibold text-indigo-300 font-mono flex items-center gap-1 group-hover:text-indigo-200 transition-colors">
            <span>Power Up Simulator</span>
            <ArrowRight className="w-4.5 h-4.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

      </div>

      {/* Main Stats Row: Trend Chart + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Trend Area Chart Widget */}
        <div className="lg:col-span-8 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-white">Performance Progress</h3>
            <p className="text-xs text-slate-400 mt-1">Track scoring upgrades on resume standards and interactive evaluations.</p>
          </div>

          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInterview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.9)", 
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff"
                  }} 
                  labelClassName="text-slate-400 text-xs font-mono"
                  itemStyle={{ fontSize: "11px", fontFamily: "Inter" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="CV Readiness" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCv)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Practice score" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorInterview)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent logs activity card */}
        <div className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-white">Recent Activities</h3>
            <p className="text-xs text-slate-400 mt-1">Interactive historic feedback track logs.</p>
          </div>

          <div className="mt-5 space-y-4 flex-1 overflow-y-auto max-h-[250px] pr-1.5">
            {stats && stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((act) => (
                <div key={act.id} className="flex gap-3 text-left p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex-col xs:flex-row relative">
                  
                  {/* Indicator Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    act.type === "RESUME" ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" :
                    act.type === "JOB_MATCH" ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" :
                    "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                  }`}>
                    {act.type === "RESUME" && <FileText className="w-4 h-4" />}
                    {act.type === "JOB_MATCH" && <Briefcase className="w-4 h-4" />}
                    {act.type === "INTERVIEW" && <Mic className="w-4 h-4" />}
                  </div>

                  {/* Text descriptions */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-display font-bold text-xs text-white truncate">{act.title}</h5>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{act.subtitle}</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 w-fit border border-white/5 bg-[#0e0e0e]/60 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <Calendar className="w-2.5 h-2.5 text-slate-500" />
                      <span>{new Date(act.date).toLocaleDateString()}</span>
                    </span>
                  </div>

                  {/* Score badge indicator */}
                  <div className="text-right flex flex-col justify-center select-none">
                    <span className={`text-xs font-mono font-bold ${
                      act.score >= 80 ? "text-emerald-400" : act.score >= 65 ? "text-amber-400" : "text-sky-400"
                    }`}>
                      {act.score}%
                    </span>
                  </div>

                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-dashed border-slate-700">
                  <ClipboardList className="w-5 h-5 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="font-display font-semibold text-xs text-slate-300">No events saved yet</p>
                  <p className="text-[10px] text-slate-500 max-w-[160px] mx-auto">Analyze a resume CV or run interview simulators to begin.</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
            <button
              onClick={() => onNavigate("resume")}
              className="text-[10px] font-mono py-1 rounded bg-[#111111] border border-white/5 hover:border-indigo-500/20 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              CV Audit
            </button>
            <button
              onClick={() => onNavigate("job-match")}
              className="text-[10px] font-mono py-1 rounded bg-[#111111] border border-white/5 hover:border-sky-500/20 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Job Match
            </button>
            <button
              onClick={() => onNavigate("interview")}
              className="text-[10px] font-mono py-1 rounded bg-[#111111] border border-white/5 hover:border-violet-500/20 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Mock Practice
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
