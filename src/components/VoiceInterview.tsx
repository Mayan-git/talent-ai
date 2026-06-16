/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, VoiceInterviewSession, SpeechSample } from "../types";
import { saasStore } from "../lib/saasStore";
import { 
  Volume2, Mic, MicOff, RefreshCw, Star, Info, Play, Circle, PlayCircle, HelpCircle, 
  Settings, CheckCircle, Award, Speech, Sparkles
} from "lucide-react";

interface VoiceInterviewProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function VoiceInterview({ user, onRefreshDashboard }: VoiceInterviewProps) {
  const [role, setRole] = useState("Frontend Engineer");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [voiceGender, setVoiceGender] = useState<"male" | "female" | "neutral">("female");
  
  const [activeSession, setActiveSession] = useState<VoiceInterviewSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [history, setHistory] = useState<VoiceInterviewSession[]>([]);

  // Simulation parameters
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  // Default Mock Questions
  const MOCK_QUESTIONS = [
    "What are the principal differences between Server-Side Rendering (SSR) and Client-Side Rendering (CSR) performance budgets?",
    "How does Node's single-threaded event loop support thousands of concurrent non-blocking HTTP pipelines?",
    "Can you detail your strategy for preventing Memory leaks on client-side React subscriptions or WebSockets?"
  ];

  useEffect(() => {
    const db = saasStore.get();
    const userSessions = db.voiceSessions.filter(s => s.userId === user.id);
    setHistory(userSessions);
    if (userSessions.length > 0) {
      setActiveSession(userSessions[0]);
    }
  }, [user.id]);

  const startVoiceSession = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newSession: VoiceInterviewSession = {
      id: saasStore.generateId(),
      userId: user.id,
      role,
      difficulty,
      status: "In Progress",
      voiceGender,
      speechSamples: [],
      overallCommunicationScore: 0,
      overallScore: 0,
      createdAt: new Date().toISOString()
    };

    const db = saasStore.get();
    db.voiceSessions.unshift(newSession);
    saasStore.save(db);

    setActiveSession(newSession);
    setActiveQuestionIndex(0);
    setTypedAnswer("");
    setHistory([newSession, ...history]);
    setLoading(false);
  };

  const simulateSpeechSubmission = async () => {
    if (!typedAnswer.trim()) return;
    setTranscribing(true);

    // Simulated Speech analysis timings
    await new Promise(resolve => setTimeout(resolve, 1200));

    const generatedSample: SpeechSample = {
      id: `sample_${Date.now()}`,
      questionText: MOCK_QUESTIONS[activeQuestionIndex] || "Mock interview core parameter query?",
      answerText: typedAnswer.trim(),
      transcriptionConfidence: 0.94,
      fluencyScore: Math.floor(Math.random() * 20) + 76, // 76-96%
      pronunciationFeedback: "Good cadence, clear pauses, standard terminology maps correctly. Try stressing target framework verbs.",
      confidenceScore: Math.floor(Math.random() * 15) + 80 // 80-95%
    };

    if (activeSession) {
      const updatedSamples = [...activeSession.speechSamples, generatedSample];
      
      // Calculate overall grades
      const avgFluency = Math.round(updatedSamples.reduce((acc, s) => acc + s.fluencyScore, 0) / updatedSamples.length);
      const avgConfidence = Math.round(updatedSamples.reduce((acc, s) => acc + s.confidenceScore, 0) / updatedSamples.length);
      const isComplete = updatedSamples.length >= MOCK_QUESTIONS.length;

      const updatedSession: VoiceInterviewSession = {
        ...activeSession,
        speechSamples: updatedSamples,
        overallCommunicationScore: avgFluency,
        overallScore: Math.round((avgFluency + avgConfidence) / 2),
        status: isComplete ? "Completed" : "In Progress"
      };

      setActiveSession(updatedSession);

      // Save to saasStore
      const db = saasStore.get();
      const sIdx = db.voiceSessions.findIndex(s => s.id === activeSession.id);
      if (sIdx !== -1) {
        db.voiceSessions[sIdx] = updatedSession;
      }

      if (isComplete) {
        db.notifications.unshift({
          id: saasStore.generateId(),
          userId: user.id,
          title: "Voice Interview Complete",
          message: `Your speech assessment for "${activeSession.role}" was graded at ${updatedSession.overallScore}%.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });

        // XP gamification addition
        if (!db.gamification[user.id]) {
          db.gamification[user.id] = { level: 1, xp: 0, xpNextLevel: 100, streakDays: 1, achievements: [] };
        }
        db.gamification[user.id].xp += 50;
      }

      saasStore.save(db);
      setHistory(db.voiceSessions.filter(s => s.userId === user.id));
    }

    setTypedAnswer("");
    setActiveQuestionIndex(activeQuestionIndex + 1);
    setTranscribing(false);
    if (onRefreshDashboard) onRefreshDashboard();
  };

  return (
    <div id="voice-mock-interview-panel" className="space-y-6">
      
      {/* Page Title header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5 animate-fade-in">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">AI Voice simulated interview</h2>
          <p className="text-zinc-500 text-xs mt-1">Harness advanced voice parameters, cadence analysis frameworks, and speech assessments.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded">
            Google WaveTTS Simulated Engine
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Launch settings pane */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Configure Audio Session</span>
            </h3>

            <div className="space-y-3.5 text-left">
              <label className="block text-[10px] font-mono uppercase text-zinc-400">Target Role Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                placeholder="e.g. Lead AWS Cloud Consultant"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="Associate">Associate</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Principal">Principal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">AI Gender voice</label>
                  <select
                    value={voiceGender}
                    onChange={(e) => setVoiceGender(e.target.value as any)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="female">Neural Female</option>
                    <option value="male">Neural Male</option>
                    <option value="neutral">Warm Neutral</option>
                  </select>
                </div>
              </div>

              <button
                onClick={startVoiceSession}
                disabled={loading}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Configuring Waves...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Launch Voice Space</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Session history panel */}
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Speech className="w-4 h-4 text-emerald-400" />
              <span>Voice Records Feed</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-[10px] text-zinc-500 text-center py-6">No speech interviews recorded.</p>
              ) : (
                history.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-center ${
                      activeSession?.id === s.id 
                        ? "bg-indigo-500/10 border-indigo-500/30" 
                        : "bg-[#111111]/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs text-zinc-200 truncate">{s.role}</p>
                      <span className="text-[9px] font-mono text-zinc-500">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400">{s.overallScore}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Audio Interaction Space */}
        <div className="lg:col-span-2">
          {activeSession ? (
            <div className="glass-card p-6 rounded-xl space-y-6">
              
              {/* Header inside report active */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-wide uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">Voice Session Live</span>
                    <span className="text-zinc-500 text-[10px] font-mono">{activeSession.voiceGender} narrator</span>
                  </div>
                  <h4 className="font-display font-extrabold text-lg text-white mt-1.5">{activeSession.role} ({activeSession.difficulty})</h4>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-white/5">
                  <div className="text-right">
                    <span className="text-[9px] font-mono uppercase text-zinc-400 block">Overall Cadence Score</span>
                    <span className="font-display font-black text-xl text-emerald-400 mt-0.5 block">{activeSession.overallScore}%</span>
                  </div>
                </div>
              </div>

              {/* Check if all default questions are answered */}
              {activeQuestionIndex < MOCK_QUESTIONS.length ? (
                <div className="space-y-6 text-left">
                  
                  {/* Active Question Box */}
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider">AI Voice Prompter</span>
                    </div>
                    <p className="text-xs text-zinc-100 font-semibold leading-relaxed">
                      "{MOCK_QUESTIONS[activeQuestionIndex]}"
                    </p>
                  </div>

                  {/* Graphical waves block */}
                  <div className="h-20 bg-[#111]/40 border border-white/5 rounded-xl p-4 flex items-center justify-center gap-1.5 overflow-hidden">
                    {[...Array(24)].map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1 rounded-full bg-indigo-500/60 transition-all ${
                          micActive ? "animate-pulse" : "h-1"
                        }`}
                        style={{
                          height: micActive ? `${Math.floor(Math.random() * 45) + 10}px` : "10px",
                          animationDelay: `${idx * 0.1}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Mic activation controls */}
                  <div className="flex justify-between items-center bg-[#111]/40 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setMicActive(!micActive)}
                        className={`p-3 rounded-full transition-all cursor-pointer ${
                          micActive ? "bg-red-500 text-white animate-pulse" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </button>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Mic Input</span>
                        <span className="text-xs font-semibold text-zinc-200">
                          {micActive ? "Mic Live. Actively listening to speech cadence patterns..." : "Mic paused. Tap to record speech."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard transcript options */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Answer input workspace (Simulate Transcription)</label>
                    <textarea
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      rows={3}
                      className="w-full bg-[#111] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500/50 outline-none resize-none font-sans"
                      placeholder="Type your response here or double click the mic button to capture text simulation streams directly..."
                    />
                  </div>

                  <button
                    onClick={simulateSpeechSubmission}
                    disabled={transcribing || !typedAnswer.trim()}
                    className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ml-auto justify-center"
                  >
                    {transcribing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating vocal delivery...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Submit response</span>
                      </>
                    )}
                  </button>

                </div>
              ) : (
                /* Completed Session overview page */
                <div className="space-y-6 text-left">
                  <div className="glass-card p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-display font-black text-sm text-white">Waves session completed!</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Outstanding oral interview metrics accomplished. Below are target assessments computed across speech samples.
                    </p>
                  </div>

                  {/* Speech Samples detail list */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">Speech Samples list</h5>
                    
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {activeSession.speechSamples.map((sample, idx) => (
                        <div key={sample.id} className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-3">
                          <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 font-mono text-[9px] rounded">Question #{idx + 1}</span>
                          <span className="float-right text-xs font-mono text-emerald-400 font-bold">{sample.confidenceScore}% Fluency</span>
                          
                          <p className="text-xs font-bold text-white mt-1">"{sample.questionText}"</p>
                          <div className="p-2 bg-zinc-900 rounded font-sans text-xs text-zinc-400">
                            "{sample.answerText}"
                          </div>
                          
                          <div className="pt-2 border-t border-white/5 flex gap-1.5 items-start">
                            <Sparkles className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">{sample.pronunciationFeedback}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl text-center space-y-3">
              <Mic className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-zinc-400 font-semibold text-sm">No Active Voice Space started</p>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">Input targeted credentials configurations on the left sidebar to generate speech questions.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
