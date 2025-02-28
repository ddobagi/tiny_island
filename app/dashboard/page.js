"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

///
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
///

export default function Dashboard() {

  ///
  const [user, setUser] = useState(null);
  ///

  const [loading, setLoading] = useState(true);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsId, setSheetsId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const router = useRouter(); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(true); // ✅ Firestore에서 데이터를 가져오기 전까지 로딩 유지
  
        try {
          // ✅ Firestore에서 사용자 정보 가져오기
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
  
          if (docSnap.exists()) {  // 🚀 오타 수정: exits() → exists()
            const userData = docSnap.data();
            if (userData.sheetsUrl) {
              setSheetsUrl(userData.sheetsUrl);
              const extractedId = extractSheetsId(userData.sheetsUrl);
              if (extractedId) {
                setSheetsId(extractedId);
              }
            }
          } else {
            console.warn("Firestore에서 SheetsUrl을 찾을 수 없습니다.");
          }
        } catch (error) {
          console.error("Firestore에서 SheetsUrl 가져오는 중 오류 발생: ", error);
        }
  
        setLoading(false); // ✅ Firestore 데이터 가져온 후 로딩 해제
      } else {
        setLoading(false);
        router.push("/"); // 🚀 user가 없을 때만 `/`로 이동 (무한 리디렉션 방지)
      }
    });
  
    return () => unsubscribe();
  }, [router]); // ✅ 의존성 배열 최적화
  
///

  useEffect(() => {
    if (!sheetsId) return;

    const fetchGoogleSheetsData = async () => {
      try {
        const res = await fetch(
          `https://python-island.onrender.com/google-sheets/${sheetsId}?range=data!A1:Z100`
        );
        if (!res.ok) throw new Error(`Google Sheets API error: ${res.status}`);

        const data = await res.json();
        const rows = data.values;
        if (!rows || rows.length <= 2) throw new Error("No data found in Google Sheets");

        const headers = rows[0]; // 첫 번째 행은 헤더
        
        const videoIndex = headers.indexOf("video");
        const thumbnailIndex = headers.indexOf("thumbnail");
        const nameIndex = headers.indexOf("name");
        const slugIndex = headers.indexOf("slug");
        const channelIndex = headers.indexOf("channel");
        const viewIndex = headers.indexOf("view");
        const dateIndex = headers.indexOf("date");
        const profileIndex = headers.indexOf("profile");
        const lengthIndex = headers.indexOf("length");

        // 3행부터 데이터를 가져오도록 설정
        const parsedVideos = rows.slice(2).map((row) => ({
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
  }, [sheetsId]);

  const extractSheetsId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)\/edit/);
    return match ? match[1] : null;
  };

  const handleSaveSheetsUrl = async () => {

    ///
    if (!user) return;
    ///


    if (user) {
      try{
        const extractedId = extractSheetsId(sheetsUrl);
        
        ///
        await setDoc(doc(db, "users", user.uid), { sheetsId: extractedId }, { merge: true });
        ///

        setSheetsId(extractedId);
      } catch (error) {
        console.error("Firestore 저장 중 오류 발생: ", error)
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      {user ? (
        <div className="mb-4">
          <p className="text-lg">
            환영합니다, {user.displayName ? user.displayName : "사용자"}! 🎉 ({user.email})
          </p>
          <Button onClick={() => signOut(auth)} className="mt-2">로그아웃</Button>
        </div>
      ) : (
        <Button onClick={() => signInWithPopup(auth, provider)}>Google 로그인</Button>
      )}

      <div className="flex flex-col gap-2 w-full max-w-lg">
        <p className="text-sm text-gray-500">🔗 Google Sheets URL 입력</p>
        <Input 
          type="text" 
          placeholder="Google Sheets URL을 입력하세요" 
          value={sheetsUrl} 
          onChange={(e) => setSheetsUrl(e.target.value)} 
          disabled={!isEditing}
        />
        <Button onClick={() => (isEditing ? handleSaveSheetsUrl() : setIsEditing(true))}>
          {isEditing ? "저장" : "수정"}
        </Button>
      </div>

      <Input 
        type="text" 
        placeholder="Search..." 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        className="mt-4 w-full max-w-lg"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
        {videos
          .filter(video => video.name.toLowerCase().includes(search.toLowerCase()))
          .map((video, index) => (
            <Link href={`/dashboard/${video.slug}`} key={index} className="w-full">
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