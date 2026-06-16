/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { User, ChatMessage } from "../types";
import { saasStore } from "../lib/saasStore";
import { 
  Send, Bot, CornerDownLeft, Sparkles, RefreshCw, Trash2, ArrowRight
} from "lucide-react";

interface CareerChatbotProps {
  user: User;
}

export default function CareerChatbot({ user }: CareerChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const db = saasStore.get();
    const chatSess = db.chatSessions.find(s => s.userId === user.id);
    if (chatSess) {
      setMessages(chatSess.messages);
    } else {
      // Boot default system messages
      const systemWelcome: ChatMessage[] = [
        {
          id: "welcome_1",
          sender: "bot",
          text: `Hello ${user.name}! I am your personal AI SaaS Career Assistant Chatbot. I have read your career profile. Ask me any career, skill roadmap, Resume optimisation, or mock Interview preparation questions!`,
          createdAt: new Date().toISOString()
        }
      ];
      setMessages(systemWelcome);

      db.chatSessions.push({
        id: saasStore.generateId(),
        userId: user.id,
        messages: systemWelcome,
        updatedAt: new Date().toISOString()
      });
      saasStore.save(db);
    }
  }, [user.id, user.name]);

  useEffect(() => {
    // Scroll chat down after message addition
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: saasStore.generateId(),
      sender: "user",
      text: typedMessage.trim(),
      createdAt: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setTypedMessage("");
    setSending(true);

    // AI logic response simulation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const botResponseText = generateBotReply(userMsg.text);

    const botMsg: ChatMessage = {
      id: saasStore.generateId(),
      sender: "bot",
      text: botResponseText,
      createdAt: new Date().toISOString()
    };

    const db = saasStore.get();
    const chatIndex = db.chatSessions.findIndex(s => s.userId === user.id);
    if (chatIndex !== -1) {
      db.chatSessions[chatIndex].messages = [...newMessages, botMsg];
      db.chatSessions[chatIndex].updatedAt = new Date().toISOString();
    }
    saasStore.save(db);

    setMessages([...newMessages, botMsg]);
    setSending(false);
  };

  const generateBotReply = (text: string): string => {
    const word = text.toLowerCase();
    
    if (word.includes("resume") || word.includes("cv") || word.includes("score")) {
      return "To elevate your Resume score, include strong quantitative actions. For example, specify 'Increased load-speed margins by 20%' or 'Decoupled monolithic server routing configurations recursively'. Use standard PDF styles!";
    }
    if (word.includes("interview") || word.includes("question")) {
      return "Mock interviews are critical for oral cadence validation. Highlight React's reconciliation cycles or database query indexes clearly to score highest with our AI Voice interviewer.";
    }
    if (word.includes("roadmap") || word.includes("study") || word.includes("learning")) {
      return "Focus on the 30-day learning roadmap checkpoints to master grid designs, then move to Docker networks and Kubernetes clusters in the 90-day pipeline targets.";
    }
    return `Excellent target query! As your personal Career coach, I recommend structuring 3 solid portfolio projects built directly in Docker Compose with fully documented README systems.`;
  };

  const clearChatHistory = () => {
    const db = saasStore.get();
    const chatIndex = db.chatSessions.findIndex(s => s.userId === user.id);
    const systemWelcome = [
      {
        id: `clr_${Date.now()}`,
        sender: "bot" as const,
        text: `Chat thread cleared safely. Let's talk about your target career goals!`,
        createdAt: new Date().toISOString()
      }
    ];

    if (chatIndex !== -1) {
      db.chatSessions[chatIndex].messages = systemWelcome;
      db.chatSessions[chatIndex].updatedAt = new Date().toISOString();
    }
    saasStore.save(db);
    setMessages(systemWelcome);
  };

  return (
    <div id="ai-assistant-chatbot-workspace" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">AI career assistant</h2>
          <p className="text-zinc-500 text-xs mt-1">Converse with our persistent cognitive model about Resume revisions, career tips, and goal setting advice.</p>
        </div>
        <div>
          <button
            onClick={clearChatHistory}
            className="h-9 px-3 border border-white/5 bg-[#141414] hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Chat Window */}
        <div className="lg:col-span-8 flex flex-col h-[520px] bg-[#111]/40 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
          
          {/* Header block inside chat */}
          <div className="p-4 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="font-display font-bold text-xs text-white block">Talent AI Copilot</span>
                <span className="text-[9px] font-mono text-emerald-400 block">● Fully Active</span>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-[#141414] text-zinc-350 border border-white/5 rounded-tl-none font-sans"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="bg-[#141414] text-zinc-500 border border-white/5 rounded-xl rounded-tl-none p-3 text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Form write message input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/60 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              className="flex-1 bg-[#111] border border-white/10 text-xs rounded-lg p-2.5 text-white outline-none focus:border-indigo-500/50"
              placeholder="Ask anything about job match checklists, Resume checkers..."
            />
            <button
              type="submit"
              disabled={sending || !typedMessage.trim()}
              className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>

        {/* Quick Topics Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Recommended Spark Prompts</span>
            </h4>

            <div className="space-y-2">
              {[
                "How do I boost my ATS CV compatibility rating?",
                "Suggest 3 simple backend portfolio projects",
                "Explain React hydration benchmarks",
                "How does the Event loop handle async network payloads?"
              ].map((rec, idx) => (
                <button
                  key={idx}
                  onClick={() => setTypedMessage(rec)}
                  className="w-full p-2.5 bg-zinc-900/40 hover:bg-indigo-500/5 border border-white/5 hover:border-indigo-500/20 text-left rounded-lg text-xs text-zinc-400 hover:text-indigo-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{rec}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
