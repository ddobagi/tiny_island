"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, db } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ name: "", video: "", thumbnail: "", channel: "", views: "", likes: "", publishedAt: "", channelProfile: "" });
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY; // Vercel 환경변수에서 API 키 불러오기

  // ✅ Firebase Auth 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ Firestore에서 데이터 불러오기 (실시간 업데이트)
  useEffect(() => {
    if (!user) return;

    const userId = auth.currentUser.uid;
    const videosRef = collection(db, "users", userId, "videos");

    const unsubscribe = onSnapshot(videosRef, (snapshot) => {
      const videosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(videosData);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ 유튜브 API를 사용해 데이터 가져오기
  const getYoutubeVideoDetails = async (url) => {
    try {
      const videoId = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
      if (!videoId) throw new Error("유효한 YouTube 링크가 아닙니다.");

      // 비디오 정보 가져오기
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`
      );
      const videoData = await videoResponse.json();

      if (!videoData.items.length) throw new Error("비디오 정보를 가져올 수 없습니다.");

      const videoInfo = videoData.items[0];
      const { title, channelTitle, publishedAt, thumbnails, channelId } = videoInfo.snippet;
      const { viewCount, likeCount } = videoInfo.statistics;

      // 채널 정보 가져오기
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`
      );
      const channelData = await channelResponse.json();
      const channelProfileImage = channelData.items[0]?.snippet?.thumbnails?.default?.url || "";

      return {
        name: title,
        video: url,
        thumbnail: thumbnails.high.url,
        channel: channelTitle,
        views: viewCount,
        likes: likeCount,
        publishedAt,
        channelProfile: channelProfileImage,
      };
    } catch (error) {
      console.error("YouTube API 오류:", error);
      return null;
    }
  };

  // ✅ 비디오 URL 입력 시 자동으로 데이터 가져오기
  const handleInputChange = async (e) => {
    const url = e.target.value;
    setNewVideo({ ...newVideo, video: url });

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoDetails = await getYoutubeVideoDetails(url);
      if (videoDetails) {
        setNewVideo(videoDetails);
      }
    }
  };

  // ✅ Firestore에 데이터 추가
  const handleAddVideo = async () => {
    if (!user) return;

    try {
      const userId = auth.currentUser.uid;
      await addDoc(collection(db, "users", userId, "videos"), newVideo);
      setNewVideo({ name: "", video: "", thumbnail: "", channel: "", views: "", likes: "", publishedAt: "", channelProfile: "" });
    } catch (error) {
      console.error("Firestore에 비디오 추가 중 오류 발생: ", error);
    }
  };

  // ✅ Firestore 데이터 삭제
  const handleDeleteVideo = async (id) => {
    if (!user) return;

    try {
      const userId = auth.currentUser.uid;
      await deleteDoc(doc(db, "users", userId, "videos", id));
    } catch (error) {
      console.error("Firestore에서 비디오 삭제 중 오류 발생: ", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {user ? (
        <div className="mb-4">
          <p className="text-lg">환영합니다, {user.displayName || "사용자"}! 🎉 ({user.email})</p>
          <Button onClick={() => signOut(auth)} className="mt-2">로그아웃</Button>
        </div>
      ) : (
        <Button onClick={() => signInWithPopup(auth, provider)}>Google 로그인</Button>
      )}

      {/* ✅ 비디오 추가 */}
      <div className="flex flex-col gap-2 w-full max-w-lg mt-4">
        <Input type="text" placeholder="유튜브 링크 입력" value={newVideo.video} onChange={handleInputChange} />
        <Button onClick={handleAddVideo}>비디오 추가</Button>
      </div>

      {/* ✅ 검색창 */}
      <Input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="mt-4 w-full max-w-lg"/>

      {/* ✅ 비디오 리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
        {videos
          .filter(video => video.name.toLowerCase().includes(search.toLowerCase()))
          .map((video) => (
            <Link key={video.id} href={`/dashboard/${video.id}`} passHref>
              <Card className="rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition">
                <img src={video.thumbnail} alt={video.name} className="w-full rounded-t-lg object-cover"/>
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold truncate">{video.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{video.channel} ({video.views} views)</p>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
