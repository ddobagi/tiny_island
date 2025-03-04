"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ArrowLeft } from "lucide-react";

export default function VideoDetail() {
  const { slug } = useParams();
  const router = useRouter();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [essay, setEssay] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      try {
        const docRef = doc(db, "gallery", slug);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error("해당 비디오를 찾을 수 없습니다.");

        const videoData = docSnap.data();
        setVideo(videoData);
        setEssay(videoData.essay || "");
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [slug, router]);

  const handleSaveEssay = async () => {
    try {
      await updateDoc(doc(db, "gallery", slug), { essay });
      setIsEditing(false);
    } catch {
      setError("Essay 업데이트 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  const getYouTubeVideoID = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/.*v=|youtube\.com\/watch\?v=)([^#&?\n]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      <div className="w-full max-w-2xl flex justify-start">
        <Link href="/dashboard" className="flex items-center mb-2">
          <ArrowLeft className="w-6 h-6 mr-2" />
        </Link>
      </div>

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
              {isEditing ? (
                <Button onClick={handleSaveEssay} className="mt-2">저장</Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="mt-2">수정</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
