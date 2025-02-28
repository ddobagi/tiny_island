"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider } from "@/lib/firebase";
import { signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true); // 🔹 로그인 상태 확인 플래그

  // ✅ 1. Firebase 로그인 상태 유지 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // 사용자 정보 업데이트
        router.push("/dashboard"); // 로그인 후 대시보드 이동
      } else {
        setCheckingAuth(false); // 로그인 상태 확인 완료
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ✅ 2. getRedirectResult(auth)를 useEffect 내부에서 실행하여 리디렉트 로그인 처리
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

  // ✅ 5. 로그인 상태 확인 중 로딩 UI 표시
  if (checkingAuth) {
    return <p>로딩 중...</p>;
  }

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
