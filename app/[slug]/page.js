"use client"; 
// 클라이언트 컴포넌트로 지정해 클라이언트 사이드에서 실행되도록 함
// 그래야지 클라이언트 사이드에서만 실행되는 훅(useState) 사용 가능

import { useParams } from "next/navigation";
// URL 파라미터(slug 등)를 가져오기 위한 훅입니다.
import Link from "next/link";
// 클라이언트 사이드 네비게이션을 제공하는 컴포넌트입니다.
import { useEffect, useState } from "react";

// 타입 주석 제거 (순수 자바스크립트 구문)
const pages = {
  nvidia: { name: "NVIDIA", content: "NVIDIA is a technology company specializing in GPUs." },
  wm: { name: "Walmart", content: "Walmart is a multinational retail corporation." },
  visa: { name: "Visa", content: "Visa is a global payments technology company." },
  // 추가 페이지들은 여기에 추가
};

export default function SubPage() {
  const params = useParams();  // ✅ useParams로 slug 가져오기
  const slug = params?.slug;

  const [pythonOutput, setPythonOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const page = pages[slug];

  useEffect(() => {
    const fetchPythonOutput = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://python-api-cjea.onrender.com/run-python');

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        setPythonOutput(data.result || "No output from Python");
      } catch (error) {
        console.error("Error fetching Python output:", error);
        setPythonOutput(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPythonOutput();
  }, []);

  if (!page) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          Go back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{page.name}</h1>
      <p className="mt-4">{page.content}</p>

      <h2 className="text-xl font-bold mt-6">Python Output:</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <p className="mt-2">{pythonOutput}</p>
      )}

      <Link href="/" className="text-blue-500 hover:underline mt-4 block">
        Back to Home
      </Link>
    </div>
  );
}
