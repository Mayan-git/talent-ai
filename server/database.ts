/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { User, ResumeAnalysis, JobMatch, InterviewSession, InterviewStatus } from "../src/types";

const DB_FILE = path.join(process.cwd(), "db.json");

interface DatabaseSchema {
  users: User[];
  resumes: ResumeAnalysis[];
  jobMatches: JobMatch[];
  interviews: InterviewSession[];
}

function initDb(): DatabaseSchema {
  const defaultSchema: DatabaseSchema = {
    users: [],
    resumes: [],
    jobMatches: [],
    interviews: [],
  };

  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), "utf-8");
      return defaultSchema;
    }

    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    // Ensure all critical root tables exist
    return {
      users: parsed.users || [],
      resumes: parsed.resumes || [],
      jobMatches: parsed.jobMatches || [],
      interviews: parsed.interviews || [],
    };
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
    data.users.push(user);
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
    this.save(data);
    return data.users[userIndex];
  },

  // Resumes Methods
  addResume(resume: ResumeAnalysis): ResumeAnalysis {
    const data = this.get();
    data.resumes.unshift(resume); // Newest first
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
    this.save(data);
    return session;
  },

  updateInterview(sessionId: string, updates: Partial<InterviewSession>): InterviewSession {
    const data = this.get();
    const idx = data.interviews.findIndex((i) => i.id === sessionId);
    if (idx === -1) {
      throw new Error("Interview not found");
    }
    data.interviews[idx] = { ...data.interviews[idx], ...updates };
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
  }
};
