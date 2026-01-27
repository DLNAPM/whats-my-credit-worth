
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Configuration prioritizing environment variables while providing project-specific fallbacks.
// This prevents 'auth/invalid-api-key' errors if variables are not yet set in the deployment environment.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBxCLulyq4HDYFZCUkMmtoIUwmM9Sn81BY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "whats-my-credit-worth.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "whats-my-credit-worth",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "whats-my-credit-worth.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "787892339198",
  appId: process.env.FIREBASE_APP_ID || "1:787892339198:web:bd0cca8db56c5f896140af",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-Y52XV704K6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * We use initializeFirestore instead of getFirestore to enable 
 * experimentalForceLongPolling. This often fixes "WebChannel transport errors" 
 * which occur when WebSockets/gRPC streams are blocked by proxies or environments.
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
