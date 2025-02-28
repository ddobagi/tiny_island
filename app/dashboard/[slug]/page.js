"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VideoDetail() {
  const { slug } = useParams(); // URL에서 slug 가져오기
  const router = useRouter();

  const [user, setUser] = useState(null);
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
      fetchVideoData(slug);
    });
    return () => unsubscribe();
  }, [slug, router]);

  // ✅ Firestore에서 비디오 데이터 가져오기
  const fetchVideoData = async (slug) => {
    try {
      const docRef = doc(db, "videos", slug);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setVideo(docSnap.data());
      } else {
        throw new Error("해당 비디오를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("Firestore에서 비디오 데이터 가져오는 중 오류 발생: ", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-sm text-gray-500">
              채널: {video.channel} · 조회수: {video.view} · 날짜: {video.date}
            </p>
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
