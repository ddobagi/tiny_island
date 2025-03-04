"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, ArrowLeft, Heart, HeartOff } from "lucide-react";

export default function VideoDetail() {
  const { slug } = useParams();
  const router = useRouter();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUserId(currentUser.uid);

      try {
        const docRef = doc(db, "gallery", slug);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error("해당 비디오를 찾을 수 없습니다.");

        const videoData = docSnap.data();
        setVideo(videoData);
        setLikes(videoData.recommend || 0);

        // 🔥 Firestore에서 사용자의 좋아요 상태 가져오기
        const userLikeRef = doc(db, "gallery", slug, "likes", currentUser.uid);
        const userLikeSnap = await getDoc(userLikeRef);

        if (userLikeSnap.exists()) {
          setLiked(true); // 이미 좋아요를 눌렀음
        } else {
          setLiked(false); // 아직 좋아요를 누르지 않음
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [slug, router]);

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  const handleLike = async () => {
    if (!video || !userId) return;

    const docRef = doc(db, "gallery", slug);
    const userLikeRef = doc(db, "gallery", slug, "likes", userId);

    try {
      if (liked) {
        // 🟥 이미 좋아요를 누른 상태 → 좋아요 취소
        await updateDoc(docRef, { recommend: increment(-1) }); // 추천 감소
        await deleteDoc(userLikeRef); // 사용자의 좋아요 기록 삭제

        setLiked(false);
        setLikes((prevLikes) => prevLikes - 1);
      } else {
        // 🟩 아직 좋아요를 누르지 않은 상태 → 좋아요 추가
        await updateDoc(docRef, { recommend: increment(1) }); // 추천 증가
        await setDoc(userLikeRef, { liked: true }); // 사용자의 좋아요 기록 추가

        setLiked(true);
        setLikes((prevLikes) => prevLikes + 1);
      }
    } catch (error) {
      console.error("좋아요 업데이트 실패:", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      <div className="w-full max-w-2xl flex justify-start">
        <Link href="/dashboard" className="flex items-center mb-2">
          <ArrowLeft className="w-6 h-6 mr-2" />
        </Link>
      </div>

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
            <h1 className="text-xl font-bold mb-2">{video.title}</h1>
            <h3 className="text-lg font-bold mb-2">{video.name}</h3>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <img src={video.channelProfile} alt="Channel Profile" className="w-10 h-10 rounded-full mr-3" />
                <span className="text-lg font-semibold">{video.channel}</span>
              </div>
              <div className="flex items-center">
                <ThumbsUp className="w-5 h-5 text-gray-500 mr-1" />
                <span className="text-gray-600">{likes}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{video.views} views · {new Date(video.publishedAt).toLocaleDateString()}</p>

            {/* 좋아요 버튼 */}
            <div className="mt-4 flex items-center justify-center">
              <button
                className="flex items-center p-2 rounded-lg transition"
                onClick={handleLike}
              >
                {liked ? (
                  <Heart className="w-6 h-6 text-red-500" />
                ) : (
                  <HeartOff className="w-6 h-6 text-gray-500" />
                )}
                <span className="ml-2 text-lg font-semibold">{likes}</span>
              </button>
            </div>

            {/* Essay 표시 */}
            <div className="mt-4">
              <h2 className="text-lg font-semibold font-nanum_pen">Essay</h2>
              <p className="mt-2 p-2 border rounded bg-gray-100 font-nanum_pen">{video.essay || "작성된 내용이 없습니다."}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
