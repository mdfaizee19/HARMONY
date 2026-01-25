import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const requireEnv = (key: string): string => {
    const value = import.meta.env[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

// Debug log to confirm env vars are loading
console.log("Firebase Config Loading:", {
    apiKeyDefined: !!import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});

const firebaseConfig = {
    apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("VITE_FIREBASE_APP_ID")
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
