"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ✅ Google Sheets API URL (스프레드시트 ID는 Firestore에서 가져옴)
const API_URL = "https://python-island.onrender.com/google-sheets/";
const RANGE = "data!A1:Z100";

export default function VideoDetail() {
  const { slug } = useParams(); // URL에서 slug 가져오기
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [sheetsId, setSheetsId] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 사용자 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/"); // 인증되지 않은 사용자는 메인 페이지로 이동
        setLoading(false);
        return;
      }
      
      setUser(currentUser);
      fetchSheetsId(currentUser.uid);
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ Firestore에서 sheetsId 가져오기
  const fetchSheetsId = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSheetsId(docSnap.data().sheetsId || null);
      } else {
        console.warn("Firestore에서 sheetsId를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("Firestore에서 sheetsId를 가져오는 중 오류 발생: ", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google Sheets API에서 데이터 가져오기
  useEffect(() => {
    if (!slug || !sheetsId) return;
    
    const fetchVideoData = async () => {
      try {
        const res = await fetch(`${API_URL}${sheetsId}?range=${encodeURIComponent(RANGE)}`);
        if (!res.ok) throw new Error(`Google Sheets API error: ${res.status}`);
        
        const data = await res.json();
        const rows = data.values;
        if (!rows || rows.length === 0) throw new Error("No data found in Google Sheets");
        
        const headers = rows[0];
        const slugIndex = headers.indexOf("slug");
        const foundVideo = rows.slice(1).find((row) => row[slugIndex] === slug);

        if (!foundVideo) throw new Error("해당 비디오를 찾을 수 없습니다.");

        setVideo({
          name: foundVideo[headers.indexOf("name")] || "제목 없음",
          thumbnail: foundVideo[headers.indexOf("thumbnail")] || "",
          channel: foundVideo[headers.indexOf("channel")],
          view: foundVideo[headers.indexOf("view")],
          date: foundVideo[headers.indexOf("date")],
          length: foundVideo[headers.indexOf("length")],
        });
      } catch (error) {
        console.error("Error fetching video data: ", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoData();
  }, [slug, sheetsId]);

  // ✅ 로딩 상태 및 에러 처리
  if (loading) return <p className="text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col items-center w-full p-6">
      {video && <h1 className="text-2xl font-bold mb-4">{video.name}</h1>}

      {video && (
        <Card className="rounded-lg shadow-lg w-full max-w-2xl">
          <img src={video.thumbnail} alt={video.name} className="w-full rounded-t-lg aspect-video object-cover" />
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">채널: {video.channel} · 조회수: {video.view} · 날짜: {video.date}</p>
            <p className="mt-2">영상 길이: {video.length}</p>
          </CardContent>
        </Card>
      )}
      
      <Link href="/dashboard">
        <Button className="mt-4">⬅️ 대시보드로 돌아가기</Button>
      </Link>
    </div>
  );
}
