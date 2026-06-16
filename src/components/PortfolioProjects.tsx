/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, PortfolioProject } from "../types";
import { saasStore } from "../lib/saasStore";
import { 
  Sparkles, Plus, Trash, FolderHeart, Activity, ListTodo, RefreshCw, Layers, CheckCircle
} from "lucide-react";

interface PortfolioProjectsProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function PortfolioProjects({ user, onRefreshDashboard }: PortfolioProjectsProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [selectedProj, setSelectedProj] = useState<PortfolioProject | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // Form input parameters
  const [title, setTitle] = useState("Distributed Rate-Limiter API");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [techStackText, setTechStackText] = useState("Node, Redis, Express, Jest, Docker");

  useEffect(() => {
    const db = saasStore.get();
    const userProjs = db.portfolioProjects.filter(p => p.userId === user.id);
    setProjects(userProjs);
    if (userProjs.length > 0) {
      setSelectedProj(userProjs[0]);
    } else {
      // Boot pre-cached default project
      const seedProj: PortfolioProject = {
        id: "seed_proj_1",
        userId: user.id,
        title: "Distributed Rate-Limiter Middleware",
        description: "Robust back-end micro-service for request management and throttling targets",
        difficulty: "Advanced",
        techStack: ["Node.js", "Redis", "Docker", "Express", "Jest"],
        milestones: [
          "Deploy stateless Redis caching cluster cleanly in a local Docker Network.",
          "Write token-bucket throttling middlewares to manage API hit budgets.",
          "Draft automated request-flooding benchmarks with Jest to verify rate-limits."
        ],
        resumeBulletSuggestions: [
          "Engineered a distributed rate-limiter managing up to 10k mock requests/sec.",
          "Leveraged Redis caching structures, lowering downstream server footprint metrics by 35%."
        ]
      };
      db.portfolioProjects.push(seedProj);
      saasStore.save(db);
      setProjects([seedProj]);
      setSelectedProj(seedProj);
    }
  }, [user.id]);

  const generateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setGenerating(true);

    await new Promise(resolve => setTimeout(resolve, 1200));

    const stackArr = techStackText.split(",").map(s => s.trim()).filter(Boolean);

    // Dynamic generation of milestones aligned with experience parameters
    const generatedMilestones = [
      `Structure the main directories, configure package manifests, and install lint rules.`,
      `Implement core routing handlers in ${stackArr.slice(0, 2).join(" and ") || "React"}.`,
      `Draft automated endpoints, configure test suits, and containerize utilizing a single Dockerfile.`
    ];

    const generatedBullets = [
      `Architected the core system engine using ${stackArr.join("/") || "React/Custom Node"}, accelerating execution benchmarks by 20%.`,
      `Integrated container configurations, ensuring reliable local sandbox environments.`
    ];

    const newProj: PortfolioProject = {
      id: saasStore.generateId(),
      userId: user.id,
      title: title.trim(),
      description: `Advanced task template layout designed under typical ${difficulty} development patterns.`,
      difficulty,
      techStack: stackArr,
      milestones: generatedMilestones,
      resumeBulletSuggestions: generatedBullets
    };

    const db = saasStore.get();
    db.portfolioProjects.unshift(newProj);
    
    db.notifications.unshift({
      id: saasStore.generateId(),
      userId: user.id,
      title: "Portfolio Project Idea Generated",
      message: `Your project blueprint for "${title}" has been architected. Use the suggested bullets on your CV!`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString()
    });

    if (!db.gamification[user.id]) {
      db.gamification[user.id] = { level: 1, xp: 0, xpNextLevel: 100, streakDays: 1, achievements: [] };
    }
    db.gamification[user.id].xp += 30;

    saasStore.save(db);

    setProjects([newProj, ...projects]);
    setSelectedProj(newProj);
    setGenerating(false);
    if (onRefreshDashboard) onRefreshDashboard();
  };

  const deleteProj = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const db = saasStore.get();
    db.portfolioProjects = db.portfolioProjects.filter(p => p.id !== id);
    saasStore.save(db);

    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    if (selectedProj?.id === id) {
      setSelectedProj(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <div id="portfolio-project-builder" className="space-y-6">
      
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">AI Portfolio project architect</h2>
          <p className="text-zinc-500 text-xs mt-1">Design high authority project concepts, engineering components lists, and exact Resume performance bullet suggestions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Launch Form and History Logs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Architect New Project Idea</span>
            </h3>

            <form onSubmit={generateProject} className="space-y-3.5 text-left">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Project Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  placeholder="e.g. Serverless Event Gateway"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Difficulty parameters</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced (High Authority)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Target Technologies (Comma separated)</label>
                <input
                  type="text"
                  value={techStackText}
                  onChange={(e) => setTechStackText(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={generating || !title.trim()}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Architecting modules...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Generate Project blueprint</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History catalogs */}
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <FolderHeart className="w-4 h-4 text-zinc-400" />
              <span>Project blueprints history</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {projects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProj(proj)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-center ${
                    selectedProj?.id === proj.id 
                      ? "bg-indigo-500/10 border-indigo-500/30" 
                      : "bg-[#111111]/40 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-xs text-zinc-200 truncate">{proj.title}</p>
                    <span className="text-[9px] font-mono text-zinc-500 block mt-1">{proj.difficulty} level</span>
                  </div>
                  <button
                    onClick={(e) => deleteProj(proj.id, e)}
                    className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Showcase Active project details */}
        <div className="lg:col-span-2">
          {selectedProj ? (
            <div className="glass-card p-6 rounded-xl space-y-6 text-left">
              
              {/* Header */}
              <div className="border-b border-white/5 pb-5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    selectedProj.difficulty === "Advanced" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {selectedProj.difficulty}
                  </span>
                  <span className="text-zinc-500 text-[10px]">Architect blueprint v1.0</span>
                </div>
                <h4 className="font-display font-extrabold text-lg text-white mt-2">{selectedProj.title}</h4>
              </div>

              {/* Technologies */}
              <div className="space-y-2.5">
                <h5 className="font-display font-semibold text-xs text-zinc-400 uppercase tracking-widest">Technologies Stack Checklist</h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProj.techStack.map((tech, i) => (
                    <span key={i} className="text-[10px] font-mono px-2.5 py-1 bg-zinc-900 border border-white/5 text-zinc-300 rounded-md">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step by step development milestons */}
              <div className="space-y-3.5 pt-3 border-t border-white/5">
                <h5 className="font-display font-semibold text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Development Milestones</span>
                </h5>
                <ol className="space-y-2.5">
                  {selectedProj.milestones.map((milestone, idx) => (
                    <li key={idx} className="p-3 bg-[#111]/40 border border-white/5 rounded-lg text-xs text-zinc-300 leading-relaxed flex gap-3 items-center">
                      <span className="font-mono text-[10px] bg-indigo-500/10 text-indigo-400 rounded h-5 w-5 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{milestone}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Resume bullets suggestions */}
              <div className="space-y-3.5 pt-3 border-t border-white/5">
                <h5 className="font-display font-semibold text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Resume bullets optimization models</span>
                </h5>
                <div className="space-y-2.5">
                  {selectedProj.resumeBulletSuggestions.map((bullet, idx) => (
                    <div key={idx} className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs leading-relaxed text-zinc-350 flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl text-center space-y-3">
              <FolderHeart className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-zinc-400 font-semibold text-sm">No Project Blueprint selected</p>
              <p className="text-zinc-500 text-xs">Choose details configurations on the left pane and generate templates directly.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
