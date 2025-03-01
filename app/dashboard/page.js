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
import { Plus, X, Trash2, Search, ArrowLeft, LogOut  } from "lucide-react";

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
      // 유튜브 영상 ID 추출 정규식
      const pattern = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|embed|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]+)/;
      const match = url.match(pattern);
  
      // 영상 ID가 없으면 에러 처리
      if (!match || !match[1]) throw new Error("유효한 YouTube 링크가 아닙니다.");
      
      const videoId = match[1]; // 올바른 영상 ID 추출 
  
      // 📌 유튜브 영상 정보 가져오기
      const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`);
      const videoData = await videoResponse.json();
  
      // 비디오 정보 확인
      if (!videoData.items || videoData.items.length === 0) throw new Error("비디오 정보를 가져올 수 없습니다.");
      
      const videoInfo = videoData.items[0];
      const { title, channelTitle, publishedAt, thumbnails, channelId } = videoInfo.snippet;
      const { viewCount, likeCount } = videoInfo.statistics;
  
      // 📌 유튜브 채널 정보 가져오기
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`);
      const channelData = await channelResponse.json();
  
      // 채널 정보 확인
      if (!channelData.items || channelData.items.length === 0) throw new Error("채널 정보를 가져올 수 없습니다.");
      
      const channelProfile = channelData.items[0].snippet.thumbnails.default.url;
  
      // 📌 최종 결과 반환
      return {
        name: title,
        video: url,
        thumbnail: thumbnails.high.url,
        channel: channelTitle,
        channelProfile: channelProfile, // ✅ 오타 수정 (chaennelProfile → channelProfile)
        views: viewCount,
        likes: likeCount,
        publishedAt: publishedAt
      };
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
    <div className="mx-auto flex flex-col items-center max-w-[600px] w-full p-6 relative" style={{ backgroundColor: "#F3F4F6" }}>
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

        <div className = "flex items-center space-x-6">
          {/* 돋보기 버튼 */}
          {!searchMode && (
            <button onClick={() => setSearchMode(true)} className="text-black">
              <Search size={24} />
            </button>
          )}

          {user && !searchMode && (
            <button onClick={() => signOut(auth)} className="text-black">
              <LogOut size={24} />
            </button>
          )}
        </div>
      </div>      

      <div className="z-10 fixed bottom-6 right-6 flex flex-col items-end" ref={fabRef}>
        {fabOpen && (
          <div className="relative px-4 py-2 w-[400px] transition-transform transform translate-y-2 opacity-100 mb-2">
            <p className="font-pretendard font-semibold text-gray-700">URL</p>
            <div className="relative flex items-center bg-gray-100 rounded-lg px-4 py-2">
              <Input 
                type="text" 
                placeholder="Youtube URL" 
                value={newVideo.video} 
                onChange={handleInputChange} 
                className="flex-1 bg-gray-100 focus:outline-none text-gray-700" 
              />
              <Button 
                onClick={handleAddVideo} 
                className="ml-2 h-10 px-4 rounded-full bg-black text-white font-bold text-sm"
              >
                추가
              </Button>
            </div>
          </div>
        )}
        <Button 
          onClick={() => setFabOpen(!fabOpen)} 
          className="rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        >
          {fabOpen ? <X size={24} /> : <Plus size={24} />}
        </Button>
      </div>


      <div className="grid grid-cols-1 gap-6 mt-6 w-full max-w-6xl">
        {videos
          .filter((video) => video.name.toLowerCase().includes(search.toLowerCase()))
          .map((video) => (
            <Link key={video.id} href={`/dashboard/${video.id}`} passHref>
              <Card key={video.id} className="w-full rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition relative">
                <button 
                  onClick={() => deleteDoc(doc(db, "users", user.uid, "videos", video.id))} 
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600">
                  <Trash2 size={32} />
                </button>
                <div className = "rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition">
                  <img src={video.thumbnail} alt={video.name} className="w-full h rounded-t-lg object-cover" />
                </div >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    {/* 채널 프로필 이미지 */}
                    <img src={video.channelProfile} alt={video.channel} className="w-10 h-10 rounded-full object-cover" />

                    {/* 영상 제목 및 채널 정보 */}
                    <div className="flex flex-col flex-1">
                      {/* 영상 제목 */}
                      <h3 className="text-lg font-bold">{video.name}</h3>
            
                      {/* 채널명, 조회수, 게시일 */}
                      <p className="text-sm text-gray-500 truncate">
                        {video.channel} · {video.views} views · {video.publishedAt}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}