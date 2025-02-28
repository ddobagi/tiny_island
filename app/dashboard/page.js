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
import { Plus, X, Trash2, Search, ArrowLeft  } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ name: "", video: "", thumbnail: "", channel: "", views: "", likes: "", publishedAt: "", channelProfile: "" });
  const [search, setSearch] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef(null);
  const router = useRouter();

  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
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
    <div className="flex flex-col items-center max-w-[600px] w-full p-6 relative">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="flex items-center justify-between max-w-[600px] w-full h-16 px-4 bg-transparent border border-gray-500 rounded text-white">
        {/* 왼쪽 아이콘 */}
        {searchMode ? (
          <button onClick={() => setSearchMode(false)} className="text-black">
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-black flex items-center justify-center">
            <img src="/deep_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
        )}

        {/* 검색 입력창 */}
        {searchMode && (
          <input
            type="text"
            className="flex-1 ml-4 px-2 py-1 text-black rounded bg-gray-100"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        {/* 돋보기 버튼 */}
        {!searchMode && (
          <button onClick={() => setSearchMode(true)} className="text-black">
            <Search size={24} />
          </button>
        )}
      </div>


      {user ? (
        <div className="mb-4">
          <p className="text-sm text-gray-500">{extractEmailPrefix(user.email)} 님</p>
          <Button onClick={() => signOut(auth)} className="mt-2">로그아웃</Button>
        </div>
      ) : (
        <Button onClick={() => signInWithPopup(auth, provider)}>Google 로그인</Button>
      )}


      

      <div className="fixed bottom-6 right-6 flex flex-col items-end" ref={fabRef}>
        {fabOpen && (
          <div className="transition-transform transform translate-y-2 opacity-100 mb-2">
            <Input type="text" placeholder="유튜브 링크 입력" value={newVideo.video} onChange={handleInputChange} className="mb-2" />
            <Button onClick={handleAddVideo}>추가</Button>
          </div>
        )}
        <Button onClick={() => setFabOpen(!fabOpen)} className="rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
          {fabOpen ? <X size={24} /> : <Plus size={24} />}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
        {videos
          .filter((video) => video.name.toLowerCase().includes(search.toLowerCase()))
          .map((video) => (
            <Link key={video.id} href={`/dashboard/${video.id}`} passHref>
              <Card key={video.id} className="max-w-[600px] w-full rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition relative">
                <button 
                  onClick={() => deleteDoc(doc(db, "users", user.uid, "videos", video.id))} 
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600">
                  <Trash2 size={16} />
                </button>
                <div className="aspect-w-16 aspect-h-9">
                  <img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover rounded-t-lg" />
                </div>
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