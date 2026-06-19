/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Mic, MicOff, MessageSquare, Play, Sparkles, Award, ArrowRight, CheckCircle2, ChevronRight, RefreshCw, AlertCircle, Headphones, Volume2, HelpCircle, Download, FileText
} from "lucide-react";
import { User, InterviewQuestion, UserAnswer, InterviewSession, InterviewStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface InterviewViewProps {
  user: User;
  onRefreshDashboard?: () => void;
}

export default function InterviewView({ user, onRefreshDashboard }: InterviewViewProps) {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  
  // Creation parameters
  const [selectedRole, setSelectedRole] = useState("Full-Stack Developer");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Expert">("Medium");
  
  // Simulator wizard state
  const [answersText, setAnswersText] = useState<{ [key: string]: string }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Status variables
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableRoles = [
    "Full-Stack Developer",
    "Frontend Engineer",
    "Backend Architect",
    "Product Manager",
    "Data Scientist",
    "Mobile App Developer",
    "DevOps Administrator"
  ];

  useEffect(() => {
    let active = true;
    async function loadInterviewHistory() {
      try {
        const response = await fetch(`/api/interview/history/${user.id}`);
        if (!response.ok) throw new Error("History fetch error");
        const data = await response.json();
        if (active) {
          setSessions(data.sessions || []);
          if (data.sessions && data.sessions.length > 0 && !currentSession) {
            // Pick latest completed or active
            setCurrentSession(data.sessions[0]);
          }
        }
      } catch (err) {
        console.error("Failed to read interviews history records:", err);
      }
    }
    loadInterviewHistory();
    return () => { active = false; };
  }, [user.id]);

  // Handle simulated Recording waveform pulse
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingProgress((p) => {
          if (p >= 100) {
            setIsRecording(false);
            // Inject text simulation to help user test
            const activeQ = currentSession?.questions[currentSession.currentQuestionIndex];
            if (activeQ) {
              setAnswersText((prev) => ({
                ...prev,
                [activeQ.id]: "In my experience, we utilize structured CI/CD pipelines to manage code promotion. I make sure testing covers unit boundaries and integrations before running Kubernetes orchestrations to guarantee service resilience and minimize latency. We also set up dashboards to track latency metrics."
              }));
            }
            return 0;
          }
          return p + 4;
        });
      } , 200);
    }
    return () => clearInterval(interval);
  }, [isRecording, currentSession, currentSession?.currentQuestionIndex]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingProgress(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Simulate speech transcription text
    const activeQ = currentSession?.questions[currentSession?.currentQuestionIndex || 0];
    if (activeQ) {
      setAnswersText((prev) => ({
        ...prev,
        [activeQ.id]: "Regarding this situation, I consistently prioritize architectural readability. I isolate dependencies at interface boundaries and create rigorous automated testing suites. To manage telemetry during load, we deploy container auto-scaling and setup load balancer routes."
      }));
    }
  };

  const handleCreateSession = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/interview/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role: selectedRole,
          difficulty: selectedDifficulty,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to instantiate interview questions.");
      }

      if (data.session) {
        // Force state setting client side
        const activeSess = {
          ...data.session,
          status: InterviewStatus.ONGOING,
          currentQuestionIndex: 0
        };
        setSessions((prev) => [activeSess, ...prev]);
        setCurrentSession(activeSess);
        setAnswersText({});
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected system setup error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Nav wizard steps inside active ongoing interview
  const handleNextQuestion = () => {
    if (!currentSession) return;
    const currentQ = currentSession.questions[currentSession.currentQuestionIndex];
    const userAns = answersText[currentQ.id] || "";
    if (!userAns.trim() || userAns.trim().length < 20) {
      setErrorMsg("Please type a realistic interview answer (at least 20 characters) to continue.");
      return;
    }
    setErrorMsg(null);

    setCurrentSession({
      ...currentSession,
      currentQuestionIndex: currentSession.currentQuestionIndex + 1,
    });
  };

  const handleSubmitInterview = async () => {
    if (!currentSession) return;
    const currentQ = currentSession.questions[currentSession.currentQuestionIndex];
    const userAns = answersText[currentQ.id] || "";
    if (!userAns.trim() || userAns.trim().length < 20) {
      setErrorMsg("Please type a realistic interview answer (at least 20 characters) to submit.");
      return;
    }
    setErrorMsg(null);
    setEvaluating(true);

    // Format payload for grading
    const userResponses = currentSession.questions.map((q) => ({
      questionId: q.id,
      answerText: answersText[q.id] || "No response provided.",
    }));

    try {
      const response = await fetch("/api/interview/submit-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.id,
          userResponses,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Evaluator calculations failed.");
      }

      if (data.session) {
        setSessions((prev) => prev.map((s) => s.id === data.session.id ? data.session : s));
        setCurrentSession(data.session);
        if (onRefreshDashboard) onRefreshDashboard();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong during grading. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">AI Interview Simulator</h1>
          <p className="text-xs text-slate-400 mt-1">Simulate expert board calibrations, check voice timing, and capture structured metrics.</p>
        </div>
        
        {currentSession && currentSession.status === InterviewStatus.COMPLETED && (
          <button 
            type="button"
            onClick={() => setCurrentSession(null)}
            className="px-4.5 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-display font-semibold text-xs tracking-wide text-white transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Launch New Prep</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left pane: History list selection */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-4 rounded-xl">
            <h3 className="font-display font-bold text-xs text-slate-400 tracking-wider uppercase mb-3">Prep History</h3>
            
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {sessions.length > 0 ? (
                sessions.map((item) => {
                  const IsActive = currentSession?.id === item.id;
                  const completed = item.status === InterviewStatus.COMPLETED;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setCurrentSession(item); }}
                      className={`
                        w-full p-3 rounded-lg text-left border flex items-start gap-2.5 transition-all cursor-pointer
                        ${IsActive 
                          ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-100" 
                          : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                        }
                      `}
                    >
                      <Mic className="w-4 h-4 mt-0.5 text-violet-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-xs truncate leading-snug">{item.role}</p>
                        <span className="text-[9px] font-mono text-slate-500 block mt-1">
                          {completed ? `Grade: ${item.overallScore}%` : "In Progress"}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0 self-center" />
                    </button>
                  );
                })
              ) : (
                <p className="text-[11px] font-mono text-slate-500 py-4 text-center">No simulation practice runs completed yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Core wizard layout */}
        <div className="lg:col-span-9 animate-fade-in">
          
          <AnimatePresence mode="wait">
            {/* SETUP SCREEN */}
            {currentSession === null ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-card rounded-2xl p-6 space-y-6 text-left"
              >
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Configure Interactive Interview</h2>
                  <p className="text-xs text-slate-400 mt-1">Deploy automated AI models to generate challenging technical, structural, and behavioral situational questions targeted to your target role.</p>
                </div>

                {errorMsg && (
                  <div className="text-xs font-mono text-center text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
                    <div className="text-center">
                      <p className="font-display font-bold text-[13px] text-white animate-pulse">Running interview setup models...</p>
                      <p className="text-xs text-slate-500 mt-1">Formulating behavioral contexts, verifying expert-level keywords, and deploying question boards.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      
                      {/* Select Role */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Designated Job Role</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer block"
                        >
                          {availableRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>

                      {/* Select Difficulty */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Board Calibration level</label>
                        <div className="grid grid-cols-4 gap-2 h-11 bg-slate-900/60 p-1 rounded-lg border border-white/5">
                          {["Easy", "Medium", "Hard", "Expert"].map((diff) => {
                            const IsActive = selectedDifficulty === diff;
                            return (
                              <button
                                key={diff}
                                type="button"
                                onClick={() => setSelectedDifficulty(diff as any)}
                                className={`
                                  rounded text-[11px] font-display font-semibold transition-all cursor-pointer
                                  ${IsActive 
                                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                                  }
                                `}
                              >
                                {diff}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Pre-flight reminders */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex gap-3 text-sm text-slate-400 leading-relaxed">
                      <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div className="space-y-1">
                        <span className="font-display font-semibold text-xs text-slate-200 block">About Simulator Guidelines</span>
                        <p className="text-xs">You will be presented with 5 structured, tricky questions. Grade targets are rigorously compiled utilizing executive checklists. Practice typing or use our voice waveform simulator to draft your answers.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateSession}
                      className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-display font-medium text-xs text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Configure Practice Board</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ) : currentSession.status === InterviewStatus.ONGOING ? (
              // ACTIVE WIZARD SESSION
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="active-interview-wizard"
                className="glass-card rounded-2xl p-6 space-y-6 text-left relative"
              >
                {/* Progress metadata */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase">Ongoing Simulation</span>
                    <h3 className="font-display font-bold text-sm text-white">{currentSession.role} • Level: {currentSession.difficulty}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-600/10 px-2.5 py-1 rounded">
                    Q {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
                  </span>
                </div>

                {errorMsg && (
                  <div className="text-xs font-mono text-center text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Question panel */}
                {(() => {
                  const activeQ = currentSession.questions[currentSession.currentQuestionIndex];
                  if (!activeQ) return null;
                  const isLast = currentSession.currentQuestionIndex === currentSession.questions.length - 1;
                  return (
                    <div className="space-y-6" key={activeQ.id}>
                      
                      {/* Floating prompt card */}
                      <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-violet-400 font-display font-bold text-xs uppercase tracking-wider">
                          <MessageSquare className="w-4 h-4" />
                          <span>Active Question Context</span>
                        </div>
                        <h4 className="font-display font-semibold text-sm text-slate-100 leading-relaxed">
                          {activeQ.question}
                        </h4>
                        <p className="text-xs text-slate-500 italic">
                          <span className="font-bold">Interviewer Tip:</span> {activeQ.context}
                        </p>
                      </div>

                      {/* Waveform simulator area */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/40 p-4 border border-dashed border-slate-800 rounded-xl">
                        <div className="flex items-center gap-2 shrink-0">
                          {isRecording ? (
                            <button
                              type="button"
                              onClick={handleStopRecording}
                              className="w-10 h-10 rounded-full bg-rose-600/25 border border-rose-500/40 text-rose-400 flex items-center justify-center animate-pulse cursor-pointer"
                            >
                              <MicOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleStartRecording}
                              className="w-10 h-10 rounded-full bg-indigo-600/25 border border-indigo-500/40 text-indigo-400 flex items-center justify-center cursor-pointer"
                            >
                              <Mic className="w-4 h-4" />
                            </button>
                          )}
                          <div className="text-left font-mono text-[10px]">
                            <span className="text-slate-300 block font-bold uppercase">{isRecording ? "Transcribing Audio" : "Simulate recording voice"}</span>
                            <span className="text-slate-500">{isRecording ? "Click to synthesize speech text Draft" : "Convert voice waveforms to draft template"}</span>
                          </div>
                        </div>

                        {/* Pulsing Flex Waveform visualization bars */}
                        {isRecording && (
                          <div className="flex-1 flex justify-center sm:justify-start items-center gap-1.5 h-8">
                            {[11, 4, 15, 6, 12, 5, 14, 8, 11, 5, 16, 7, 10, 4, 12, 6].map((h, i) => (
                              <div 
                                key={i} 
                                className="w-1 bg-indigo-500 rounded-full transition-all"
                                style={{ 
                                  height: `${h * 1.5}px`,
                                  animation: `pulse-soft 0.8s ${i * 0.05}s infinite ease-in-out`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Text typing component */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Your Draft Response Response</label>
                        <textarea
                          placeholder="Type or simulate speech translation copy of your answer details here (at least 20 characters)..."
                          value={answersText[activeQ.id] || ""}
                          onChange={(e) => setAnswersText({ ...answersText, [activeQ.id]: e.target.value })}
                          className="w-full h-36 p-3.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-sans resize-none"
                        />
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                          <span>Target Key indicators: {activeQ.idealKeywords?.slice(0, 3).join(", ")}</span>
                          <span>{answersText[activeQ.id]?.length || 0} characters</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-xs text-slate-500">Pressing Save stores your draft locally.</span>
                        {isLast ? (
                          <button
                            type="button"
                            onClick={handleSubmitInterview}
                            className="px-5 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-display font-semibold text-xs text-white transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Complete & Submit Board</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="px-5 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-display font-semibold text-xs text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Save & Next Question</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })()}

              </motion.div>
            ) : evaluating ? (
              // EVALUATING INTERVIEW LOADER SCREEN
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="evaluating-loader"
                className="glass-card rounded-2xl p-16 text-center space-y-6"
              >
                <div className="w-12 h-12 border-t-2 border-indigo-500 border-r-2 border-violet-500 rounded-full animate-spin mx-auto" />
                <div>
                  <h3 className="font-display font-extrabold text-white text-base animate-pulse">Running Candidate AI Calibration...</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                    Analyzing technical vocabularies, checking question context variables, checking compliance percentages, and compiling answer suggestions.
                  </p>
                </div>
              </motion.div>
            ) : (
              // EVALUATIONS CARD AND DETAILED BREAKDOWNS (Completed status)
              currentSession.status === InterviewStatus.COMPLETED && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key="interview-results-panel"
                  className="space-y-6 text-left"
                >
                  
                  {/* Gauge header panel */}
                  <div className="glass-card rounded-2xl p-6 grid md:grid-cols-4 gap-6 items-center">
                    
                    <div className="md:col-span-1 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
                      {/* Gauge */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="44" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                          <circle 
                            cx="56" 
                            cy="56" 
                            r="44" 
                            stroke={currentSession.overallScore >= 80 ? "#10b981" : currentSession.overallScore >= 60 ? "#f59e0b" : "#f43f5e"} 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={276}
                            strokeDashoffset={276 - (276 * currentSession.overallScore) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="font-display font-extrabold text-2xl text-white">{currentSession.overallScore}%</span>
                          <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest leading-none mt-1">Average Grade</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-violet-500/10 border border-violet-400/20 text-violet-300 font-mono text-[9px] mb-2 uppercase">
                        <Award className="w-3.5 h-3.5" />
                        <span>AI RECRUITER VERDICT</span>
                      </div>
                      <h2 className="font-display font-bold text-xl text-white truncate">{currentSession.role} Practice Board</h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {currentSession.overallFeedback}
                      </p>
                    </div>

                  </div>

                  {/* Individual answer-by-answer breakdown list */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-sm text-white">Answer Breakdown Cards</h3>
                    
                    {currentSession.answers && currentSession.answers.length > 0 ? (
                      currentSession.answers.map((ans, idx) => {
                        const originalQ = currentSession.questions.find((q) => q.id === ans.questionId);
                        return (
                          <div key={idx} className="glass-card p-5 rounded-2xl space-y-4 text-left">
                            <div className="flex flex-wrap justify-between items-start gap-2 border-b border-white/5 pb-3">
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Question {idx + 1}</span>
                                <h4 className="font-display font-bold text-xs text-slate-100 truncate mt-0.5">{originalQ?.question || "Structured scenario challenge"}</h4>
                              </div>
                              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                ans.score >= 80 ? "bg-emerald-500/10 text-emerald-400" : ans.score >= 65 ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400"
                              }`}>
                                Grade: {ans.score}%
                              </span>
                            </div>

                            {/* User details */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
                                <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase block">Your Response</span>
                                <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                                  "{ans.answerText}"
                                </p>
                              </div>

                              <div className="space-y-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
                                <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider uppercase block">AI critique & tips</span>
                                <p className="text-xs text-indigo-200 font-sans leading-relaxed mt-1">
                                  {ans.feedback}
                                </p>
                                <p className="text-xs text-emerald-300 font-sans leading-relaxed mt-2.5">
                                  <span className="font-bold block text-[10px] uppercase font-mono text-emerald-400">Verbal improvement guidelines:</span>
                                  {ans.suggestions}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 font-mono py-4 text-center">No graded answer cards could be parsed.</p>
                    )}
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
