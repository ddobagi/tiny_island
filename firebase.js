import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBrIWgq1opHKqjpLoRL1xeayf8PM0klL7I",
    authDomain: "test-island-cd9a8.firebaseapp.com",
    projectId: "test-island-cd9a8",
    storageBucket: "test-island-cd9a8.firebasestorage.app",
    messagingSenderId: "771856380278",
    appId: "1:771856380278:web:08557cccafba6cfde50a57"
  };

// Firebase가 여러 번 초기화되지 않도록 확인
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };
