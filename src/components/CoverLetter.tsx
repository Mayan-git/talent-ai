/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, ResumeAnalysis } from "../types";
import { FileText, Copy, Download, Sparkles, FileUp, Check, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { storage, ref, uploadBytes, getDownloadURL } from "../lib/firebase";

interface CoverLetterProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function CoverLetter({ user, onRefreshDashboard }: CoverLetterProps) {
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [manualResumeText, setManualResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [extraInstructions, setExtraInstructions] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");

  useEffect(() => {
    async function loadResumes() {
      try {
        const res = await fetch(`/api/resume/history/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setResumes(data.resumes || []);
          if (data.resumes && data.resumes.length > 0) {
            setSelectedResumeId(data.resumes[0].id);
          } else {
            setSelectedResumeId("manual");
          }
        }
      } catch (err) {
        console.error("Failed to load user resume history", err);
      }
    }
    loadResumes();
  }, [user.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setUploadError("For high alignment, please upload a valid .pdf resume document.");
      return;
    }

    // Strict 5MB size limit validation
    const maxLimit = 5 * 1024 * 1024;
    if (file.size > maxLimit) {
      setUploadError("Document size limit exceeded! Please upload a resume PDF smaller than 5MB.");
      return;
    }

    setUploadError("");
    setUploadLoading(true);

    try {
      // 1. Upload file object to cloud Firebase Storage first
      let firebaseDownloadUrl = "";
      try {
        const fileRef = ref(storage, `resumes/${user.id}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        firebaseDownloadUrl = await getDownloadURL(snapshot.ref);
        console.log("Firebase storage copy uploaded successfully:", firebaseDownloadUrl);
      } catch (storageErr) {
        console.warn("Storage upload failed or permission skipped, parsing directly:", storageErr);
      }

      // 2. Read file base64 string to analyze resume
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(",")[1];
          const res = await fetch("/api/resume/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              fileName: file.name,
              base64Data: base64String,
              isPdf: true,
              fileUrl: firebaseDownloadUrl || undefined
            })
          });

          if (!res.ok) {
            throw new Error("Failed to process and analyze resume PDF.");
          }

          const data = await res.json();
          if (data.resume) {
            setResumes((prev) => [data.resume, ...prev]);
            setSelectedResumeId(data.resume.id);
            if (onRefreshDashboard) onRefreshDashboard();
          }
        } catch (err: any) {
          setUploadError(err.message || "Unable to parse this resume PDF. Please write manually.");
        } finally {
          setUploadLoading(false);
        }
      };
      reader.onerror = () => {
        setUploadError("Error reading the specified document file.");
        setUploadLoading(false);
      };
    } catch (outerErr: any) {
      setUploadError(outerErr.message || "Failed uploading process.");
      setUploadLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");
    
    let resumeText = "";
    if (selectedResumeId === "manual") {
      resumeText = manualResumeText;
      if (!resumeText.trim()) {
        setError("Please enter your resume details or select an existing resume profile.");
        return;
      }
    } else {
      const selected = resumes.find(r => r.id === selectedResumeId);
      if (selected) {
        // Construct clean textual summary of matching skills, experience and education details
        resumeText = `
Candidate Name: ${user.name}
Target title: ${user.title || ""}
Skills: ${selected.skills.map(s => s.name).join(", ")}
Experience highlights: ${selected.experience.map(e => `${e.role} at ${e.company} (${e.duration}): ${e.highlights.join("; ")}`).join("\n")}
Education: ${selected.education.map(ed => `${ed.degree} from ${ed.institution} (${ed.year})`).join("\n")}
`;
      } else {
        setError("Please select a resume profile or provide details manually.");
        return;
      }
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description to align with.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resumeText,
          extraInstructions
        })
      });

      if (!res.ok) {
        throw new Error("Failed to communicate with the cover letter model service.");
      }

      const data = await res.json();
      setResult(data.coverLetter);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([result], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${user.name.replace(/\s+/g, "_")}_Cover_Letter.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to download the formatted PDF.");
      return;
    }
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>${user.name} - Cover Letter</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1f2937;
              line-height: 1.6;
              padding: 50px 70px;
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 24px;
              margin-bottom: 40px;
            }
            .name {
              font-size: 28px;
              font-weight: 700;
              color: #111827;
              letter-spacing: -0.025em;
              margin: 0;
            }
            .title {
              font-size: 14px;
              font-weight: 500;
              color: #4f46e5;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 4px 0 0 0;
            }
            .meta {
              font-size: 12px;
              color: #6b7280;
              margin-top: 12px;
              display: flex;
              gap: 16px;
            }
            .date {
              font-size: 13px;
              font-weight: 500;
              color: #4b5563;
              margin-bottom: 30px;
            }
            .content {
              font-size: 14.5px;
              color: #374151;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 60px;
              font-size: 11px;
              color: #9ca3af;
              text-align: center;
              border-top: 1px dashed #e5e7eb;
              padding-top: 15px;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="name">${user.name}</h1>
            <p class="title">${user.title || "Professional Candidate"}</p>
            <div class="meta">
              <span>Email: ${user.email}</span>
              <span>Generated on: ${today}</span>
            </div>
          </div>
          <div class="date">${today}</div>
          <div class="content">${result}</div>
          <div class="footer">Tailored with precision by HireWise AI • Confidential</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Header section */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="font-display font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" />
          <span>AI Cover Letter Generator</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Paste a target job description and align it automatically with your resume to generate a high-impact cover letter.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input form */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="glass-card p-6 rounded-2xl border border-white/5 space-y-5">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <span>Tailoring Details</span>
            </h3>

            {/* Resume selector & PDF Uploader */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Source Resume Profile</label>
                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">PDF Parser Ready</span>
              </div>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.fileName || "Uploaded Resume"} ({r.score ? `ATS Score: ${r.score}%` : "Processed"})</option>
                ))}
                <option value="manual">Enter Experience manually...</option>
              </select>

              {/* PDF Drag & Drop / Upload area */}
              <div className="relative">
                <input
                  type="file"
                  id="pdf-resume-letter"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadLoading}
                />
                <label
                  htmlFor="pdf-resume-letter"
                  className={`border border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    uploadLoading 
                      ? "border-indigo-500/40 bg-indigo-950/5" 
                      : "border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.01]"
                  }`}
                >
                  {uploadLoading ? (
                    <div className="space-y-1">
                      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
                      <p className="text-[10px] font-mono text-indigo-400">Structuring target matrix via AI...</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <FileUp className="w-5 h-5 text-slate-500 mx-auto" />
                      <p className="text-[10px] text-slate-300 font-semibold">Upload target Resume (PDF)</p>
                      <p className="text-[9px] text-zinc-500">Drag & drop or browse locally • Max 10MB</p>
                    </div>
                  )}
                </label>
              </div>

              {uploadError && (
                <p className="text-[9px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>

            {selectedResumeId === "manual" && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Your Resume Highlights</label>
                <textarea
                  value={manualResumeText}
                  onChange={(e) => setManualResumeText(e.target.value)}
                  placeholder="List your core skills, recent jobs, and key qualifications..."
                  rows={4}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </motion.div>
            )}

            {/* Job Description input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Target Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the entire job post details here..."
                rows={6}
                required
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {/* Extra tone guidelines */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Custom Tone & Directions (Optional)</label>
              <input
                type="text"
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="e.g. Focus on cloud scale, write in an excited conversational tone..."
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl flex items-start gap-2 text-[11px] text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/40 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Integrating & Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Draft Tailored Cover Letter</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output results slate */}
        <div className="lg:col-span-7">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col min-h-[480px]"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-display font-black text-sm text-white">Generated Cover Letter</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="p-2 bg-indigo-950/30 hover:bg-indigo-900/30 border border-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-sans bg-[#070707]/60 border border-white/5 p-5 rounded-2xl overflow-y-auto max-h-[500px]">
                {result}
              </div>
            </motion.div>
          ) : (
            <div className="border border-dashed border-white/5 rounded-2xl min-h-[480px] flex flex-col items-center justify-center text-center p-8 bg-[#070707]/20">
              {loading ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin mx-auto" />
                  <div className="space-y-1 animate-pulse">
                    <p className="font-mono text-xs text-indigo-400">Consulting Gemini Executive Models...</p>
                    <p className="text-[10px] text-zinc-500">Aligning experience matrices and tailoring pitch angles...</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-xs space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto text-slate-500">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-xs text-white">Letter Slate is Dry</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal mt-1">
                      Configure your target profile specs on the left and dispatch the tailoring generator task. Your output will reveal here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
