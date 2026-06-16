/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, ResumeAnalysis, JobMatch, InterviewSession, InterviewStatus, InterviewQuestion, UserAnswer, DashboardStats } from "../types";

// Key for storage persistence
const LOCAL_STORAGE_KEY = "talent_ai_local_db";

interface DatabaseSchema {
  users: User[];
  resumes: ResumeAnalysis[];
  jobMatches: JobMatch[];
  interviews: InterviewSession[];
}

// Initial default database state
function getInitialDb(): DatabaseSchema {
  return {
    users: [],
    resumes: [],
    jobMatches: [],
    interviews: [],
  };
}

// Persistent Store Helper
export const clientStore = {
  get(): DatabaseSchema {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!data) {
        const d = getInitialDb();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(d));
        return d;
      }
      const parsed = JSON.parse(data);
      return {
        users: parsed.users || [],
        resumes: parsed.resumes || [],
        jobMatches: parsed.jobMatches || [],
        interviews: parsed.interviews || [],
      };
    } catch {
      return getInitialDb();
    }
  },

  save(data: DatabaseSchema) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }
};

// Simple ID Generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// High-Fidelity Question Database for Simulated Interviews
const PRESET_QUESTIONS: Record<string, Array<{ question: string; context: string; idealKeywords: string[] }>> = {
  frontend: [
    {
      question: "How do you optimize a complex React application suffering from performance bottlenecks and rendering lag?",
      context: "Assess the candidate's mastery of React reconciliation, rendering cycles, memoization hooks, and virtual list scrolling.",
      idealKeywords: ["useMemo", "useCallback", "memo", "virtualization", "reconciliation", "profiler", "render-overhead"]
    },
    {
      question: "Explain the differences between client-side rendering (CSR), server-side rendering (SSR), and static site generation (SSG). When would you choose which?",
      context: "Deduce architectural decision-making, SEO standards, cumulative layout shifts, and bundle hydration metrics.",
      idealKeywords: ["SEO", "hydration", "nextjs", "build-time", "TTFB", "server-side", "bundle-size"]
    },
    {
      question: "Describe your strategy for writing highly scalable, adaptive CSS code across extensive enterprise dashboards.",
      context: "Examine understanding of styled architectures, utility-first designs like Tailwind, design tokens, and modular layouts.",
      idealKeywords: ["tailwind", "design-tokens", "mobile-first", "theme", "flexbox", "grid", "vars"]
    },
    {
      question: "How do you manage complex asynchronous operations, pagination states, and side-effects in enterprise frontend applications?",
      context: "Evaluate knowledge of data-fetching tools, state synchronizations, optimistic updates, and client caches.",
      idealKeywords: ["react-query", "rxjs", "optimistic", "cache", "useeffect", "abortcontroller", "debounce"]
    },
    {
      question: "What is your approach to ensuring frontend web accessibility (a11y) conformant to WCAG standards?",
      context: "Explore focus flows, screen readers, semantic HTML elements, and keyboard interactive support layers.",
      idealKeywords: ["aria", "semantic", "wcag", "screen-readers", "contrast", "tabindex", "lighthouse"]
    }
  ],
  backend: [
    {
      question: "How would you design a distributed database architecture for an application with extremely high read/write volume?",
      context: "Examine knowledge of replication strategies, database indexing, caching strategies, and partition keys.",
      idealKeywords: ["redis", "sharding", "replication", "indexing", "nosql", "postgres", "partition-key"]
    },
    {
      question: "Explain how you implement secure, stateless authentication and session flows across split microservices.",
      context: "Test understandings of token signatures, encryption, secure transport layers, and secret rotations.",
      idealKeywords: ["jwt", "oauth", "stateless", "cookies", "refresh-token", "key-rotation", "cors"]
    },
    {
      question: "Describe your approach to finding and mitigating a performance bottleneck in a deep relational database query.",
      context: "Deduce query optimizations, plan explanations, joins, foreign keys, and slow-query log auditing.",
      idealKeywords: ["explain", "query-plan", "indexes", "n+1", "connection-pooling", "joins", "denormalize"]
    },
    {
      question: "How do you handle reliable asynchronous background jobs and message processing systems safely?",
      context: "Assess queue architectures, retry backoffs, idempotent operations, and race conditions.",
      idealKeywords: ["rabbitmq", "kafka", "bullmq", "idempotency", "backoff", "dlq", "redis"]
    },
    {
      question: "How do you design REST APIs and ensure safe backward compatibility as business product requirements evolve?",
      context: "Inspect versioning techniques, schema migrations, optional fields, and strict contract definitions.",
      idealKeywords: ["versioning", "deprecate", "schema", "validation", "rest", "graphql", "openapi"]
    }
  ]
};

// Fallback questions for custom roles
const GENERAL_QUESTIONS = [
  {
    question: "Can you detail a complex technical problem you solved, your decision-making framework, and the final business impact?",
    context: "Assess situational analysis, collaboration levels, and clarity of high-level communication.",
    idealKeywords: ["impact", "trade-offs", "monitoring", "architecture", "scalability"]
  },
  {
    question: "How do you systematically structure your tasks when working in high-pace iterative development sprints?",
    context: "Explore time prioritization, requirement discussions, documentation habits, and scope controls.",
    idealKeywords: ["agile", "sprint", "milestones", "jira", "documentation"]
  },
  {
    question: "Explain your process for ensuring your code stays heavily covered by automated testing without hurting build speed.",
    context: "Examine practices on unit tests, integration matches, end-to-end setups, and mocking conventions.",
    idealKeywords: ["jest", "unit-test", "mocking", "coverage", "playwright", "ci-cd"]
  },
  {
    question: "How do you identify, handle, and resolve technical team conflicts or differing opinions on architectural directions?",
    context: "Analyze emotional intelligence, professional arguments, consensus standards, and documentation guidelines.",
    idealKeywords: ["consensus", "rfc", "compromise", "collaboration", "empathy"]
  },
  {
    question: "What is your continuous learning strategy to stay updated with tech advancements and library deprecations?",
    context: "Ensure the candidate displays high curiosity-driven engineering standards.",
    idealKeywords: ["newsletter", "open-source", "prototype", "community", "standards"]
  }
];

// Replicates the entire router handlers inside client memory
export async function handleClientRequest(urlStr: string, options?: any): Promise<Response | null> {
  // Parse relative URL
  const url = new URL(urlStr, window.location.origin);
  const pathName = url.pathname;
  const method = (options?.method || "GET").toUpperCase();
  const body = options?.body ? JSON.parse(options.body) : {};

  const db = clientStore.get();

  const responseHeaders = { "Content-Type": "application/json" };
  const okResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), { status, headers: responseHeaders });
  };
  const errorResponse = (msg: string, status = 400) => {
    return new Response(JSON.stringify({ error: msg }), { status, headers: responseHeaders });
  };

  // ==========================================
  // AUTH API ROUTER
  // ==========================================

  if (pathName === "/api/auth/signup" && method === "POST") {
    const { email, password, name } = body;
    if (!email || !password || !name) {
      return errorResponse("Missing required registration parameters.");
    }

    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return errorResponse("Email already registered on this platform.");
    }

    const user: User = {
      id: generateId(),
      email,
      name,
      createdAt: new Date().toISOString(),
      skills: [],
      experienceLevel: "Junior",
      title: "Developer Aspirant",
      bio: "Developing my profile to land my dream job.",
    };

    db.users.push(user);
    clientStore.save(db);
    return okResponse({ user }, 201);
  }

  if (pathName === "/api/auth/login" && method === "POST") {
    const { email, password } = body;
    if (!email || !password) {
      return errorResponse("Email and password are required.");
    }

    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // For highly resilient UX on custom deploys, if there's no user, create a temporary session user
      const tempUser: User = {
        id: generateId(),
        email: email,
        name: email.split("@")[0],
        createdAt: new Date().toISOString(),
        skills: ["React", "JavaScript", "Tailwind CSS"],
        experienceLevel: "Mid-level",
        title: "Software Engineer",
        bio: "Simulated local-first dashboard profile created dynamically.",
      };
      db.users.push(tempUser);
      clientStore.save(db);
      return okResponse({ user: tempUser });
    }

    return okResponse({ user });
  }

  if (pathName === "/api/auth/forgot-password" && method === "POST") {
    return okResponse({ message: "Password reset link emitted successfully (locally simulated)." });
  }

  if (pathName === "/api/auth/profile" && method === "PUT") {
    const { userId, title, bio, experienceLevel, skills } = body;
    if (!userId) {
      return errorResponse("userId is required to update profile.");
    }

    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return errorResponse("User not found");
    }

    db.users[userIndex] = {
      ...db.users[userIndex],
      title: title ?? db.users[userIndex].title,
      bio: bio ?? db.users[userIndex].bio,
      experienceLevel: experienceLevel ?? db.users[userIndex].experienceLevel,
      skills: skills ?? db.users[userIndex].skills,
    };

    clientStore.save(db);
    return okResponse({ user: db.users[userIndex] });
  }

  // Get user details
  const userMatch = pathName.match(/^\/api\/auth\/user\/([^/]+)$/);
  if (userMatch && method === "GET") {
    const userId = userMatch[1];
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return errorResponse("User not found.", 404);
    }
    return okResponse({ user });
  }

  // ==========================================
  // RESUME ANALYZER ROUTER
  // ==========================================

  if (pathName === "/api/resume/analyze" && method === "POST") {
    const { userId, fileName, base64Data, isPdf } = body;
    if (!userId || !fileName || !base64Data) {
      return errorResponse("Missing required resume parsing payload.");
    }

    // High fidelity simulator content
    const randScore = Math.floor(Math.random() * 22) + 73; // 73 to 95
    
    // Guess some skills from the filename or plain content
    const guessedSkills: string[] = ["JavaScript", "TypeScript", "React", "Node.js", "Web APIs", "Tailwind CSS", "Git"];
    if (fileName.toLowerCase().includes("python") || base64Data.toLowerCase().includes("python")) {
      guessedSkills.push("Python", "FastAPI", "SQLAlchemy", "PostgreSQL");
    } else if (fileName.toLowerCase().includes("java") || base64Data.toLowerCase().includes("java")) {
      guessedSkills.push("Java", "Spring Boot", "Maven", "MySQL");
    } else {
      guessedSkills.push("Redux Toolkit", "Next.js", "Jest", "Docker");
    }

    const skillsOutput = guessedSkills.map((s, idx) => ({
      name: s,
      category: (idx % 3 === 0 ? "Technical" : idx % 3 === 1 ? "Tools/Frameworks" : "Soft Skill") as any,
    }));

    const suggestions = [
      "Explicitly quantify achievements using standard metric values (e.g. 'boosted build latency by 40%').",
      "Mention your standard continuous integration/deployment protocols (CI/CD pipelines).",
      "Enhance structural visibility in formatting to guide automated screeners.",
      "Add direct links to active projects, portfolios, or public engineering profiles.",
    ];

    const resume: ResumeAnalysis = {
      id: generateId(),
      userId,
      fileName,
      score: randScore,
      skills: skillsOutput,
      experience: [
        {
          role: "Senior Software Engineer",
          company: "Vertex Tech Laboratories",
          duration: "2024 - Present",
          highlights: [
            "Engineered low-latency application dashboards using optimized state stores.",
            "Mentored 6 junior engineers on writing testable, robust functional components.",
            "Integrated continuous deployments minimizing release window overheads."
          ]
        },
        {
          role: "Full-Stack Developer",
          company: "Cloud Solutions Enterprise",
          duration: "2021 - 2024",
          highlights: [
            "Built robust, secure relational databases and GraphQL endpoints.",
            "Optimized search performance metrics reducing total latency levels.",
            "Spearheaded mobile layouts generating 25% extra retention rates."
          ]
        }
      ],
      education: [
        {
          degree: "B.S. in Computer Science",
          institution: "State University of Technology",
          year: "2021"
        }
      ],
      suggestions,
      createdAt: new Date().toISOString(),
    };

    db.resumes.unshift(resume);

    // Update user profile skills if empty or thin
    const userIdx = db.users.findIndex((u) => u.id === userId);
    if (userIdx !== -1) {
      const u = db.users[userIdx];
      if (!u.skills || u.skills.length === 0) {
        db.users[userIdx].skills = guessedSkills;
      }
    }

    clientStore.save(db);
    return okResponse({ resume }, 201);
  }

  const resumeHistoryMatch = pathName.match(/^\/api\/resume\/history\/([^/]+)$/);
  if (resumeHistoryMatch && method === "GET") {
    const userId = resumeHistoryMatch[1];
    const userResumes = db.resumes.filter((r) => r.userId === userId);
    return okResponse({ resumes: userResumes });
  }

  // ==========================================
  // JOB MATCHING ROUTER
  // ==========================================

  if (pathName === "/api/job-match/run" && method === "POST") {
    const { userId, resumeId, jobTitle, jobDescription } = body;
    if (!userId || !resumeId || !jobTitle || !jobDescription) {
      return errorResponse("Missing essential match payload.");
    }

    const resume = db.resumes.find((r) => r.id === resumeId);
    const resumeSkills = resume ? resume.skills.map(s => s.name.toLowerCase()) : [];

    // Analyze target descriptions for standard technologies and find missing skills
    const possibleGaps = ["Docker", "Kubernetes", "AWS Cloud", "GraphQL", "Azure", "CI/CD Orchestration", "Redis Cache", "System Design Patterns"];
    const matchedGaps: string[] = [];

    // Look for matching elements
    possibleGaps.forEach(gap => {
      if (jobDescription.toLowerCase().includes(gap.toLowerCase()) && !resumeSkills.includes(gap.toLowerCase())) {
        matchedGaps.push(gap);
      }
    });

    if (matchedGaps.length === 0) {
      // Pick some random ones to simulate gap metrics
      matchedGaps.push("AWS Cloud Administration", "Redis Distributed Cache");
    }

    const score = Math.max(50, 95 - matchedGaps.length * 7);

    const learnRoadmap = matchedGaps.map(g => `Enroll in an authorized ${g} specialization course and structure a showcase project integrating this framework.`);

    const match: JobMatch = {
      id: generateId(),
      userId,
      resumeId,
      jobTitle,
      jobDescription,
      matchScore: score,
      missingSkills: matchedGaps,
      recommendations: [
        "Align your CV summary explicitly to mention distributed scalability architectures.",
        ...learnRoadmap,
        "Review interview cheat-sheets focusing on system design patterns for standard enterprise applications."
      ],
      createdAt: new Date().toISOString(),
    };

    db.jobMatches.unshift(match);
    clientStore.save(db);
    return okResponse({ jobMatch: match }, 201);
  }

  const jobMatchHistoryMatch = pathName.match(/^\/api\/job-match\/history\/([^/]+)$/);
  if (jobMatchHistoryMatch && method === "GET") {
    const userId = jobMatchHistoryMatch[1];
    const userMatches = db.jobMatches.filter((m) => m.userId === userId);
    return okResponse({ matches: userMatches });
  }

  // ==========================================
  // INTERVIEW ROUTER
  // ==========================================

  if (pathName === "/api/interview/create" && method === "POST") {
    const { userId, role, difficulty } = body;
    if (!userId || !role || !difficulty) {
      return errorResponse("Missing user credentials, target role, or difficulty.");
    }

    // Try to find preset questions matching the general domain or fall back to general ones
    let sourceQuestions = GENERAL_QUESTIONS;
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes("front") || lowerRole.includes("react") || lowerRole.includes("web")) {
      sourceQuestions = PRESET_QUESTIONS.frontend;
    } else if (lowerRole.includes("back") || lowerRole.includes("node") || lowerRole.includes("database") || lowerRole.includes("sys")) {
      sourceQuestions = PRESET_QUESTIONS.backend;
    }

    // Map into proper interview question blocks
    const questions: InterviewQuestion[] = sourceQuestions.map((q, idx) => ({
      id: `q_${idx}_${generateId()}`,
      question: q.question,
      context: `Difficulty: ${difficulty}. ${q.context}`,
      idealKeywords: q.idealKeywords,
    }));

    const session: InterviewSession = {
      id: generateId(),
      userId,
      role,
      difficulty,
      status: InterviewStatus.SETUP,
      questions,
      answers: [],
      currentQuestionIndex: 0,
      overallScore: 0,
      overallFeedback: "",
      createdAt: new Date().toISOString(),
    };

    db.interviews.unshift(session);
    clientStore.save(db);
    return okResponse({ session }, 201);
  }

  if (pathName === "/api/interview/submit-answers" && method === "POST") {
    const { sessionId, userResponses } = body;
    if (!sessionId || !userResponses || !Array.isArray(userResponses)) {
      return errorResponse("Invalid submission array shape.");
    }

    const sessionIdx = db.interviews.findIndex((i) => i.id === sessionId);
    if (sessionIdx === -1) {
      return errorResponse("The active interview session is not found.", 404);
    }

    const session = db.interviews[sessionIdx];
    let totalScore = 0;

    const answers: UserAnswer[] = session.questions.map((q) => {
      const userRes = userResponses.find((r) => r.questionId === q.id);
      const answerText = userRes?.answerText || "No answer submitted.";

      // Grade the answer based on keyword matches and length
      const lowerText = answerText.toLowerCase();
      let matchesCount = 0;
      q.idealKeywords.forEach((k) => {
        if (lowerText.includes(k.toLowerCase())) matchesCount++;
      });

      const wordsCount = answerText.split(/\s+/).filter(Boolean).length;
      let score = 50; // base score

      if (wordsCount > 10) score += 10;
      if (wordsCount > 25) score += 15;
      score += Math.min(25, matchesCount * 8); // match bonus

      score = Math.min(100, Math.max(30, score));
      totalScore += score;

      const matchedKw = q.idealKeywords.filter(k => lowerText.includes(k.toLowerCase()));
      const missingKw = q.idealKeywords.filter(k => !lowerText.includes(k.toLowerCase()));

      let feedback = "Nice effort. You clearly have some high level awareness of this issue.";
      if (score >= 85) {
        feedback = `Excellent, comprehensive answer. You integrated crucial ideas like: ${matchedKw.join(", ")}.`;
      } else if (score >= 65) {
        feedback = `Solid answer covering primary details. However, expand on standard implementation strategies. Recognized: ${matchedKw.join(", ") || "none"}.`;
      } else {
        feedback = `Minimal response. It is crucial to address underlying core mechanics. Expand on engineering trade-offs.`;
      }

      let suggestions = "Be sure to speak in absolute engineering specifics. Map out your trade-off criteria clearly.";
      if (missingKw.length > 0) {
        suggestions = `Ensure you talk and elaborate on terms like: ${missingKw.slice(0, 3).join(", ")} inside future answers.`;
      }

      return {
        questionId: q.id,
        answerText,
        score,
        feedback,
        suggestions
      };
    });

    const overallScore = Math.round(totalScore / session.questions.length);

    db.interviews[sessionIdx] = {
      ...session,
      answers,
      overallScore,
      overallFeedback: `Completed beautifully with an aggregate grade of ${overallScore}%. You showcase solid conceptual strengths. Focus on deepening production engineering frameworks, data consistency, and low-level diagnostic parameters.`,
      status: InterviewStatus.COMPLETED
    };

    clientStore.save(db);
    return okResponse({ session: db.interviews[sessionIdx] });
  }

  const interviewHistoryMatch = pathName.match(/^\/api\/interview\/history\/([^/]+)$/);
  if (interviewHistoryMatch && method === "GET") {
    const userId = interviewHistoryMatch[1];
    const userInterviews = db.interviews.filter((i) => i.userId === userId);
    return okResponse({ sessions: userInterviews });
  }

  const interviewSessionMatch = pathName.match(/^\/api\/interview\/session\/([^/]+)$/);
  if (interviewSessionMatch && method === "GET") {
    const sessionId = interviewSessionMatch[1];
    const session = db.interviews.find((i) => i.id === sessionId);
    if (!session) {
      return errorResponse("Interview session not found.", 404);
    }
    return okResponse({ session });
  }

  // ==========================================
  // DASHBOARD AGGREGATED STATISTIC ENDPOINTS
  // ==========================================

  const dashboardMatch = pathName.match(/^\/api\/dashboard\/stats\/([^/]+)$/);
  if (dashboardMatch && method === "GET") {
    const userId = dashboardMatch[1];

    const userResumes = db.resumes.filter((r) => r.userId === userId);
    const userInterviews = db.interviews.filter((i) => i.userId === userId && i.status === InterviewStatus.COMPLETED);
    const userMatches = db.jobMatches.filter((m) => m.userId === userId);

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

    const stats: DashboardStats = {
      resumeCount: userResumes.length,
      averageResumeScore: avgResumeScore,
      interviewsCount: userInterviews.length,
      averageInterviewScore: avgInterviewScore,
      skillGapsTrackedCount: uniqueGaps.size,
      recentActivity: activities.slice(0, 5),
    };

    return okResponse(stats);
  }

  // Not handled by simulation router
  return null;
}
