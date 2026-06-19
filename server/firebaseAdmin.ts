import { getApps, initializeApp, getApp } from "firebase-admin/app";
import { getFirestore, initializeFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

const platformProjectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "rock-rush-wk8sk";

let projectId = platformProjectId;
let databaseId = "ai-studio-e58130cf-8c8c-41e5-aa41-8a42a1fbce0f";

let configProjectId = "";
let configDatabaseId = "";

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    configProjectId = config.projectId || "";
    configDatabaseId = config.firestoreDatabaseId || "";
  }
} catch (e) {
  console.error("Failed to load firebase-applet-config.json", e);
}

// Detect if we are running in the AI Studio sandboxed staging/preview environment.
const isSandboxedPreview = platformProjectId === "rock-rush-wk8sk" || platformProjectId.startsWith("ais-");

if (isSandboxedPreview) {
  projectId = "rock-rush-wk8sk";
  databaseId = configDatabaseId || "ai-studio-e58130cf-8c8c-41e5-aa41-8a42a1fbce0f";
} else {
  // Use custom user project configuration for production (when deployed inside user's GCP project)
  projectId = configProjectId || platformProjectId;
  databaseId = configDatabaseId;
}

console.log(`[Firebase Admin] Environment check: platformProjectId="${platformProjectId}", configProjectId="${configProjectId}", isSandboxedPreview=${isSandboxedPreview}. Resolving to: project="${projectId}", database="${databaseId || "(default)"}"`);

let app: any;
try {
  if (getApps().length === 0) {
    app = initializeApp({
      projectId: projectId
    });
    console.log(`[Firebase Admin] Initialized with project ${projectId}`);
  } else {
    app = getApp();
  }
} catch (e) {
  console.error("Firebase Admin init error:", e);
}

// Connect to the custom firestoreDatabaseId if specified, or default standard DB
const realAdminDb = databaseId ? initializeFirestore(app, { databaseId: databaseId } as any) : getFirestore(app);
export const adminAuth = getAuth();

// Initialize the active status flag
export let isFirestoreActive = false;
let isTestingConnection = false;

// Create a Proxy around realAdminDb to intercept and fail-fast when firestore is inactive.
// This prevents scary multiline gRPC network error stacktraces and delays during local/preview fallbacks.
export const adminDb = new Proxy(realAdminDb, {
  get(target, prop, receiver) {
    if (!isFirestoreActive && !isTestingConnection) {
      throw new Error("Firestore is currently inactive on the server (using local fallback DB).");
    }
    return Reflect.get(target, prop, receiver);
  }
});

// Test Firestore connectivity asynchronously
export async function checkFirestoreActive(): Promise<boolean> {
  isTestingConnection = true;
  try {
    const snap = await realAdminDb.collection("users").limit(1).get();
    isFirestoreActive = true;
    console.log(`[Firebase Admin] Firestore connection test successful! Server-side Firestore operations are fully ACTIVE.`);
    return true;
  } catch (e: any) {
    isFirestoreActive = false;
    console.info(`[Firebase Admin] Staging environment note: Firestore is offline/unresolved. Active storage mode seamlessly set to local in-memory DB.`);
    return false;
  } finally {
    isTestingConnection = false;
  }
}

export { projectId, databaseId };
