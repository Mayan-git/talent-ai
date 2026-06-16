/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User as UserIcon, Award, ShieldCheck, RefreshCw, KeyRound, Sparkles, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";

interface ProfileViewProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export default function ProfileView({ user, onUpdateUser }: ProfileViewProps) {
  const [title, setTitle] = useState(user.title || "Full-Stack Engineer");
  const [bio, setBio] = useState(user.bio || "Passionate software builder looking ahead...");
  const [experienceLevel, setExperienceLevel] = useState<User["experienceLevel"]>(user.experienceLevel || "Junior");
  const [skillsText, setSkillsText] = useState((user.skills || []).join(", "));
  
  // Controls
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    // Parse skills delimited by commas
    const parsedSkills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title,
          bio,
          experienceLevel,
          skills: parsedSkills,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Profile updating failed on backend.");
      }

      if (data.user) {
        onUpdateUser(data.user);
        setMsg({ type: "success", text: "Candidate profile tracker updated successfully." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-left max-w-4xl mx-auto">
      
      {/* Header bar */}
      <div className="pb-4 border-b border-white/5">
        <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">Candidate Profile Tracker</h1>
        <p className="text-xs text-slate-400 mt-1">Configure experience hierarchies and add core technical tags to calibrate AI interview questions.</p>
      </div>

      {msg && (
        <div className={`text-xs font-mono p-4 rounded-xl border flex items-center gap-2 ${
          msg.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Side Info card summary */}
        <div className="md:col-span-1 glass-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xl font-extrabold text-white uppercase shadow-lg shadow-indigo-500/10 select-none">
              {user.name ? user.name.slice(0, 2) : "CV"}
            </div>
            <h3 className="font-display font-bold text-base text-white mt-4">{user.name || "Aspirant"}</h3>
            <p className="text-xs font-mono text-slate-500">{user.email}</p>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Title Range:</span>
              <span className="font-semibold text-slate-200">{user.title || "Not custom set"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Seniority:</span>
              <span className="font-mono text-indigo-400 font-bold">{user.experienceLevel || "Junior"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Created:</span>
              <span className="font-mono text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Right Side Form fields sheets */}
        <form onSubmit={handleSubmitProfile} className="md:col-span-2 glass-card p-6 rounded-2xl space-y-6">
          <div className="space-y-4">
            
            <div className="grid sm:grid-cols-2 gap-4">
              
              {/* Custom Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Professional Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Devops Architect"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Selector level */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Seniority Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer block"
                >
                  <option value="Junior">Junior Aspirant</option>
                  <option value="Mid-level">Mid-level Technologist</option>
                  <option value="Senior">Senior Specialist</option>
                  <option value="Executive">Executive Director</option>
                </select>
              </div>

            </div>

            {/* Custom Bio */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Professional Bio Statement</label>
              <textarea
                placeholder="A brief elevator description of your career focus and targets..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full h-24 p-3.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-sans resize-none"
              />
            </div>

            {/* Commas delimited technical tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Technical Competencies (Commas Delimited)</label>
              <textarea
                placeholder="e.g. React, Docker, Kubernetes, Python, AWS, PostgreSQL, Go, Redis"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full h-20 p-3.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-sans resize-none"
              />
              <span className="text-[10px] font-mono text-slate-500 block leading-tight">These indices will calibrate prompt generators inside simulated mock interviews.</span>
            </div>

          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-display font-medium text-xs text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Synchronize Candidate Profile</span>
              </>
            )}
          </button>
        </form>

      </div>

    </div>
  );
}
