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
  const { videoId } = useParams(); // URL에서 videoId 가져오기
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
      fetchVideoData(videoId);
    });

    return () => unsubscribe();
  }, [videoId, router]);

  // ✅ Firestore에서 비디오 데이터 가져오기
  const fetchVideoData = async (videoId) => {
    try {
      const userId = auth.currentUser.uid;
      const docRef = doc(db, "users", userId, "videos", videoId);
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

  // ✅ YouTube 영상 ID 추출
  const extractYouTubeID = (url) => {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([^#&?]*))/;
    const match = url.match(regex);
    return match && match[1] ? match[1] : null;
  };

  const videoEmbedId = extractYouTubeID(video.video);

  return (
    <div className="flex flex-col items-center w-full p-6">
      {/* 제목 */}
      {video && <h1 className="text-2xl font-bold mb-4">{video.name}</h1>}

      {/* ✅ 비디오 플레이어 (YouTube iframe) */}
      {videoEmbedId && (
        <div className="w-full max-w-2xl aspect-video">
          <iframe
            className="w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoEmbedId}?controls=1&rel=0`}
            title={video.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      )}

      {/* ✅ 비디오 상세 정보 */}
      {video && (
        <Card className="rounded-lg shadow-lg w-full max-w-2xl mt-4">
          <CardContent className="p-4">
            {/* 채널 정보 */}
            <div className="flex items-center gap-3">
              <img src={video.channelProfile} alt={video.channel} className="w-12 h-12 rounded-full" />
              <p className="text-lg font-bold">{video.channel}</p>
            </div>

            {/* 조회수, 좋아요, 게시일 */}
            <p className="text-sm text-gray-500 mt-2">
              조회수: {video.views} · 좋아요: {video.likes} · 게시일: {new Date(video.publishedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ✅ 대시보드로 돌아가기 버튼 */}
      <Link href="/dashboard">
        <Button className="mt-4">⬅️ 대시보드로 돌아가기</Button>
      </Link>
    </div>
  );
}
