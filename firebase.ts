import * as firebaseApp from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBxCLulyq4HDYFZCUkMmtoIUwmM9Sn81BY",
  authDomain: "whats-my-credit-worth.firebaseapp.com",
  projectId: "whats-my-credit-worth",
  storageBucket: "whats-my-credit-worth.firebasestorage.app",
  messagingSenderId: "787892339198",
  appId: "1:787892339198:web:bd0cca8db56c5f896140af",
  measurementId: "G-Y52XV704K6"
};

const app = firebaseApp.initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);