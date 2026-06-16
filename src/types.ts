/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Kept secure on backend
  createdAt: string;
  title?: string;
  bio?: string;
  skills?: string[];
  experienceLevel?: "Junior" | "Mid-level" | "Senior" | "Executive";
}

// Resume Analysis Types
export interface SkillExtraction {
  name: string;
  category: "Technical" | "Soft Skill" | "Tools/Frameworks" | "Other";
}

export interface ExperienceExtraction {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface EducationExtraction {
  degree: string;
  institution: string;
  year: string;
}

export interface ResumeAnalysis {
  id: string;
  userId: string;
  fileName: string;
  score: number;
  skills: SkillExtraction[];
  experience: ExperienceExtraction[];
  education: EducationExtraction[];
  suggestions: string[];
  fileSize?: string;
  createdAt: string;
}

// Job Matching / Skill Gap Tracking Types
export interface JobMatch {
  id: string;
  userId: string;
  resumeId: string;
  jobTitle: string;
  jobDescription: string;
  matchScore: number;
  missingSkills: string[];
  recommendations: string[];
  createdAt: string;
}

// Interactive Simulated Interview Module Types
export interface InterviewQuestion {
  id: string;
  question: string;
  context: string;
  idealKeywords: string[];
}

export interface UserAnswer {
  questionId: string;
  answerText: string;
  score: number; // 0-100 score for this individual answer
  feedback: string; // concise targeted critique
  suggestions: string; // constructive advice
}

export enum InterviewStatus {
  SETUP = "SETUP",
  ONGOING = "ONGOING",
  EVALUATING = "EVALUATING",
  COMPLETED = "COMPLETED"
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  status: InterviewStatus;
  questions: InterviewQuestion[];
  answers: UserAnswer[];
  currentQuestionIndex: number;
  overallScore: number;
  overallFeedback: string;
  createdAt: string;
}

// Dashboard Summary Stats
export interface DashboardStats {
  resumeCount: number;
  averageResumeScore: number;
  interviewsCount: number;
  averageInterviewScore: number;
  skillGapsTrackedCount: number;
  recentActivity: Array<{
    type: "RESUME" | "JOB_MATCH" | "INTERVIEW";
    id: string;
    title: string;
    subtitle: string;
    score: number;
    date: string;
  }>;
}
