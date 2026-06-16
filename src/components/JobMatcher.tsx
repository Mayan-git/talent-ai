/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Briefcase, AlertTriangle, ShieldCheck, Sparkles, BookOpen, ChevronRight, RefreshCw, Layers, Award, MapPin 
} from "lucide-react";
import { User, ResumeAnalysis, JobMatch } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface JobMatcherProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function JobMatcher({ user, onRefreshDashboard }: JobMatcherProps) {
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  // Results
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<JobMatch | null>(null);
  
  // Loading & states
  const [runningMatch, setRunningMatch] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        // Fetch resumes for selector
        const resHistory = await fetch(`/api/resume/history/${user.id}`);
        const cvData = await resHistory.json();
        
        // Fetch match history
        const matchHistory = await fetch(`/api/job-match/history/${user.id}`);
        const alignData = await matchHistory.json();

        if (active) {
          const cvs = cvData.resumes || [];
          setResumes(cvs);
          if (cvs.length > 0) {
            setSelectedResumeId(cvs[0].id);
          }

          const historyMatches = alignData.matches || [];
          setMatches(historyMatches);
          if (historyMatches.length > 0) {
            setCurrentMatch(historyMatches[0]);
            setShowForm(false);
          }
        }
      } catch (err) {
        console.error("Failed to load matching records:", err);
      }
    }
    loadData();
    return () => { active = false; };
  }, [user.id]);

  const handleSubmitMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setErrorMsg("Please audit a Resume first before running job alignments.");
      return;
    }
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setErrorMsg("Please fill out both the Job Title and Job Description fields.");
      return;
    }
    if (jobDescription.trim().length < 150) {
      setErrorMsg("Please paste a more substantial job description (at least 150 characters) for an accurate audit.");
      return;
    }

    setRunningMatch(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/job-match/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          resumeId: selectedResumeId,
          jobTitle,
          jobDescription,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Model job matching calculations failed.");
      }

      if (data.jobMatch) {
        setMatches((prev) => [data.jobMatch, ...prev]);
        setCurrentMatch(data.jobMatch);
        setShowForm(false);
        setJobTitle("");
        setJobDescription("");
        if (onRefreshDashboard) onRefreshDashboard();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error or logic mismatch occurred.");
    } finally {
      setRunningMatch(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">AI Job Fit Benchmarker</h1>
          <p className="text-xs text-slate-400 mt-1">Check compliance scores, detect technological gaps, and build learning tracks.</p>
        </div>
        
        {resumes.length > 0 && (
          <button 
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-4.5 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-display font-semibold text-xs tracking-wide text-white transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Benchmark Job Fit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left pane: Historic checks selection */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-4 rounded-xl">
            <h3 className="font-display font-bold text-xs text-slate-400 tracking-wider uppercase mb-3">Historic alignments</h3>
            
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {matches.length > 0 ? (
                matches.map((item) => {
                  const IsActive = currentMatch?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setCurrentMatch(item); setShowForm(false); }}
                      className={`
                        w-full p-3 rounded-lg text-left border flex items-start gap-2.5 transition-all cursor-pointer
                        ${IsActive 
                          ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-100" 
                          : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                        }
                      `}
                    >
                      <Briefcase className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-xs truncate leading-snug">{item.jobTitle}</p>
                        <span className="text-[9px] font-mono text-slate-500 block mt-1">Match: {item.matchScore}%</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0 self-center" />
                    </button>
                  );
                })
              ) : (
                <p className="text-[11px] font-mono text-slate-500 py-4 text-center">No historic matching cards saved.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Action sheet / Report viewer */}
        <div className="lg:col-span-9">
          
          <AnimatePresence mode="wait">
            {showForm || resumes.length === 0 ? (
              // SUBMIT COMPILER SHEET
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-card rounded-2xl p-6 space-y-6 text-left"
              >
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Compare Resume & Job Specification</h2>
                  <p className="text-xs text-slate-400 mt-1">Contrast your audited skills against the parameters of a target JD and extract missing tech competencies.</p>
                </div>

                {errorMsg && (
                  <div className="text-xs font-mono text-center text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {resumes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20 gap-4">
                    <AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
                    <div>
                      <p className="font-display font-bold text-sm text-slate-200">No Audited Resumes Located</p>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">Before running compliance testing, you must upload or paste a copy of your CV under the Resume Auditor tab.</p>
                    </div>
                  </div>
                ) : runningMatch ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
                    <div className="text-center">
                      <p className="font-display font-bold text-[13px] text-white animate-pulse">Running semantic JD comparisons...</p>
                      <p className="text-xs text-slate-500 mt-1">Evaluating candidate competency indices, checking tech synonyms, and mapping certification recommenders.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitMatch} className="space-y-4">
                    
                    {/* Selector of resumes */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Select Audited Resume Profile</label>
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer block"
                      >
                        {resumes.map((cv) => (
                          <option key={cv.id} value={cv.id}>
                            {cv.fileName} (Audit strength: {cv.score}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Job specifications inputs */}
                    <div className="grid sm:grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Target Job Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Senior Full-Stack Engineer"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="w-full h-11 px-4 rounded-lg bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Target Job Description</label>
                        <textarea
                          required
                          placeholder="Paste full specifications text details from the job offer description..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          className="w-full h-44 p-3.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-sans resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-display font-medium text-xs text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Execute Semantic Benchmarking</span>
                    </button>

                  </form>
                )}
              </motion.div>
            ) : (
              // ALIGNMENT REPORT COMPONENT
              currentMatch && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={currentMatch.id}
                  className="space-y-6 text-left"
                >
                  {/* Gauge header banner */}
                  <div className="glass-card rounded-2xl p-6 grid md:grid-cols-4 gap-6 items-center">
                    
                    <div className="md:col-span-1 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
                      {/* Gauge */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="44" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                          <circle 
                            cx="56" 
                            cy="56" 
                            r="44" 
                            stroke={currentMatch.matchScore >= 80 ? "#10b981" : currentMatch.matchScore >= 60 ? "#f59e0b" : "#f43f5e"} 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={276}
                            strokeDashoffset={276 - (276 * currentMatch.matchScore) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="font-display font-extrabold text-2xl text-white">{currentMatch.matchScore}%</span>
                          <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Compliance</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-sky-500/10 border border-sky-400/20 text-sky-300 font-mono text-[9px] mb-2 uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>JD MATCH AUDIT COMPLETE</span>
                      </div>
                      <h2 className="font-display font-bold text-xl text-white truncate">{currentMatch.jobTitle}</h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Evaluated candidate CV. Technical competency compliance metrics are mapped below. Address identified missing concepts to elevate resume index strength prior to submitting.
                      </p>
                    </div>

                  </div>

                  {/* Main lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Detected Skill Gaps panel */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                          <span>Detected Skill Gaps</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 mb-5 leading-normal">
                          The target job description lists the following required technologies, domains, or protocols, which are missing from your loaded CV index.
                        </p>
                      </div>

                      <div className="flex-1 space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {currentMatch.missingSkills && currentMatch.missingSkills.length > 0 ? (
                          currentMatch.missingSkills.map((gap, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 font-mono">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>{gap}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-slate-800 rounded-lg">
                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            <p className="font-display font-semibold text-xs text-slate-300 mt-1">Excellent Alignment</p>
                            <p className="text-[10px] text-slate-500">Your profile maps all technical dependencies listed in this JD.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Learning recommendations roadmap */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-4">
                          <BookOpen className="w-4 h-4 text-sky-400 animate-pulse-soft" />
                          <span>AI Certification roadmap</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 mb-5 leading-normal">
                          Actionable, tailored study modules and concrete pathways compiled by Gemini to handle the discovered gaps.
                        </p>
                      </div>

                      <div className="flex-1 space-y-3 max-h-[250px] overflow-y-auto pr-1">
                        {currentMatch.recommendations && currentMatch.recommendations.length > 0 ? (
                          currentMatch.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex gap-2 p-3 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-300 leading-snug">
                              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 font-mono text-center">No missing requirements mean zero required studies.</p>
                        )}
                      </div>
                    </div>

                  </div>

                </motion.div>
              )
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
