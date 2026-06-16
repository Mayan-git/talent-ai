/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Mail, Lock, User as UserIcon, Sparkles, Award, ArrowRight, BookOpen, UserCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface LandingPageProps {
  onLoginSuccess: (user: User) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

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
          email: `demo_user_${Math.floor(Math.random() * 10000)}@careercheck.ai`,
          password: "demo-secure-password",
          name: "Alex Mercer",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // If somehow exist, try standard fallback logging
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
        throw new Error(data.error || "Could not complete the auth request.");
      }

      if (isForgot) {
        setInfoMsg("A secure recovery notification has been transmitted to your inbox.");
        setIsForgot(false);
        setIsLogin(true);
      } else if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication mismatch occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Decorative Background Highlights */}
      <div className="absolute top-[-300px] left-[-200px] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              TalentAI
            </span>
            <span className="text-indigo-400 font-mono text-[10px] block font-bold leading-none">PREP SUITE</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 hidden sm:inline">v1.2 Platform Ready</span>
          <button 
            onClick={handleDemoLogin}
            className="px-4 py-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 text-xs font-medium transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Instant Demo Bypass
          </button>
        </div>
      </header>

      {/* Hero Showcase + Glass auth Block */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 grid md:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Product pitch & Branding */}
        <div className="md:col-span-7 flex flex-col justify-center text-left">
          <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-mono text-xs w-fit mb-6">
            <Award className="w-3.5 h-3.5" />
            Generative AI Careers Platform
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6">
            Unlock your target <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Job Offer with AI.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mb-10 leading-relaxed font-sans">
            Conduct bulletproof audits of your Resume, map alignment scores with real Job Descriptions, and practice under realistic simulator interviews powered by our contextual interactive models.
          </p>

          {/* Core Feature bullet lists */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-lg">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm text-slate-200">Interactive Interviews</h3>
                <p className="text-xs text-slate-400 mt-1">Realistic scenarios, real-time responses, and target grading.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm text-slate-200">Instant Score Audits</h3>
                <p className="text-xs text-slate-400 mt-1">PDF analysis checks experience duration, degree, and skills gaps.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Component Wrapper */}
        <div className="md:col-span-5 w-full flex justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-sm glass-card rounded-2xl p-6 sm:p-8 shadow-2xl shadow-violet-950/20"
          >
            {/* Tab layout selector */}
            {!isForgot && (
              <div className="grid grid-cols-2 bg-slate-950/40 p-1.5 rounded-lg border border-white/5 mb-8">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setErrorMsg(null); }}
                  className={`py-2 rounded-md font-display font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                    isLogin ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setErrorMsg(null); }}
                  className={`py-2 rounded-md font-display font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                    !isLogin ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {isForgot && (
              <div className="mb-6">
                <h2 className="font-display font-bold text-xl text-white">Reset Credentials</h2>
                <p className="text-xs text-slate-400 mt-1">Enter your email and receive a safe diagnostic recovery transmission link.</p>
              </div>
            )}

            {/* Error notifications */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg overflow-hidden"
                >
                  {errorMsg}
                </motion.div>
              )}
              {infoMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 text-xs font-sans text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg overflow-hidden"
                >
                  {infoMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name field for registration */}
              {!isLogin && !isForgot && (
                <div className="space-y-1.5" id="name-field-wrap">
                  <label className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase"> Your Name </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-white/5 text-sm text-white placeholder-slate-500 font-sans focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email component */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-white/5 text-sm text-white placeholder-slate-500 font-sans focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password component */}
              {!isForgot && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsForgot(true)}
                        className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors hover:underline cursor-pointer"
                      >
                        Help?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-900 border border-white/5 text-sm text-white placeholder-slate-500 font-sans focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Submission button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-display font-medium text-sm text-white transition-all shadow-md shadow-indigo-600/20 shadow-inner flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isForgot ? "Transmit Reset Code" : isLogin ? "Access Platform" : "Create My Account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Forgot state return to sign in */}
              {isForgot && (
                <button
                  type="button"
                  onClick={() => setIsForgot(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 hover:underline mt-2 cursor-pointer"
                >
                  Return to login
                </button>
              )}
            </form>

            {/* Instant Demo quick footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block mb-3 font-mono tracking-wider uppercase">Testing the AI Agent?</span>
              <button
                onClick={handleDemoLogin}
                className="text-xs transition-colors px-4 py-2 border border-white/5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 w-full hover:border-indigo-500 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>One-Click Login Sandbox</span>
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/5 text-center relative z-10 text-[11px] text-slate-500 font-mono">
        &copy; {new Date().getFullYear()} TalentAI Prep. All data safely secured locally via PostgreSQL standard schema emulation.
      </footer>
    </div>
  );
}
