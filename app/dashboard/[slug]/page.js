"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = "https://python-island.onrender.com/google-sheets/";
const range = "data!A1:Z100";

export default function VideoDetail() {
  const { slug } = useParams(); // URL에서 slug 가져오기
  const searchParams = useSearchParams(); // ✅ URL에서 `sheet` 값 가져오기
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheetsId, setSheetsId] = useState(null);

  // ✅ URL에서 `sheetsId` 가져오기
  useEffect(() => {
    const sheetIdFromUrl = searchParams.get("sheet");
    if (sheetIdFromUrl) {
      setSheetsId(sheetIdFromUrl);
    } else {
      setError("Google Sheets ID를 찾을 수 없습니다.");
      alert("Google Sheets ID를 찾을 수 없습니다. 대시보드에서 다시 입력해주세요.");
      setLoading(false);
    }
  }, [searchParams]);

  // ✅ Google Sheets에서 특정 비디오 정보 불러오기
  useEffect(() => {
    if (!slug || !sheetsId) return;

    const fetchVideoData = async () => {
      try {
        const res = await fetch(`${API_URL}${sheetsId}?range=${encodeURIComponent(range)}`);
        if (!res.ok) throw new Error(`Google Sheets API error: ${res.status}`);

        const data = await res.json();
        const rows = data.values;
        if (!rows || rows.length === 0) throw new Error("No data found in Google Sheets");

        const headers = rows[0];
        const slugIndex = headers.indexOf("slug");
        const foundVideo = rows.slice(1).find((row) => row[slugIndex] === slug);

        if (!foundVideo) throw new Error("해당 비디오를 찾을 수 없습니다.");

        setVideo({
          name: foundVideo[headers.indexOf("name")],
          thumbnail: foundVideo[headers.indexOf("thumbnail")] || "",
          channel: foundVideo[headers.indexOf("channel")],
          view: foundVideo[headers.indexOf("view")],
          date: foundVideo[headers.indexOf("date")],
          length: foundVideo[headers.indexOf("length")],
        });

      } catch (error) {
        console.error("Error fetching video data: ", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [slug, sheetsId]);

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col items-center w-full p-6">
      <h1 className="text-2xl font-bold mb-4">{video.name}</h1>

      <Card className="rounded-lg shadow-lg w-full max-w-2xl">
        <img src={video.thumbnail} alt={video.name} className="w-full rounded-t-lg aspect-video object-cover" />
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">채널: {video.channel} · 조회수: {video.view} · 날짜: {video.date}</p>
          <p className="mt-2">영상 길이: {video.length}</p>
        </CardContent>
      </Card>

      <Link href="/dashboard">
        <Button className="mt-4">⬅️ 대시보드로 돌아가기</Button>
      </Link>
    </div>
  );
}
