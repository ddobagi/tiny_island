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
  const [newVideo, setNewVideo] = useState({ name: "", video: "", thumbnail: "", channel: "" });
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

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

    const videosRef = collection(db, "videos");

    const unsubscribe = onSnapshot(videosRef, (snapshot) => {
      const videosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(videosData);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ Firestore에 데이터 추가
  const handleAddVideo = async () => {
    if (!user) return;

    try {
      await addDoc(collection(db, "videos"), newVideo);
      setNewVideo({ name: "", video: "", thumbnail: "", channel: "" });
    } catch (error) {
      console.error("Firestore에 비디오 추가 중 오류 발생: ", error);
    }
  };

  // ✅ Firestore 데이터 수정
  const handleUpdateVideo = async (id, updatedData) => {
    try {
      const videoRef = doc(db, "videos", id);
      await updateDoc(videoRef, updatedData);
    } catch (error) {
      console.error("Firestore 업데이트 중 오류 발생: ", error);
    }
  };

  // ✅ Firestore 데이터 삭제
  const handleDeleteVideo = async (id) => {
    try {
      await deleteDoc(doc(db, "videos", id));
    } catch (error) {
      console.error("Firestore에서 비디오 삭제 중 오류 발생: ", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {user ? (
        <div className="mb-4">
          <p className="text-lg">
            환영합니다, {user.displayName ? user.displayName : "사용자"}! 🎉 ({user.email})
          </p>
          <Button onClick={() => signOut(auth)} className="mt-2">로그아웃</Button>
        </div>
      ) : (
        <Button onClick={() => signInWithPopup(auth, provider)}>Google 로그인</Button>
      )}

      {/* ✅ 비디오 추가 폼 */}
      <div className="flex flex-col gap-2 w-full max-w-lg mt-4">
        <p className="text-sm text-gray-500">📌 새 비디오 추가</p>
        <Input 
          type="text" 
          placeholder="비디오 제목" 
          value={newVideo.name} 
          onChange={(e) => setNewVideo({ ...newVideo, name: e.target.value })} 
        />
        <Input 
          type="text" 
          placeholder="비디오 URL" 
          value={newVideo.video} 
          onChange={(e) => setNewVideo({ ...newVideo, video: e.target.value })} 
        />
        <Input 
          type="text" 
          placeholder="썸네일 URL" 
          value={newVideo.thumbnail} 
          onChange={(e) => setNewVideo({ ...newVideo, thumbnail: e.target.value })} 
        />
        <Input 
          type="text" 
          placeholder="채널명" 
          value={newVideo.channel} 
          onChange={(e) => setNewVideo({ ...newVideo, channel: e.target.value })} 
        />
        <Button onClick={handleAddVideo}>비디오 추가</Button>
      </div>

      {/* ✅ 검색창 */}
      <Input 
        type="text" 
        placeholder="Search..." 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        className="mt-4 w-full max-w-lg"
      />

      {/* ✅ 비디오 리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
        {videos
          .filter(video => video.name.toLowerCase().includes(search.toLowerCase()))
          .map((video) => (
            <div key={video.id} className="w-full relative">
              <Link href={`/dashboard/${video.id}`} className="w-full">
                <Card className="rounded-lg shadow-lg hover:shadow-2xl transition">
                  <img src={video.thumbnail} alt={video.name} className="w-full rounded-t-lg aspect-video object-cover" />
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold truncate">{video.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{video.channel}</p>
                  </CardContent>
                </Card>
              </Link>

              {/* 삭제 버튼 */}
              <Button onClick={() => handleDeleteVideo(video.id)} className="absolute top-2 right-2 bg-red-500">
                삭제
              </Button>
            </div>
          ))}
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
