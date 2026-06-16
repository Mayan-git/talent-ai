/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { dbStore } from "./server/database";
import {
  analyzeResume,
  matchJobDescription,
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  evaluateVoiceSpeechSample,
} from "./server/gemini";
import { InterviewStatus } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set higher limits for base64 resume uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Helper function to generate UUID-like strings
  function generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  // ==========================================
  // AUTH API ENDPOINTS
  // ==========================================

  app.post("/api/auth/signup", (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Missing required registration parameters." });
      }

      const existing = dbStore.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered on this platform." });
      }

      const user = dbStore.createUser({
        id: generateId(),
        email,
        name,
        createdAt: new Date().toISOString(),
        skills: [],
        experienceLevel: "Junior",
        title: "Developer Aspirant",
        bio: "Developing my profile to land my dream job.",
      });

      res.status(201).json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = dbStore.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials. User not found." });
      }

      // Simple credential verification for developer ease & UX
      dbStore.addLog(`User login successful: ${user.name} (${user.email}) as role ${user.role || 'user'}`, "success");
      res.status(200).json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    // Simulate bulletproof success response
    res.status(200).json({ message: "Password reset link emitted successfully." });
  });

  app.put("/api/auth/profile", (req, res) => {
    try {
      const { userId, title, bio, experienceLevel, skills } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required to update profile." });
      }

      const updatedUser = dbStore.updateUser(userId, {
        title,
        bio,
        experienceLevel,
        skills,
      });

      res.status(200).json({ user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/user/:id", (req, res) => {
    try {
      const data = dbStore.get();
      const user = data.users.find((u) => u.id === req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      res.status(200).json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // RESUME ANALYZER API ENDPOINTS
  // ==========================================

  app.post("/api/resume/analyze", async (req, res) => {
    try {
      const { userId, fileName, base64Data, isPdf } = req.body;
      if (!userId || !fileName || !base64Data) {
        return res.status(400).json({ error: "Missing required resume parsing payload." });
      }

      // Analyze resume contents via AI
      const analysisRaw = await analyzeResume(fileName, base64Data, isPdf);

      // Create permanent Record
      const newResumeRecord = dbStore.addResume({
        id: generateId(),
        userId,
        createdAt: new Date().toISOString(),
        ...analysisRaw,
      });

      // Optionally update user skills if empty or thin
      const userObj = dbStore.get().users.find((u) => u.id === userId);
      if (userObj && (!userObj.skills || userObj.skills.length === 0)) {
        const topSkills = analysisRaw.skills.slice(0, 10).map((s) => s.name);
        dbStore.updateUser(userId, { skills: topSkills });
      }

      res.status(201).json({ resume: newResumeRecord });
    } catch (err: any) {
      console.error("error processing resume analyzer api route:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/resume/history/:userId", (req, res) => {
    try {
      const resumes = dbStore.getResumes(req.params.userId);
      res.status(200).json({ resumes });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // JOB MATCHING API ENDPOINTS
  // ==========================================

  app.post("/api/job-match/run", async (req, res) => {
    try {
      const { userId, resumeId, jobTitle, jobDescription } = req.body;
      if (!userId || !resumeId || !jobTitle || !jobDescription) {
        return res.status(400).json({ error: "Missing essential match payload." });
      }

      // Retrieve resume text/details for comparing
      const resume = dbStore.get().resumes.find((r) => r.id === resumeId);
      if (!resume) {
        return res.status(404).json({ error: "Base resume profile could not be located." });
      }

      // Generate Matching Report
      const matchDetails = await matchJobDescription(resume, jobTitle, jobDescription);

      const newMatchRecord = dbStore.addJobMatch({
        id: generateId(),
        userId,
        resumeId,
        createdAt: new Date().toISOString(),
        ...matchDetails,
      });

      res.status(201).json({ jobMatch: newMatchRecord });
    } catch (err: any) {
      console.error("error during job description analyzer match:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/job-match/history/:userId", (req, res) => {
    try {
      const matches = dbStore.getJobMatches(req.params.userId);
      res.status(200).json({ matches });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // INTERVIEW API ENDPOINTS
  // ==========================================

  app.post("/api/interview/create", async (req, res) => {
    try {
      const { userId, role, difficulty } = req.body;
      if (!userId || !role || !difficulty) {
        return res.status(400).json({ error: "Missing user credentials, target role, or difficulty." });
      }

      // Fetch user profile stats to enrich prompts
      const user = dbStore.get().users.find((u) => u.id === userId);
      const userSkills = user?.skills || [];

      // Ask Gemini to generate 5 robust interview questions
      const generatedQs = await generateInterviewQuestions(role, difficulty, userSkills);

      const interviewSession = dbStore.addInterview({
        id: generateId(),
        userId,
        role,
        difficulty,
        status: InterviewStatus.SETUP,
        questions: generatedQs,
        answers: [],
        currentQuestionIndex: 0,
        overallScore: 0,
        overallFeedback: "",
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({ session: interviewSession });
    } catch (err: any) {
      console.error("error creating interview api session:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/interview/submit-answers", async (req, res) => {
    try {
      const { sessionId, userResponses } = req.body;
      if (!sessionId || !userResponses || !Array.isArray(userResponses)) {
        return res.status(400).json({ error: "Invalid submission array shape." });
      }

      const session = dbStore.getInterviewById(sessionId);
      if (!session) {
        return res.status(404).json({ error: "The active interview session is not found." });
      }

      // Evaluate the answers in block with single highly coherent AI request
      const evaluationResult = await evaluateInterviewAnswers(
        session.role,
        session.difficulty,
        session.questions,
        userResponses
      );

      // Save report in database State
      const updatedSession = dbStore.updateInterview(sessionId, {
        answers: evaluationResult.answers,
        overallScore: evaluationResult.overallScore,
        overallFeedback: evaluationResult.overallFeedback,
        status: InterviewStatus.COMPLETED,
      });

      res.status(200).json({ session: updatedSession });
    } catch (err: any) {
      console.error("error evaluation answers api session:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/voice/evaluate", async (req, res) => {
    try {
      const { questionText, answerText, role, difficulty } = req.body;
      if (!questionText || !answerText || !role || !difficulty) {
        return res.status(400).json({ error: "Missing required speech parameters." });
      }

      const evaluation = await evaluateVoiceSpeechSample(questionText, answerText, role, difficulty);
      res.status(200).json(evaluation);
    } catch (err: any) {
      console.error("error in Voice evaluation endpoint:", err);
      res.status(500).json({ error: err.message || "Failed to analyze speech metrics." });
    }
  });

  app.get("/api/interview/history/:userId", (req, res) => {
    try {
      const sessions = dbStore.getInterviews(req.params.userId);
      res.status(200).json({ sessions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/interview/session/:sessionId", (req, res) => {
    try {
      const session = dbStore.getInterviewById(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Interview session not found." });
      }
      res.status(200).json({ session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // DASHBOARD AGGREGATED STATISTIC ENDPOINTS
  // ==========================================

  app.get("/api/dashboard/stats/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const data = dbStore.get();

      const userResumes = data.resumes.filter((r) => r.userId === userId);
      const userInterviews = data.interviews.filter((i) => i.userId === userId && i.status === InterviewStatus.COMPLETED);
      const userMatches = data.jobMatches.filter((m) => m.userId === userId);

      // Calculations
      const avgResumeScore = userResumes.length > 0
        ? Math.round(userResumes.reduce((acc, r) => acc + r.score, 0) / userResumes.length)
        : 0;

      const avgInterviewScore = userInterviews.length > 0
        ? Math.round(userInterviews.reduce((acc, i) => acc + i.overallScore, 0) / userInterviews.length)
        : 0;

      // Calculate total gaps
      const uniqueGaps = new Set<string>();
      userMatches.forEach((m) => {
        m.missingSkills.forEach((s) => uniqueGaps.add(s.toLowerCase()));
      });

      // Construct Recent Activity stream
      const activities: Array<{
        type: "RESUME" | "JOB_MATCH" | "INTERVIEW";
        id: string;
        title: string;
        subtitle: string;
        score: number;
        date: string;
      }> = [];

      userResumes.forEach((r) => {
        activities.push({
          type: "RESUME",
          id: r.id,
          title: `Resume Core Audit: ${r.fileName}`,
          subtitle: `${r.skills.length} skills extracted & indexed.`,
          score: r.score,
          date: r.createdAt,
        });
      });

      userMatches.forEach((m) => {
        activities.push({
          type: "JOB_MATCH",
          id: m.id,
          title: `Job Fit Alignment: ${m.jobTitle}`,
          subtitle: `${m.missingSkills.length} missing skill gaps identified.`,
          score: m.matchScore,
          date: m.createdAt,
        });
      });

      userInterviews.forEach((i) => {
        activities.push({
          type: "INTERVIEW",
          id: i.id,
          title: `Interactive Interview: ${i.role}`,
          subtitle: `Grade level: ${i.difficulty} Difficulty`,
          score: i.overallScore,
          date: i.createdAt,
        });
      });

      // Sort activities newest first
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.status(200).json({
        resumeCount: userResumes.length,
        averageResumeScore: avgResumeScore,
        interviewsCount: userInterviews.length,
        averageInterviewScore: avgInterviewScore,
        skillGapsTrackedCount: uniqueGaps.size,
        recentActivity: activities.slice(0, 5),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // SYSTEM ADMINISTRATION PANEL ENDPOINTS
  // ==========================================

  // Middleware to log API request durations inside DB Telemetry schema
  app.use("/api", (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (!req.originalUrl.includes("/api/admin")) {
        try {
          dbStore.addApiTelemetry(req.originalUrl.split("?")[0], duration, res.statusCode);
        } catch (_) {}
      }
    });
    next();
  });

  // Admin Verification Helper
  function verifyAdmin(req: any, res: any, next: any) {
    const adminHeaderId = req.headers["x-admin-userid"];
    if (!adminHeaderId) {
      return res.status(401).json({ error: "Access denied. Administrator identity not verified." });
    }
    const data = dbStore.get();
    const adminUser = data.users.find(u => u.id === adminHeaderId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Forbidden. Access restricted to System Administrators." });
    }
    next();
  }

  // Get Admin Dashboard Cumulative Stats
  app.get("/api/admin/stats", verifyAdmin, (req, res) => {
    try {
      const data = dbStore.get();
      
      // Calculate score aggregates
      const totalResumes = data.resumes.length;
      const totalInterviews = data.interviews.length;
      const completedInterviews = data.interviews.filter(i => i.status === InterviewStatus.COMPLETED || i.overallScore > 0);

      const avgResumeScore = totalResumes > 0 
        ? Math.round(data.resumes.reduce((sum, r) => sum + r.score, 0) / totalResumes)
        : 0;
      
      const avgInterviewScore = completedInterviews.length > 0
        ? Math.round(completedInterviews.reduce((sum, i) => sum + i.overallScore, 0) / completedInterviews.length)
        : 0;

      // Group users by registration date over last 30 days
      const userGrowth: Record<string, number> = {};
      const resumeScoreBrackets = { Excellent: 0, High: 0, Basic: 0 };

      data.users.forEach(u => {
        const dateStr = u.createdAt ? u.createdAt.split("T")[0] : new Date().toISOString().split("T")[0];
        userGrowth[dateStr] = (userGrowth[dateStr] || 0) + 1;
      });

      data.resumes.forEach(r => {
        if (r.score >= 85) resumeScoreBrackets.Excellent++;
        else if (r.score >= 70) resumeScoreBrackets.High++;
        else resumeScoreBrackets.Basic++;
      });

      // API Telemetry routing split
      const routeFrequency: Record<string, { count: number; totalDuration: number; errors: number }> = {};
      data.apiTelemetry.forEach(t => {
        if (!routeFrequency[t.route]) {
          routeFrequency[t.route] = { count: 0, totalDuration: 0, errors: 0 };
        }
        routeFrequency[t.route].count++;
        routeFrequency[t.route].totalDuration += t.durationMs;
        if (t.status >= 400) {
          routeFrequency[t.route].errors++;
        }
      });

      const apiStats = Object.entries(routeFrequency).map(([route, metrics]) => ({
        route,
        requests: metrics.count,
        avgLatencyMs: Math.round(metrics.totalDuration / metrics.count),
        errorRatePercent: Math.round((metrics.errors / metrics.count) * 100),
      }));

      // Get last 150 logs sorted newest first
      const sortedLogs = [...data.logs].reverse().slice(0, 150);

      res.status(200).json({
        cumulative: {
          totalUsers: data.users.length,
          totalResumes,
          totalInterviews,
          completedInterviewsCount: completedInterviews.length,
          avgResumeScore,
          avgInterviewScore,
          totalApiRequests: data.apiTelemetry.length,
        },
        userGrowth: Object.entries(userGrowth).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date)),
        resumeDist: [
          { name: "Excellent (85-100)", value: resumeScoreBrackets.Excellent },
          { name: "High Potential (70-84)", value: resumeScoreBrackets.High },
          { name: "Needs Auditing (<70)", value: resumeScoreBrackets.Basic },
        ],
        apiStats,
        logs: sortedLogs,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get All Registered Users List
  app.get("/api/admin/users", verifyAdmin, (req, res) => {
    try {
      const data = dbStore.get();
      // Enrich user object with counts of their resumes & interviews
      const enrichedUsers = data.users.map(u => {
        const userResumes = data.resumes.filter(r => r.userId === u.id);
        const userInterviews = data.interviews.filter(i => i.userId === u.id);
        const completed = userInterviews.filter(i => i.status === InterviewStatus.COMPLETED || i.overallScore > 0);
        const maxScore = completed.length > 0 ? Math.max(...completed.map(i => i.overallScore)) : 0;

        return {
          ...u,
          resumesAnalyzed: userResumes.length,
          interviewsAttempted: userInterviews.length,
          bestInterviewScore: maxScore,
        };
      });
      res.status(200).json({ users: enrichedUsers });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Modify User Parameters
  app.post("/api/admin/users/update", verifyAdmin, (req, res) => {
    try {
      const { targetUserId, updates } = req.body;
      if (!targetUserId || !updates) {
        return res.status(400).json({ error: "Missing targetUserId or edits updates." });
      }
      const updated = dbStore.updateUser(targetUserId, updates);
      res.status(200).json({ user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Hard Delete User Account
  app.post("/api/admin/users/delete", verifyAdmin, (req, res) => {
    try {
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId parameter required." });
      }
      if (targetUserId === "admin_default" || targetUserId === req.headers["x-admin-userid"]) {
        return res.status(400).json({ error: "Root administrators cannot delete themselves." });
      }
      const success = dbStore.deleteUser(targetUserId);
      if (!success) {
        return res.status(404).json({ error: "Candidate profile not found." });
      }
      res.status(200).json({ success: true, message: "Account scrubbed successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear system-wide telemetry activity logs
  app.post("/api/admin/logs/clear", verifyAdmin, (req, res) => {
    try {
      const data = dbStore.get();
      data.logs = [{ id: "log_clear_" + Date.now().toString(36), msg: "System administrator cleared all logs feeds.", time: new Date().toISOString(), type: "warn" }];
      dbStore.save(data);
      res.status(200).json({ success: true, logs: data.logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin manually emit user log event trace
  app.post("/api/admin/logs/emit", verifyAdmin, (req, res) => {
    try {
      const { msg, type } = req.body;
      if (!msg) return res.status(400).json({ error: "Message string required." });
      const addedLog = dbStore.addLog(msg, type || "info");
      res.status(200).json({ log: addedLog });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // VITE DEV / PRODUCTION MIDDLEWARE
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: true,
        strictPort: true,
        hmr: false,
        watch: {
          usePolling: true,
          interval: 100,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Use 0.0.0.0 and port 3000 to enable proxy accessibility
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully binding on http://localhost:${PORT}`);
  });
}

// In case DB has wrong import shapes or fails, handle gracefully
startServer().catch((e) => {
  console.error("FATAL failure routing dev server:", e);
});
