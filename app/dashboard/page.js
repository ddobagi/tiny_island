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
      
      return { name: title, video: url, thumbnail: thumbnails.high.url, channel: channelTitle, views: viewCount, likes: likeCount, publishedAt };
    } catch (error) {
      console.error("YouTube API 오류:", error);
      return null;
    }
  };

  const handleInputChange = async (e) => {
    const url = e.target.value;
    setNewVideo({ ...newVideo, video: url });
  };

  const handleAddVideo = async () => {
    if (!user || !newVideo.video) return;
    try {
      const videoDetails = await getYoutubeVideoDetails(newVideo.video);
      if (!videoDetails) return;
      const userId = auth.currentUser.uid;
      await addDoc(collection(db, "users", userId, "videos"), videoDetails);
      setNewVideo({ name: "", video: "", thumbnail: "", channel: "", views: "", likes: "", publishedAt: "", channelProfile: "" });
      setFabOpen(false);
    } catch (error) {
      console.error("Firestore에 비디오 추가 중 오류 발생: ", error);
    }
  };

  const extractEmailPrefix = (email) => {
    return email ? email.split("@")[0] : "";
  };

  return (
    <div className="flex flex-col items-center w-full p-6 relative">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {user ? (
        <div className="mb-4">
          <p className="text-sm text-gray-500">{extractEmailPrefix(user.email)} 님</p>
          <Button onClick={() => signOut(auth)} className="mt-2">로그아웃</Button>
        </div>
      ) : (
        <Button onClick={() => signInWithPopup(auth, provider)}>Google 로그인</Button>
      )}


      <Input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="mt-4 w-full max-w-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
        {videos.map((video) => (
          <Card key={video.id} className="rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition relative">
            <button 
              onClick={() => deleteDoc(doc(db, "users", user.uid, "videos", video.id))} 
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600">
              <Trash2 size={16} />
            </button>
            <div className="w-full aspect-w-16 aspect-h-9">
              <img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover rounded-t-lg" />
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold truncate">{video.name}</h3>
              <p className="text-sm text-gray-500 truncate">{video.channel} ({video.views} views)</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}