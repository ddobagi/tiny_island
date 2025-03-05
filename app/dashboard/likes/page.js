"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { query, collection, onSnapshot, orderBy, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Trash2 } from "lucide-react";

export default function LikesDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
    
    const userId = user.uid;
    const collectionPath = collection(db, "gallery", videoId, "likes");
    const q = query(collectionPath);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const likedVideos = snapshot.docs
        .filter((doc) => doc.data().likedBy?.includes(userId)) // 현재 사용자가 좋아요 누른 영상만 필터링
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideos(likedVideos);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="rounded-lg shadow-lg max-w-2xl w-full flex flex-col p-6 relative mx-auto">
      <div className="flex items-center justify-between w-full h-16 px-4 border border-gray-500 rounded text-white">
        <h1 className="text-lg font-bold">Liked Videos</h1>
        {user && (
          <button onClick={() => signOut(auth)} className="text-black">
            <LogOut size={24} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6 w-full max-w-6xl">
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
            <button
              onClick={async () => {
                await deleteDoc(doc(db, "gallery", "videos", "likes", video.id));
                router.push("/dashboard/likes");
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
            >
              <Trash2 size={32} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
