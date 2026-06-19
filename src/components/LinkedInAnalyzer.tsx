/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { User } from "../types";
import { Linkedin, Sparkles, RefreshCw, Send, AlertCircle, ShieldAlert, BadgeCheck, Zap, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface LinkedInAnalyzerProps {
  user: User;
  onRefreshDashboard?: () => void;
}

interface LinkedInAnalysisResult {
  headlineAndSummary: string;
  experienceSection: string;
  skillsAndOptimizationTips: string;
  overallStrengthScore: number;
}

export default function LinkedInAnalyzer({ user, onRefreshDashboard }: LinkedInAnalyzerProps) {
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [profileContent, setProfileContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<LinkedInAnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!profileUrl.trim()) {
      setError("Please paste your LinkedIn profile URLs to proceed.");
      return;
    }

    if (!profileUrl.toLowerCase().includes("linkedin.com/")) {
      setError("Please specify a genuine, valid LinkedIn profile address link.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/linkedin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileUrl,
          profileContent: profileContent || `Target Candidate: ${user.name}, Present Professional Title: ${user.title || "Developer"}, Skills: ${user.skills?.join(", ") || "Engineering"}`
        })
      });

      if (!res.ok) {
        throw new Error("Unable to analyze profile. Please retry the optimization sweep.");
      }

      const data = await res.json();
      setResult(data);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during optimization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Header Title Section */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="font-display font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
          <Linkedin className="w-6 h-6 text-indigo-400" />
          <span>AI LinkedIn Profile Auditor & Optimizer</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform immediate SEO audits on your LinkedIn profile to optimize visibility, rank higher in recruiter searches, and convert job offers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left URL Form Card */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleAnalyze} className="glass-card p-6 rounded-2xl border border-white/5 space-y-5">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <span>Auditing Scope</span>
            </h3>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">LinkedIn Profile URL</label>
              <div className="relative">
                <input
                  type="text"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/yourprofile"
                  required
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
                <Linkedin className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Additional Profile Details (Optional)</label>
              <textarea
                value={profileContent}
                onChange={(e) => setProfileContent(e.target.value)}
                placeholder="Paste some scraps of your present headline, about section, or skills, to maximize suggestion alignment..."
                rows={5}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
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
                  <span>Sweeping & Optimizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Initiate Profile SEO Sweep</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Audit output details */}
        <div className="lg:col-span-7">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 animate-fade-in"
            >
              {/* Profile rating score banner */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col xs:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/20 via-slate-900/40 to-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-sm text-white">LinkedIn Audit Status</h4>
                    <p className="text-[10px] text-slate-500">Profile positioning indexing recommendations ready.</p>
                  </div>
                </div>
                {/* Visual scoring widget */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[9px] font-mono uppercase text-slate-400 font-bold">SEO Strength</p>
                    <p className="text-sm font-mono font-black text-emerald-400">{result.overallStrengthScore}% Score</p>
                  </div>
                  <div className="relative w-11 h-11 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
                    <div className="absolute inset-0.5 rounded-full border border-emerald-400/40 border-t-transparent animate-spin-slow" />
                    <Zap className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Suggestions Categories */}
              <div className="space-y-5">
                {/* 1. Headline & Brand Summary card */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <BadgeCheck className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">Premium Headline & Brand positioning</h4>
                  </div>
                  <div className="whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-sans bg-[#080808]/60 p-4 rounded-xl border border-white/5">
                    {result.headlineAndSummary}
                  </div>
                </div>

                {/* 2. Experience restructuring */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <BadgeCheck className="w-4 h-4 text-violet-400" />
                    <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">Quantified Highlight rewrites</h4>
                  </div>
                  <div className="whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-sans bg-[#080808]/60 p-4 rounded-xl border border-white/5">
                    {result.experienceSection}
                  </div>
                </div>

                {/* 3. SEO tips and high index SEO keywords */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">Search Keywords & Recruiter Conversion Tips</h4>
                  </div>
                  <div className="whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-sans bg-[#080808]/60 p-4 rounded-xl border border-white/5">
                    {result.skillsAndOptimizationTips}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="border border-dashed border-white/5 rounded-2xl min-h-[480px] flex flex-col items-center justify-center text-center p-8 bg-[#070707]/20">
              {loading ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin mx-auto" />
                  <div className="space-y-1 animate-pulse">
                    <p className="font-mono text-xs text-indigo-400">Analyzing Profile Positioning...</p>
                    <p className="text-[10px] text-zinc-500">Injecting SEO indices, tuning executive titles and restructuring highlights...</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-xs space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto text-slate-500">
                    <Linkedin className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-xs text-white">Auditor is Standing By</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal mt-1">
                      Provide your LinkedIn handle address link on the left to initiate executive optimizations sweeps immediately.
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
