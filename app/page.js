"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        router.push("/dashboard"); // 로그인 후 대시보드로 이동
      }
    });

    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          setUser(result.user);
          router.push("/dashboard"); // 로그인 후 대시보드로 이동
        }
      })
      .catch((error) => {
        console.error("로그인 오류:", error);
      });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    try {
      if (auth && provider) {
        await signInWithPopup(auth, provider); // 팝업 로그인
      }
    } catch (error) {
      console.error("로그인 오류:", error);
    }
  };

  const handleLogout = () => {
    if (auth) {
      signOut(auth)
        .then(() => {
          setUser(null);
          alert("로그아웃 되었습니다.");
        })
        .catch((error) => console.error("❌ 로그아웃 오류:", error));
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Firebase Google 로그인</h2>

      {/* 🔹 로그인 UI */}
      {user ? (
        <div>
          <p>로그인한 사용자: {user.displayName} ({user.email})</p>
          <button onClick={handleLogout}>로그아웃</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Google 로그인</button>
      )}
    </div>
  );
}