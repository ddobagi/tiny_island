"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBrIWgq1opHKqjpLoRL1xeayf8PM0klL7I",
  authDomain: "test-island-cd9a8.firebaseapp.com",
  projectId: "test-island-cd9a8",
  storageBucket: "test-island-cd9a8.firebasestorage.app",
  messagingSenderId: "771856380278",
  appId: "1:771856380278:web:08557cccafba6cfde50a57"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        router.push(`/user/${encodeURIComponent(currentUser.email)}`);
      }
    });
  }, [router]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error: ", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h1>Welcome to Video Gallery</h1>
      {!user ? (
        <button onClick={handleLogin} style={{ padding: '10px 20px', marginBottom: '20px' }}>Login with Google</button>
      ) : (
        <div>
          <p>Redirecting to your personalized page...</p>
          <button onClick={handleLogout} style={{ padding: '10px 20px', marginBottom: '20px' }}>Logout</button>
        </div>
      )}
    </div>
  );
}
