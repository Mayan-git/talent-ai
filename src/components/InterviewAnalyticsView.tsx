/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, InterviewAnalytics, TopicScore } from "../types";
import { saasStore } from "../lib/saasStore";
import { clientStore } from "../lib/clientDb";
import { 
  Plus, TrendingUp, Sparkles, Award, AlertTriangle, CheckSquare, RefreshCw, Layers, Library
} from "lucide-react";

interface InterviewAnalyticsProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function InterviewAnalyticsView({ user, onRefreshDashboard }: InterviewAnalyticsProps) {
  const [analytics, setAnalytics] = useState<InterviewAnalytics | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [user.id]);

  const loadAnalytics = () => {
    const db = saasStore.get();
    let stats = db.interviewAnalytics.find(a => a.userId === user.id);

    if (!stats) {
      // Lazy default analytics bootstrapper
      const categories: TopicScore[] = [
        { topic: "React Hooks & hydration", score: 85 },
        { topic: "Database Index Tuning", score: 62 },
        { topic: "Node Async pipelines", score: 78 },
        { topic: "CI/CD container environments", score: 55 }
      ];

      stats = {
        id: saasStore.generateId(),
        userId: user.id,
        categoryPerformance: categories,
        technicalScore: 76,
        communicationScore: 82,
        readinessScore: 70,
        weakAreas: ["Database systems optimization", "Docker deployment pipelines"],
        strongAreas: ["React architectural rendering", "Async event models"],
        historicalMetrics: [
          { date: "May 10", score: 68, communication: 75, fluency: 70 },
          { date: "May 20", score: 72, communication: 79, fluency: 78 },
          { date: "Jun 02", score: 76, communication: 82, fluency: 80 }
        ],
        aiImprovementPrompt: "Your semantic reasoning during the React optimization queries was highly compelling. However, your database execution explanations lacked detailed descriptions of isolation layers. Study Transaction models safely this week.",
        updatedAt: new Date().toISOString()
      };

      db.interviewAnalytics.push(stats);
      saasStore.save(db);
    }

    setAnalytics(stats);
  };

  const runAnalysisRegression = async () => {
    setUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Pull from clientStore mock interviews to compute real dynamic metrics if desired
    const mainDb = clientStore.get();
    const userCompletedInterviews = mainDb.interviews.filter(i => i.userId === user.id && i.overallScore > 0);

    if (userCompletedInterviews.length > 0) {
      const db = saasStore.get();
      const targetIdx = db.interviewAnalytics.findIndex(a => a.userId === user.id);
      
      const avgTech = Math.round(userCompletedInterviews.reduce((acc, i) => acc + i.overallScore, 0) / userCompletedInterviews.length);
      const isUp = avgTech > 70;

      if (targetIdx !== -1) {
        db.interviewAnalytics[targetIdx].technicalScore = avgTech;
        db.interviewAnalytics[targetIdx].readinessScore = Math.min(avgTech + 5, 95);
        db.interviewAnalytics[targetIdx].updatedAt = new Date().toISOString();
        saasStore.save(db);
      }
    }

    loadAnalytics();
    setUpdating(false);
  };

  return (
    <div id="analytics-overview-dashboard" className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">Interview analytics</h2>
          <p className="text-zinc-500 text-xs mt-1">Extract exhaustive diagnostics, communication scores, readiness charts, and strong/weak topics lists.</p>
        </div>
        <div>
          <button
            onClick={runAnalysisRegression}
            disabled={updating}
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            <span>Recalculate Metrics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        
        {/* Metric score blocks */}
        <div className="p-5 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Avg Technical Score</span>
          <div className="flex justify-between items-center">
            <span className="font-display font-black text-3xl text-white">{analytics?.technicalScore || 0}%</span>
            <span className="text-emerald-400 text-xs font-mono">+4% trend</span>
          </div>
        </div>

        <div className="p-5 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Communication Fluency</span>
          <div className="flex justify-between items-center">
            <span className="font-display font-black text-3xl text-indigo-400">{analytics?.communicationScore || 0}%</span>
            <span className="text-emerald-400 text-xs font-mono">Stable</span>
          </div>
        </div>

        <div className="p-5 bg-[#141414] border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Job readiness index</span>
          <div className="flex justify-between items-center">
            <span className="font-display font-black text-3xl text-teal-400">{analytics?.readinessScore || 0}%</span>
            <span className="text-xs text-zinc-400 font-mono">Moderate</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Category performances */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Library className="w-4 h-4 text-indigo-400" />
              <span>Skill Category Performance breakdown</span>
            </h3>

            {/* Bars list */}
            <div className="space-y-4 pt-1">
              {analytics?.categoryPerformance.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-zinc-350">
                    <span>{item.topic}</span>
                    <span className="font-mono text-indigo-400">{item.score}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        item.score >= 80 ? "bg-emerald-500" : item.score >= 70 ? "bg-indigo-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Historical trend charts */}
          <div className="glass-card p-5 rounded-xl space-y-3">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">Historical Assessment trend</h4>
            <div className="h-24 flex items-end justify-between gap-4 pt-4 border-b border-white/5 pb-2">
              {analytics?.historicalMetrics.map((met, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-indigo-600/30 border border-indigo-500/40 rounded-t-md transition-all duration-1000 flex items-center justify-center text-[10px] font-mono text-white"
                    style={{ height: `${met.score}%` }}
                  >
                    {met.score}%
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">{met.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right side: Strong/Weak vectors */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Diagnostic Vectors</span>
            </h4>

            {/* Strong competencies */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-emerald-400">High Authority Strengths</span>
              {analytics?.strongAreas.map((skill, idx) => (
                <div key={idx} className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>

            {/* Weak Areas */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono uppercase text-[#e9a93c]">Primary Gaps Identified</span>
              {analytics?.weakAreas.map((skill, idx) => (
                <div key={idx} className="p-2.5 bg-[#e9a93c]/5 border border-[#e9a93c]/10 rounded-lg text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
