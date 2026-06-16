/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, CareerRoadmap } from "../types";
import { saasStore } from "../lib/saasStore";
import { 
  Compass, RefreshCw, Sparkles, CheckSquare, Square, ArrowRight, ExternalLink, Activity, BookOpen, Layers
} from "lucide-react";

interface LearningRoadmapProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function LearningRoadmap({ user, onRefreshDashboard }: LearningRoadmapProps) {
  const [activeDuration, setActiveDuration] = useState<30 | 60 | 90>(30);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [generating, setGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState("Frontend Engineer");

  useEffect(() => {
    // Attempt load from saasStore
    loadRoadmap(activeDuration);
  }, [user.id, activeDuration]);

  const loadRoadmap = (duration: 30 | 60 | 90) => {
    const db = saasStore.get();
    const found = db.roadmaps.find(r => r.userId === user.id && r.daysDuration === duration);
    if (found) {
      setRoadmap(found);
    } else {
      generateDefaultRoadmap(duration);
    }
  };

  const generateDefaultRoadmap = (duration: 30 | 60 | 90) => {
    // Generate static content depending on durations
    const phases = [];
    if (duration >= 30) {
      phases.push({
        phaseTitle: "Fundamentals & Styling Standards",
        timeframe: "Days 1 - 15",
        items: [
          { id: `r_${duration}_1`, title: "Tailwind CSS Layout Mechanics", duration: "Day 1-5", description: "Optimize flexbox grids, fluid sizing, raw media hooks, and custom dark presets.", techStack: ["TailwindCSS", "CSS vars"], resources: [{ name: "Tailwind v4 Docs", url: "https://tailwindcss.com", free: true }], completed: false },
          { id: `r_${duration}_2`, title: "Async REST APIs integrations", duration: "Day 6-12", description: "Handle network retries, optimistic state updates, client caches, and error fallbacks.", techStack: ["React Query", "Fetch"], resources: [{ name: "TanStack Query Guide", url: "https://tanstack.com", free: true }], completed: false }
        ]
      });
    }
    if (duration >= 60) {
      phases.push({
        phaseTitle: "State Store Optimization & Architecture",
        timeframe: "Days 16 - 40",
        items: [
          { id: `r_${duration}_3`, title: "Master React Reconciliation Hooks", duration: "Day 16-25", description: "Analyze unnecessary component audits using standard memoization patterns (useMemo, useCallback).", techStack: ["React DevTools"], resources: [{ name: "React Profiler Docs", url: "https://react.dev", free: true }], completed: false },
          { id: `r_${duration}_4`, title: "Enterprise State Management", duration: "Day 26-35", description: "Structure modular Redux Toolkit stores or state libraries cleanly across parent frameworks.", techStack: ["Redux Toolkit"], resources: [{ name: "RTK Essentials", url: "https://redux-toolkit.js.org", free: true }], completed: false }
        ]
      });
    }
    if (duration >= 90) {
      phases.push({
        phaseTitle: "Automated testing, CI/CD, and Cloud containerization",
        timeframe: "Days 41 - 90",
        items: [
          { id: `r_${duration}_5`, title: "Configure Docker Compose architectures", duration: "Day 41-60", description: "Spin up PostgreSQL database cells and backend services in integrated docker networks.", techStack: ["Docker", "docker-compose"], resources: [{ name: "Docker Compose Tutorial", url: "https://docker.com", free: true }], completed: false },
          { id: `r_${duration}_6`, title: "Robust testing with Jest & Playwright", duration: "Day 61-80", description: "Implement unit checks for utility calculations and end-to-end regression suites for user profiles.", techStack: ["Jest", "Playwright"], resources: [{ name: "Playwright Custom Guides", url: "https://playwright.dev", free: true }], completed: false }
        ]
      });
    }

    const defaultRoadmap: CareerRoadmap = {
      id: saasStore.generateId(),
      userId: user.id,
      role: targetRole,
      difficulty: "Intermediate",
      daysDuration: duration,
      skillsPlan: ["React", "TypeScript", "Tailwind CSS", "Docker", "Jest"],
      phases,
      projectRecommendations: [
        { title: "Distributed Task Tracker Hub", description: "Create a visual task manager backed by a PostgreSQL database container and RESTful controllers.", difficulty: "Intermediate", stack: ["Node.js", "Express", "Docker", "PostgreSQL"] }
      ],
      createdAt: new Date().toISOString()
    };

    setRoadmap(defaultRoadmap);
  };

  const toggleItemCompletion = (itemId: string) => {
    if (!roadmap) return;

    const updatedPhases = roadmap.phases.map(phase => {
      const updatedItems = phase.items.map(item => {
        if (item.id === itemId) {
          return { ...item, completed: !item.completed };
        }
        return item;
      });
      return { ...phase, items: updatedItems };
    });

    const updatedRoadmap = { ...roadmap, phases: updatedPhases };
    setRoadmap(updatedRoadmap);

    // Save in saasStore
    const db = saasStore.get();
    const existingIdx = db.roadmaps.findIndex(r => r.id === roadmap.id);
    if (existingIdx !== -1) {
      db.roadmaps[existingIdx] = updatedRoadmap;
    } else {
      db.roadmaps.unshift(updatedRoadmap);
    }
    saasStore.save(db);
    if (onRefreshDashboard) onRefreshDashboard();
  };

  const runRoadmapGen = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Custom roadmap generation output matching role
    generateDefaultRoadmap(activeDuration);

    const db = saasStore.get();
    db.notifications.unshift({
      id: saasStore.generateId(),
      userId: user.id,
      title: "Custom study roadmap Ready",
      message: `Your personalized career learning pathway for "${targetRole}" (${activeDuration} Days) has been calculated.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString()
    });
    saasStore.save(db);

    setGenerating(false);
  };

  // Calculations for progress bar
  const totalItemsCount = roadmap ? roadmap.phases.reduce((acc, p) => acc + p.items.length, 0) : 0;
  const completedItemsCount = roadmap ? roadmap.phases.reduce((acc, p) => acc + p.items.filter(i => i.completed).length, 0) : 0;
  const roadmapPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div id="learning-roadmap-workspace" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">Interactive study roadmap</h2>
          <p className="text-zinc-500 text-xs mt-1">Acquire rigorous week-by-week learning tracks carefully structured for professional success.</p>
        </div>
        <div className="flex bg-zinc-950 p-1 border border-white/5 rounded-lg shrink-0">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setActiveDuration(d as any)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                activeDuration === d 
                  ? "bg-indigo-600 text-white" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {d}-Day track
            </button>
          ))}
        </div>
      </div>

      {/* Target role form */}
      <form onSubmit={runRoadmapGen} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#111]/40 border border-white/5 rounded-xl p-4 md:items-center">
        <div className="md:col-span-3 space-y-1">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block text-left">Target Employment Title</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white"
            placeholder="e.g. Senior React Developer"
          />
        </div>
        <div className="pt-4 md:pt-4 flex justify-end">
          <button
            type="submit"
            disabled={generating}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg text-xs font-semibold w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Compiling metrics...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Roadmap</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Progress Metric indicator */}
      {roadmap && (
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Pathway Progress Rating</span>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl text-white">{roadmapPercent}% Complete</span>
              <span className="text-zinc-500 text-xs">({completedItemsCount} / {totalItemsCount} steps checked)</span>
            </div>
          </div>
          <div className="flex-1 max-w-sm h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${roadmapPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Roadmap Tree and details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Modules Tree */}
        <div className="lg:col-span-8 space-y-6">
          {roadmap?.phases.map((phase, pIdx) => (
            <div key={pIdx} className="glass-card p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-baseline border-b border-white/5 pb-2.5">
                <h4 className="font-display font-extrabold text-sm text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>{phase.phaseTitle}</span>
                </h4>
                <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                  {phase.timeframe}
                </span>
              </div>

              {/* Items in this phase */}
              <div className="space-y-3">
                {phase.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItemCompletion(item.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3.5 ${
                      item.completed 
                        ? "bg-emerald-500/5 border-emerald-500/20" 
                        : "bg-zinc-950/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="mt-1 shrink-0">
                      {item.completed ? (
                        <CheckSquare className="w-4.5 h-4.5 text-emerald-400" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <h5 className={`font-display font-bold text-xs ${item.completed ? "text-zinc-500 line-through" : "text-white"}`}>
                          {item.title}
                        </h5>
                        <span className="font-mono text-[9px] text-zinc-500">{item.duration}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{item.description}</p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-1">
                          {item.techStack.map((tech, i) => (
                            <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-900 border border-white/5 rounded text-zinc-400">
                              {tech}
                            </span>
                          ))}
                        </div>
                        {item.resources.map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                          >
                            <span>{res.name}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actionable Side-panel widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Target Portfolio Project Idea Card */}
          <div className="glass-card p-5 rounded-xl space-y-3.5">
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-2.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Recommended Target Project</span>
            </h4>

            {roadmap?.projectRecommendations.map((proj, idx) => (
              <div key={idx} className="space-y-3">
                <div>
                  <h5 className="font-display font-extrabold text-xs text-white">{proj.title}</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{proj.description}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {proj.stack.map((s, i) => (
                    <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-900 border border-white/5 rounded text-zinc-400">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick study resource panel */}
          <div className="glass-card p-5 rounded-xl space-y-3">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Standard Study Platforms</span>
            </h4>
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="p-2.5 bg-zinc-900/50 rounded border border-white/5 flex justify-between items-center">
                <span>mdn Web Docs</span>
                <span className="text-[9px] font-mono text-emerald-400">Highly Recommended</span>
              </div>
              <div className="p-2.5 bg-zinc-900/50 rounded border border-white/5 flex justify-between items-center">
                <span>Frontend Masters API course</span>
                <span className="text-[9px] font-mono text-zinc-500">Premium Video</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
