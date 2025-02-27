"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [range, setRange] = useState("data!A1:Z100");
  const [isEditing, setIsEditing] = useState(false);
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
          extractSpreadsheetId(savedUrl);
        }
        if (savedRange) setRange(savedRange);
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
    <div className="flex flex-col items-center w-full p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      {user ? (
        <div className="mb-4">
          <p className="text-lg">환영합니다, {user.displayName}! 🎉 ({user.email})</p>
          <Button onClick={() => signOut(auth)} className="mt-2">로그아웃</Button>
        </div>
      ) : (
        <Button onClick={() => signInWithPopup(auth, provider)}>Google 로그인</Button>
      )}

      {/* 스프레드시트 입력 */}
      <div className="flex flex-col gap-2 w-full max-w-lg">
        <Input 
          type="text" 
          placeholder="Google Sheets URL" 
          value={sheetsUrl} 
          onChange={(e) => {
            setSheetsUrl(e.target.value);
            extractSpreadsheetId(e.target.value);
          }} 
          disabled={!isEditing}
        />
        <Input 
          type="text" 
          placeholder="Range (예: data!A1:Z100)" 
          value={range} 
          onChange={(e) => setRange(e.target.value)} 
          disabled={!isEditing}
        />
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "저장" : "수정"}
        </Button>
      </div>

      {/* 검색 */}
      <Input 
        type="text" 
        placeholder="Search..." 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        className="mt-4 w-full max-w-lg"
      />

      {/* 비디오 리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
        {videos
          .filter(video => video.name.toLowerCase().includes(search.toLowerCase()))
          .map((video, index) => (
            <Link href={`/${video.slug}`} key={index} className="w-full">
              <Card className="rounded-lg shadow-lg hover:shadow-2xl transition">
                <img src={video.thumbnail} alt={video.name} className="w-full rounded-t-lg aspect-video object-cover" />
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold truncate">{video.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{video.channel} · {video.view} views · {video.date}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}