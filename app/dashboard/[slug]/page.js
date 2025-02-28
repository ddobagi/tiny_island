"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY; // 환경변수 사용

export default function VideoDetail() {
  const { videoId } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoId) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        setLoading(false);
        return;
      }

      setUser(currentUser);
      fetchVideoData(videoId, currentUser.uid);
    });

    return () => unsubscribe();
  }, [videoId, router]);

  const fetchVideoData = async (videoId, userId) => {
    try {
      if (!userId) throw new Error("사용자 정보 없음");

      const docRef = doc(db, "users", userId, "videos", videoId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setVideo(docSnap.data());
      } else {
        console.log("🔥 Firestore에 데이터 없음, YouTube API에서 가져옵니다.");
        const videoData = await fetchYouTubeData(videoId);

        if (videoData) {
          await setDoc(docRef, videoData); // Firestore에 저장
          setVideo(videoData);
        }
      }
    } catch (error) {
      console.error("비디오 데이터를 가져오는 중 오류 발생: ", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchYouTubeData = async (videoId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("YouTube API 요청 실패");
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        throw new Error("YouTube에서 비디오 정보를 찾을 수 없습니다.");
      }

      const videoInfo = data.items[0];
      return {
        name: videoInfo.snippet.title,
        channel: videoInfo.snippet.channelTitle,
        channelProfile: `https://yt3.ggpht.com/ytc/${videoInfo.snippet.channelId}`,
        video: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: videoInfo.snippet.thumbnails.high.url,
        views: videoInfo.statistics.viewCount,
        likes: videoInfo.statistics.likeCount,
        publishedAt: videoInfo.snippet.publishedAt,
      };
    } catch (error) {
      console.error("YouTube API에서 데이터를 가져오는 중 오류 발생: ", error);
      return null;
    }
  };

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  const extractYouTubeID = (url) => {
    if (!url) return null;
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([^#&?]*))/;
    const match = url.match(regex);
    return match && match[1] ? match[1] : null;
  };

  const videoEmbedId = extractYouTubeID(video?.video);

  return (
    <div className="flex flex-col items-center w-full p-6">
      {video && <h1 className="text-2xl font-bold mb-4">{video.name}</h1>}

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

      {video && (
        <Card className="rounded-lg shadow-lg w-full max-w-2xl mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <img src={video.channelProfile} alt={video.channel} className="w-12 h-12 rounded-full" />
              <p className="text-lg font-bold">{video.channel}</p>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              조회수: {video.views} · 좋아요: {video.likes} · 게시일: {new Date(video.publishedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      <Link href="/dashboard">
        <Button className="mt-4">⬅️ 대시보드로 돌아가기</Button>
      </Link>
    </div>
  );
}
