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
  role?: "admin" | "user";
  experienceLevel?: "Junior" | "Mid-level" | "Senior" | "Executive";
  plan?: "Free" | "Pro" | "Enterprise" | string;
  photoURL?: string;
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

// 1. ATS Resume Checker Types
export interface AtsReport {
  id: string;
  userId: string;
  fileName: string;
  compatibilityScore: number;
  keywordOptimization: {
    matched: string[];
    missing: string[];
    densityScore: number; // 0-100
  };
  formattingAnalysis: {
    fontCheck: "Success" | "Warning" | "Error";
    tablesCheck: "Success" | "Warning";
    columnsCheck: "Success" | "Warning";
    overallNotes: string;
  };
  sectionCompleteness: {
    contact: boolean;
    summary: boolean;
    experience: boolean;
    skills: boolean;
    education: boolean;
  };
  recommendations: string[];
  createdAt: string;
}

// 2. AI Resume Builder Workspace Types
export interface ResumeVersion {
  id: string;
  userId: string;
  title: string;
  templateId: "modern" | "editorial" | "technical" | "minimalist";
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
  };
  skills: string[];
  experience: Array<{
    id: string;
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
  }>;
  createdAt: string;
}

// 3. AI Career Coach Types
export interface CareerCoachProfile {
  id: string;
  userId: string;
  weeklyGoals: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  industryTrends: Array<{
    skill: string;
    demand: "High" | "Medium" | "Surging";
    trendDescription: string;
  }>;
  recommendedCertifications: string[];
  aiAdvisorNotes: string;
  progressScore: number; // 0-100
  updatedAt: string;
}

// 4. Personalized Learning Roadmap Types
export interface RoadmapItem {
  id: string;
  title: string;
  duration: string;
  description: string;
  techStack: string[];
  resources: Array<{ name: string; url: string; free: boolean }>;
  completed: boolean;
}

export interface CareerRoadmap {
  id: string;
  userId: string;
  role: string;
  difficulty: string;
  daysDuration: 30 | 60 | 90;
  skillsPlan: string[];
  phases: Array<{
    phaseTitle: string;
    timeframe: string;
    items: RoadmapItem[];
  }>;
  projectRecommendations: Array<{
    title: string;
    description: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    stack: string[];
  }>;
  createdAt: string;
}

// 5. Interview Analytics Dashboard
export interface TopicScore {
  topic: string;
  score: number;
}

export interface InterviewAnalytics {
  id: string;
  userId: string;
  categoryPerformance: TopicScore[];
  technicalScore: number;
  communicationScore: number;
  readinessScore: number;
  weakAreas: string[];
  strongAreas: string[];
  historicalMetrics: Array<{
    date: string;
    score: number;
    communication: number;
    fluency: number;
  }>;
  aiImprovementPrompt: string;
  updatedAt: string;
}

// 6. Voice Mock Interview Types
export interface SpeechSample {
  id: string;
  questionText: string;
  answerText: string;
  transcriptionConfidence: number;
  fluencyScore: number;
  pronunciationFeedback: string;
  confidenceScore: number; // 0-100
}

export interface VoiceInterviewSession {
  id: string;
  userId: string;
  role: string;
  difficulty: string;
  status: string;
  voiceGender: "male" | "female" | "neutral";
  speechSamples: SpeechSample[];
  overallCommunicationScore: number;
  overallScore: number;
  createdAt: string;
}

// 7. AI Career Assistant Chatbot Types
export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

// 8. Job Recommendation & 9. Skill Gap Analyzer Types
export interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  description: string;
  skillsRequired: string[];
  salaryEstimate: string;
  missingSkills: string[];
  learningResources: string[];
}

// 10. Notification System
export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  read: boolean;
  createdAt: string;
}

// 11. Gamification System
export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt: string;
}

export interface GamificationStats {
  level: number;
  xp: number;
  xpNextLevel: number;
  streakDays: number;
  achievements: UserAchievement[];
}

// 12. Portfolio Project Generator
export interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  techStack: string[];
  milestones: string[];
  resumeBulletSuggestions: string[];
}

