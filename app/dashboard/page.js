"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, signOut } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/"); // 로그인 안 했으면 메인 페이지로 이동
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        router.push("/"); // 로그아웃 후 메인 페이지로 이동
      })
      .catch((error) => console.error("❌ 로그아웃 오류:", error));
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Dashboard</h1>
      <p>환영합니다, {user.displayName}! 🎉</p>
      <p>이메일: {user.email}</p>
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  );
}
