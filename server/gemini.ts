/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysis, JobMatch, InterviewQuestion, UserAnswer } from "../src/types";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your secrets panels.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

/**
 * Extracts and analyzes resume content from standard Base64 PDF data or clear-text CV copy.
 */
export async function analyzeResume(
  fileName: string,
  base64OrText: string,
  isPdf: boolean
): Promise<Omit<ResumeAnalysis, "id" | "userId" | "createdAt">> {
  const ai = getGeminiClient();

  let contents: any;
  if (isPdf) {
    // PDF document inline part
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64OrText,
          },
        },
        {
          text: "Conduct a comprehensive CV audit from the attached PDF. Extract name, metrics, experiences, skills, and structure suggestions.",
        },
      ],
    };
  } else {
    // Plain Text content
    contents = `Analyze the following clean text CV/Resume and conduct a comprehensive audit.
---
${base64OrText}
---`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents,
    config: {
      systemInstruction: "You are an elite, technical director and chief talent recruiter. Grade the candidate resume rigorously on metrics (0-100), extract precise technical and soft skills categorizing them, and specify actionable improvement suggestions.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: {
            type: Type.INTEGER,
            description: "A solid score from 0 to 100 mapping the readiness and quality of the CV.",
          },
          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: ["Technical", "Soft Skill", "Tools/Frameworks", "Other"],
                },
              },
              required: ["name", "category"],
            },
          },
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING },
                company: { type: Type.STRING },
                duration: { type: Type.STRING },
                highlights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["role", "company", "duration", "highlights"],
            },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING },
                institution: { type: Type.STRING },
                year: { type: Type.STRING },
              },
              required: ["degree", "institution", "year"],
            },
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["score", "skills", "experience", "education", "suggestions"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    fileName,
    score: parsed.score || 70,
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    education: parsed.education || [],
    suggestions: parsed.suggestions || [],
  };
}

/**
 * Calculates a match report comparing a Candidate Resume with a target Job Description.
 */
export async function matchJobDescription(
  resumeData: ResumeAnalysis,
  jobTitle: string,
  jobDescription: string
): Promise<Omit<JobMatch, "id" | "userId" | "createdAt" | "resumeId">> {
  const ai = getGeminiClient();

  const prompt = `
Context Resume details:
${JSON.stringify({
  skills: resumeData.skills,
  experience: resumeData.experience,
})}

Target Job Title: ${jobTitle}
Target Job Description:
${jobDescription}

Compare this resume data against the job description. Find missing skills and outline real-world learning recommendations.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are a professional recruiting analyzer. Check job description requirements. Find missing tools, libraries, or methodologies in the resume, calculate a rigorous compatibility percentage status, and generate recommendations.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchScore: {
            type: Type.INTEGER,
            description: "Percentage compatibility score between 0 and 100.",
          },
          missingSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Explicit technical, domain, or soft skills required but not verified in the resume.",
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Actionable concrete learning pathways, project topics, or books to fill the gap.",
          },
        },
        required: ["matchScore", "missingSkills", "recommendations"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    jobTitle,
    jobDescription,
    matchScore: parsed.matchScore || 50,
    missingSkills: parsed.missingSkills || [],
    recommendations: parsed.recommendations || [],
  };
}

/**
 * Generates interactive interview questions based on role, difficulty, and candidate profile context.
 */
export async function generateInterviewQuestions(
  role: string,
  difficulty: string,
  skills?: string[]
): Promise<InterviewQuestion[]> {
  const ai = getGeminiClient();

  const prompt = `
Generate 5 structured interview questions.
Role: ${role}
Difficulty Level: ${difficulty}
Candidate core skills: ${skills?.join(", ") || "software design, agile, analytics"}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are a senior technical interviewer. Create 5 realistic, challenging, and domain-appropriate interview questions with contexts and ideal response keywords. Ensure the questions target design, system structures, and soft skill situations corresponding to the selected difficulty.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                context: { type: Type.STRING },
                idealKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["id", "question", "context", "idealKeywords"],
            },
          },
        },
        required: ["questions"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return parsed.questions || [];
}

/**
 * Conducts a rigorous AI evaluation on submitted user answers.
 */
export async function evaluateInterviewAnswers(
  role: string,
  difficulty: string,
  questions: InterviewQuestion[],
  userResponses: Array<{ questionId: string; answerText: string }>
): Promise<{ overallScore: number; overallFeedback: string; answers: UserAnswer[] }> {
  const ai = getGeminiClient();

  const payload = questions.map((q) => {
    const userAns = userResponses.find((r) => r.questionId === q.id)?.answerText || "No answer submitted.";
    return {
      questionId: q.id,
      question: q.question,
      context: q.context,
      idealKeywords: q.idealKeywords,
      userAnswer: userAns,
    };
  });

  const prompt = `
Analyze the follow conversation history during an interactive evaluation.
Role: ${role}
Difficulty: ${difficulty}

Submissions:
${JSON.stringify(payload)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are an elite expert grading a technical interview. Grade each response on a scale of 0-100, generate targeted helpful critique highlighting exactly what they missed technically, and deliver a holistic review score and summary feedback.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.INTEGER },
          overallFeedback: { type: Type.STRING },
          answers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionId: { type: Type.STRING },
                answerText: { type: Type.STRING, description: "Keep user's raw answerText structure." },
                score: { type: Type.INTEGER },
                feedback: { type: Type.STRING },
                suggestions: { type: Type.STRING },
              },
              required: ["questionId", "answerText", "score", "feedback", "suggestions"],
            },
          },
        },
        required: ["overallScore", "overallFeedback", "answers"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    overallScore: parsed.overallScore || 60,
    overallFeedback: parsed.overallFeedback || "Evaluation completed gracefully.",
    answers: parsed.answers || [],
  };
}
