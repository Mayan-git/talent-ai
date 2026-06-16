/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { User, ResumeAnalysis, JobMatch, InterviewSession, InterviewStatus } from "../src/types";

const DB_FILE = path.join(process.cwd(), "db.json");

export interface ActivityLog {
  id: string;
  msg: string;
  time: string;
  type: "info" | "success" | "warn";
}

export interface ApiTelemetry {
  id: string;
  route: string;
  timestamp: string;
  durationMs: number;
  status: number;
}

interface DatabaseSchema {
  users: User[];
  resumes: ResumeAnalysis[];
  jobMatches: JobMatch[];
  interviews: InterviewSession[];
  logs: ActivityLog[];
  apiTelemetry: ApiTelemetry[];
}

function initDb(): DatabaseSchema {
  const defaultSchema: DatabaseSchema = {
    users: [],
    resumes: [],
    jobMatches: [],
    interviews: [],
    logs: [],
    apiTelemetry: [],
  };

  try {
    let rawData: DatabaseSchema | null = null;
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      rawData = JSON.parse(data);
    }

    const schema: DatabaseSchema = {
      users: rawData?.users || [],
      resumes: rawData?.resumes || [],
      jobMatches: rawData?.jobMatches || [],
      interviews: rawData?.interviews || [],
      logs: rawData?.logs || [],
      apiTelemetry: rawData?.apiTelemetry || [],
    };

    // Ensure Default Administrator exists
    const hasAdmin = schema.users.some(u => u.email.toLowerCase() === "admin@hirewise.ai");
    if (!hasAdmin) {
      schema.users.push({
        id: "admin_default",
        email: "admin@hirewise.ai",
        name: "Platform Administrator",
        role: "admin",
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), // 30 days ago
        title: "Systems Director",
        bio: "Root environment administrator. Head of Technical Talent Operations & Core Systems Integrations.",
        skills: ["Operations", "System Security", "Infrastructure Design", "Core Auditing"],
        experienceLevel: "Senior",
      });
    }

    // Ensure some high-fidelity Candidate Users exist for Admin dashboard presentation if empty
    if (schema.users.length <= 1) {
      const candidates: User[] = [
        {
          id: "cand_1",
          email: "sarah.connor@gmail.com",
          name: "Sarah Connor",
          role: "user",
          createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
          title: "Senior React Architect",
          bio: "Specializing in low-latency analytics dashboards and reactive state-caches.",
          skills: ["React", "TypeScript", "Tailwind CSS", "Redux", "Docker", "Node.js"],
          experienceLevel: "Senior",
        },
        {
          id: "cand_2",
          email: "marcus.wright@yahoo.com",
          name: "Marcus Wright",
          role: "user",
          createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
          title: "Full-Stack Node Engineer",
          bio: "Passionate about relational Postgres schemas, GraphQL protocols, and microservice structures.",
          skills: ["Node.js", "Express", "PostgreSQL", "Redis", "GraphQL", "CI/CD"],
          experienceLevel: "Mid-level",
        },
        {
          id: "cand_3",
          email: "john.connor@recruit.io",
          name: "John Connor",
          role: "user",
          createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          title: "Junior Backend Apprentice",
          bio: "Eager to design clean server endpoints, automate robust Jest unit tests, and build shell tasks.",
          skills: ["JavaScript", "Node.js", "Express", "Git", "Jest"],
          experienceLevel: "Junior",
        }
      ];
      schema.users.push(...candidates);

      // Seed Some Resumes
      schema.resumes = [
        {
          id: "res_1",
          userId: "cand_1",
          fileName: "Sarah_Connor_React_Architect_2026.pdf",
          score: 91,
          skills: [
            { name: "React", category: "Technical" },
            { name: "TypeScript", category: "Tools/Frameworks" },
            { name: "Tailwind CSS", category: "Tools/Frameworks" },
            { name: "Node.js", category: "Technical" },
            { name: "Docker", category: "Tools/Frameworks" }
          ],
          experience: [
            { role: "Senior Frontend Lead", company: "MetaLabs Inc", duration: "2023 - Present", highlights: ["Increased rendering speed by 35% using useMemo profiling.", "Guided team of 4 frontend engineers on a11y compliance."] }
          ],
          education: [{ degree: "M.S. Computer Science", institution: "Stanford University", year: "2022" }],
          suggestions: ["Integrate automated Playwright integration flows.", "Add explicit credentials metrics to experience headers."],
          createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: "res_2",
          userId: "cand_2",
          fileName: "Marcus_Wright_Backend_Cv.pdf",
          score: 82,
          skills: [
            { name: "Node.js", category: "Technical" },
            { name: "PostgreSQL", category: "Technical" },
            { name: "Redis", category: "Tools/Frameworks" },
            { name: "GraphQL", category: "Technical" }
          ],
          experience: [
            { role: "Full-Stack Developer", company: "Cyberdyne Corp", duration: "2021 - 2025", highlights: ["Scaled PostgreSQL indexing, speeding up analytical queries by 50%.", "Restructured API servers into secure stateless clusters."] }
          ],
          education: [{ degree: "B.S. Software Engineering", institution: "MIT", year: "2021" }],
          suggestions: ["Clarify Docker container deployment details.", "Describe key-vault setups in microservice architectures."],
          createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: "res_3",
          userId: "cand_3",
          fileName: "JohnConnorJuniorDev_Draft.docx",
          score: 64,
          skills: [
            { name: "JavaScript", category: "Technical" },
            { name: "Node.js", category: "Technical" },
            { name: "Express", category: "Technical" },
            { name: "Git", category: "Other" }
          ],
          experience: [
            { role: "Intern Developer", company: "Tech Solutions", duration: "2025 (6 months)", highlights: ["Constructed express endpoint routes according to static REST formats.", "Resolved bugs in visual dashboard styling."] }
          ],
          education: [{ degree: "Associate Degree in Coding", institution: "Tech Academy", year: "2025" }],
          suggestions: ["Enrich skills section with core frameworks like React or Tailwind.", "Provide quantifiable business impacts on key bullet-points.", "Incorporate automated testing parameters heavily using Jest."],
          createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        }
      ];

      // Seed Some Interview Sessions
      schema.interviews = [
        {
          id: "int_1",
          userId: "cand_1",
          role: "Senior React Architect",
          difficulty: "Hard",
          status: InterviewStatus.COMPLETED,
          currentQuestionIndex: 0,
          overallScore: 89,
          overallFeedback: "The candidate exhibits world-class capabilities in React reconciliation. Answers were extremely precise and descriptive, leveraging deep knowledge of performance hooks.",
          questions: [],
          answers: [],
          createdAt: new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: "int_2",
          userId: "cand_2",
          role: "Full-Stack Node Engineer",
          difficulty: "Medium",
          status: InterviewStatus.COMPLETED,
          currentQuestionIndex: 0,
          overallScore: 78,
          overallFeedback: "Good standard of database normalization and redis queuing. Response delivery was clean, but could have expounded on container security parameters.",
          questions: [],
          answers: [],
          createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: "int_3",
          userId: "cand_3",
          role: "Junior Backend Developer",
          difficulty: "Easy",
          status: InterviewStatus.SETUP,
          currentQuestionIndex: 0,
          overallScore: 0,
          overallFeedback: "",
          questions: [],
          answers: [],
          createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        }
      ];

      // Seed default Logs
      schema.logs = [
        { id: "log_init_1", msg: "Global HireWise system database bootstrapped on port 3000.", time: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), type: "info" },
        { id: "log_init_2", msg: "Platform root systems initialised.", time: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), type: "success" },
        { id: "log_init_3", msg: "Admin superuser seeded: 'admin@hirewise.ai'", time: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), type: "success" }
      ];

      // Seed default API Telemetries
      schema.apiTelemetry = [
        { id: "t_1", route: "/api/auth/signup", timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), durationMs: 120, status: 201 },
        { id: "t_2", route: "/api/resume/analyze", timestamp: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(), durationMs: 2310, status: 201 },
        { id: "t_3", route: "/api/auth/signup", timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), durationMs: 140, status: 201 },
        { id: "t_4", route: "/api/resume/analyze", timestamp: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(), durationMs: 1980, status: 201 },
        { id: "t_5", route: "/api/auth/signup", timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), durationMs: 155, status: 201 },
        { id: "t_6", route: "/api/resume/analyze", timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), durationMs: 2540, status: 201 },
      ];
    }

    // Always keep dynamic logs array capped to avoid unbounded growth (e.g. 100 items)
    if (schema.logs.length > 200) {
      schema.logs = schema.logs.slice(-150);
    }
    // Capped API telemetries too
    if (schema.apiTelemetry.length > 500) {
      schema.apiTelemetry = schema.apiTelemetry.slice(-300);
    }

    // Persist seeded state if changed / fresh
    fs.writeFileSync(DB_FILE, JSON.stringify(schema, null, 2), "utf-8");
    return schema;
  } catch (err) {
    console.error("Database initialization failed, resetting...", err);
    return defaultSchema;
  }
}

export const dbStore = {
  get(): DatabaseSchema {
    return initDb();
  },

  save(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Database save failed", err);
    }
  },

  // Users Auth Methods
  findUserByEmail(email: string): User | undefined {
    const data = this.get();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(user: User): User {
    const data = this.get();
    // Default register role to "user" unless email explicitly requests "admin"
    if (!user.role) {
      user.role = user.email.toLowerCase().includes("admin") ? "admin" : "user";
    }
    data.users.push(user);
    this.addLog(`User registration: ${user.name} (${user.email}) as role ${user.role}`, "info");
    this.save(data);
    return user;
  },

  updateUser(userId: string, updates: Partial<User>): User {
    const data = this.get();
    const userIndex = data.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    data.users[userIndex] = { ...data.users[userIndex], ...updates };
    this.addLog(`User profile modified: "${data.users[userIndex].name}"`, "info");
    this.save(data);
    return data.users[userIndex];
  },

  deleteUser(userId: string): boolean {
    const data = this.get();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return false;
    data.users = data.users.filter((u) => u.id !== userId);
    // Cascade delete user resumes & interviews to keep DB clean
    data.resumes = data.resumes.filter((r) => r.userId !== userId);
    data.jobMatches = data.jobMatches.filter((m) => m.userId !== userId);
    data.interviews = data.interviews.filter((i) => i.userId !== userId);
    this.addLog(`User account hard deleted: ${user.name} (${user.email})`, "warn");
    this.save(data);
    return true;
  },

  // Resumes Methods
  addResume(resume: ResumeAnalysis): ResumeAnalysis {
    const data = this.get();
    data.resumes.unshift(resume); // Newest first
    this.addLog(`Resume parsed successfully: ${resume.fileName}. Score: ${resume.score}%`, "success");
    this.save(data);
    return resume;
  },

  getResumes(userId: string): ResumeAnalysis[] {
    const data = this.get();
    return data.resumes.filter((r) => r.userId === userId);
  },

  // Job Matches Methods
  addJobMatch(match: JobMatch): JobMatch {
    const data = this.get();
    data.jobMatches.unshift(match);
    this.addLog(`Job alignment query made for title: "${match.jobTitle}"`, "info");
    this.save(data);
    return match;
  },

  getJobMatches(userId: string): JobMatch[] {
    const data = this.get();
    return data.jobMatches.filter((m) => m.userId === userId);
  },

  // Interviews Methods
  addInterview(session: InterviewSession): InterviewSession {
    const data = this.get();
    data.interviews.unshift(session);
    this.addLog(`Created mock interview session for role: "${session.role}"`, "info");
    this.save(data);
    return session;
  },

  updateInterview(sessionId: string, updates: Partial<InterviewSession>): InterviewSession {
    const data = this.get();
    const idx = data.interviews.findIndex((i) => i.id === sessionId);
    if (idx === -1) {
      throw new Error("Interview not found");
    }
    const current = data.interviews[idx];
    data.interviews[idx] = { ...data.interviews[idx], ...updates };
    if (updates.status === InterviewStatus.COMPLETED) {
      this.addLog(`Mock interview completed for role: "${current.role}". Final output grade: ${updates.overallScore || 0}%`, "success");
    }
    this.save(data);
    return data.interviews[idx];
  },

  getInterviews(userId: string): InterviewSession[] {
    const data = this.get();
    return data.interviews.filter((i) => i.userId === userId);
  },

  getInterviewById(sessionId: string): InterviewSession | undefined {
    const data = this.get();
    return data.interviews.find((i) => i.id === sessionId);
  },

  // Live Activity Logs & API Telemetries
  addLog(msg: string, type: "info" | "success" | "warn" = "info"): ActivityLog {
    const data = this.get();
    const log: ActivityLog = {
      id: "log_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      msg,
      time: new Date().toISOString(),
      type,
    };
    data.logs.push(log);
    // Limit to 200 logs
    if (data.logs.length > 200) {
      data.logs = data.logs.slice(-150);
    }
    // Use fs.writeFileSync directly for immediate writing
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return log;
  },

  addApiTelemetry(route: string, durationMs: number, status: number): ApiTelemetry {
    const data = this.get();
    const entry: ApiTelemetry = {
      id: "t_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      route,
      timestamp: new Date().toISOString(),
      durationMs,
      status,
    };
    data.apiTelemetry.push(entry);
    if (data.apiTelemetry.length > 500) {
      data.apiTelemetry = data.apiTelemetry.slice(-300);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return entry;
  }
};
