/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, AtsReport, ResumeAnalysis } from "../types";
import { saasStore } from "../lib/saasStore";
import { clientStore } from "../lib/clientDb";
import { 
  CheckCircle, AlertTriangle, HelpCircle, FileText, Sparkles, RefreshCw, 
  Download, ArrowRight, Activity, Trash, History, ListTodo, Gauge
} from "lucide-react";

interface AtsCheckerProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function AtsChecker({ user, onRefreshDashboard }: AtsCheckerProps) {
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<AtsReport[]>([]);
  const [activeReport, setActiveReport] = useState<AtsReport | null>(null);

  // Load database content on boot
  useEffect(() => {
    const db = clientStore.get();
    const userResumes = db.resumes.filter(r => r.userId === user.id);
    setResumes(userResumes);
    if (userResumes.length > 0) {
      setSelectedResumeId(userResumes[0].id);
    }

    const saasDb = saasStore.get();
    const userReports = saasDb.atsReports.filter(r => r.userId === user.id);
    setReports(userReports);
    if (userReports.length > 0) {
      setActiveReport(userReports[0]);
    }
  }, [user.id]);

  const runAtsAudit = async () => {
    if (!selectedResumeId) return;
    setLoading(true);

    // Let's add simulated heavy work
    await new Promise(resolve => setTimeout(resolve, 1500));

    const db = clientStore.get();
    const targetResume = db.resumes.find(r => r.id === selectedResumeId);
    if (!targetResume) return;

    const matchedList = targetResume.skills.slice(0, 5).map(s => s.name);
    const missingCandidates = ["Kubernetes Orchestration", "CI/CD Deployment Pipelines", "GraphQL Federation", "Redis Distributed Cache", "System Level Microservices"];
    const randomlyPickedMissing = missingCandidates.slice(0, Math.floor(Math.random() * 3) + 2);

    const baseScore = Math.floor(Math.random() * 15) + 72; // 72 to 87

    const fontChecks: Array<"Success" | "Warning" | "Error"> = ["Success", "Warning"];
    const colChecks: Array<"Success" | "Warning"> = ["Success", "Warning"];

    const newReport: AtsReport = {
      id: saasStore.generateId(),
      userId: user.id,
      fileName: targetResume.fileName,
      compatibilityScore: baseScore,
      keywordOptimization: {
        matched: matchedList,
        missing: randomlyPickedMissing,
        densityScore: Math.floor(Math.random() * 20) + 65,
      },
      formattingAnalysis: {
        fontCheck: fontChecks[Math.floor(Math.random() * fontChecks.length)],
        tablesCheck: "Success",
        columnsCheck: colChecks[Math.floor(Math.random() * colChecks.length)],
        overallNotes: "Standard parsing-friendly typography found. Avoid custom icons, complex visual grids, or table cells inside structural highlights.",
      },
      sectionCompleteness: {
        contact: true,
        summary: Math.random() > 0.2,
        experience: true,
        skills: true,
        education: true,
      },
      recommendations: [
        "Include strict keywords matching exact targeted vacancy keywords (e.g., list frameworks directly).",
        "Redesign contact detail locations; avoid embedding important links in headers/footers.",
        "Include actionable result metrics in recent roles (e.g., 'Optimized response benchmarks by 25%').",
        "Use simple, clean sans-serif fonts such as Arial, Helvetica, or Inter which parse with very high reliability."
      ],
      createdAt: new Date().toISOString()
    };

    const saasDb = saasStore.get();
    saasDb.atsReports.unshift(newReport);
    
    // Add gamification XP and Notification
    if (!saasDb.gamification[user.id]) {
      saasDb.gamification[user.id] = { level: 1, xp: 0, xpNextLevel: 100, streakDays: 1, achievements: [] };
    }
    saasDb.gamification[user.id].xp += 35;
    if (saasDb.gamification[user.id].xp >= saasDb.gamification[user.id].xpNextLevel) {
      saasDb.gamification[user.id].level += 1;
      saasDb.gamification[user.id].xp -= saasDb.gamification[user.id].xpNextLevel;
      saasDb.notifications.unshift({
        id: saasStore.generateId(),
        userId: user.id,
        title: "Level Up! 🌟",
        message: `Congratulations! You leveled up to Level ${saasDb.gamification[user.id].level} by completing ATS checks.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    // Add normal notification
    saasDb.notifications.unshift({
      id: saasStore.generateId(),
      userId: user.id,
      title: "ATS Resume Scan Complete",
      message: `Your resume "${targetResume.fileName}" was scanned with an ATS Compatibility rating of ${baseScore}%.`,
      type: "info",
      read: false,
      createdAt: new Date().toISOString()
    });

    saasStore.save(saasDb);

    setReports([newReport, ...reports]);
    setActiveReport(newReport);
    setLoading(false);
    if (onRefreshDashboard) onRefreshDashboard();
  };

  const deleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const saasDb = saasStore.get();
    saasDb.atsReports = saasDb.atsReports.filter(r => r.id !== id);
    saasStore.save(saasDb);

    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    if (activeReport?.id === id) {
      setActiveReport(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <div id="ats-checker-parent" className="space-y-6">
      
      {/* Title & Introduction banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">SaaS ATS compatibility Checker</h2>
          <p className="text-zinc-500 text-xs mt-1">Audit resumes for structural parses, mandatory keyword density levels, design layouts, and completeness.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded">
            Simulated Engine v3.12
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Run Audit Controls Pane */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span>Launch Compatibility Scan</span>
            </h3>

            {resumes.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-zinc-700" />
                <p className="text-[11px]">No analyzed CV profiles found. Please upload a CV in the "Resume Auditor" view first.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <label className="block text-[11px] font-mono uppercase text-zinc-400">Select Parsed Resume CV</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.fileName} ({new Date(r.createdAt).toLocaleDateString()})</option>
                  ))}
                </select>

                <button
                  onClick={runAtsAudit}
                  disabled={loading}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Optimizing Parser Channels...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Deep Match Score</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* History logs */}
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <History className="w-4 h-4 text-zinc-400" />
              <span>Historical ATS Scans</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {reports.length === 0 ? (
                <p className="text-[10px] text-zinc-500 text-center py-6">No historical score scans completed.</p>
              ) : (
                reports.map(rep => (
                  <div
                    key={rep.id}
                    onClick={() => setActiveReport(rep)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-center ${
                      activeReport?.id === rep.id 
                        ? "bg-indigo-500/10 border-indigo-500/30" 
                        : "bg-[#111111]/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-xs text-zinc-200 truncate">{rep.fileName}</p>
                      <p className="text-[9px] font-mono text-zinc-500 mt-1">{new Date(rep.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-mono font-bold ${
                        rep.compatibilityScore >= 80 ? "text-emerald-400" : "text-amber-400"
                      }`}>{rep.compatibilityScore}%</span>
                      <button 
                        onClick={(e) => deleteReport(rep.id, e)}
                        className="p-1.5 hover:bg-white/5 rounded hover:text-red-400 text-zinc-500"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Audit Details Area */}
        <div className="lg:col-span-2">
          {activeReport ? (
            <div className="glass-card p-6 rounded-xl space-y-6">
              
              {/* Header inside Report */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-wide uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Fully Active</span>
                    <span className="text-zinc-500 text-[10px] font-mono">Analyzed on {new Date(activeReport.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-display font-extrabold text-lg text-white mt-1.5">{activeReport.fileName}</h4>
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-white/5">
                  <div className="text-center">
                    <span className="text-[9px] font-mono uppercase text-zinc-400 block tracking-wider">ATS Score</span>
                    <span className={`font-display font-black text-2xl block ${
                      activeReport.compatibilityScore >= 80 ? "text-emerald-400" : "text-amber-400"
                    }`}>{activeReport.compatibilityScore}%</span>
                  </div>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section completeness checklist */}
                <div className="space-y-3.5">
                  <h5 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-zinc-400" />
                    <span>Parsed Sections completeness</span>
                  </h5>
                  <div className="bg-[#111]/40 border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Contact Details Block</span>
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Profile summary Statement</span>
                      {activeReport.sectionCompleteness.summary ? (
                        <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4.5 h-4.5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Standard Work Experience</span>
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Technical Skills list</span>
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Educational Background</span>
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Keyword Analysis Box */}
                <div className="space-y-3.5">
                  <h5 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Keyword Optimization</span>
                  </h5>
                  <div className="bg-[#111]/40 border border-white/5 rounded-xl p-4 space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500">Matched Keywords ({activeReport.keywordOptimization.matched.length})</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activeReport.keywordOptimization.matched.map((kw, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500">Suggested Missing Recs ({activeReport.keywordOptimization.missing.length})</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activeReport.keywordOptimization.missing.map((kw, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Formatting Checks */}
              <div className="space-y-3">
                <h5 className="font-display font-semibold text-xs text-white uppercase tracking-wider">Format Diagnostics</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#111]/40 border border-white/5 text-left">
                    <span className="text-[10px] font-mono text-zinc-500">Typography Check</span>
                    <p className={`font-semibold text-xs mt-1.5 ${
                      activeReport.formattingAnalysis.fontCheck === "Success" ? "text-emerald-400" : "text-yellow-400"
                    }`}>{activeReport.formattingAnalysis.fontCheck}</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#111]/40 border border-white/5 text-left">
                    <span className="text-[10px] font-mono text-zinc-500">Tables Complexity</span>
                    <p className="font-semibold text-xs text-emerald-400 mt-1.5">No nested Tables</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#111]/40 border border-white/5 text-left">
                    <span className="text-[10px] font-mono text-zinc-500">Layout Multi-Columns</span>
                    <p className="font-semibold text-xs text-emerald-400 mt-1.5">Easy Single-Col layout</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3 border-t border-white/5 pt-5">
                <h5 className="font-display font-bold text-xs text-white uppercase tracking-wider">Improvement Recommendations</h5>
                <ul className="space-y-2 text-left">
                  {activeReport.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl text-center space-y-3">
              <FileText className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-zinc-400 font-semibold text-sm">No Active Auditing Report Selected</p>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">Select a resume on the left pane and generate a matching report directly in seconds.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
