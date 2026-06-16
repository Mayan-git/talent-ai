/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AtsReport, 
  ResumeVersion, 
  CareerCoachProfile, 
  CareerRoadmap, 
  InterviewAnalytics, 
  VoiceInterviewSession, 
  ChatSession, 
  JobRecommendation, 
  UserNotification, 
  GamificationStats, 
  PortfolioProject,
  User,
  SpeechSample
} from "../types";

const SAAS_STORAGE_KEY = "talent_ai_saas_db";

interface SaasDatabase {
  atsReports: AtsReport[];
  resumeVersions: ResumeVersion[];
  careerCoachProfiles: CareerCoachProfile[];
  roadmaps: CareerRoadmap[];
  interviewAnalytics: InterviewAnalytics[];
  voiceSessions: VoiceInterviewSession[];
  chatSessions: ChatSession[];
  notifications: UserNotification[];
  portfolioProjects: PortfolioProject[];
  gamification: Record<string, GamificationStats>; // key: userId
}

function getInitialSaasDb(): SaasDatabase {
  return {
    atsReports: [],
    resumeVersions: [],
    careerCoachProfiles: [],
    roadmaps: [],
    interviewAnalytics: [],
    voiceSessions: [],
    chatSessions: [],
    notifications: [],
    portfolioProjects: [],
    gamification: {}
  };
}

export const saasStore = {
  get(): SaasDatabase {
    try {
      const data = localStorage.getItem(SAAS_STORAGE_KEY);
      if (!data) {
        const d = getInitialSaasDb();
        localStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify(d));
        return d;
      }
      return JSON.parse(data);
    } catch {
      return getInitialSaasDb();
    }
  },

  save(db: SaasDatabase) {
    try {
      localStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error("Local SaaS DB synchronization error:", e);
    }
  },

  generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
};

// PRESET JOB RECOMMENDATIONS FOR RECOMMENDATION ENGINE
export const PRESET_JOBS: JobRecommendation[] = [
  {
    id: "job_1",
    title: "Senior Full-Stack Engineer (React & Go)",
    company: "MetaFlow Technologies",
    location: "San Francisco, CA (Hybrid)",
    salaryEstimate: "$145,000 - $180,000",
    matchScore: 92,
    description: "Design reactive real-time dashboard dashboards and high performance API servers in a clean Kubernetes orchestration architecture.",
    skillsRequired: ["React", "TypeScript", "Go", "Docker", "Kubernetes", "gRPC", "PostgreSQL"],
    missingSkills: ["Go", "gRPC"],
    learningResources: ["Go Lang Bootcamp on Coursera", "Kubernetes Hands-On with Kind", "gRPC Mastery Guides"]
  },
  {
    id: "job_2",
    title: "Frontend Engineer - AI Product Interface",
    company: "FutureMind SaaS",
    location: "Austin, TX (Remote)",
    salaryEstimate: "$110,000 - $135,000",
    matchScore: 88,
    description: "Integrate vector search layers and Gemini model streaming features into visual layouts. Tailor accessibility parameters recursively.",
    skillsRequired: ["React", "Tailwind CSS", "TypeScript", "Vite", "Framer Motion", "Gemini API", "a11y"],
    missingSkills: ["Framer Motion", "Gemini API"],
    learningResources: ["Interactive Animations with Framer Motion", "DeepMind Gemini SDK TypeScript Integration Guides"]
  },
  {
    id: "job_3",
    title: "DevOps & Cloud Reliability Engineer",
    company: "Synergy Analytics Labs",
    location: "New York, NY (On-site)",
    salaryEstimate: "$130,000 - $165,000",
    matchScore: 65,
    description: "Manage Terraform provisioning scripts and scale server latency checks. Set up CI/CD workflows and Docker orchestration hubs.",
    skillsRequired: ["Docker", "Terraform", "AWS", "CI/CD", "Prometheus", "Kubernetes", "Linux Shell"],
    missingSkills: ["Terraform", "Prometheus", "Linux Shell"],
    learningResources: ["Terraform Cloud Provisioner Course", "Monitoring Infrastructures with Prometheus"]
  },
  {
    id: "job_4",
    title: "Junior Backend Developer",
    company: "CodeSprout Innovations",
    location: "Chicago, IL (Hybrid)",
    salaryEstimate: "$75,000 - $95,000",
    matchScore: 95,
    description: "Implement Express request pipelines, manage PostgreSQL database schemas, and create RESTful JSON endpoints.",
    skillsRequired: ["Node.js", "Express", "PostgreSQL", "REST APIs", "Git", "Jest"],
    missingSkills: ["Jest"],
    learningResources: ["Automated testing with Jest for Node.js APIs"]
  }
];

// PRESET CAREER COACHING TEMPLATES
export const COACHING_PRESETS = {
  trends: [
    { skill: "VectoDB/Generative Integrations", demand: "Surging" as const, trendDescription: "Fast rise of client products utilizing streaming interfaces and semantic search systems." },
    { skill: "Tailwind v4 & Design Tokens", demand: "High" as const, trendDescription: "Unified styling optimizations with direct compile-time Tailwind compilation." },
    { skill: "Go microservices", demand: "High" as const, trendDescription: "Replacement of legacy middleware pipelines with high-concurrency Go clusters." }
  ],
  certs: [
    "AWS Certified Solutions Architect - Associate",
    "Google Cloud Professional Cloud Developer",
    "HashiCorp Terraform Associate Certification"
  ]
};
