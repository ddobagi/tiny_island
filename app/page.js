"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { auth, provider } from "@/lib/firebase";
import { signInWithRedirect, onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    if (auth && provider) {
      signInWithRedirect(auth, provider);
    }
  };

  const handleLogout = () => {
    if (auth) {
      signOut(auth)
        .then(() => alert("로그아웃 되었습니다."))
        .catch((error) => console.error("❌ 로그아웃 오류:", error));
    }
  };

  useEffect(() => {
    const fetchGoogleSheetsData = async () => {
      try {
        const res = await fetch("https://python-island.onrender.com/google-sheets/all");

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

        const parsedVideos = rows.slice(1).map((row) => {
          return {
            video: row[videoIndex],
            thumbnail: row[thumbnailIndex] || "",
            name: row[nameIndex],
            slug: row[slugIndex],
            channel: row[channelIndex],
            view: row[viewIndex],
            date: row[dateIndex],
            profile: row[profileIndex],
            length: row[lengthIndex],
          };
        });

        setVideos(parsedVideos);
      } catch (error) {
        console.error("Error fetching Google Sheets data: ", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleSheetsData();
  }, []);

  const filteredVideos = videos.filter((video) =>
    video.name.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* 🔹 비디오 검색 UI */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <h1>Video Gallery</h1>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ccc' }}
        />

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          {filteredVideos.map((video, index) => (
            <Link href={`/${video.slug}`} key={index} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                width: '300px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ position: 'relative' }}>
                  <img src={video.thumbnail} alt={video.name} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
                </div>

                <div style={{ padding: '10px', flex: '1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={video.profile} alt={video.channel} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    <div>
                      <h3 style={{ margin: '0', fontSize: '16px' }}>{video.name}</h3>
                      <p style={{ margin: '0', fontSize: '14px', color: '#555' }}>{video.channel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
