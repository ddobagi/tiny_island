"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [range, setRange] = useState("data!A1:Z100");
  const [isEditing, setIsEditing] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const savedUrl = localStorage.getItem(`sheetsUrl_${currentUser.uid}`);
        const savedRange = localStorage.getItem(`range_${currentUser.uid}`);

        if (savedUrl) {
          setSheetsUrl(savedUrl);
          extractSpreadsheetId(savedUrl); // 📌 ID 자동 추출
        }
        if (savedRange) setRange(savedRange);
        setIsEditing(false);
      } else {
        router.push("/");
      }
      setLoading(false);
    });

    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          setUser(result.user);
          router.push("/dashboard");
        }
      })
      .catch((error) => console.error("로그인 오류:", error));

    return () => unsubscribe();
  }, [router]);

  // 📌 Google Sheets URL에서 spreadsheetId만 추출하는 함수
  const extractSpreadsheetId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      setSpreadsheetId(match[1]);
    } else {
      setSpreadsheetId("");
      setError("잘못된 Google Sheets URL입니다. ID를 확인하세요.");
    }
  };

  useEffect(() => {
    if (!spreadsheetId) return;

    const fetchGoogleSheetsData = async () => {
      try {
        const res = await fetch(`https://python-island.onrender.com/google-sheets/${spreadsheetId}?range=${encodeURIComponent(range)}`);
        if (!res.ok) throw new Error(`Google Sheets API error: ${res.status}`);

        const data = await res.json();
        const rows = data.values;
        if (!rows || rows.length === 0) throw new Error("No data found in Google Sheets");

        const headers = rows[0];
        const videoIndex = headers.indexOf("video");
        const thumbnailIndex = headers.indexOf("thumbnail");
        const nameIndex = headers.indexOf("name");
        const slugIndex = headers.indexOf("slug");
        const channelIndex = headers.indexOf("channel");
        const viewIndex = headers.indexOf("view");
        const dateIndex = headers.indexOf("date");
        const profileIndex = headers.indexOf("profile");
        const lengthIndex = headers.indexOf("length");

        const parsedVideos = rows.slice(1).map((row) => ({
          video: row[videoIndex],
          thumbnail: row[thumbnailIndex] || "",
          name: row[nameIndex],
          slug: row[slugIndex],
          channel: row[channelIndex],
          view: row[viewIndex],
          date: row[dateIndex],
          profile: row[profileIndex],
          length: row[lengthIndex],
        }));

        setVideos(parsedVideos);
      } catch (error) {
        console.error("Error fetching Google Sheets data: ", error);
        setError(error.message);
      }
    };

    fetchGoogleSheetsData();
  }, [spreadsheetId, range]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <p>환영합니다, {user.displayName}! 🎉 ({user.email})</p>
          <button onClick={() => signOut(auth)}>로그아웃</button>
        </div>
      ) : (
        <button onClick={() => signInWithPopup(auth, provider)}>Google 로그인</button>
      )}
      
      {/* Google Sheets URL 입력 필드 */}
      <input
        type="text"
        placeholder="Google Sheets URL"
        value={sheetsUrl}
        onChange={(e) => {
          setSheetsUrl(e.target.value);
          extractSpreadsheetId(e.target.value);
        }}
        disabled={!isEditing}
      />

      <input
        type="text"
        placeholder="Extracted Spreadsheet ID"
        value={spreadsheetId}
        disabled
      />

      <input
        type="text"
        placeholder="Range (예: data!A1:Z100)"
        value={range}
        onChange={(e) => setRange(e.target.value)}
        disabled={!isEditing}
      />
      
      <button onClick={() => setIsEditing(!isEditing)}>{isEditing ? "저장" : "수정"}</button>
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div>
        {videos.map((video, index) => (
          <Link href={`/${video.slug}`} key={index}>
            <div>
              <img src={video.thumbnail} alt={video.name} />
              <h3>{video.name}</h3>
              <p>{video.channel}</p>
            </div>
          </Link>
        ))}
      </div>
      
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
