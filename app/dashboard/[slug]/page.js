"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs, deleteDoc, writeBatch, setDoc, increment } from "firebase/firestore";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ArrowLeft, Heart } from "lucide-react";

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
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            console.log("✅ 로그인된 사용자:", currentUser);
            setUser(currentUser);
            setLoading(true);

            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                console.log("1번 uid 통과");
                const userDocSnap = await getDoc(userDocRef);
                const mode = userDocSnap.exists() && userDocSnap.data().Mode === "public";

                setIsOn(mode);
                await fetchVideoData(slug, mode);
            } catch (error) {
                console.error("사용자 Mode 데이터를 가져오는 중 오류 발생:", error);
                await fetchVideoData(slug, false);
            }
        } else {
            console.log("❌ 로그인되지 않음");
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
    if (!auth.currentUser) {
      console.warn("user가 아직 설정되지 않음, 500ms 후 다시 실행");
      setTimeout(() => fetchVideoData(slug, mode), 500); // 🔥 0.5초 후 다시 실행
      return;
    }
    try {
        setLoading(true);
        const userId = auth.currentUser?.uid;
        console.log("2번 uid 통과");

        let docRef = mode
          ? doc(db, "gallery", slug) : doc(db, "users", userId, "videos", slug)

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const videoData = docSnap.data();
            setVideo(videoData);
            setEssay(videoData.essay || "");
            setIsPosted(mode);
        } else {
            throw new Error(`해당 비디오를 찾을 수 없습니다. (isOn: ${mode})`);
        }

        if (mode) {
          const videoData = docSnap.data();
          setLikes(videoData.recommend || 0);

          const userId = auth.currentUser?.uid;

          const [userLikeSnap, userDocSnap] = await Promise.all([
            getDoc(doc(db, "gallery", slug, "likes", userId)),
            getDoc(doc(db, "users", userId))
          ]);
          console.log("3번 uid 통과");

          setLiked(userLikeSnap.exists());

          if (userDocSnap.exists() && userDocSnap.data().Mode) {
            setIsOn(userDocSnap.data().Mode === "public"); // ✅ Mode 값에 따라 isOn 설정
          } else {
            setIsOn(false); // ✅ Mode 값이 없으면 기본값 설정
          }
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
      const userId = auth.currentUser?.uid;
      const docRef = doc(db, "users", userId, "videos", slug);
      await updateDoc(docRef, { essay });
      console.log("4번 uid 통과");


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
  
  const handleLike = async () => {
    if (!video) return;
    if (!auth.currentUser) return alert(" ");

    const docRef = doc(db, "gallery", slug);
    const userLikeRef = doc(db, "gallery", slug, "likes", userId);

    try {
      if (liked) {
        // 🟥 이미 좋아요를 누른 상태 → 좋아요 취소
        await updateDoc(docRef, { recommend: increment(-1) }); // 추천 감소
        await deleteDoc(userLikeRef); // 사용자의 좋아요 기록 삭제

        setLiked(false);
        setLikes((prevLikes) => prevLikes - 1);
      } else {
        // 🟩 아직 좋아요를 누르지 않은 상태 → 좋아요 추가
        await updateDoc(docRef, { recommend: increment(1) }); // 추천 증가
        await setDoc(userLikeRef, { liked: true }); // 사용자의 좋아요 기록 추가

        setLiked(true);
        setLikes((prevLikes) => prevLikes + 1);
      }
    } catch (error) {
      console.error("좋아요 업데이트 실패:", error);
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

            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold font-nanum_pen">Essay</h2>

                {isOn && (
                  <button
                    className="flex items-center p-2 rounded-lg transition"
                    onClick={handleLike}
                  >
                    <Heart
                      className="w-6 h-6 text-red-500"
                      fill={liked ? "currentColor" : "none"} // 🔥 불필요한 삼항 연산자 제거
                    />
                    <span className="ml-2 text-lg font-semibold">{likes}</span>
                  </button>
                )}
              </div>

              {!isOn ? (
                // 🔥 isOn이 false일 때 (편집 가능)
                isEditing ? (
                  <textarea
                    className="w-full p-2 border rounded mt-2 font-nanum_pen"
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                />
                ) : (
                  <p className="mt-2 p-2 border rounded bg-gray-100 font-nanum_pen">
                    {essay || "작성된 내용이 없습니다."}
                  </p>
                )
              ) : (
                // 🔥 isOn이 true일 때 (읽기 전용)
                <div className="flex-1">
                  <p className="mt-2 p-2 border rounded bg-gray-100 font-nanum_pen">
                    {video.essay || "작성된 내용이 없습니다."}
                  </p>
                </div>
              )}

              {/* 🔥 isOn이 false일 때만 버튼 표시 */}
              {!isOn && (
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