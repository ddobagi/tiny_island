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

  // ✅ Firestore에서 가져온 비디오 데이터의 URL이 전체 URL인지 확인하고 ID만 추출하는 함수
  const getYouTubeVideoID = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/.*v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/user\/.*#p\/u\/\d\/|youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([^#&?\n]+)/);
    return match ? match[1] : null;
  };

  // ✅ Firestore에서 비디오 데이터 가져오기
  const fetchVideoData = async (slug) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("사용자 인증이 필요합니다.");
      
      const docRef = doc(db, "users", userId, "videos", slug);
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
      {video && <h1 className="text-2xl font-bold mb-4">{video.title}</h1>}

      {video && (
        <Card className="rounded-lg shadow-lg w-full max-w-2xl">
          <div className="relative w-full aspect-video">
            <iframe
              className="w-full h-full rounded-t-lg"
              src={`https://www.youtube.com/embed/${getYouTubeVideoID(video.video)}?autoplay=0&controls=1`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">
              채널: {video.channel} · 조회수: {video.views} · 좋아요: {video.likes}
            </p>
            <p className="mt-2">게시 날짜: {new Date(video.publishedAt).toLocaleDateString()}</p>
            <div className="flex items-center mt-4">
              <img src={video.channelProfile} alt="Channel Profile" className="w-10 h-10 rounded-full mr-2" />
              <span className="text-lg font-semibold">{video.channel}</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Link href="/dashboard">
        <Button className="mt-4">⬅️ 대시보드로 돌아가기</Button>
      </Link>
    </div>
  );
}
