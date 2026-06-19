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
  generateCoverLetter,
  analyzeLinkedInProfile,
} from "./server/gemini";
import { InterviewStatus } from "./src/types";
import { adminDb, projectId, databaseId, isFirestoreActive, checkFirestoreActive } from "./server/firebaseAdmin";
import Razorpay from "razorpay";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Check Firestore administrative connectivity at bootup asynchronously
  await checkFirestoreActive();

  // Set higher limits for base64 resume uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Helper function to generate UUID-like strings
  function generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  // ==========================================
  // FIREBASE FIRESTORE SYNC & RATE LIMIT UTILITIES
  // ==========================================

  async function getFirestoreUser(userId: string): Promise<any> {
    if (isFirestoreActive) {
      try {
        const docRef = adminDb.collection("users").doc(userId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          return docSnap.data();
        }
      } catch (e) {
        console.warn("Firestore error fetching user, falling back to local DB:", e);
      }
    }
    return dbStore.get().users.find(u => u.id === userId) || null;
  }

  async function saveFirestoreUser(userId: string, data: any): Promise<void> {
    if (isFirestoreActive) {
      try {
        const docRef = adminDb.collection("users").doc(userId);
        await docRef.set(data, { merge: true });
      } catch (e) {
        console.warn("Firestore error saving user, falling back to local DB:", e);
      }
    }
    const localUser = dbStore.get().users.find(u => u.id === userId);
    if (localUser) {
      dbStore.updateUser(userId, data);
    } else {
      dbStore.createUser({ id: userId, ...data });
    }
  }

  async function checkAtsScanLimit(userId: string): Promise<{ allowed: boolean; count: number }> {
    try {
      const user = await getFirestoreUser(userId);
      const plan = (user?.plan || "free").toLowerCase();
      if (plan === "pro" || plan === "enterprise") {
        return { allowed: true, count: 0 };
      }

      const startOfMo = new Date();
      startOfMo.setDate(1);
      startOfMo.setHours(0,0,0,0);

      if (isFirestoreActive) {
        try {
          const snap = await adminDb.collection("atsHistory")
            .where("userId", "==", userId)
            .where("createdAt", ">=", startOfMo.toISOString())
            .get();
          if (snap.size >= 3) {
            return { allowed: false, count: snap.size };
          }
          return { allowed: true, count: snap.size };
        } catch (firestoreErr) {
          // fall through to local fallback
        }
      }

      const localMatches = dbStore.getResumes(userId).filter(r => new Date(r.createdAt) >= startOfMo);
      if (localMatches.length >= 3) {
        return { allowed: false, count: localMatches.length };
      }
      return { allowed: true, count: localMatches.length };
    } catch (e) {
      return { allowed: true, count: 0 };
    }
  }

  async function checkInterviewLimit(userId: string): Promise<{ allowed: boolean; count: number }> {
    try {
      const user = await getFirestoreUser(userId);
      const plan = (user?.plan || "free").toLowerCase();
      if (plan === "pro" || plan === "enterprise") {
        return { allowed: true, count: 0 };
      }

      const startOfMo = new Date();
      startOfMo.setDate(1);
      startOfMo.setHours(0,0,0,0);

      if (isFirestoreActive) {
        try {
          const snap = await adminDb.collection("interviews")
            .where("userId", "==", userId)
            .where("createdAt", ">=", startOfMo.toISOString())
            .get();
          if (snap.size >= 5) {
            return { allowed: false, count: snap.size };
          }
          return { allowed: true, count: snap.size };
        } catch (firestoreErr) {
          // fall through to local fallback
        }
      }

      const localInvs = dbStore.getInterviews(userId).filter(i => new Date(i.createdAt) >= startOfMo);
      if (localInvs.length >= 5) {
        return { allowed: false, count: localInvs.length };
      }
      return { allowed: true, count: localInvs.length };
    } catch (e) {
      return { allowed: true, count: 0 };
    }
  }

  // ==========================================
  // RAZORPAY INTEGRATION ENDPOINTS
  // ==========================================
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      const { plan, userId } = req.body;
      if (!userId || !plan) {
        return res.status(400).json({ error: "Missing required order arguments." });
      }

      const amount = plan === "pro" ? 29900 : plan === "enterprise" ? 499900 : 0;
      if (amount === 0) {
        return res.status(400).json({ error: "Invalid payment plan." });
      }

      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!razorpayKeyId || !razorpayKeySecret) {
        const mockOrderId = "order_sim_" + Math.random().toString(36).substring(2, 11);
        console.log(`[Razorpay Sandbox] Creating simulated order ${mockOrderId} for plan ${plan}`);
        return res.json({
          orderId: mockOrderId,
          amount,
          currency: "INR",
          simulated: true,
          keyId: "rzp_test_simulated_key"
        });
      }

      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      });

      const options = {
        amount,
        currency: "INR",
        receipt: `receipt_${userId}_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.status(201).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        simulated: false,
        keyId: razorpayKeyId
      });
    } catch (e: any) {
      console.error("Razorpay order creation failure:", e);
      res.status(500).json({ error: e.message || "Failed to create payment order." });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { userId, plan, razorpay_order_id, razorpay_payment_id, razorpay_signature, simulated } = req.body;
      if (!userId || !plan) {
        return res.status(400).json({ error: "Missing identity or plan info." });
      }

      if (simulated || !razorpay_signature) {
        console.log(`[Razorpay Sandbox] Verifying simulated checkout for user ${userId} plan ${plan}`);
        const dbUser = await getFirestoreUser(userId) || {
          id: userId,
          email: `${userId}@simulated.com`,
          name: "Candidate Professional",
          createdAt: new Date().toISOString()
        };

        const updatedUser = {
          ...dbUser,
          plan: plan === "pro" ? "pro" : "enterprise",
          updatedAt: new Date().toISOString()
        };

        await saveFirestoreUser(userId, updatedUser);
        dbStore.addLog(`User ${userId} upgraded to ${plan} subscription (Simulated Checkout)`, "success");

        return res.json({ success: true, user: updatedUser });
      }

      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!razorpayKeySecret) {
        return res.status(400).json({ error: "Secrets are not loaded on backend server." });
      }

      const crypto = await import("crypto");
      const generated_signature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid payment signature verification failed." });
      }

      const dbUser = await getFirestoreUser(userId) || {
        id: userId,
        email: `${userId}@hirewise.ai`,
        name: "Premium Member",
        createdAt: new Date().toISOString()
      };

      const updatedUser = {
        ...dbUser,
        plan: plan === "pro" ? "pro" : "enterprise",
        updatedAt: new Date().toISOString()
      };

      await saveFirestoreUser(userId, updatedUser);
      dbStore.addLog(`User ${userId} upgraded to ${plan} subscription successfully via Razorpay`, "success");

      return res.json({ success: true, user: updatedUser });
    } catch (e: any) {
      console.error("Payment verification failure:", e);
      res.status(500).json({ error: e.message || "Failed to process payment verification." });
    }
  });

  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      const signature = req.headers["x-razorpay-signature"];

      if (!razorpayKeySecret || !signature) {
        return res.status(400).json({ error: "Webhook validation headers missing." });
      }

      const crypto = await import("crypto");
      const shasum = crypto.createHmac("sha256", razorpayKeySecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== signature) {
        return res.status(400).send("Invalid Webhook Signature");
      }

      const event = req.body;
      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        const notes = payment.notes || {};
        const userId = notes.userId;
        const plan = notes.plan;

        if (userId && plan) {
          const dbUser = await getFirestoreUser(userId);
          if (dbUser) {
            const updatedUser = {
              ...dbUser,
              plan: plan,
              updatedAt: new Date().toISOString()
            };
            await saveFirestoreUser(userId, updatedUser);
            dbStore.addLog(`Webhook: User ${userId} upgraded to ${plan} subscription`, "success");
          }
        }
      }

      res.json({ status: "ok" });
    } catch (e: any) {
      console.error("Webhook processing error:", e);
      res.status(500).send("Webhook processing error");
    }
  });

  app.get("/api/diagnostics", async (req, res) => {
    let firestoreStatus = "unknown";
    let firestoreMessage = "";
    try {
      // Attempt a safe, simple get to check Firestore administrative connectivity
      const snap = await adminDb.collection("users").limit(1).get();
      firestoreStatus = "success";
      firestoreMessage = `Successfully read users collection. Size: ${snap.size}`;
    } catch (e: any) {
      firestoreStatus = "error";
      firestoreMessage = e.toString() + (e.stack ? "\n" + e.stack : "");
    }

    res.json({
      gcp: {
        GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || null,
        GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || null,
        NODE_ENV: process.env.NODE_ENV || null,
      },
      firebaseAdmin: {
        resolvedProjectId: projectId,
        resolvedDatabaseId: databaseId,
      },
      firestoreTest: {
        status: firestoreStatus,
        message: firestoreMessage,
      }
    });
  });


  // ==========================================
  // AUTH API ENDPOINTS
  // ==========================================

  app.post("/api/auth/sync", async (req, res) => {
    try {
      const { id, email, name, plan, skills, experienceLevel, title, bio, photoURL } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing user ID to sync." });
      }

      let user = await getFirestoreUser(id);
      let isNewUser = false;
      if (!user) {
        user = {
          id,
          email: email || `${id}@hirewise.ai`,
          name: name || "Aspirant Member",
          photoURL: photoURL || "",
          plan: plan || "free",
          createdAt: new Date().toISOString(),
          skills: skills || [],
          experienceLevel: experienceLevel || "Junior",
          title: title || "Developer Aspirant",
          bio: bio || "Developing my profile to land my dream job.",
        };
        await saveFirestoreUser(id, user);
        isNewUser = true;
        dbStore.addLog(`New synchronized client profile created for ${user.name}`, "info");
      } else {
        const updated = {
          ...user,
          ...(email && { email }),
          ...(name && { name }),
          ...(photoURL !== undefined && { photoURL }),
          ...((plan !== undefined && plan !== null) ? { plan } : {}),
          ...(skills && { skills }),
          ...(experienceLevel && { experienceLevel }),
          ...(title && { title }),
          ...(bio && { bio }),
        };
        await saveFirestoreUser(id, updated);
        user = updated;
      }
      res.status(200).json({ user, isNewUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Missing required registration parameters." });
      }

      const existing = dbStore.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered on this platform." });
      }

      const userId = generateId();
      const user = {
        id: userId,
        email,
        name,
        createdAt: new Date().toISOString(),
        skills: [],
        experienceLevel: "Junior" as const,
        title: "Developer Aspirant",
        bio: "Developing my profile to land my dream job.",
        plan: "Free" as const
      };

      await saveFirestoreUser(userId, user);
      res.status(201).json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = dbStore.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials. User not found." });
      }

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
    res.status(200).json({ message: "Password reset link emitted successfully." });
  });

  app.put("/api/auth/profile", async (req, res) => {
    try {
      const { userId, title, bio, experienceLevel, skills } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required to update profile." });
      }

      const userObj = await getFirestoreUser(userId) || {};
      const updatedUser = {
        ...userObj,
        title,
        bio,
        experienceLevel,
        skills,
      };

      await saveFirestoreUser(userId, updatedUser);
      res.status(200).json({ user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/user/:id", async (req, res) => {
    try {
      const user = await getFirestoreUser(req.params.id);
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

  const handleAnalyzeResume = async (req: express.Request, res: express.Response) => {
    try {
      const { userId, fileName, base64Data, isPdf } = req.body;
      if (!userId || !fileName || !base64Data) {
        return res.status(400).json({ error: "Missing required resume parsing payload." });
      }

      // Check Rate limiting
      const limitCheck = await checkAtsScanLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(429).json({ 
          error: "Monthly scan limit reached! Free accounts are limited to 3 scans per month. Upgrade to Pro for unlimited scans.",
          limitReached: true,
          limit: 3,
          currentCount: limitCheck.count
        });
      }

      // Analyze resume contents via AI
      const analysisRaw = await analyzeResume(fileName, base64Data, isPdf);

      const recordId = generateId();
      const newRecord = {
        id: recordId,
        userId,
        fileName,
        createdAt: new Date().toISOString(),
        ...analysisRaw,
      };

      // Save to Firestore
      if (isFirestoreActive) {
        try {
          await adminDb.collection("atsHistory").doc(recordId).set(newRecord);
        } catch (firestoreErr) {
          // Silent or safe warning
        }
      }

      // Create local record for fallback
      const newResumeRecord = dbStore.addResume(newRecord);

      // Optionally update user skills if empty or thin
      const userObj = await getFirestoreUser(userId);
      if (userObj && (!userObj.skills || userObj.skills.length === 0)) {
        const topSkills = analysisRaw.skills.slice(0, 10).map((s) => s.name);
        await saveFirestoreUser(userId, { skills: topSkills });
      }

      res.status(201).json({ resume: newResumeRecord });
    } catch (err: any) {
      console.error("error processing resume analyzer api route:", err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post("/api/resume/analyze", handleAnalyzeResume);
  app.post("/api/analyze-resume", handleAnalyzeResume);

  app.get("/api/resume/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let resumes: any[] = [];
      if (isFirestoreActive) {
        try {
          const snap = await adminDb.collection("atsHistory").where("userId", "==", userId).get();
          snap.forEach((docSnap) => {
            const raw = docSnap.data();
            resumes.push({
              id: docSnap.id,
              ...raw,
              score: raw.score || raw.compatibilityScore || 0
            });
          });
        } catch (firestoreErr) {
          // Silent
        }
      }

      if (resumes.length === 0) {
        resumes = dbStore.getResumes(userId);
      } else {
        resumes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
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

      const recordId = generateId();
      const matchData = {
        id: recordId,
        userId,
        resumeId,
        createdAt: new Date().toISOString(),
        ...matchDetails,
      };

      // Store in Google Firestore
      if (isFirestoreActive) {
        try {
          await adminDb.collection("jobMatches").doc(recordId).set(matchData);
        } catch (firestoreErr) {
          // Silent or safe warning
        }
      }

      const newMatchRecord = dbStore.addJobMatch(matchData);

      res.status(201).json({ jobMatch: newMatchRecord });
    } catch (err: any) {
      console.error("error during job description analyzer match:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/job-match/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let matches: any[] = [];
      if (isFirestoreActive) {
        try {
          const snap = await adminDb.collection("jobMatches").where("userId", "==", userId).get();
          snap.forEach((docSnap) => {
            matches.push({ id: docSnap.id, ...docSnap.data() });
          });
        } catch (firestoreErr) {
          // Silent
        }
      }

      if (matches.length === 0) {
        matches = dbStore.getJobMatches(userId);
      } else {
        matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      res.status(200).json({ matches });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // COVER LETTER GENERATOR API ENDPOINTS
  // ==========================================
  const handleCoverLetter = async (req: express.Request, res: express.Response) => {
    try {
      const { jobDescription, resumeText, extraInstructions } = req.body;
      if (!jobDescription || !resumeText) {
        return res.status(400).json({ error: "Job description and resume details are required." });
      }
      const letter = await generateCoverLetter(jobDescription, resumeText, extraInstructions || "");
      res.status(200).json({ coverLetter: letter });
    } catch (err: any) {
      console.error("Error generating cover letter:", err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post("/api/cover-letter/generate", handleCoverLetter);
  app.post("/api/cover-letter", handleCoverLetter);

  // ==========================================
  // LINKEDIN PROFILE ANALYZER API ENDPOINTS
  // ==========================================
  const handleLinkedInAnalyze = async (req: express.Request, res: express.Response) => {
    try {
      const { profileUrl, profileContent } = req.body;
      if (!profileUrl) {
        return res.status(400).json({ error: "LinkedIn Profile URL is required." });
      }
      const analysis = await analyzeLinkedInProfile(profileUrl, profileContent || "");
      res.status(200).json(analysis);
    } catch (err: any) {
      console.error("Error analyzing LinkedIn Profile:", err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post("/api/linkedin/analyze", handleLinkedInAnalyze);
  app.post("/api/linkedin", handleLinkedInAnalyze);

  // ==========================================
  // INTERVIEW API ENDPOINTS
  // ==========================================

  app.post("/api/interview/create", async (req, res) => {
    try {
      const { userId, role, difficulty } = req.body;
      if (!userId || !role || !difficulty) {
        return res.status(400).json({ error: "Missing user credentials, target role, or difficulty." });
      }

      // Check Rate limit for interviews: max 5 per month for Free accounts
      const limitCheck = await checkInterviewLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(429).json({
          error: "Monthly interview limit reached! Free accounts are limited to 5 sessions per month. Upgrade to Pro for unlimited prep.",
          limitReached: true,
          limit: 5,
          currentCount: limitCheck.count
        });
      }

      // Fetch user profile stats to enrich prompts
      const user = await getFirestoreUser(userId);
      const userSkills = user?.skills || [];

      // Ask Gemini to generate 5 robust interview questions
      const generatedQs = await generateInterviewQuestions(role, difficulty, userSkills);

      const sessionId = generateId();
      const interviewSessionData = {
        id: sessionId,
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
      };

      // Save to Firestore
      if (isFirestoreActive) {
        try {
          await adminDb.collection("interviews").doc(sessionId).set(interviewSessionData);
        } catch (firestoreErr) {
          // Silent
        }
      }

      const interviewSession = dbStore.addInterview(interviewSessionData);

      res.status(201).json({ session: interviewSession });
    } catch (err: any) {
      console.error("error creating interview api session:", err);
      res.status(500).json({ error: err.message });
    }
  });

  const handleSubmitAnswers = async (req: express.Request, res: express.Response) => {
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

      const updateData = {
        answers: evaluationResult.answers,
        overallScore: evaluationResult.overallScore,
        overallFeedback: evaluationResult.overallFeedback,
        status: InterviewStatus.COMPLETED,
      };

      // Save to Firestore
      if (isFirestoreActive) {
        try {
          await adminDb.collection("interviews").doc(sessionId).set(updateData, { merge: true });
        } catch (firestoreErr) {
          // Silent
        }
      }

      // Save report in database State
      const updatedSession = dbStore.updateInterview(sessionId, updateData);

      res.status(200).json({ session: updatedSession });
    } catch (err: any) {
      console.error("error evaluation answers api session:", err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post("/api/interview/submit-answers", handleSubmitAnswers);
  app.post("/api/interview-feedback", handleSubmitAnswers);

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

  app.get("/api/interview/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let sessions: any[] = [];
      if (isFirestoreActive) {
        try {
          const snap = await adminDb.collection("interviews").where("userId", "==", userId).get();
          snap.forEach((docSnap) => {
            sessions.push({ id: docSnap.id, ...docSnap.data() });
          });
        } catch (firestoreErr) {
          // Silent
        }
      }

      if (sessions.length === 0) {
        sessions = dbStore.getInterviews(userId);
      } else {
        sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      res.status(200).json({ sessions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/interview/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      let session: any = null;
      if (isFirestoreActive) {
        try {
          const docSnap = await adminDb.collection("interviews").doc(sessionId).get();
          if (docSnap.exists) {
            session = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (firestoreErr) {
          // Silent
        }
      }

      if (!session) {
        session = dbStore.getInterviewById(sessionId);
      }

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

  app.get("/api/dashboard/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      let userResumes: any[] = [];
      let userInterviews: any[] = [];
      let userMatches: any[] = [];

      if (isFirestoreActive) {
        try {
          const atsSnap = await adminDb.collection("atsHistory").where("userId", "==", userId).get();
          atsSnap.forEach((doc) => {
            const raw = doc.data();
            userResumes.push({
              id: doc.id,
              ...raw,
              score: raw.score || raw.compatibilityScore || 0
            });
          });
        } catch (firestoreErr) {
          // Silent fallback
        }

        try {
          const intSnap = await adminDb.collection("interviews").where("userId", "==", userId).get();
          intSnap.forEach((doc) => {
            userInterviews.push({ id: doc.id, ...doc.data() });
          });
        } catch (firestoreErr) {
          // Silent fallback
        }

        try {
          const matchSnap = await adminDb.collection("jobMatches").where("userId", "==", userId).get();
          matchSnap.forEach((doc) => {
            userMatches.push({ id: doc.id, ...doc.data() });
          });
        } catch (firestoreErr) {
          // Silent fallback
        }
      }

      if (userResumes.length === 0) {
        userResumes = dbStore.get().resumes.filter((r) => r.userId === userId);
      }
      if (userInterviews.length === 0) {
        userInterviews = dbStore.get().interviews.filter((i) => i.userId === userId && i.status === InterviewStatus.COMPLETED);
      }
      if (userMatches.length === 0) {
        userMatches = dbStore.get().jobMatches.filter((m) => m.userId === userId);
      }

      // Calculations
      const avgResumeScore = userResumes.length > 0
        ? Math.round(userResumes.reduce((acc, r) => acc + (r.score || 0), 0) / userResumes.length)
        : 0;

      const completedInterviews = userInterviews.filter((i) => (i.overallScore && i.overallScore > 0) || i.status === "completed" || i.status === InterviewStatus.COMPLETED);
      const avgInterviewScore = completedInterviews.length > 0
        ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / completedInterviews.length)
        : 0;

      // Calculate total gaps
      const uniqueGaps = new Set<string>();
      userMatches.forEach((m) => {
        if (m.missingSkills && Array.isArray(m.missingSkills)) {
          m.missingSkills.forEach((s: any) => {
            const skillName = typeof s === "string" ? s : (s.name || "");
            if (skillName) uniqueGaps.add(skillName.toLowerCase());
          });
        }
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
          title: `Resume Core Audit: ${r.fileName || "Aspirant CV"}`,
          subtitle: `${(r.skills || []).length} skills extracted & indexed.`,
          score: r.score || r.compatibilityScore || 0,
          date: r.createdAt,
        });
      });

      userMatches.forEach((m) => {
        activities.push({
          type: "JOB_MATCH",
          id: m.id,
          title: `Job Fit Alignment: ${m.jobTitle}`,
          subtitle: `${(m.missingSkills || []).length} missing skill gaps identified.`,
          score: m.matchScore || 0,
          date: m.createdAt,
        });
      });

      userInterviews.forEach((i) => {
        activities.push({
          type: "INTERVIEW",
          id: i.id,
          title: `Interactive Interview: ${i.role}`,
          subtitle: `Grade level: ${i.difficulty} Difficulty`,
          score: i.overallScore || 0,
          date: i.createdAt,
        });
      });

      // Sort activities newest first
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.status(200).json({
        resumeCount: userResumes.length,
        averageResumeScore: avgResumeScore,
        interviewsCount: completedInterviews.length,
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
