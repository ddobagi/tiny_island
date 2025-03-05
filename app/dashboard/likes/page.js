"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { query, collection, getDocs, onSnapshot, orderBy, doc, deleteDoc, where } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Trash2, ArrowLeft } from "lucide-react";

export default function LikesDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isOn, setIsOn] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserEmail(currentUser.email);
        setIsOn(true);
      } else {
        router.push("/");
        setUserEmail("")
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!auth.currentUser) return;
  
    const userId = auth.currentUser.uid;
    const galleryRef = collection(db, "gallery");
  
    const unsubscribe = onSnapshot(galleryRef, async (snapshot) => {
      const likedVideoIds = [];
  
      for (const doc of snapshot.docs) {
        const likesRef = collection(db, "gallery", doc.id, "likes");
        const likeQuery = query(likesRef, where("__name__", "==", userId));
        const likeSnapshot = await getDocs(likeQuery);
  
        if (!likeSnapshot.empty) {
          likedVideoIds.push(doc.id);
        }
      }
  
      const likedVideos = snapshot.docs
        .filter((doc) => likedVideoIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() }));
  
      setVideos(likedVideos);
    });
  
    return () => unsubscribe();
  }, [user]);

  function getEmailUsername(email) {
    if (!email || typeof email !== "string") return "";
    return email.split("@")[0];
  }













  
  if (loading) return <p>Loading...</p>;

  return (
    <div className="rounded-lg shadow-lg max-w-2xl w-full flex flex-col p-6 relative mx-auto">
      <div className="w-full max-w-2xl flex justify-between">
        <Link href="/dashboard" className="flex items-center mb-2">
          <ArrowLeft className="w-6 h-6 mr-2" />
        </Link>
        <div className="flex items-center max-w-[600px] w-full h-10 space-x-2 justify-end">
          <p className="text-gray-500 text-sm font-pretendard">{getEmailUsername(userEmail)} 님</p>
          <p onClick={() => signOut(auth)} className="cursor-pointer text-gray-500 text-sm font-pretendard underline">로그아웃</p>
        </div>
      </div>      

      <div className="grid grid-cols-1 gap-6 mt-0 w-full max-w-6xl">
        {videos.map((video) => (
          <Card key={video.id} className="w-full max-w-[600px] rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition relative">
            <Link href={`/dashboard/${video.id}`} passHref>
              <div className="relative w-full aspect-video">
                <iframe
                  className="w-full h-full rounded-t-lg"
                  src={`https://www.youtube.com/embed/${video.video}?autoplay=0&controls=1`}
                  title={video.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </Link>
            <CardContent className="p-4">
              <Link href={`/dashboard/${video.id}`} passHref>
                <div className="flex items-center space-x-3">
                  <img src={video.channelProfile} alt={video.channel} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex flex-col flex-1">
                    <h3 className="text-lg font-bold mb-2">{video.name}</h3>
                    <p className="text-sm text-gray-500">{video.channel} · {video.views} views · {new Date(video.publishedAt).toLocaleDateString()}</p>
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