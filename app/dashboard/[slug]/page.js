"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ArrowLeft } from "lucide-react";

export default function VideoDetail() {
  const { slug } = useParams(); // URL에서 slug 가져오기
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [essay, setEssay] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            setLoading(true);

            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                const mode = userDocSnap.exists() && userDocSnap.data().Mode === "public";

                setIsOn(mode);
                await fetchVideoData(slug, mode);
            } catch (error) {
                console.error("사용자 Mode 데이터를 가져오는 중 오류 발생:", error);
                await fetchVideoData(slug, false);
            }
        } else {
            router.push("/");
            setLoading(false);
            return;
        }
    });

    return () => unsubscribe();
  }, [slug, router]);

  const getYouTubeVideoID = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/.*v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/user\/.*#p\/u\/\d\/|youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([^#&?\n]+)/);
    return match ? match[1] : null;
  };

  // ✅ `isOn`이 변경될 때 fetchVideoData를 실행하지 않고, 위 `useEffect`에서 직접 실행함
  const fetchVideoData = async (slug, mode) => {
    try {
        setLoading(true);
        let docRef = mode
          ? doc(db, "gallery", slug) : doc(db, "users", auth.currentUser?.uid, "videos", slug)

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const videoData = docSnap.data();
            setVideo(videoData);
            setEssay(videoData.essay || "");
            setIsPosted(mode);
        } else {
            throw new Error(`해당 비디오를 찾을 수 없습니다. (isOn: ${mode})`);
        }
    } catch (error) {
        console.error("Firestore에서 비디오 데이터 가져오는 중 오류 발생: ", error);
        setError(error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleTogglePost = async () => {
    if (!video) return alert("비디오 데이터가 없습니다.");
    if (!auth.currentUser) return alert("로그인 후 이용해주세요");

    try {
      if (isPosted) {
        const q = query(collection(db, "gallery"), where ("video", "==", video.video));
        const querySnapshot = await getDocs(q);

        const batch = writeBatch(db);

        querySnapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        setIsPosted(false);
        alert("게시가 취소되었습니다.");
      } else {
        await addDoc(collection(db, "gallery"), {
          name: video.name || "알 수 없음",
          video: video.video || "",
          thumbnail: video.thumbnail || "",
          channel: video.channel || "알 수 없음",
          views: video.views || 0,
          likes: video.likes || 0,
          publishedAt: video.publishedAt || serverTimestamp(),
          channelProfile: video.channelProfile || "",
          post: true, // 새로운 문서에 post 필드 추가
          essay: video.essay,
          createdAt: serverTimestamp(), // 문서 생성 시간 추가
        });

        setIsPosted(true);
        alert("게시되었습니다!");
      }
    } catch (error) {
      console.error("게시/게시 취소 중 오류 발생: ", error);
    }
  };

  const handleSaveEssay = async () => {
    if (!auth.currentUser) return alert("사용자 인증이 필요합니다.");

    try {
      const docRef = doc(db, "users", auth.currentUser.uid, "videos", slug);
      await updateDoc(docRef, { essay });


      // 🔥 추가된 코드: gallery 컬렉션에서 해당 영상 삭제
      const q = query(collection(db, "gallery"), where("video", "==", video.video));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      // UI 업데이트
      setIsPosted(false);
      setIsEditing(false);
    } catch (error) {
      console.error("에세이 저장 오류: ", error);
    }
  };
  

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

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
              { !isOn && (
                <div className="flex mt-2 space-x-2 font-pretendard justify-end">
                  {isEditing ? (
                    <Button onClick={handleSaveEssay}>저장</Button>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>수정</Button>
                  )}
                  <Button onClick={handleTogglePost} className="bg-blue-500 text-white">
                    {isPosted ? "게시 취소" : "게시"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}