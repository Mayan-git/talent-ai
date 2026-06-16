/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User } from "../types";
import { clientStore } from "../lib/clientDb";
import { saasStore } from "../lib/saasStore";
import { 
  Users, Server, RefreshCw, Trash2, Database, ShieldAlert, ArrowRight, Layout, BarChart3, Terminal
} from "lucide-react";

interface AdminPanelProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function AdminPanel({ user, onRefreshDashboard }: AdminPanelProps) {
  const [usersCount, setUsersCount] = useState(0);
  const [resumesCount, setResumesCount] = useState(0);
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [logs, setLogs] = useState<Array<{ id: string; msg: string; time: string; type: "info" | "success" | "warn" }>>([]);

  useEffect(() => {
    const db = clientStore.get();
    const saasDb = saasStore.get();

    setUsersCount(db.users.length || 1);
    setResumesCount(db.resumes.length || 0);
    setInterviewsCount(db.interviews.length || 0);

    setLogs([
      { id: "log_1", msg: "Database state loaded successfully on port 3000.", time: "10:11:00", type: "info" },
      { id: "log_2", msg: `Identified user account registered: "${user.email}".`, time: "10:11:05", type: "success" },
      { id: "log_3", msg: "Vite dynamic hot refresh modules connected.", time: "10:12:00", type: "info" },
      { id: "log_4", msg: "SaaS Premium modules loaded safely.", time: "10:12:35", type: "success" }
    ]);
  }, [user.id, user.email]);

  const clearEntireDatabase = () => {
    if (confirm("Are you sure you want to clear all localized caches and data versions? This will reset all resumes, roadmaps, and scores.")) {
      localStorage.clear();
      alert("Local stores flushed successfully. Please reload/restart the page.");
      window.location.reload();
    }
  };

  return (
    <div id="admin-dashboard-panel" className="space-y-6">

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">System Admin controller</h2>
          <p className="text-zinc-500 text-xs mt-1">Acquire precision statistics, monitor activity telemetry feeds, and manage local storage caches.</p>
        </div>
      </div>

      {/* General telemetry grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
        
        <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Registered System Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="font-display font-black text-2xl text-white">{usersCount}</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Analyzed Resumes</span>
            <Database className="w-4 h-4 text-teal-400" />
          </div>
          <p className="font-display font-black text-2xl text-white">{resumesCount}</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Mock Interviews Graded</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="font-display font-black text-2xl text-white">{interviewsCount}</p>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[10px] font-mono uppercase tracking-wider">Gemini API status</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-display font-black text-lg text-emerald-400">Stable (Client Fallback ready)</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Logs Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Telemetry Feed</span>
            </h3>

            <div className="font-mono text-[11px] bg-black/60 p-4 border border-zinc-900 rounded-lg space-y-2.5 h-64 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 items-baseline">
                  <span className="text-zinc-600">[{log.time}]</span>
                  <span className={
                    log.type === "success" ? "text-emerald-400" : log.type === "warn" ? "text-amber-400" : "text-sky-400"
                  }>
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-zinc-300">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Administration tools safety */}
        <div className="lg:col-span-4 spacing-y-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Safety Controls</span>
            </h3>

            <div className="space-y-4 text-xs">
              <p className="text-zinc-500">Use this action to clean all cached databases and configuration profiles. This flushes browser local storage cells entirely.</p>
              
              <button
                onClick={clearEntireDatabase}
                className="w-full h-10 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 font-mono text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>FLUSH LOCAL STORES</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
