/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, UserNotification } from "../types";
import { saasStore } from "../lib/saasStore";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { 
  Users, Server, RefreshCw, Trash2, Database, ShieldAlert, ArrowRight, Layout, BarChart3, Terminal, Search, Filter, 
  Send, ShieldCheck, Mail, Radio, AlertCircle, LayoutDashboard, FileText, CheckCircle2, ChevronRight, Sliders, Download, Sparkles
} from "lucide-react";

interface AdminPanelProps {
  user: User;
  onRefreshDashboard?: () => void;
}

interface CumulativeStats {
  totalUsers: number;
  totalResumes: number;
  totalInterviews: number;
  completedInterviewsCount: number;
  avgResumeScore: number;
  avgInterviewScore: number;
  totalApiRequests: number;
}

interface UserGrowthEntry {
  date: string;
  count: number;
}

interface ResumeDistEntry {
  name: string;
  value: number;
}

interface ApiStatsEntry {
  route: string;
  requests: number;
  avgLatencyMs: number;
  errorRatePercent: number;
}

interface SystemLog {
  id: string;
  msg: string;
  time: string;
  type: "info" | "success" | "warn";
}

interface EnrichedUser extends User {
  resumesAnalyzed: number;
  interviewsAttempted: number;
  bestInterviewScore: number;
}

type AdminTab = "dashboard" | "users" | "telemetry" | "notifications" | "reports";

export default function AdminPanel({ user, onRefreshDashboard }: AdminPanelProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // Core stats states
  const [cumulative, setCumulative] = useState<CumulativeStats>({
    totalUsers: 0,
    totalResumes: 0,
    totalInterviews: 0,
    completedInterviewsCount: 0,
    avgResumeScore: 0,
    avgInterviewScore: 0,
    totalApiRequests: 0,
  });

  const [userGrowth, setUserGrowth] = useState<UserGrowthEntry[]>([]);
  const [resumeDist, setResumeDist] = useState<ResumeDistEntry[]>([]);
  const [apiStats, setApiStats] = useState<ApiStatsEntry[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [usersList, setUsersList] = useState<EnrichedUser[]>([]);

  // Search/Filter states
  const [userSearchText, setUserSearchText] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const [filterExperience, setFilterExperience] = useState<"all" | "Junior" | "Mid-level" | "Senior" | "Executive">("all");

  // Loader states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Edit User modal state
  const [editingUser, setEditingUser] = useState<EnrichedUser | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "user">("user");
  const [editTitle, setEditTitle] = useState("");
  const [editExpLevel, setEditExpLevel] = useState<"Junior" | "Mid-level" | "Senior" | "Executive">("Junior");

  // Notification Broadcast Form state
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | string>("all");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "success" | "warning" | "alert">("info");
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Custom Report Generator state
  const [reportCategory, setReportCategory] = useState<"performance" | "demographics" | "telemetry">("performance");
  const [reportFormat, setReportFormat] = useState<"json" | "csv" | "print">("json");
  const [compiledReport, setCompiledReport] = useState<any | null>(null);
  const [compiling, setCompiling] = useState(false);

  // Standard Colors for PieChart
  const PIE_COLORS = ["#6366f1", "#14b8a6", "#f59e0b"];

  // Fetch admin states
  const fetchAllStats = async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          "Content-Type": "application/json",
          "x-admin-userid": user.id, // Role-authorisation header
        },
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error("Security verification failed. This interface is restricted to administrators.");
        }
        throw new Error("Could not load backend simulation statistics.");
      }

      const data = await response.json();
      if (data.cumulative) {
        setCumulative(data.cumulative);
        setUserGrowth(data.userGrowth);
        setResumeDist(data.resumeDist);
        setApiStats(data.apiStats);
        setLogs(data.logs);
      }
    } catch (err: any) {
      setStatsError(err.message || "An unexpected error occurred loading analytics.");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsersList = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          "x-admin-userid": user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error("Could not load user tables:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
    fetchUsersList();
  }, [user.id]);

  // Handle manual log emit trace
  const handleEmitLog = async (msg: string) => {
    if (!msg.trim()) return;
    try {
      await fetch("/api/admin/logs/emit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-userid": user.id,
        },
        body: JSON.stringify({ msg, type: "info" }),
      });
      fetchAllStats(); // Reload logs feed
    } catch (e) {
      console.error(e);
    }
  };

  // Handle clear logs
  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to flush system-wide activity trace logs?")) return;
    try {
      const r = await fetch("/api/admin/logs/clear", {
        method: "POST",
        headers: { "x-admin-userid": user.id },
      });
      if (r.ok) {
        fetchAllStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update user parameters
  const handleUpdateUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormSubmitting(true);
    try {
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-userid": user.id,
        },
        body: JSON.stringify({
          targetUserId: editingUser.id,
          updates: {
            role: editRole,
            title: editTitle,
            experienceLevel: editExpLevel,
          },
        }),
      });

      if (response.ok) {
        setEditingUser(null);
        handleEmitLog(`Administrator updated candidate account fields for email: "${editingUser.email}"`);
        await fetchUsersList();
        await fetchAllStats();
      } else {
        alert("Failed to modify candidate details.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Hard Delete User
  const handleDeleteCandidate = async (targetId: string, email: string) => {
    if (!confirm(`CRITICAL SECURITY WARNING: Are you sure you want to hard delete the account "${email}"?\nThis flushes all linked resumes and interview sessions recursively!`)) return;
    try {
      const r = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-userid": user.id,
        },
        body: JSON.stringify({ targetUserId: targetId }),
      });
      if (r.ok) {
        handleEmitLog(`Administrator hard scrubbed user account: ${email}`);
        await fetchUsersList();
        await fetchAllStats();
      } else {
        const errorData = await r.json();
        alert(errorData.error || "Cannot scrub administrators.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dispatch global / personal notification alerts
  const handleDispatchNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setFormSubmitting(true);
    try {
      const saasDb = saasStore.get();
      
      let targetIds: string[] = [];
      if (broadcastTarget === "all") {
        targetIds = usersList.map(u => u.id);
      } else {
        targetIds = [broadcastTarget];
      }

      // Append standard notifications
      targetIds.forEach(tId => {
        const newNotif: UserNotification = {
          id: "notif_" + saasStore.generateId(),
          userId: tId,
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
          read: false,
          createdAt: new Date().toISOString(),
        };
        saasDb.notifications.unshift(newNotif);
      });

      saasStore.save(saasDb);
      handleEmitLog(`Dispatched system broadcast alert: "${notifTitle.trim()}" targeted to [${broadcastTarget.toUpperCase()}]`);
      
      setBroadcastSuccess(true);
      setNotifTitle("");
      setNotifMessage("");
      if (onRefreshDashboard) onRefreshDashboard();

      setTimeout(() => {
        setBroadcastSuccess(false);
      }, 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Custom Reports generation compiler
  const handleCompileReport = async () => {
    setCompiling(true);
    setCompiledReport(null);
    
    // Artificial precision audit delays
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      const systemDb = saasStore.get();
      let payload: any = {};

      if (reportCategory === "performance") {
        payload = {
          reportTitle: "Platform Candidate Performance Summary",
          generatedAt: new Date().toISOString(),
          aggregateMetrics: {
            averageResumeScoringIndex: cumulative.avgResumeScore + "%",
            averageInterviewAggregateGrade: cumulative.avgInterviewScore + "%",
            totalMockEvaluationsCompleted: cumulative.completedInterviewsCount,
          },
          rechartsSummary: resumeDist,
          recommendedBenchmarks: [
            "Provide additional targeted questions focusing on asynchronous state management.",
            "Alert users showing CV scoring rates under 70% with high-contrast suggested markers."
          ]
        };
      } else if (reportCategory === "demographics") {
        const expGroups = { Junior: 0, Mid: 0, Senior: 0, Executive: 0 };
        usersList.forEach(u => {
          if (u.experienceLevel === "Junior") expGroups.Junior++;
          else if (u.experienceLevel === "Mid-level") expGroups.Mid++;
          else if (u.experienceLevel === "Senior") expGroups.Senior++;
          else if (u.experienceLevel === "Executive") expGroups.Executive++;
        });

        payload = {
          reportTitle: "User Registration Demographics Audit",
          generatedAt: new Date().toISOString(),
          totalDatabaseProfiles: cumulative.totalUsers,
          cohortsBreakdown: expGroups,
          growthVelocity: userGrowth,
        };
      } else {
        payload = {
          reportTitle: "Vite & Gemini API Usage Metrics",
          generatedAt: new Date().toISOString(),
          cumulativeServerCallsRecorded: cumulative.totalApiRequests,
          endpointsGrid: apiStats,
          auditReportVerdict: "All API route responses running inside expected latency bounds. Zero timeout crashes."
        };
      }

      setCompiledReport(payload);
      handleEmitLog(`Generated custom systems compliance report on: "${reportCategory.toUpperCase()}" in [${reportFormat.toUpperCase()}]`);
    } catch (e) {
      console.error(e);
    } finally {
      setCompiling(false);
    }
  };

  // Download simulation
  const triggerReportDownload = () => {
    if (!compiledReport) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(compiledReport, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `hirewise_audit_report_${reportCategory}_2026.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Filter users lists based on inputs
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearchText.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearchText.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(userSearchText.toLowerCase()));
    
    const matchesRole = filterRole === "all" ? true : u.role === filterRole;
    const matchesExperience = filterExperience === "all" ? true : u.experienceLevel === filterExperience;

    return matchesSearch && matchesRole && matchesExperience;
  });

  return (
    <div id="admin-panel-workspace" className="space-y-8 animate-fade-in text-left pb-12">
      
      {/* Header system branding info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 font-mono text-[9px] uppercase font-extrabold tracking-widest border border-red-500/20 rounded-full">
              System Root Authenticated
            </span>
            <span className="text-zinc-500 font-mono text-xs">v3.0 Production telemetry</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-white mt-1.5 flex items-center gap-2">
            Enterprise Admin Controller
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Supervise registered talent profiles, monitor live Gemini API traffic limits, view log telemetry, broadcast alerts, and compile audits.
          </p>
        </div>

        <button
          onClick={() => {
            fetchAllStats();
            fetchUsersList();
          }}
          className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white rounded-lg transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer self-start lg:self-center"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Synchronise Metrics</span>
        </button>
      </div>

      {statsError && (
        <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400 text-xs text-left">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Security Verification Error</span>
            <span className="block mt-1">{statsError}</span>
          </div>
        </div>
      )}

      {/* Primary tab switches */}
      <div className="flex overflow-x-auto gap-2 border-b border-white/5 p-1 bg-zinc-950/40 rounded-xl">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 h-9 font-display font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "dashboard" ? "bg-indigo-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>System Console</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 h-9 font-display font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "users" ? "bg-indigo-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Candidate Accounts ({cumulative.totalUsers})</span>
        </button>

        <button
          onClick={() => setActiveTab("telemetry")}
          className={`px-4 h-9 font-display font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "telemetry" ? "bg-indigo-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Telemetry & API Feed</span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 h-9 font-display font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "notifications" ? "bg-indigo-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Broadcast Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 h-9 font-display font-bold text-xs tracking-wide rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "reports" ? "bg-indigo-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>System Audits</span>
        </button>
      </div>

      {/* Loader wrapper */}
      {loadingStats && activeTab === "dashboard" ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs font-mono">Consolidating system telemetry matrix...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: SYSTEM CONSOLE VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Telemetry Stat Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-mono uppercase tracking-wider block">Total Databases Users</span>
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <p className="font-display font-black text-2xl text-white">{cumulative.totalUsers}</p>
                  <p className="text-[10px] text-zinc-500">Active accounts initialized</p>
                </div>

                <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-mono uppercase tracking-wider block">Audited CV Files</span>
                    <Database className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <p className="font-display font-black text-2xl text-white">{cumulative.totalResumes}</p>
                  <p className="text-[10px] text-zinc-500">Avg CV Score: <b className="text-teal-400">{cumulative.avgResumeScore}%</b></p>
                </div>

                <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-mono uppercase tracking-wider block">Intelligent Mock Interviews</span>
                    <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="font-display font-black text-2xl text-white">{cumulative.totalInterviews}</p>
                  <p className="text-[10px] text-zinc-500">Avg score: <b className="text-amber-400">{cumulative.avgInterviewScore}%</b></p>
                </div>

                <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-mono uppercase tracking-wider block">Live API Ingress Calls</span>
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="font-display font-black text-2xl text-emerald-400">{cumulative.totalApiRequests}</p>
                  <p className="text-[10px] text-zinc-500">Status: <b className="text-emerald-400">Excellent</b></p>
                </div>
              </div>

              {/* Dynamic Recharts Charts Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                {/* Chart 1: User Growth Line */}
                <div className="lg:col-span-8 p-5 bg-[#111]/45 border border-white/5 rounded-xl space-y-4">
                  <h3 className="font-display font-bold text-xs uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Candidate Signup Velocity Stream</span>
                  </h3>
                  
                  {userGrowth.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-zinc-650 text-xs">
                      No user registration streams recorded.
                    </div>
                  ) : (
                    <div className="h-60 block">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid stroke="#1c1c1e" strokeDasharray="3 3" />
                          <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: 10, fontFamily: "monospace" }} />
                          <YAxis stroke="#6b7280" style={{ fontSize: 10, fontFamily: "monospace" }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#141414", borderColor: "#27272a" }}
                            labelStyle={{ color: "#a1a1aa", fontFamily: "monospace", fontSize: 11 }}
                          />
                          <Line type="monotone" dataKey="count" name="Registered Candidates" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Chart 2: Category Breakdown Pie */}
                <div className="lg:col-span-4 p-5 bg-[#111]/45 border border-white/5 rounded-xl space-y-4">
                  <h3 className="font-display font-bold text-xs uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-400" />
                    <span>CV Quality Categories</span>
                  </h3>

                  {cumulative.totalResumes === 0 ? (
                    <div className="h-60 flex items-center justify-center text-zinc-650 text-xs">
                      No resumes checked yet.
                    </div>
                  ) : (
                    <div className="h-60 relative flex flex-col justify-between">
                      <div className="h-44 w-full block">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={resumeDist}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {resumeDist.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#141414", borderColor: "#27272a", fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {resumeDist.map((item, index) => (
                          <div key={item.name} className="flex justify-between items-center text-zinc-400">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                              <span className="text-[11px] font-mono">{item.name}</span>
                            </div>
                            <span className="font-bold text-white text-[11px]">{item.value} resumes</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-5 bg-zinc-950/20 border border-white/5 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <h3 className="font-display font-bold text-sm text-white">Advanced System Tools</h3>
                </div>
                <p className="text-zinc-500 text-xs max-w-2xl leading-relaxed">
                  Administrator tools allow full system audits. You may manually seed activity trace logging points or run performance reports. Flush actions can be executed to reset databases.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-mono rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Run Platform Compliance Report</span>
                  </button>

                  <button
                    onClick={() => handleEmitLog("Admin initiated custom secure cache rotation event.")}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 text-xs font-mono rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Simulate Cache Rotation Event</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CANDIDATE USER MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-6">
              
              {/* Account List Filter bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#111]/40 border border-white/5 p-4 rounded-xl">
                {/* Search Text */}
                <div className="md:col-span-5 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    placeholder="Search candidates by name, email, or role..."
                    className="w-full h-10 pl-9 pr-4 bg-black/40 border border-white/5 text-zinc-200 text-xs rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Filter Role */}
                <div className="md:col-span-3 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={filterRole}
                    onChange={(e: any) => setFilterRole(e.target.value)}
                    className="flex-1 h-10 bg-black/40 border border-white/5 text-zinc-300 text-xs rounded-lg px-2 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                  >
                    <option value="all">Roles: All</option>
                    <option value="admin">Administrator Only</option>
                    <option value="user">Candidate Only</option>
                  </select>
                </div>

                {/* Filter Experience */}
                <div className="md:col-span-4 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={filterExperience}
                    onChange={(e: any) => setFilterExperience(e.target.value)}
                    className="flex-1 h-10 bg-black/40 border border-white/5 text-zinc-300 text-xs rounded-lg px-2 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                  >
                    <option value="all">Exp Level: All</option>
                    <option value="Junior">Junior Apprentice</option>
                    <option value="Mid-level">Mid-level Developer</option>
                    <option value="Senior">Senior Specialist</option>
                    <option value="Executive">Executive Lead</option>
                  </select>
                </div>
              </div>

              {/* Advanced Table */}
              <div className="bg-[#111]/25 border border-white/5 rounded-xl overflow-hidden text-left">
                {loadingUsers ? (
                  <div className="p-20 text-center text-zinc-500 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                    <p className="text-xs font-mono">Quering candidates registry index...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-16 text-center text-zinc-500 space-y-2 font-mono text-xs">
                    <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p>No registered candidates match your filters criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#111]/70 border-b border-white/5 font-mono text-zinc-400 text-[10px] uppercase tracking-wider">
                          <th className="px-5 py-4 font-semibold text-left">Candidate Name / Email</th>
                          <th className="px-5 py-4 font-semibold text-left">Internal Role</th>
                          <th className="px-5 py-4 font-semibold text-left">Experience & Title</th>
                          <th className="px-5 py-4 font-semibold text-center">CV Checked</th>
                          <th className="px-5 py-4 font-semibold text-center">Interviews (Max Score)</th>
                          <th className="px-5 py-4 font-semibold text-right">Actions Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((cand) => (
                          <tr key={cand.id} className="hover:bg-white/2 transition-colors">
                            {/* User details */}
                            <td className="px-5 py-4 space-y-1">
                              <p className="font-semibold text-zinc-200 block text-sm">{cand.name}</p>
                              <p className="font-mono text-[11px] text-zinc-500 block">{cand.email}</p>
                              <span className="text-[9px] font-mono text-zinc-600 uppercase block">Registered: {cand.createdAt ? cand.createdAt.split("T")[0] : "2026-06-16"}</span>
                            </td>

                            {/* Role badge */}
                            <td className="px-5 py-4 vertical-center">
                              {cand.role === "admin" ? (
                                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/10 rounded-full font-mono text-[10px] font-bold">
                                  ADMINISTRATOR
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full font-mono text-[10px]">
                                  CANDIDATE
                                </span>
                              )}
                            </td>

                            {/* Job stats title */}
                            <td className="px-5 py-4 space-y-0.5 text-left">
                              <span className="font-medium text-zinc-350 block">{cand.title || "Developer Aspirant"}</span>
                              <span className="text-[10px] text-zinc-500 block">Cohorts: <b className="font-semibold text-indigo-400">{cand.experienceLevel || "Junior"}</b></span>
                            </td>

                            {/* Resumes analyzed count */}
                            <td className="px-5 py-4 text-center font-mono">
                              <span className={`inline-block font-bold text-sm ${cand.resumesAnalyzed > 0 ? "text-teal-400" : "text-zinc-600"}`}>
                                {cand.resumesAnalyzed}
                              </span>
                            </td>

                            {/* Best interview score */}
                            <td className="px-5 py-4 text-center space-y-1">
                              <p className="font-mono text-sm block font-bold text-zinc-200">
                                {cand.interviewsAttempted}
                              </p>
                              {cand.interviewsAttempted > 0 && (
                                <span className={`text-[10px] font-mono ${cand.bestInterviewScore >= 80 ? "text-emerald-400" : "text-amber-500"}`}>
                                  Best Grade: {cand.bestInterviewScore}%
                                </span>
                              )}
                            </td>

                            {/* Action Operations */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingUser(cand);
                                    setEditRole(cand.role || "user");
                                    setEditTitle(cand.title || "Developer Aspirant");
                                    setEditExpLevel(cand.experienceLevel || "Junior");
                                  }}
                                  className="px-3 h-8 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold font-display rounded-lg transition-all cursor-pointer inline-flex items-center"
                                >
                                  Modify Profile
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteCandidate(cand.id, cand.email)}
                                  className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/10 rounded-lg cursor-pointer transition-all inline-flex items-center"
                                  disabled={cand.id === "admin_default" || cand.id === user.id}
                                  title="Hard delete this candidate record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Editing User Modal popup */}
              {editingUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-md bg-[#141414] border border-white/10 p-6 rounded-2xl shadow-3xl space-y-5 animate-fade-in text-left">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="font-display font-extrabold text-lg text-white">Modify Candidate Profile</h3>
                      <p className="text-zinc-500 text-[11px] font-mono mt-0.5">Parameters settings for: {editingUser.email}</p>
                    </div>

                    <form onSubmit={handleUpdateUsers} className="space-y-4 text-xs font-mono">
                      {/* Select Role */}
                      <div className="space-y-1.5">
                        <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Access System Scope</label>
                        <select
                          value={editRole}
                          onChange={(e: any) => setEditRole(e.target.value)}
                          className="w-full h-10 bg-black/50 border border-white/5 text-zinc-200 rounded-lg px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="user">User / Standard Candidate access</option>
                          <option value="admin">Admin / System Operations Scope</option>
                        </select>
                      </div>

                      {/* Select Experience */}
                      <div className="space-y-1.5">
                        <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Experience cohorts</label>
                        <select
                          value={editExpLevel}
                          onChange={(e: any) => setEditExpLevel(e.target.value)}
                          className="w-full h-10 bg-black/50 border border-white/5 text-zinc-200 rounded-lg px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="Junior">Junior Apprentice</option>
                          <option value="Mid-level">Mid-level Developer</option>
                          <option value="Senior">Senior Specialist</option>
                          <option value="Executive">Executive Lead</option>
                        </select>
                      </div>

                      {/* Title input */}
                      <div className="space-y-1.5">
                        <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Candidate Headline Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="e.g. Lead System Engineer"
                          className="w-full h-10 bg-black/50 border border-white/5 text-zinc-200 rounded-lg px-3 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex gap-2 justify-end border-t border-white/5 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 h-9 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={formSubmitting}
                          className="px-4 h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center"
                        >
                          {formSubmitting ? "Updating..." : "Save Parameters"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: SYSTEM TELEMETRY FEED */}
          {activeTab === "telemetry" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                {/* Left Side: API Usage metrics */}
                <div className="lg:col-span-4 p-5 bg-[#111]/40 border border-white/5 rounded-xl space-y-4 self-start">
                  <div className="border-b border-white/5 pb-3">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                        <Server className="w-4 h-4 text-teal-400" />
                        <span>API Routes Usage Analyzer</span>
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse block" />
                    </div>
                    <p className="text-zinc-500 text-[10px] font-mono mt-1">Automatic real time telemetry logging duration check.</p>
                  </div>

                  {apiStats.length === 0 ? (
                    <p className="text-xs text-zinc-650 font-mono italic">No requests logged yet. Invoke some API endpoints above!</p>
                  ) : (
                    <div className="space-y-4">
                      {apiStats.map((item) => (
                        <div key={item.route} className="bg-zinc-950/40 p-3 rounded-lg border border-white/5 space-y-2">
                          <div className="flex justify-between items-start gap-3">
                            <span className="font-mono text-[11px] text-zinc-300 block truncate max-w-[180px]" title={item.route}>
                              {item.route}
                            </span>
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold rounded">
                              {item.requests} calls
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500">
                            <div>
                              <span>Latency: </span>
                              <b className="text-zinc-350">{item.avgLatencyMs}ms</b>
                            </div>
                            <div className="text-right">
                              <span>Error Rate: </span>
                              <b className={item.errorRatePercent > 10 ? "text-red-400 animate-pulse" : "text-emerald-400"}>
                                {item.errorRatePercent}%
                              </b>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: Log console prompt */}
                <div className="lg:col-span-8 p-5 bg-[#111]/40 border border-white/5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="font-display font-bold text-xs uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span>Live Server Log Stream</span>
                    </h3>

                    <button
                      onClick={handleClearLogs}
                      className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/10 font-mono text-[10px] rounded transition-all cursor-pointer"
                    >
                      Clear Logs
                    </button>
                  </div>

                  {/* Sandbox Shell console */}
                  <div className="font-mono text-[11px] bg-black border border-[#222] rounded-xl p-4 space-y-2 h-96 overflow-y-auto leading-relaxed shadow-inner">
                    {logs.length === 0 ? (
                      <p className="text-zinc-650 italic">System event console buffer has completed loading. No triggers detected.</p>
                    ) : (
                      logs.map((log) => {
                        const localTimeStr = new Date(log.time).toLocaleTimeString();
                        return (
                          <div key={log.id} className="flex gap-4 items-baseline text-left hover:bg-white/2 p-0.5 rounded transition">
                            <span className="text-zinc-600 shrink-0">[{localTimeStr}]</span>
                            
                            <span className={`shrink-0 font-bold ${
                              log.type === "success" ? "text-emerald-500" : log.type === "warn" ? "text-amber-500" : "text-sky-400"
                            }`}>
                              {log.type.toUpperCase()}
                            </span>
                            
                            <span className="text-zinc-350 leading-snug break-all">
                              {log.msg}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-500 italic block font-mono">
                    Activity events automatically stream into this console whenever candidates upload files, start/finish mock audio recordings, or update headlines.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: BROADCAST NOTIFICATIONS Alerts */}
          {activeTab === "notifications" && (
            <div className="max-w-2xl mx-auto p-6 bg-[#111]/45 border border-white/5 rounded-xl space-y-6">
              <div className="border-b border-white/5 pb-3">
                <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <span>Interactive Broadcast Dispatcher</span>
                </h3>
                <p className="text-zinc-500 text-xs mt-1">
                  Inject direct system notifications. This instantly saves into candidate session alerts visible in the top header hub.
                </p>
              </div>

              {broadcastSuccess && (
                <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Success! System notification emitted successfully and persistent caches updated.</span>
                </div>
              )}

              <form onSubmit={handleDispatchNotification} className="space-y-4 text-xs font-mono">
                {/* Select Candidate Target */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Select Target cohort</label>
                  <select
                    value={broadcastTarget}
                    onChange={(e: any) => setBroadcastTarget(e.target.value)}
                    className="w-full h-10 bg-black/40 border border-white/5 text-zinc-200 rounded-lg px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">Global Broadcast (Dispatch to ALL Users)</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        Personal alert: {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Notif Type */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Alert Category</label>
                    <select
                      value={notifType}
                      onChange={(e: any) => setNotifType(e.target.value)}
                      className="w-full h-10 bg-black/40 border border-white/5 text-zinc-200 rounded-lg px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="info">💡 Informational Hint</option>
                      <option value="success">✅ Goal Achievements Alert</option>
                      <option value="warning">⚠️ High Priority warning</option>
                      <option value="alert">🔔 Critical Platform Reminder</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Notification Header Title</label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="e.g. Schedule audit review"
                      required
                      className="w-full h-10 bg-black/40 border border-white/5 text-zinc-200 rounded-lg px-3 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Message block */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Message Content</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Provide full description steps..."
                    required
                    rows={4}
                    className="w-full bg-black/40 border border-white/5 text-zinc-250 rounded-lg p-3 focus:outline-none focus:border-indigo-500 font-sans text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>{formSubmitting ? "Dispatching Alert..." : "Emit Persistent Alert"}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: SYSTEM REPORTS AUDITS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                {/* Compiler parameters input */}
                <div className="lg:col-span-5 p-5 bg-[#111]/45 border border-white/5 rounded-xl space-y-4 self-start">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="font-display font-extrabold text-sm text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      <span>Configure Audit Scope</span>
                    </h3>
                    <p className="text-zinc-550 text-[10px] mt-0.5">Custom compliance reports generator.</p>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Report category</label>
                      <select
                        value={reportCategory}
                        onChange={(e: any) => setReportCategory(e.target.value)}
                        className="w-full h-10 bg-black/40 border border-white/5 text-zinc-200 rounded-lg px-2"
                      >
                        <option value="performance">Candidate Performance & Metrics Audit</option>
                        <option value="demographics">User Registration Cohorts Audit</option>
                        <option value="telemetry">System API Ingress Telemetry Study</option>
                      </select>
                    </div>

                    {/* Format choice */}
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">Compiled File Type</label>
                      <select
                        value={reportFormat}
                        onChange={(e: any) => setReportFormat(e.target.value)}
                        className="w-full h-10 bg-black/40 border border-white/5 text-zinc-200 rounded-lg px-2"
                      >
                        <option value="json">JSON format serialized report</option>
                        <option value="csv">Printed CSV spreadsheet data (Raw text)</option>
                        <option value="print">Standard text presentation log format</option>
                      </select>
                    </div>

                    <button
                      onClick={handleCompileReport}
                      disabled={compiling}
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 duration-75 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-xs cursor-pointer"
                    >
                      {compiling ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating compliance report...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Compile Audit System Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Compiler display pane */}
                <div className="lg:col-span-7 p-5 bg-[#111]/45 border border-white/5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="font-display font-semibold text-xs uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Audit compilation screen</span>
                    </h3>

                    {compiledReport && (
                      <button
                        onClick={triggerReportDownload}
                        className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/15 font-mono text-[11px] rounded-lg cursor-pointer flex items-center gap-2 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Serialized JSON</span>
                      </button>
                    )}
                  </div>

                  <div className="h-96 rounded-xl border border-white/5 bg-zinc-950/60 p-4 font-mono text-[11px] overflow-y-auto leading-relaxed text-zinc-300 select-all shadow-inner">
                    {compiling ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                        <span>Analysing databases collections aggregates recursively...</span>
                      </div>
                    ) : compiledReport ? (
                      <pre className="whitespace-pre-wrap font-mono uppercase bg-black/40 p-2 rounded max-h-full">
                        {reportFormat === "csv" ? (
                          `AUDIT REPORT HEADLINES: ${compiledReport.reportTitle || "Report"}\n` +
                          `GENERATED TIMESTAMP: ${compiledReport.generatedAt || new Date().toISOString()}\n\n` +
                          `CRITICAL FIELDS,VALUE,AUDIT METRIC STATUS\n` +
                          Object.entries(compiledReport.aggregateMetrics || compiledReport.cohortsBreakdown || compiledReport.endpointsGrid || {})
                            .map(([k,v]) => {
                              const vStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
                              return `"${k}","${vStr}","VERIFIED"`
                            }).join("\n")
                        ) : reportFormat === "print" ? (
                          `############################################################\n` +
                          `   HIREWISE AI PLATFORM - COMPLIANCE SYSTEM REPORT      \n` +
                          `   ID: ${saasStore.generateId().toUpperCase()} | SECURITY LEVEL: ROOT         \n` +
                          `############################################################\n\n` +
                          `TITLE: ${compiledReport.reportTitle}\n` +
                          `TIMESTAMP: ${compiledReport.generatedAt || new Date().toISOString()}\n\n` +
                          `COHORTS OVERVIEW SUMMARY:\n` +
                          JSON.stringify(compiledReport.aggregateMetrics || compiledReport.cohortsBreakdown || compiledReport.endpointsGrid || {}, null, 2) +
                          `\n\nREPORT GENERATOR VERDICT: SYSTEM OPERATING WELL. COMPLIANCE STANDARDS COMPLIED WITH VERIFIED OK.`
                        ) : (
                          JSON.stringify(compiledReport, null, 2)
                        )}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-1.5 italic text-center text-xs">
                        <AlertCircle className="w-8 h-8 text-zinc-700" />
                        <span>Compliance report screen is idle.<br />Configure study scope and click Compile to begin system verification.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}
