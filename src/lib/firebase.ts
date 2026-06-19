import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  addDoc,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const env = (import.meta as any).env || {};

// The platform multi-tenant database ID
const PLATFORM_DB_ID = "ai-studio-e58130cf-8c8c-41e5-aa41-8a42a1fbce0f";

// Detect if we are running under the platform's development or staging preview (including localhost)
const usePlatformConfig = typeof window !== "undefined" && (
  window.location.hostname.includes("ais-dev") ||
  window.location.hostname.includes("ais-pre") ||
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1") ||
  !env.VITE_FIREBASE_PROJECT_ID
);

const firebaseConfig = usePlatformConfig ? {
  apiKey: "AIzaSyBVszrNGpRM8IrJPxRrQNYp44kni8utM9Q",
  authDomain: "rock-rush-wk8sk.firebaseapp.com",
  projectId: "rock-rush-wk8sk",
  storageBucket: "rock-rush-wk8sk.appspot.com",
  messagingSenderId: "270066250939",
  appId: "1:270066250939:web:8451f2982219d95bf8259e",
  measurementId: ""
} : {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBVszrNGpRM8IrJPxRrQNYp44kni8utM9Q",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "hirewise-ai-37da2.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "hirewise-ai-37da2",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "hirewise-ai-37da2.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "270066250939",
  appId: env.VITE_FIREBASE_APP_ID || "1:270066250939:web:d551fbc90c4d7bc7f8259e",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-K4NFGTVD30"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore (use specific DB ID only if using default development sandbox, otherwise standard default database)
export const db = (firebaseConfig.projectId === "rock-rush-wk8sk") 
  ? getFirestore(app, PLATFORM_DB_ID) 
  : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL
};
