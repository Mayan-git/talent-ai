/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, CareerCoachProfile } from "../types";
import { saasStore, COACHING_PRESETS } from "../lib/saasStore";
import { 
  Sparkles, ListCheck, Compass, TrendingUp, Award, RefreshCw, Star, Trophy, Target, CheckCircle, Plus
} from "lucide-react";

interface CareerCoachProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function CareerCoach({ user, onRefreshDashboard }: CareerCoachProps) {
  const [profile, setProfile] = useState<CareerCoachProfile | null>(null);
  const [goals, setGoals] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [newGoalText, setNewGoalText] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const db = saasStore.get();
    let coachProf = db.careerCoachProfiles.find(p => p.userId === user.id);

    if (!coachProf) {
      // Create lazy default career profile
      coachProf = {
        id: saasStore.generateId(),
        userId: user.id,
        weeklyGoals: [
          { id: "g1", text: "Revise React hydration structures and SSG paradigms", completed: false },
          { id: "g2", text: "Complete an ATS compat check with score >= 80%", completed: false },
          { id: "g3", text: "Run 1 simulated mockup practice of Frontend questions", completed: false }
        ],
        industryTrends: COACHING_PRESETS.trends,
        recommendedCertifications: COACHING_PRESETS.certs,
        aiAdvisorNotes: "Your current profile showcases solid core frontend logic but lacks production deployment metrics. We strongly suggest prioritizing Kubernetes docker workflows and Cloud architectures this week.",
        progressScore: 35,
        updatedAt: new Date().toISOString()
      };

      db.careerCoachProfiles.push(coachProf);
      saasStore.save(db);
    }

    setProfile(coachProf);
    setGoals(coachProf.weeklyGoals);
  }, [user.id]);

  const toggleGoal = (id: string) => {
    const updatedGoals = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    setGoals(updatedGoals);

    // Calculate progress rating
    const completedCount = updatedGoals.filter(g => g.completed).length;
    const progress = Math.round((completedCount / updatedGoals.length) * 100);

    const db = saasStore.get();
    const profIdx = db.careerCoachProfiles.findIndex(p => p.userId === user.id);
    if (profIdx !== -1) {
      db.careerCoachProfiles[profIdx].weeklyGoals = updatedGoals;
      db.careerCoachProfiles[profIdx].progressScore = progress;
      db.careerCoachProfiles[profIdx].updatedAt = new Date().toISOString();
      saasStore.save(db);
      if (profile) {
        setProfile({ ...profile, weeklyGoals: updatedGoals, progressScore: progress });
      }
    }
    if (onRefreshDashboard) onRefreshDashboard();
  };

  const addNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const newGoal = {
      id: `g_${Date.now()}`,
      text: newGoalText.trim(),
      completed: false
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    setNewGoalText("");

    const progress = Math.round((updatedGoals.filter(g => g.completed).length / updatedGoals.length) * 100);

    const db = saasStore.get();
    const profIdx = db.careerCoachProfiles.findIndex(p => p.userId === user.id);
    if (profIdx !== -1) {
      db.careerCoachProfiles[profIdx].weeklyGoals = updatedGoals;
      db.careerCoachProfiles[profIdx].progressScore = progress;
      saasStore.save(db);
      if (profile) {
        setProfile({ ...profile, weeklyGoals: updatedGoals, progressScore: progress });
      }
    }
  };

  const regenerateAdvice = async () => {
    setUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const adviceVault = [
      "Excellent work! Optimize database query index maps to address typical N+1 slow API cycles next.",
      "Consider designing 3 clean portfolio microservices using Docker Compose, showcasing multi-container environments.",
      "Highlight secure stateless token setups inside your main CV highlights, and list performance profiling statistics explicitly."
    ];

    const randomAdvice = adviceVault[Math.floor(Math.random() * adviceVault.length)];

    const db = saasStore.get();
    const profIdx = db.careerCoachProfiles.findIndex(p => p.userId === user.id);
    if (profIdx !== -1) {
      db.careerCoachProfiles[profIdx].aiAdvisorNotes = randomAdvice;
      db.careerCoachProfiles[profIdx].updatedAt = new Date().toISOString();
      
      db.notifications.unshift({
        id: saasStore.generateId(),
        userId: user.id,
        title: "Career Advice Refreshed",
        message: "Your AI Career Coach advisor has generated a custom skill upgrade roadmap.",
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      saasStore.save(db);
      if (profile) {
        setProfile({ ...profile, aiAdvisorNotes: randomAdvice });
      }
    }
    setUpdating(false);
  };

  return (
    <div id="career-coach-workspace" className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">AI career Coach advisor</h2>
          <p className="text-zinc-500 text-xs mt-1">Acquire precision intelligence on weekly milestones, trending technology sectors, and credential roadmaps.</p>
        </div>
        <div>
          <button
            onClick={regenerateAdvice}
            disabled={updating}
            className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Refresh Custom Advice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Goals Checklist */}
        <div className="lg:col-span-1 space-y-6 text-left">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Weekly Development Goals</span>
            </h3>

            {/* Goals Metric progress */}
            <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Goals Complete</span>
                <span className="block font-display font-extrabold text-lg text-white mt-0.5">
                  {goals.filter(g => g.completed).length} of {goals.length}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Progress</span>
                <span className="block font-display font-black text-lg text-indigo-400 mt-0.5">
                  {profile?.progressScore || 0}%
                </span>
              </div>
            </div>

            {/* List of goals */}
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto pr-1">
              {goals.map(goal => (
                <div
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center gap-3 transition-all ${
                    goal.completed 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-zinc-400 line-through" 
                      : "bg-[#111]/60 border-white/5 hover:border-white/10 text-zinc-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => {}}
                    className="rounded border-white/10 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>{goal.text}</span>
                </div>
              ))}
            </div>

            {/* Form to append new milestone */}
            <form onSubmit={addNewGoal} className="flex gap-1.5 mt-2 pt-3 border-t border-white/5">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Custom goal e.g. Master Flexbox layouts..."
                className="flex-1 bg-[#111] border border-white/10 text-xs rounded-lg p-2 text-white outline-none"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Coach Recommendations & Industry Trends */}
        <div className="lg:col-span-2 space-y-6 text-left">
          
          {/* AI Advisor Card */}
          <div className="bg-gradient-to-br from-indigo-950/20 to-violet-950/20 border border-indigo-500/20 p-5 rounded-xl space-y-3">
            <h4 className="font-display font-black text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Personalized Coach Guidance notes</span>
            </h4>
            <p className="text-zinc-350 text-xs leading-relaxed">
              {profile?.aiAdvisorNotes || "Loading advice metrics details..."}
            </p>
          </div>

          {/* Industry trend analysis */}
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Urgent Tech Sector demand trends</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile?.industryTrends.map((trend, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-zinc-900/50 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                        {trend.demand}
                      </span>
                    </div>
                    <h5 className="font-display font-extrabold text-xs text-white mt-2.5">{trend.skill}</h5>
                    <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">{trend.trendDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications recommendations */}
          <div className="glass-card p-5 rounded-xl space-y-3">
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2 pb-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Recommended Target Credentials</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {profile?.recommendedCertifications.map((cert, idx) => (
                <div key={idx} className="p-3 bg-[#111111] border border-white/5 rounded-lg text-xs font-semibold text-zinc-350 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
