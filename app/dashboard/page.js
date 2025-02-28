"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, db } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ name: "", video: "", thumbnail: "", channel: "", views: "", likes: "", publishedAt: "", channelProfile: "" });
  const [search, setSearch] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef(null);
  const router = useRouter();
  
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

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

  useEffect(() => {
    if (!user) return;
    const userId = auth.currentUser.uid;
    const videosRef = collection(db, "users", userId, "videos");
    const unsubscribe = onSnapshot(videosRef, (snapshot) => {
      setVideos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setFabOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getYoutubeVideoDetails = async (url) => {
    try {
      const videoId = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
      if (!videoId) throw new Error("유효한 YouTube 링크가 아닙니다.");
      
      const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`);
      const videoData = await videoResponse.json();
      if (!videoData.items.length) throw new Error("비디오 정보를 가져올 수 없습니다.");
      
      const videoInfo = videoData.items[0];
      const { title, channelTitle, publishedAt, thumbnails, channelId } = videoInfo.snippet;
      const { viewCount, likeCount } = videoInfo.statistics;
      
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`);
      const channelData = await channelResponse.json();
      const channelProfileImage = channelData.items[0]?.snippet?.thumbnails?.default?.url || "";
      
      return { name: title, video: url, thumbnail: thumbnails.high.url, channel: channelTitle, views: viewCount, likes: likeCount, publishedAt, channelProfile: channelProfileImage };
    } catch (error) {
      console.error("YouTube API 오류:", error);
      return null;
    }
  };

  const handleInputChange = async (e) => {
    const url = e.target.value;
    setNewVideo({ ...newVideo, video: url });
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoDetails = await getYoutubeVideoDetails(url);
      if (videoDetails) setNewVideo(videoDetails);
    }
  };

  const handleAddVideo = async () => {
    if (!user) return;
    try {
      const userId = auth.currentUser.uid;
      await addDoc(collection(db, "users", userId, "videos"), newVideo);
      setNewVideo({ name: "", video: "", thumbnail: "", channel: "", views: "", likes: "", publishedAt: "", channelProfile: "" });
      setFabOpen(false);
    } catch (error) {
      console.error("Firestore에 비디오 추가 중 오류 발생: ", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-6 relative">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {user && (
        <div className="mb-4">
          <p className="text-lg">{user.displayName || "사용자"} 님, ({user.email})</p>
          <Button onClick={() => signOut(auth)} className="mt-2">로그아웃</Button>
        </div>
      )}
      <Input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="mt-4 w-full max-w-lg" />
      <div className="fixed bottom-6 right-6 flex flex-col items-end" ref={fabRef}>
        {fabOpen && (
          <div className="transition-transform transform translate-y-2 opacity-100 mb-2">
            <Input type="text" placeholder="유튜브 링크 입력" value={newVideo.video} onChange={handleInputChange} className="mb-2" />
            <Button onClick={handleAddVideo}>비디오 추가</Button>
          </div>
        )}
        <Button onClick={() => setFabOpen(!fabOpen)} className="rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
          {fabOpen ? <X size={24} /> : <Plus size={24} />}
        </Button>
      </div>
    </div>
  );
}
