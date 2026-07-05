import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBE0uXhh8ePOQH6FBdhRCZrRgRkUTwCWws",
  authDomain: "tyagi-hub.firebaseapp.com",
  projectId: "tyagi-hub",
  storageBucket: "tyagi-hub.firebasestorage.app",
  messagingSenderId: "1052184634573",
  appId: "1:1052184634573:web:077135d1bc4f321688b584",
  measurementId: "G-36X3TG734R",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export default app;
