"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetsUrl, setSheetsUrl] = useState(""); // Google Sheets URL 상태
  const [isEditing, setIsEditing] = useState(true); // URL 편집 가능 여부
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // 사용자의 uid에 맞는 URL 불러오기
        const savedUrl = localStorage.getItem(`sheetsUrl_${currentUser.uid}`);
        if (savedUrl) {
          setSheetsUrl(savedUrl);
          setIsEditing(false); // 저장된 URL이 있으면 편집 비활성화 상태로 시작
        }
      } else {
        router.push("/"); // 로그인 안 했으면 메인 페이지로 이동
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      setUser(null);
      router.push("/"); // 로그아웃 후 메인 페이지로 이동
    } catch (error) {
      console.error("❌ 로그아웃 오류:", error);
    }
  };

  const handleUrlChange = (e) => {
    setSheetsUrl(e.target.value);
  };

  const handleSaveOrEdit = () => {
    if (isEditing && user) {
      // uid 기반으로 URL 저장
      localStorage.setItem(`sheetsUrl_${user.uid}`, sheetsUrl);
      alert("✅ Google Sheets URL이 저장되었습니다!");
    }
    // 편집 상태 토글
    setIsEditing(!isEditing);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null; // 로그인 안 되어 있으면 아무것도 렌더링하지 않음
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Dashboard</h1>
      <p>환영합니다, {user.displayName}! 🎉</p>
      <p>이메일: {user.email}</p>

      {/* Google Sheets URL 입력 필드 */}
      <div style={{ margin: "20px 0" }}>
        <label htmlFor="sheetsUrl" style={{ display: "block", fontSize: "16px", fontWeight: "bold" }}>
          Google Sheets URL
        </label>
        <input
          type="text"
          id="sheetsUrl"
          value={sheetsUrl}
          onChange={handleUrlChange}
          placeholder="Google Sheets URL을 입력하세요"
          disabled={!isEditing} // 편집 여부에 따라 입력창 활성화/비활성화
          style={{
            width: "80%",
            padding: "10px",
            marginTop: "10px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            backgroundColor: isEditing ? "#fff" : "#f0f0f0", // 비활성화 시 색상 변경
          }}
        />
        <button
          onClick={handleSaveOrEdit}
          style={{
            marginLeft: "10px",
            padding: "10px 15px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: isEditing ? "#007bff" : "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {isEditing ? "저장" : "수정"}
        </button>
      </div>

      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        로그아웃
      </button>
    </div>
  );
}
