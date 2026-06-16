/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Mail, Lock, User as UserIcon, Sparkles, Award, ArrowRight, BookOpen, UserCheck, 
  RefreshCw, TrendingUp, CheckCircle, MessageSquare, Plus, Star, Volume2, PieChart, 
  HelpCircle, Send, Zap, Check, Map, Search, FileText, ChevronDown, CheckSquare, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface LandingPageProps {
  onLoginSuccess: (user: User) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Landing Page Interactive States
  const [activeDemoTab, setActiveDemoTab] = useState<"ats" | "voice" | "coach">("ats");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isContactLoading, setIsContactLoading] = useState(false);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `candidate_demo_${Math.floor(Math.random() * 10000)}@hirewise.ai`,
          password: "demo-secure-password",
          name: "Alex Mercer",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // If already exists or random fallback
        const fallbackRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "alex.mercer@mock.com",
            password: "demo-secure-password",
          }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.user) {
          onLoginSuccess(fallbackData.user);
          return;
        }
        throw new Error(data.error || "Failed to launch quick account.");
      }

      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPrefillLogin = () => {
    setEmail("admin@hirewise.ai");
    setPassword("admin-master-password");
    setIsLogin(true);
    setIsForgot(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const endpoint = isForgot 
      ? "/api/auth/forgot-password" 
      : isLogin 
        ? "/api/auth/login" 
        : "/api/auth/signup";

    const payload = isForgot 
      ? { email } 
      : isLogin 
        ? { email, password } 
        : { email, password, name };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not complete the safety auth request.");
      }

      if (isForgot) {
        setInfoMsg("A secure recovery token link has been generated to your clipboard emulation.");
        setIsForgot(false);
        setIsLogin(true);
      } else if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication mismatch. Please review credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setTimeout(() => {
      setNewsletterEmail("");
    }, 2000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactMessage) return;
    setIsContactLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setContactSuccess(true);
    setIsContactLoading(false);
    setContactName("");
    setContactEmail("");
    setContactMessage("");
    setTimeout(() => setContactSuccess(false), 4000);
  };

  // Static stats
  const stats = [
    { value: "98.4%", label: "ATS Optimization Index", icon: ShieldCheck, color: "text-emerald-400" },
    { value: "482,000+", label: "Verified Mock Audits", icon: Volume2, color: "text-indigo-400" },
    { value: "3.2x Boost", label: "Average Call-back Rate", icon: TrendingUp, color: "text-teal-400" },
    { value: "4.9 / 5.0", label: "Global Professional Score", icon: Star, color: "text-amber-400" }
  ];

  // Bento Features list
  const features = [
    {
      title: "ATS Resume Checker",
      desc: "Robust deep parser that computes your resume formatting, keyword matching density, and provides bulletproof missing keyword corrections.",
      icon: Search,
      tag: "ATS Core",
      color: "border-indigo-500/20 text-indigo-400"
    },
    {
      title: "AI Resume Builder",
      desc: "Generate stunning LaTeX or Swiss-modern professional resume layouts dynamically. Includes custom live templates with real-time editing previews.",
      icon: FileText,
      tag: "Builder",
      color: "border-violet-500/20 text-violet-400"
    },
    {
      title: "AI Career Coach",
      desc: "Instant career trajectory advisory with custom weekly growth objectives, skill gaps analysis maps, and target employer expectations alignment.",
      icon: Zap,
      tag: "Mentorship",
      color: "border-emerald-500/20 text-emerald-400"
    },
    {
      title: "Skill Gap Analyzer",
      desc: "Paste any target Job Description and map standard semantic gaps instantly from your scanned resume. Highlights necessary missing keywords.",
      icon: PieChart,
      tag: "Analytics",
      color: "border-amber-500/20 text-amber-400"
    },
    {
      title: "Learning Roadmaps",
      desc: "Personalized curated learning tracks configured for tight milestones: 30-day quick ramp ups, 60-day deep dives, and 90-day comprehensive system mastery.",
      icon: BookOpen,
      tag: "Roadmaps",
      color: "border-teal-400/20 text-teal-400"
    },
    {
      title: "Voice Mock Interviews",
      desc: "Participate in real-time interactive simulated verbal interviews. Evaluates communication scores, grammatical flow, and provides audio tone guides.",
      icon: Volume2,
      tag: "Voice Simulator",
      color: "border-pink-500/20 text-pink-400"
    },
    {
      title: "Interview Analytics",
      desc: "Extract detailed topic-wise metrics, communication fluency tracking, score delta vectors, and historic progress performance indicators.",
      icon: TrendingUp,
      tag: "Metrics",
      color: "border-sky-500/20 text-sky-450"
    },
    {
      title: "AI Chat Assistant",
      desc: "Equipped with specialized 24/7 agents to answer immediate technical interview blocks, resume revision feedback, and salary negotiation tactics.",
      icon: MessageSquare,
      tag: "Assistant",
      color: "border-fuchsia-500/20 text-fuchsia-400"
    }
  ];

  // Testimonials
  const testimonials = [
    {
      quote: "HireWise AI completely rebuilt my portfolio projects and helped me identify massive gaps in my ATS key concepts. Within 3 weeks of grading, I accepted a Principal Engineer role at Netflix.",
      name: "Marcus Aurelius Chen",
      role: "Lead Platform Engineer",
      company: "Netflix",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    {
      quote: "The interactive voice interviews felt incredibly realistic. The pronunciation and confidence analysis gave me concrete vectors to fix. My salary bump went up 45%.",
      name: "Sarah Lindqvist",
      role: "Senior Product Architect",
      company: "Google Cloud",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    {
      quote: "ATS check scores allowed me to customize my React / Node.js descriptions safely. I passed standard automated screeners with three major companies instantly.",
      name: "Devon McKinney",
      role: "Frontend Engineer",
      company: "Stripe",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
    }
  ];

  // FAQs
  const faqs = [
    {
      q: "How does the ATS Resume Checker compute my score?",
      a: "Our algorithm uses deep semantic comparison models to evaluate keyword frequency, text layout density, experience years calculation, and role title congruence against verified industry screeners, ensuring you pass automated HR pipelines clean."
    },
    {
      q: "Does the voice simulated interview run client-side?",
      a: "The audio recorder utilizes standard browser media streams to capture your voice. Our server-side processing pipeline safely transcribes your answers, checks your pacing, reviews confidence levels, and overlays AI improvements without sharing data externally."
    },
    {
      q: "Can I generate and edit my resume live using standard LaTeX templates?",
      a: "Absolutely! The Resume Builder view offers a fully integrated live editor with real-time previews. You can toggle between several Swiss-Minimalist layouts, modify headers, and download clean, printer-optimized PDF files instantly."
    },
    {
      q: "Is there an enterprise self-hosted license available?",
      a: "Yes. HireWise AI supports team telemetry, shared evaluation indices, and custom corporate job profile matching. Reach out via our standard support form below to schedule a direct system demo."
    }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans flex flex-col justify-between relative overflow-x-hidden">
      
      {/* Dynamic Cosmic Backdrops */}
      <div className="absolute top-[-300px] left-[-200px] w-[800px] h-[800px] rounded-full bg-indigo-900/10 blur-[160px] pointer-events-none z-0" />
      <div className="absolute top-[800px] right-[-100px] w-[700px] h-[700px] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[200px] left-[10%] w-[600px] h-[600px] rounded-full bg-teal-900/5 blur-[140px] pointer-events-none z-0" />

      {/* Global Interactive Navigation Banner */}
      <nav className="w-full sticky top-0 z-50 bg-[#040404]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                HireWise AI
              </span>
              <span className="text-indigo-400 font-mono text-[9px] block font-bold leading-none">PREMIUM COGNITIVE PLATFORM</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Key Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Workspace Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing Tiers</a>
            <a href="#faq" className="hover:text-white transition-colors">Platform FAQ</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact Support</a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsLogin(true); setIsAuthModalOpen(true); }}
              className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-xs font-bold transition-all text-white cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition-all text-white shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Register Pro
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Showcase Block */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-16 pb-12 text-center md:text-left grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 flex flex-col justify-center">
          
          <div className="inline-flex items-center gap-1.5 h-7 px-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs w-fit mx-auto md:mx-0 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Enterprise SaaS Release v3.0</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[56px] text-white tracking-tight leading-[1.1] mb-6">
            Accelerate your career <br />
            with <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-400 bg-clip-text text-transparent">AI-powered resume analysis</span> <br className="hidden sm:inline" />
            and interview prep.
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mb-8 leading-relaxed">
            Conduct exhaustive ATS key evaluations, auto-build clean developer CV sheets, track detailed target skill gaps, and experience voice-interactive interview sessions with immediate communication metrics scoring.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }}
              className="px-6 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-display font-bold text-xs tracking-wider text-white shadow-xl shadow-indigo-600/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>GET STARTED FOR FREE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDemoLogin}
              className="px-6 h-12 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 font-display font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>COGNITIVE DEMO BYPASS</span>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center md:justify-start gap-4">
            <div className="flex -space-x-2">
              <img className="w-7 h-7 rounded-full border border-[#030303]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop" alt="User avatar" />
              <img className="w-7 h-7 rounded-full border border-[#030303]" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop" alt="User avatar" />
              <img className="w-7 h-7 rounded-full border border-[#030303]" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop" alt="User avatar" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-white tracking-tight">Trusted by over 14,000 global experts</p>
              <p className="text-[9px] font-mono text-zinc-500 tracking-wide">Placed cleanly at Google, Stripe, McKinsey & Meta</p>
            </div>
          </div>

        </div>

        <div className="md:col-span-5 flex justify-center relative">
          
          {/* Mock Interactive Platform Dashboard Visual Preview */}
          <div className="p-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-white/10 max-w-sm w-full shadow-2xl relative z-10 glass-card">
            <div className="bg-[#0c0c0c] rounded-[14px] p-5 text-left space-y-4">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[9px] text-zinc-500 tracking-widest uppercase">Target Role Evaluation</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400 font-bold">PRO ACCOUNT</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-505 block">Scanned Candidate Resume</span>
                <div className="flex justify-between items-center p-2.5 bg-zinc-900 border border-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] font-semibold text-white truncate max-w-[150px]">principal_engineer_cv.pdf</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold">READY</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono">ATS Compatibility</span>
                  <div className="text-lg font-black text-white">92%</div>
                </div>
                <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono">Simulated Fluency</span>
                  <div className="text-lg font-black text-indigo-400">Stable</div>
                </div>
              </div>

              {/* Decorative mini action rows */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 p-2 bg-zinc-900/40 border border-white/5 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PostgreSQL isolation levels</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">+18% delta</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 p-2 bg-zinc-900/40 border border-white/5 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>TypeScript structural typing</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">Optimal</span>
                </div>
              </div>

              <button 
                onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }}
                className="w-full h-9 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Initialize Interview Audits</span>
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              </button>

            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
        </div>
      </header>

      {/* Animated Statistics Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 border-y border-white/5 bg-[#050505]/60 backdrop-blur-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          {stats.map((stat, idx) => {
            const IconComp = stat.icon;
            return (
              <div key={idx} className="p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all space-y-1.5 bg-[#0a0a0a]/30">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] tracking-wider uppercase text-zinc-500">SYSTEM STAT {idx+1}</span>
                  <IconComp className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="font-display font-black text-3xl text-white tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-zinc-450 leading-normal">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bento style Grid section */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 text-left">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">EXHAUSTIVE CAPABILITIES</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight mt-2">
            The standard stack for AI target selection assessments.
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-3">
            Unlock professional grading metrics, custom weekly action checklists, 30/60/90 day curriculum planning, and interactive 24/7 technical mentors natively.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="p-5 bg-zinc-900/40 border border-white/5 hover:border-indigo-500/20 rounded-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group space-y-4 text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/10 group-hover:bg-indigo-600/10 group-hover:border-indigo-500/20 transition-all">
                      <Icon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-all" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-mono text-zinc-400 group-hover:text-white transition-all">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <button 
                  onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }}
                  className="pt-2 text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer w-fit"
                >
                  <span>Launch Module</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Product Simulated Live Demo Section */}
      <section id="demo" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">PRODUCT INSIGHTS</span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mt-1">
            Toggle our specialized sub-engines
          </h2>
          <p className="text-zinc-500 text-xs mt-2">
            Explore realistic workspace mocks and metrics computed live on HireWise AI panels.
          </p>
        </div>

        {/* Demo switcher */}
        <div className="flex justify-center gap-2 mb-8 bg-zinc-950/40 p-1 rounded-xl border border-white/5 max-w-lg mx-auto">
          <button
            onClick={() => setActiveDemoTab("ats")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeDemoTab === "ats" ? "bg-indigo-600 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            ATS Checker
          </button>
          <button
            onClick={() => setActiveDemoTab("voice")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeDemoTab === "voice" ? "bg-indigo-600 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Voice Mock Setup
          </button>
          <button
            onClick={() => setActiveDemoTab("coach")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeDemoTab === "coach" ? "bg-indigo-600 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            AI Career Coach
          </button>
        </div>

        {/* Workspace Display Mock */}
        <div className="glass-card border border-white/5 rounded-2xl p-6 sm:p-8 text-left max-w-4xl mx-auto shadow-2xl relative">
          
          {activeDemoTab === "ats" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 border-b border-white/5 pb-4">
                <div>
                  <h4 className="font-display font-bold text-lg text-white">SaaS ATS compatibility parser</h4>
                  <p className="text-xs text-zinc-500">Detects key gaps, formatting warnings, and layout compliance.</p>
                </div>
                <span className="text-emerald-450 font-mono text-xs font-bold">ATS Audit Score: 94 / 100</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Density Assessment</span>
                  <p className="text-xs font-semibold text-white">Highly Optimal (18 key phrases detected)</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Formatting compliance</span>
                  <p className="text-xs font-semibold text-emerald-450">Passed (Single-column layout optimized)</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Role title alignment</span>
                  <p className="text-xs font-semibold text-indigo-400">Excellent Congruency matches</p>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 border border-white/5 rounded-xl space-y-3">
                <h5 className="text-[11px] font-mono uppercase tracking-wider text-indigo-400">Missing Key Concepts Found</h5>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">Redis cache invalidation</span>
                  <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">Kafka message streams</span>
                  <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">Docker compose network</span>
                  <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">K8s cluster pod configurations</span>
                </div>
              </div>
            </div>
          )}

          {activeDemoTab === "voice" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h4 className="font-display font-bold text-lg text-white">Interactive voice auditor dashboard</h4>
                  <p className="text-xs text-zinc-500">Simulates real verbal stress scenarios in safe browser environments.</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-mono text-red-400 font-bold">Simulator Armed</span>
                </span>
              </div>

              <div className="p-6 bg-zinc-950 rounded-xl border border-white/5 space-y-4 text-center">
                <p className="text-xs text-zinc-300 italic">"Design a system to throttle heavy transactional database queries in an distributed order fulfillment micro-service."</p>
                <div className="flex items-center justify-center gap-4">
                  <button className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer">
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-mono text-zinc-500">0:14 / 2:00 Max response</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-amber-500 block uppercase">Communication Score</span>
                  <p className="text-xs text-zinc-400">Pacing is excellent, vocabulary matches standard tech parameters.</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-purple-400 block uppercase">Fluency Vectors</span>
                  <p className="text-xs text-zinc-400 font-medium">Mild pause gaps detected. Try to structure with numbered bullet counts.</p>
                </div>
              </div>
            </div>
          )}

          {activeDemoTab === "coach" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h4 className="font-display font-bold text-lg text-white">Personal AI growth counselor</h4>
                  <p className="text-xs text-zinc-500">Tracks study objectives, weekly alignments, and career metrics.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] font-mono text-emerald-400">ACTIVE</span>
              </div>

              <div className="space-y-4">
                <span className="text-[10.5px] font-mono uppercase text-indigo-400 tracking-wider">Weekly target objectives</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400">
                      <span>MILESTONE A</span>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-white">Configure Redis cluster</p>
                  </div>
                  <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400">
                      <span>MILESTONE B</span>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-white">Solve transaction latency</p>
                  </div>
                  <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-indigo-450">
                      <span>IN PROGRESS</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    </div>
                    <p className="text-xs font-semibold text-white">Participate in voice mock</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Testimonials Slider Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">SUCCESS CONFIRMATIONS</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-1">
            Proven to open competitive pipelines
          </h2>
          <p className="text-zinc-500 text-xs mt-2">
            Verified alumni stories placed through custom automated CV tuning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, idx) => (
            <div key={idx} className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-4">
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed italic">
                  "{test.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <img className="w-10 h-10 rounded-full object-cover border border-white/10" src={test.avatar} alt={test.name} />
                <div>
                  <h4 className="font-display font-bold text-xs text-white">{test.name}</h4>
                  <p className="text-[10px] text-zinc-500">{test.role} at <span className="text-indigo-400 font-semibold">{test.company}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">SIMPLE SAAS PLANS</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-1">
            Scale your access securely
          </h2>
          <p className="text-zinc-500 text-xs mt-2">
            Every subscription helps optimize client stores, keeping AI simulations responsive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* Starter Plan */}
          <div className="p-6 bg-zinc-900/20 border border-white/5 rounded-2xl flex flex-col justify-between text-left space-y-6 relative">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block">TIER 01</span>
                <h3 className="font-display font-bold text-lg text-white">Starter Sandbox</h3>
              </div>
              <p className="text-zinc-450 text-xs">Ideal for quick CV evaluations, trial ATS scorings and platform previews.</p>
              <div className="pt-2">
                <span className="font-display font-black text-3xl text-white">$0</span>
                <span className="text-zinc-500 text-xs"> / Permanent free</span>
              </div>

              <hr className="border-white/5" />

              <ul className="space-y-2.5 text-[11px] text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3 Free ATS scoring audits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Standard LaTeX CV editor templates</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-650">
                  <Check className="w-3.5 h-3.5 text-zinc-650" />
                  <span>Voice simulated verbal audits</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }}
              className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Initialize Sandbox
            </button>
          </div>

          {/* Pro Copilot Plan */}
          <div className="p-6 bg-zinc-900/60 border border-indigo-500/20 rounded-2xl flex flex-col justify-between text-left space-y-6 relative shadow-2xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 border border-indigo-500 text-[10px] font-mono font-bold uppercase rounded-full text-white">
              Most Selected
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-indigo-400 block">TIER 02</span>
                <h3 className="font-display font-bold text-lg text-white">Professional Pro</h3>
              </div>
              <p className="text-zinc-450 text-xs">Deep skill gaps matrices, unlimited roadmaps, voice simulators, and weekly objective alerts.</p>
              <div className="pt-2">
                <span className="font-display font-black text-3xl text-indigo-400">$19</span>
                <span className="text-zinc-500 text-xs"> / monthly standard</span>
              </div>

              <hr className="border-white/5" />

              <ul className="space-y-2.5 text-[11px] text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-white">Unlimited ATS Auditor checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Full Interactive Voice Simulator accesses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>30/60/90 Study Roadmap builder engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Interactive Career Copilot chat agents</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow shadow-indigo-600/30 cursor-pointer"
            >
              Optimize My Career
            </button>
          </div>

          {/* Enterprise Unlimited */}
          <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-2xl flex flex-col justify-between text-left space-y-6 relative">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block">TIER 03</span>
                <h3 className="font-display font-bold text-lg text-white">Enterprise Teams</h3>
              </div>
              <p className="text-zinc-450 text-xs">Equipped for scaling hiring groups, team metrics, custom evaluation matrices, and shared APIs.</p>
              <div className="pt-2">
                <span className="font-display font-black text-3xl text-white">$49</span>
                <span className="text-zinc-500 text-xs"> / monthly flat</span>
              </div>

              <hr className="border-white/5" />

              <ul className="space-y-2.5 text-[11px] text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>All Professional features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Corporate recruiter assessment panels</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dedicated custom LLM key integrations</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }}
              className="w-full h-10 bg-zinc-900 hover:bg-zinc-805 text-white text-xs font-bold rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer"
            >
              Contact Recruiting Sales
            </button>
          </div>

        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="relative z-10 w-full max-w-3xl mx-auto px-6 py-16 border-t border-white/5 text-left">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">FAQ CORNER</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-1">
            Standard Platform Queries
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="border border-white/5 bg-zinc-900/30 rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex justify-between items-center text-xs sm:text-sm font-semibold text-white hover:text-indigo-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 pt-1 text-zinc-450 text-[11px] sm:text-xs leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 rounded-3xl bg-gradient-to-br from-[#111111] to-[#040404] border border-white/5 shadow-2xl my-8 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-400">INFORMATIVE FEEDS</span>
          <h3 className="font-display font-black text-xl sm:text-2xl text-white leading-tight">
            Acquire tactical interview updates
          </h3>
          <p className="text-zinc-500 text-xs leading-normal">
            We transmit system updates, salary benchmark findings, and technical system questions templates weekly. No telemetry spam guaranteed.
          </p>
        </div>

        {newsletterSuccess ? (
          <div className="text-emerald-450 font-mono text-xs py-3">
            ✔ Transmission successfully calibrated. Welcome on board HireWise AI!
          </div>
        ) : (
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-2 h-11">
            <input
              type="email"
              required
              placeholder="candidate@example.com"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 bg-[#050505] border border-white/5 rounded-lg px-4 text-xs font-sans text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
            <button
              type="submit"
              className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Subscribe</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        )}
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 w-full max-w-4xl mx-auto px-6 py-16 border-t border-white/5 text-left grid md:grid-cols-12 gap-8">
        
        <div className="md:col-span-5 space-y-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e4bd33]">DIAGNOSTICS & HELP</span>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-tight mt-1">
              Reach HireWise AI Specialist Support
            </h3>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Need localized support regarding database flushes, premium subscription keys or customized corporate assessment licenses? Give our system engineers up to 12 hours.
          </p>

          <div className="space-y-2.5 text-xs font-mono text-zinc-400">
            <div className="p-3 bg-[#0a0a0a] border border-white/5 rounded-lg flex items-center gap-3">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>support@hirewise.ai</span>
            </div>
            <div className="p-3 bg-[#0a0a0a] border border-white/5 rounded-lg flex items-center gap-3">
              <Map className="w-4 h-4 text-teal-400" />
              <span>San Francisco Headquarters, CA</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 p-6 bg-[#0a0a0a]/60 border border-white/5 rounded-2xl relative shadow-xl">
          {contactSuccess ? (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-2 py-12">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <h4 className="font-display font-bold text-white text-sm">Transmission Conveyed</h4>
              <p className="text-zinc-500 text-[11px]">Your inquiries have logged into SaaS support telemetry queues successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-zinc-500">Your Name</label>
                  <input
                    type="text"
                    placeholder="Alex"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full h-10 bg-zinc-900 border border-white/5 rounded-lg text-xs px-3 focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-zinc-500">Your Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@gmail.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-10 bg-zinc-900 border border-white/5 rounded-lg text-xs px-3 focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-zinc-500">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Inquire regarding team accounts scope or premium setups details..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-lg text-xs p-3 focus:outline-none focus:border-indigo-500 text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isContactLoading}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isContactLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>SEND SUPPORT TRANSMISSION</span>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Floating Auth Dialog Modal / Side Drawer */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Auth panel wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6 sm:p-8 shadow-3xl text-left relative z-10 border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-400 tracking-wider">SECURE AUTHORIZATION</span>
                  <h3 className="font-display font-extrabold text-xl text-white">
                    {isForgot ? "Reset Settings" : isLogin ? "Access Platform" : "Create Pro Profile"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 text-xs font-mono font-bold cursor-pointer"
                >
                  ESC [ ✕ ]
                </button>
              </div>

              {/* Form mode tabs */}
              {!isForgot && (
                <div className="grid grid-cols-2 bg-slate-950/60 p-1 rounded-lg border border-white/5 mb-6">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setErrorMsg(null); }}
                    className={`py-1.5 rounded-md font-display font-bold text-[11px] tracking-wide transition-all cursor-pointer ${
                      isLogin ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setErrorMsg(null); }}
                    className={`py-1.5 rounded-md font-display font-bold text-[11px] tracking-wide transition-all cursor-pointer ${
                      !isLogin ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Error alerts */}
              {errorMsg && (
                <div className="mb-4 text-[10.5px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}
              {infoMsg && (
                <div className="mb-4 text-[10.5px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                  {infoMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name field for registration */}
                {!isLogin && !isForgot && (
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Your Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                      <input
                        type="text"
                        required
                        placeholder="Alex Mercer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-10 pl-10 pr-3 rounded-lg bg-[#0d0d0d] border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 rounded-lg bg-[#0d0d0d] border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Password field */}
                {!isForgot && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Password</label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setIsForgot(true)}
                          className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                        >
                          Help?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-555" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-10 pl-10 pr-3 rounded-lg bg-[#0d0d0d] border border-white/5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>{isForgot ? "Reset Settings Now" : isLogin ? "Access Platform" : "Generate Pro Profile"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {isForgot && (
                  <button
                    type="button"
                    onClick={() => setIsForgot(false)}
                    className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors cursor-pointer block mt-1"
                  >
                    Return to sign in options
                  </button>
                )}
              </form>

              <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block text-center">Testing the AI Agent?</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="h-10 bg-slate-950 hover:bg-slate-900 border border-white/5 hover:border-indigo-500 rounded-lg text-[11px] font-bold text-zinc-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Candidate Bypass</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminPrefillLogin}
                    className="h-10 bg-red-950/10 hover:bg-red-950/20 border border-red-500/10 hover:border-red-500/35 rounded-lg text-[11px] font-bold text-red-350 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                    <span>Admin Prefill</span>
                  </button>
                </div>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* Professional Multi-Column Footer bar */}
      <footer className="w-full border-t border-white/5 bg-[#040404] py-12 relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8">
          
          <div className="col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-extrabold text-base tracking-tight text-white block">HireWise AI</span>
            </div>
            <p className="text-zinc-550 text-xs leading-relaxed max-w-sm">
              Accelerate your career with AI-powered resume analysis and interview preparation. Score ATS indices, check skill gaps, construct pristine PDF layouts, and practice stress verbal mock audits.
            </p>
            <span className="text-[10px] text-zinc-650 font-mono block">
              &copy; {new Date().getFullYear()} HireWise AI. All telemetry secured locally via local state models.
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="font-display font-bold text-[11.5px] text-zinc-300 uppercase tracking-widest">Solutions</h4>
            <div className="flex flex-col gap-2 text-[11px] text-zinc-500">
              <button onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }} className="hover:text-white hover:underline text-left cursor-pointer">ATS Compatibility Checker</button>
              <button onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }} className="hover:text-white hover:underline text-left cursor-pointer">Swiss LaTeX Resume Builder</button>
              <button onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }} className="hover:text-white hover:underline text-left cursor-pointer">Voice Simulated Verbal Audits</button>
              <button onClick={() => { setIsLogin(false); setIsAuthModalOpen(true); }} className="hover:text-white hover:underline text-left cursor-pointer">Skill Gaps Mapping Modules</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display font-bold text-[11.5px] text-zinc-300 uppercase tracking-widest">Resources</h4>
            <div className="flex flex-col gap-2 text-[11px] text-zinc-500 font-mono">
              <a href="#demo" className="hover:text-white hover:underline">Workspace Demo Mocks</a>
              <a href="#pricing" className="hover:text-white hover:underline">SaaS Rates Matrix</a>
              <a href="#faq" className="hover:text-white hover:underline">Evaluation Docs FAQ</a>
              <a href="#contact" className="hover:text-white hover:underline">Inquire Support Queue</a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display font-bold text-[11.5px] text-zinc-300 uppercase tracking-widest">Legal Status</h4>
            <div className="flex flex-col gap-2 text-[11px] text-zinc-500 font-mono">
              <span className="text-zinc-600">Enterprise License 3.0</span>
              <span className="text-zinc-600">PostgreSQL Schema Compliant</span>
              <span className="text-emerald-450 text-[9px] font-bold">✔ CLOUD INGRESS RUNNING</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
