"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider } from "@/lib/firebase";
import { signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // ✅ 1. getRedirectResult(auth)를 useEffect 내부에서 비동기적으로 실행
  useEffect(() => {
    const checkRedirectLogin = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setUser(result.user); // 사용자 정보 업데이트
          router.push("/dashboard"); // 로그인 후 대시보드 이동
        }
      } catch (error) {
        console.error("로그인 오류:", error);
      }
    };

    checkRedirectLogin();
  }, [router]); // ✅ `router` 의존성 추가

  // ✅ 2. Firebase 로그인 상태 유지 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // 사용자 정보 업데이트
        router.push("/dashboard"); // 로그인 후 대시보드 이동
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ✅ 3. 로그인 함수 (signInWithRedirect 사용)
  const handleLogin = async () => {
    try {
      if (auth && provider) {
        await signInWithRedirect(auth, provider);
      }
    } catch (error) {
      console.error("로그인 오류:", error);
    }
  };

  // ✅ 4. 로그아웃 처리
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
