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
        if (savedUrl) {
          setSheetsUrl(savedUrl);
          setIsEditing(false);
        }
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

  useEffect(() => {
    if (!sheetsUrl) return;

    const fetchGoogleSheetsData = async () => {
      try {
        const res = await fetch(`${sheetsUrl}`);
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
  }, [sheetsUrl]);

  const filteredVideos = videos.filter((video) =>
    video.name.toLowerCase().includes(search.toLowerCase())
  );

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
      <input
        type="text"
        placeholder="Google Sheets URL"
        value={sheetsUrl}
        onChange={(e) => setSheetsUrl(e.target.value)}
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
        {filteredVideos.map((video, index) => (
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
