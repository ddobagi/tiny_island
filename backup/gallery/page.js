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
    const videosRef = collection(db, "gallery");
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
        publishedAt: publishedAt.slice(0, 10)
      };
    } catch (error) {
      console.error("YouTube API 오류:", error);
      return null;
    }
  };

  const handleAddVideo = async () => {
    if (!user || !newVideo.video) return;
    try {
      const videoDetails = await getYoutubeVideoDetails(newVideo.video);
      if (!videoDetails) return;
      const userId = auth.currentUser.uid;
      await addDoc(collection(db, "gallery"), videoDetails);
      setNewVideo({ name: "", video: "", thumbnail: "", channel: "", views: "", likes: "", publishedAt: "", channelProfile: "" });
      setFabOpen(false);
    } catch (error) {
      console.error("Firestore에 비디오 추가 중 오류 발생: ", error);
    }
  };

  const getYouTubeVideoID = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/.*v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/user\/.*#p\/u\/\d\/|youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([^#&?\n]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="rounded-lg shadow-lg max-w-2xl w-full flex flex-col p-6 relative mx-auto">
        <h1>Collection</h1>
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

      <div className="grid grid-cols-1 gap-6 mt-6 w-full max-w-6xl">
        {videos
          .filter((video) => video.name.toLowerCase().includes(search.toLowerCase()))
          .map((video) => (
            <Card key={video.id} className="w-full max-w-[600px] rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition relative">
              <Link key={video.id} href={`/gallery/${video.id}`} passHref>
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
              </Link>
              <CardContent className="p-4">
                <Link key={video.id} href={`/gallery/${video.id}`} passHref>
                  <div className="flex items-center space-x-3">
                    {/* 채널 프로필 이미지 */}
                    <img src={video.channelProfile} alt={video.channel} className="w-10 h-10 rounded-full object-cover" />

                    {/* 영상 제목 및 채널 정보 */}
                    <div className="flex flex-col flex-1">
                      {/* 영상 제목 */}
                      <h3 className="text-lg font-bold mb-2">{video.name}</h3>
            
                      {/* 채널명, 조회수, 게시일 */}
                      <p className="text-sm text-gray-500">
                        {video.channel} · {video.views} views · {new Date(video.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}