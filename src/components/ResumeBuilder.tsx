/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, ResumeVersion } from "../types";
import { saasStore } from "../lib/saasStore";
import { 
  FileText, Sparkles, Plus, Trash, Download, Eye, Layout, Save, CheckCircle, ArrowRight, Loader2, RefreshCw
} from "lucide-react";

interface ResumeBuilderProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function ResumeBuilder({ user, onRefreshDashboard }: ResumeBuilderProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  // Resume Form Fields State
  const [title, setTitle] = useState("Target CV v1");
  const [templateId, setTemplateId] = useState<"modern" | "editorial" | "technical" | "minimalist">("modern");
  const [fullName, setFullName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [location, setLocation] = useState("San Francisco, CA");
  const [website, setWebsite] = useState("https://portfolio.dev");
  const [summary, setSummary] = useState("Dedicated engineering specialist with high caliber experience in structural components, visual layouts, and automated dashboards.");
  const [skillsText, setSkillsText] = useState("React, TypeScript, Tailwind CSS, Node.js, REST APIs, Git, Docker");

  const [experience, setExperience] = useState<Array<{
    id: string;
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }>>([
    {
      id: "exp_1",
      role: "Software Developer",
      company: "Innovate Tech Labs",
      duration: "2023 - Present",
      highlights: ["Built custom interactive visual charts.", "Integrated server state synchronization protocols."]
    }
  ]);

  const [education, setEducation] = useState<Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
  }>>([
    {
      id: "edu_1",
      degree: "B.S. in Computer Science",
      institution: "State University of Computing",
      year: "2023"
    }
  ]);

  // Load SaaS database entries
  useEffect(() => {
    const db = saasStore.get();
    const userVersions = db.resumeVersions.filter(v => v.userId === user.id);
    setVersions(userVersions);
    if (userVersions.length > 0) {
      loadVersionData(userVersions[0]);
    }
  }, [user.id]);

  const loadVersionData = (v: ResumeVersion) => {
    setSelectedVersionId(v.id);
    setTitle(v.title);
    setTemplateId(v.templateId);
    setFullName(v.personalInfo.fullName);
    setEmail(v.personalInfo.email);
    setPhone(v.personalInfo.phone);
    setLocation(v.personalInfo.location);
    setWebsite(v.personalInfo.website);
    setSummary(v.personalInfo.summary);
    setSkillsText(v.skills.join(", "));
    setExperience(v.experience);
    setEducation(v.education);
  };

  const addExperienceItem = () => {
    setExperience([
      ...experience,
      {
        id: `exp_${Date.now()}`,
        role: "Software Engineer",
        company: "Enterprise Labs",
        duration: "2021 - 2023",
        highlights: ["Created responsive user interface sections.", "Accelerated load benchmarks by 15%."]
      }
    ]);
  };

  const removeExperienceItem = (id: string) => {
    setExperience(experience.filter(e => e.id !== id));
  };

  const updateExperienceRole = (id: string, role: string) => {
    setExperience(experience.map(e => e.id === id ? { ...e, role } : e));
  };

  const updateExperienceCompany = (id: string, company: string) => {
    setExperience(experience.map(e => e.id === id ? { ...e, company } : e));
  };

  const updateExperienceDuration = (id: string, duration: string) => {
    setExperience(experience.map(e => e.id === id ? { ...e, duration } : e));
  };

  const updateHighlights = (id: string, text: string) => {
    setExperience(experience.map(e => e.id === id ? { ...e, highlights: text.split("\n").filter(Boolean) } : e));
  };

  const addEducationItem = () => {
    setEducation([
      ...education,
      {
        id: `edu_${Date.now()}`,
        degree: "Professional Diploma",
        institution: "Cloud Academy",
        year: "2024"
      }
    ]);
  };

  const removeEducationItem = (id: string) => {
    setEducation(education.filter(e => e.id !== id));
  };

  const saveResumeVersion = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const skillsArray = skillsText.split(",").map(s => s.trim()).filter(Boolean);

    const updatedVersion: ResumeVersion = {
      id: selectedVersionId || saasStore.generateId(),
      userId: user.id,
      title,
      templateId,
      personalInfo: {
        fullName,
        email,
        phone,
        location,
        website,
        summary
      },
      skills: skillsArray,
      experience,
      education,
      createdAt: new Date().toISOString()
    };

    const db = saasStore.get();
    const existingIndex = db.resumeVersions.findIndex(v => v.id === updatedVersion.id);

    if (existingIndex !== -1) {
      db.resumeVersions[existingIndex] = updatedVersion;
    } else {
      db.resumeVersions.unshift(updatedVersion);
      setSelectedVersionId(updatedVersion.id);
    }

    db.notifications.unshift({
      id: saasStore.generateId(),
      userId: user.id,
      title: "Resume Saved Successfully",
      message: `Your resume version "${title}" has been saved in your career catalog vaults.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString()
    });

    // Provide XP
    if (!db.gamification[user.id]) {
      db.gamification[user.id] = { level: 1, xp: 0, xpNextLevel: 100, streakDays: 1, achievements: [] };
    }
    db.gamification[user.id].xp += 40;
    if (db.gamification[user.id].xp >= db.gamification[user.id].xpNextLevel) {
      db.gamification[user.id].level += 1;
      db.gamification[user.id].xp -= db.gamification[user.id].xpNextLevel;
    }

    saasStore.save(db);

    const userVersions = db.resumeVersions.filter(v => v.userId === user.id);
    setVersions(userVersions);
    setSaving(false);
    if (onRefreshDashboard) onRefreshDashboard();
  };

  // Switch versions
  const handleVersionChange = (id: string) => {
    if (!id) {
      // Setup new template defaults
      setSelectedVersionId("");
      setTitle("New Target CV");
      return;
    }
    const target = versions.find(v => v.id === id);
    if (target) {
      loadVersionData(target);
    }
  };

  // Mock export action
  const handleDownloadPdf = () => {
    const rawContent = `
=============================================
${fullName.toUpperCase()}
${location} | ${phone} | ${email} | ${website}
=============================================

SUMMARY DEFINITION
${summary}

TECHNOLOGICAL SKILLS
${skillsText}

PROFESSIONAL EXPERIENCE
${experience.map(e => `
- ${e.role} | ${e.company} (${e.duration})
  ${e.highlights.map(h => `* ${h}`).join("\n  ")}
`).join("\n")}

EDUCATIONAL BACKGROUND
${education.map(ed => `
- ${ed.degree} | ${ed.institution} (${ed.year})
`).join("\n")}
    `;

    const blob = new Blob([rawContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fullName.replace(/\s+/g, "_")}_Resume_${templateId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="resume-builder-workspace" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">AI resume builder</h2>
          <p className="text-zinc-500 text-xs mt-1 font-sans">Leverage live interactive templates to design and structure high impact resumes.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}
            className="h-9 px-4 rounded-lg bg-[#141414] hover:bg-zinc-800 border border-white/5 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            {activeTab === "edit" ? (
              <>
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Live Preview Panel</span>
              </>
            ) : (
              <>
                <Layout className="w-4 h-4 text-teal-400" />
                <span>Return Editor Workspace</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Select active version */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#111111]/40 border border-white/5 rounded-xl p-4 md:items-center">
        <div className="lg:col-span-4 space-y-1">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Active Resume profile</label>
          <select 
            value={selectedVersionId}
            onChange={(e) => handleVersionChange(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-xs text-white"
          >
            <option value="">+ (Create New Resume Draft Profile)</option>
            {versions.map(v => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Layout Template Style</label>
          <select 
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as any)}
            className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-xs text-white"
          >
            <option value="modern">Modern Professional Slate</option>
            <option value="technical">JetBrains Technical Mono</option>
            <option value="editorial">Placid Editorial Georgia</option>
            <option value="minimalist">Minimalist Swiss Design</option>
          </select>
        </div>
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Draft Name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-xs text-white"
            placeholder="e.g. Target Lead CV"
          />
        </div>
        <div className="lg:col-span-2 pt-4 md:pt-0 flex items-center justify-end gap-2">
          <button
            onClick={saveResumeVersion}
            disabled={saving}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-lg text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer w-full justify-center"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save draft</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Hand: Editor Workspace */}
        {activeTab === "edit" ? (
          <div className="glass-card p-5 rounded-xl space-y-5 text-left max-h-[700px] overflow-y-auto">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Personal Information details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-zinc-400">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-lg p-2 text-xs text-white focus:border-indigo-500/50 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-zinc-400">Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-lg p-2 text-xs text-white focus:border-indigo-500/50 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-zinc-400">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-lg p-2 text-xs text-white focus:border-indigo-500/50 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-zinc-400">Job Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-lg p-2 text-xs text-white focus:border-indigo-500/50 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-zinc-400">Portfolio/Website Link</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-[#111] border border-white/5 rounded-lg p-2 text-xs text-white focus:border-indigo-500/50 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-zinc-400">Executive Summary Profile</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full bg-[#111] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500/50 outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-zinc-400">Core Technologies skills (Comma separated)</label>
              <textarea
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                rows={2}
                className="w-full bg-[#111] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500/50 outline-none resize-none"
              />
            </div>

            {/* Experience Blocks */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">Professional Positions</h4>
                <button
                  type="button"
                  onClick={addExperienceItem}
                  className="p-1 px-2.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Position</span>
                </button>
              </div>

              {experience.map((exp, idx) => (
                <div key={exp.id} className="p-4 rounded-lg bg-zinc-900/40 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center bg-white/5 -m-4 p-2 px-4 rounded-t-lg mb-1">
                    <span className="text-[10px] font-mono text-zinc-400">Employment #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeExperienceItem(exp.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-white/5 cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperienceRole(exp.id, e.target.value)}
                      placeholder="Title e.g. Staff Engineer"
                      className="bg-[#111] border border-white/5 p-2 rounded text-xs text-white hover:border-zinc-700 outline-none"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperienceCompany(exp.id, e.target.value)}
                      placeholder="Company"
                      className="bg-[#111] border border-white/5 p-2 rounded text-xs text-white hover:border-zinc-700 outline-none"
                    />
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => updateExperienceDuration(exp.id, e.target.value)}
                      placeholder="Duration"
                      className="bg-[#111] border border-white/5 p-2 rounded text-xs text-white hover:border-zinc-700 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-zinc-500">Bullet points highlights (One per line)</label>
                    <textarea
                      value={exp.highlights.join("\n")}
                      onChange={(e) => updateHighlights(exp.id, e.target.value)}
                      rows={2}
                      className="w-full bg-[#111] border border-white/5 p-2 rounded text-xs text-white outline-none resize-none font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Live Resume preview container */
          <div className="glass-card p-6 rounded-xl space-y-4 text-left max-h-[700px] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Live HTML Template rendering preview</span>
              <button
                onClick={handleDownloadPdf}
                className="h-8 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-white font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export draft content</span>
              </button>
            </div>

            {/* Template Render block */}
            <div className={`p-6 rounded-lg bg-white text-zinc-900 border shadow-md ${
              templateId === "technical" ? "font-mono" : templateId === "editorial" ? "font-serif" : "font-sans"
            }`}>
              
              {/* Header */}
              <div className="text-center space-y-1.5 border-b pb-4 border-zinc-200">
                <h1 className="text-xl font-bold font-display tracking-tight text-zinc-900">{fullName || "Aspirant Name"}</h1>
                <p className="text-[10px] text-zinc-500">
                  {location} | {phone} | {email} | {website}
                </p>
              </div>

              {/* Summary */}
              <div className="mt-4 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Executive highlight</h3>
                <p className="text-[11px] text-zinc-700 leading-relaxed">{summary || "Profile summary content placeholder"}</p>
              </div>

              {/* Skills */}
              <div className="mt-4 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Technology competencies</h3>
                <div className="flex flex-wrap gap-1">
                  {skillsText.split(",").map((s, idx) => (
                    <span key={idx} className="text-[10px] font-mono bg-zinc-100 border px-2 py-0.5 rounded text-zinc-700">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Career path history</h3>
                {experience.map(e => (
                  <div key={e.id} className="space-y-1">
                    <div className="flex justify-between items-baseline text-[11px]">
                      <span className="font-bold text-zinc-900">{e.role} — <span className="font-normal text-zinc-600">{e.company}</span></span>
                      <span className="text-zinc-500 font-mono text-[9px]">{e.duration}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-zinc-600">
                      {e.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Education background</h3>
                {education.map(ed => (
                  <div key={ed.id} className="flex justify-between items-baseline text-[11px]">
                    <span className="font-bold text-zinc-900">{ed.degree} — <span className="font-normal text-zinc-600">{ed.institution}</span></span>
                    <span className="text-zinc-500 font-mono text-[9px]">{ed.year}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* Right Hand / Side-panel: Help tips & Suggestions */}
        <div className="glass-card p-5 rounded-xl space-y-5 text-left h-fit">
          <h4 className="font-display font-extrabold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Real-Time recommendations</span>
          </h4>

          <div className="space-y-3">
            <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">Parser-Friendly Tip</span>
              <p className="text-xs text-zinc-400">Always preserve simple headings like "Skills", "Experience", and "Education". ATS algorithms seek exactly these standard headings during classification maps.</p>
            </div>

            <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Keyword Injection Suggestion</span>
              <p className="text-xs text-zinc-400">Map out tech skills such as <code className="bg-[#111] px-1 text-[11px]">Kubernetes</code>, <code className="bg-[#111] px-1 text-[11px]">Microservices</code>, and <code className="bg-[#111] px-1 text-[11px]">Jest Testing</code> inside the competency section to drive ATS compatibilities above 85%.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
