"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

///
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
///

// ✅ 스프레드시트 ID 고정 (변수화 X, 그냥 하드코딩)
const API_URL = "https://python-island.onrender.com/google-sheets/";
const range = "data!A1:Z100";

export default function VideoDetail() {
  
  ///
  const [user, setUser] = useState("");
  ///

  const { slug } = useParams(); // URL에서 slug 가져오기
  
  const [video, setVideo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsId, setSheetsId] = useState(null);
  const router = useRouter(); 

////////

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
  
//////////


  useEffect(() => {
    console.log("📌 현재 sheetsId 값:", sheetsId); // ✅ sheetsId 업데이트 확인
    console.log("📌 현재 uid 값: ", user.uid)
  }, [sheetsId]);
  

  useEffect(() => {
    
    ///
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSheetsId = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedSheetsId = docSnap.data().sheetsId;
          console.log(fetchedSheetsId)
          setSheetsId(fetchedSheetsId);
        } else {
          throw new Error("Firestore에서 SheetsId를 찾을 수 없습니다");
        }
      } catch (error) {
        console.error("Firestore에서 sheetsId를 가져오는 중 오류 발생: ", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSheetsId();
  }, [user]);

  useEffect(() => {
    if (!slug || !sheetsId) return;

    const fetchVideoData = async () => {
      try {
        const res = await fetch(`${API_URL}${sheetsId}?range=${encodeURIComponent(range)}`);
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

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col items-center w-full p-6">
      { video && <h1 className="text-2xl font-bold mb-4">{video.name}</h1> }

      { video && (
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