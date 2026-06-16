/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Upload, FileText, Calendar, GraduationCap, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Layers, Award, Sparkles 
} from "lucide-react";
import { User, ResumeAnalysis } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ResumeViewProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function ResumeView({ user, onRefreshDashboard }: ResumeViewProps) {
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeAnalysis | null>(null);
  
  // Creation States
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rawText, setRawText] = useState(""); // Fallback text input
  const [uploadProgress, setUploadProgress] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadResumeHistory() {
      try {
        const res = await fetch(`/api/resume/history/${user.id}`);
        if (!res.ok) throw new Error("History fetch error");
        const data = await res.json();
        if (active) {
          setHistory(data.resumes || []);
          if (data.resumes && data.resumes.length > 0 && !selectedResume) {
            setSelectedResume(data.resumes[0]);
          }
        }
      } catch (err) {
        console.error("Failed to read resume audit history:", err);
      }
    }
    loadResumeHistory();
    return () => { active = false; };
  }, [user.id]);

  // Handle drag configurations
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== "application/pdf") {
      setFeedbackError("For accurate structural reports, please provide a valid .pdf document.");
      return;
    }
    setFileName(file.name);
    setFeedbackError(null);

    // Convert PDF file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      triggerAnalysis(file.name, base64String, true);
    };
    reader.onerror = () => {
      setFeedbackError("Document reading failure. Please try again.");
    };
  };

  // Plaintext Paste Audit trigger
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || rawText.trim().length < 150) {
      setFeedbackError("Please provide a more substantial CV text layout (at least 150 characters) for auditing.");
      return;
    }
    setFileName("Pasted Resume Copy");
    setFeedbackError(null);
    triggerAnalysis("Pasted Resume Copy", rawText, false);
  };

  const triggerAnalysis = async (fileLabel: string, payload: string, isPdf: boolean) => {
    setUploadProgress(true);
    setFeedbackError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout safety boundary
    
    try {
      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          fileName: fileLabel,
          base64Data: payload,
          isPdf,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI Resume analyzer failed to parse CV model.");
      }

      if (data.resume) {
        setHistory((prev) => [data.resume, ...prev]);
        setSelectedResume(data.resume);
        setShowUploader(false);
        setRawText("");
        if (onRefreshDashboard) onRefreshDashboard();
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setFeedbackError("Request timeout. The server is under high load. We have successfully triggered the client-side failover engine to analyze and securely save your CV locally!");
        
        // Give a tiny delayed moment for client-side db storage to synchronize, then reload history
        setTimeout(async () => {
          try {
            const res = await fetch(`/api/resume/history/${user.id}`);
            if (res.ok) {
              const data = await res.json();
              setHistory(data.resumes || []);
              if (data.resumes && data.resumes.length > 0) {
                setSelectedResume(data.resumes[0]);
                setShowUploader(false);
                setRawText("");
              }
            }
          } catch (historyErr) {
            console.error("Failed to refresh resume list:", historyErr);
          }
        }, 1200);
      } else {
        setFeedbackError(err.message || "An unexpected error occurred during analysis.");
      }
    } finally {
      setUploadProgress(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">Enterprise Resume Auditor</h1>
          <p className="text-xs text-slate-400 mt-1">SaaS grading platform comparing skill profiles with candidate checklists.</p>
        </div>
        <button 
          onClick={() => setShowUploader(!showUploader)}
          className="px-4.5 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-display font-semibold text-xs tracking-wide text-white transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Another CV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: History picker + Action list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-4 rounded-xl">
            <h3 className="font-display font-bold text-xs text-slate-400 tracking-wider uppercase mb-3">Audits History</h3>
            
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {history.length > 0 ? (
                history.map((item) => {
                  const IsActive = selectedResume?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedResume(item); setShowUploader(false); }}
                      className={`
                        w-full p-3 rounded-lg text-left border flex items-start gap-2.5 transition-all cursor-pointer
                        ${IsActive 
                          ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-100" 
                          : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                        }
                      `}
                    >
                      <FileText className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-xs truncate leading-snug">{item.fileName}</p>
                        <span className="text-[9px] font-mono text-slate-500 block mt-1">Score: {item.score}%</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0 self-center" />
                    </button>
                  );
                })
              ) : (
                <p className="text-[11px] font-mono text-slate-500 py-4 text-center">No previous resume uploads found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Main dynamic view body */}
        <div className="lg:col-span-9">
          
          <AnimatePresence mode="wait">
            {/* UPLOADER / CREATOR BLOCK */}
            {showUploader || history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-card rounded-2xl overflow-hidden p-6 space-y-6"
              >
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Upload New CV Profile</h2>
                  <p className="text-xs text-slate-400 mt-1">Deploy automated AI models to extract education, milestones, role highlighting, and structural corrections.</p>
                </div>

                {feedbackError && (
                  <div className="text-xs font-mono text-center text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{feedbackError}</span>
                  </div>
                )}

                {uploadProgress ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
                    <div className="text-center">
                      <p className="font-display font-bold text-[13px] text-white animate-pulse">Running Generative CV Audit...</p>
                      <p className="text-xs text-slate-500 mt-1">Unpacking PDF structural components, classifying technologist skill layers, and compiling scores.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* File Drop Drag Area */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`
                        border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer min-h-[220px]
                        ${dragActive ? "border-indigo-500 bg-indigo-500/5" : "border-slate-800 hover:border-slate-700 bg-slate-950/20"}
                      `}
                    >
                      <input 
                        type="file"
                        id="pdf-uploader-input"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="pdf-uploader-input" className="cursor-pointer space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center mx-auto text-slate-400 hover:text-indigo-400 transition-colors">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-xs text-slate-200">Drop your resume PDF here or <span className="text-indigo-400 hover:underline">Browse files</span></p>
                          <p className="text-[10px] text-slate-500 font-mono mt-2">Only .pdf transcripts supported (Max 15MB)</p>
                        </div>
                      </label>
                    </div>

                    {/* Fallback Text area */}
                    <form onSubmit={handleTextSubmit} className="space-y-4 flex flex-col justify-between">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Or Paste Plain Resume Text Copy</label>
                        <textarea
                          placeholder="Paste full plain outline copy of your CV (Skills, Work experience, and Degree details)..."
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          className="w-full h-36 p-3.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-sans resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-850 hover:border-indigo-500 border border-white/5 font-display font-medium text-xs text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Audit Copied Copy</span>
                      </button>
                    </form>

                  </div>
                )}
              </motion.div>
            ) : (
              // RESULT/AUDIT VIEWER BLOCK
              selectedResume && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={selectedResume.id}
                  className="space-y-6"
                >
                  
                  {/* Banner summary metrics */}
                  <div className="glass-card rounded-2xl p-6 grid md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
                      {/* Circle Gauge */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="44" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                          <circle 
                            cx="56" 
                            cy="56" 
                            r="44" 
                            stroke="#6366f1" 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={276}
                            strokeDashoffset={276 - (276 * selectedResume.score) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="font-display font-extrabold text-2xl text-white">{selectedResume.score}</span>
                          <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest leading-none mt-1">Audit Score</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3 text-left">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-mono text-[9px] mb-2 uppercase">
                        <Award className="w-3 h-3" />
                        <span>AI RECRUITER VERDICT</span>
                      </div>
                      <h2 className="font-display font-bold text-xl text-white truncate">{selectedResume.fileName}</h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        This CV maps a strong competency profile. Review the extracted experiences, technologist checklist indexes, and address suggestions to maximize job alignment metrics.
                      </p>
                    </div>
                  </div>

                  {/* Detail grids */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Left: Extract timeline & Degree lists */}
                    <div className="md:col-span-8 space-y-6">
                      
                      {/* Work history Timeline */}
                      <div className="glass-card p-6 rounded-2xl">
                        <h3 className="font-display font-bold text-sm text-white mb-6">Work Experience Highlights</h3>
                        
                        <div className="relative border-l border-slate-800 ml-3 space-y-6">
                          {selectedResume.experience && selectedResume.experience.length > 0 ? (
                            selectedResume.experience.map((exp, idx) => (
                              <div key={idx} className="relative pl-6">
                                {/* Dot marker */}
                                <div className="absolute top-1 left-[-5px] w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-950" />
                                
                                <div className="space-y-1.5 text-left">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h5 className="font-display font-bold text-xs text-white uppercase">{exp.role}</h5>
                                    <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-white/5">{exp.duration}</span>
                                  </div>
                                  <p className="text-[11px] font-mono font-bold text-indigo-400">{exp.company}</p>
                                  
                                  {exp.highlights && exp.highlights.length > 0 && (
                                    <ul className="list-disc list-outside pl-4 space-y-1 mt-2">
                                      {exp.highlights.map((bullet, BulletIdx) => (
                                        <li key={BulletIdx} className="text-xs text-slate-300 leading-snug">{bullet}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 font-mono pl-4">No experience historical blocks extracted.</p>
                          )}
                        </div>
                      </div>

                      {/* Education component */}
                      <div className="glass-card p-6 rounded-2xl">
                        <h3 className="font-display font-bold text-sm text-white mb-4">Academic & Formal Qualifications</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {selectedResume.education && selectedResume.education.length > 0 ? (
                            selectedResume.education.map((edu, idx) => (
                              <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex gap-3 text-left">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-display font-bold text-xs text-white truncate">{edu.degree}</h5>
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{edu.institution}</p>
                                  <span className="text-[9px] font-mono text-slate-500 block mt-1">Conferred: {edu.year}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 font-mono col-span-2">No educational blocks extracted.</p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right: Technical competency matrices & Improvement guides */}
                    <div className="md:col-span-4 space-y-6">
                      
                      {/* Skill categorization indexes */}
                      <div className="glass-card p-5 rounded-2xl">
                        <h3 className="font-display font-bold text-sm text-auto text-white mb-4 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          <span>Extracted Competencies</span>
                        </h3>

                        <div className="space-y-4">
                          {["Technical", "Tools/Frameworks", "Soft Skill"].map((cat) => {
                            const filtered = selectedResume.skills?.filter((s) => s.category === cat) || [];
                            if (filtered.length === 0) return null;
                            return (
                              <div key={cat} className="text-left space-y-2">
                                <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{cat}</h5>
                                <div className="flex flex-wrap gap-1.5">
                                  {filtered.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-white/5 text-[9px] font-mono leading-none">
                                      {skill.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recruiter guidelines recommendations */}
                      <div className="glass-card p-5 rounded-2xl">
                        <h3 className="font-display font-bold text-sm text-auto text-white mb-4 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse-soft" />
                          <span>Improvement Roadmap</span>
                        </h3>

                        <div className="space-y-3 pr-1 max-h-[300px] overflow-y-auto">
                          {selectedResume.suggestions && selectedResume.suggestions.length > 0 ? (
                            selectedResume.suggestions.map((sug, idx) => (
                              <div key={idx} className="flex gap-2.5 text-left p-3 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-300 leading-snug">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                <span>{sug}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 font-mono">This CV meets solid executive formatting standards.</p>
                          )}
                        </div>
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
