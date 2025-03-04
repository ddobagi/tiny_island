"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ArrowLeft } from "lucide-react";

export default function VideoDetail() {
  const { slug } = useParams(); // URL에서 slug 가져오기
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [essay, setEssay] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        setLoading(false);
        return;
      }
      setUser(currentUser);
      fetchVideoData(slug);
    });
    return () => unsubscribe();
  }, [slug, router]);

  const getYouTubeVideoID = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/.*v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/user\/.*#p\/u\/\d\/|youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([^#&?\n]+)/);
    return match ? match[1] : null;
  };

  const fetchVideoData = async (slug) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("사용자 인증이 필요합니다.");
      
      const docRef = doc(db, "users", userId, "videos", slug);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setVideo(docSnap.data());
        setEssay(docSnap.data().essay || "");
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

  const handleSaveEssay = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("사용자 인증이 필요합니다.");
      
      const docRef = doc(db, "users", userId, "videos", slug);
      await updateDoc(docRef, { essay });
      setIsEditing(false);
    } catch (error) {
      console.error("Firestore에서 essay 데이터 업데이트 중 오류 발생: ", error);
    }
  };
  
  const VideoPostButton = ({ userId, videoId }) => {
    const [isPosted, setIsPosted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const checkPostStatus = async () => {
        if (!userId || !videoId) return;
  
        const galleryRef = doc(db, "gallery", videoId);
        const docSnap = await getDoc(galleryRef);
  
        if (docSnap.exists()) {
          setIsPosted(true);
        }
      };
  
      checkPostStatus();
    }, [userId, videoId]);



    // 🔹 Firestore에 비디오 게시
    const handlePostVideo = async () => {
      if (!userId || !videoId) {
        setError("유효한 사용자 또는 비디오 ID가 필요합니다.");
        return;
      }
      
      setLoading(true);
      setError(null);
  
      try {
        // 1️⃣ users/{userId}/videos/{videoId}에서 videoDetails 가져오기
        const videoRef = doc(db, "users", userId, "videos", videoId);
        const videoSnap = await getDoc(videoRef);
  
        if (!videoSnap.exists()) {
          throw new Error("비디오 데이터를 찾을 수 없습니다.");
        }
  
        const videoDetails = videoSnap.data();
  
        // 2️⃣ gallery/{videoId}에 videoDetails 저장
        const galleryRef = doc(db, "gallery", videoId);
        await setDoc(galleryRef, videoDetails);
  
        // 3️⃣ 버튼 상태 변경
        setIsPosted(true);
      } catch (error) {
        console.error("게시 중 오류 발생: ", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    // 🔹 Firestore에서 비디오 게시 취소
    const handleUnpostVideo = async () => {
      if (!userId || !videoId) {
        setError("유효한 사용자 또는 비디오 ID가 필요합니다.");
        return;
      }  

      setLoading(true);
      setError(null);
  
      try {
        // 1️⃣ gallery/{videoId}에서 삭제
        const galleryRef = doc(db, "gallery", videoId);
        await deleteDoc(galleryRef);
  
        // 2️⃣ 버튼 상태 변경
        setIsPosted(false);
      } catch (error) {
        console.error("게시 취소 중 오류 발생: ", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      
    );
  };
  



  if (loading) return <p className="text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col items-center w-full p-6">
      <div className="w-full max-w-2xl flex justify-start">
        <Link href="/dashboard" className="flex items-center mb-2">
          <ArrowLeft className="w-6 h-6 mr-2" />
        </Link>
      </div>
      {video && <h1 className="text-2xl font-bold mb-1">{video.title}</h1>}
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
                <span className="text-gray-600">{video.likes}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{video.views} views · {new Date(video.publishedAt).toLocaleDateString()}</p>
            
            {/* Essay 입력 및 수정 */}
            <div className="mt-4">
              <h2 className="text-lg font-semibold font-nanum_pen">Essay</h2>
              {isEditing ? (
                <textarea
                  className="w-full p-2 border rounded mt-2 font-nanum_pen"
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                />
              ) : (
                <p className="mt-2 p-2 border rounded bg-gray-100 font-nanum_pen">{essay || "작성된 내용이 없습니다."}</p>
              )}
              <div className="flex mt-2 space-x-2 font-pretendard justify-end">
                {isEditing ? (
                  <Button onClick={handleSaveEssay}>저장</Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>수정</Button>
                )}
              </div>
              {/* 📌 게시 버튼을 VideoPostButton으로 이동 */}
              <VideoPostButton userId={auth.currentUser?.uid} videoId={slug} />
              <div className="flex mt-2 space-x-2 font-pretendard justify-end">
                <Button onClick={isPosted ? handleUnpostVideo : handlePostVideo} disabled={loading}>
                  {loading ? "처리 중..." : isPosted ? "게시 취소" : "게시"}
                </Button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
