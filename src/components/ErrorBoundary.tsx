/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Exception caught inside ${this.props.name || "App Boundary"}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // If it's a critical global boundary, reload user session local storage triggers
    if (!this.props.name) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isSubsystem = !!this.props.name;

      return (
        <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-zinc-900/50 border border-red-500/10 min-h-[300px] shadow-xl ${isSubsystem ? "w-full my-4" : "min-h-screen bg-[#030303] text-zinc-300"}`}>
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          
          <h2 className="font-display font-black text-lg text-white mb-2">
            {isSubsystem ? `${this.props.name} Module Blocked` : "Application Intercepted An Issue"}
          </h2>
          
          <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || "An unexpected rendering event took place within this system component."}
          </p>

          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer border border-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Retry Component</span>
            </button>
            
            {!isSubsystem && (
              <button
                onClick={() => {
                  localStorage.removeItem("talentai_session_user");
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
