"use client"; 
// 클라이언트 컴포넌트로 지정해 클라이언트 사이드에서 실행되도록 함
// 그래야지 클라이언트 사이드에서만 실행되는 훅(useState) 사용 가능

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
// 메인 컴포넌트 함수 
  const [search, setSearch] = useState("");
  // useState를 사용해 search라는 상태 변수 생성성
  const [pages, setPages] = useState([]); // 스프레드시트 데이터를 저장할 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태태

  // Google Sheets 데이터 가져오기
  useEffect(() => {
    const fetchGoogleSheetsData = async () => {
      try {
        const res = await fetch("https://python-island.onrender.com/google-sheets/all");

        if (!res.ok) {
          throw new Error(`Google Sheets API error: ${res.status}`);
        }

        const data = await res.json();
        const rows = data.values;

        if (!rows || rows.length === 0) {
          throw new Error("No data found in Google Sheets");
        }

        const headers = rows[0];
        const slugIndex = headers.indexOf("slug");
        const nameIndex = headers.indexOf("name");
        const contentIndex = headers.indexOf("content");

        const parsedPages = rows.slice(1).map((row) => ({
          slug: rows[slugIndex],
          name: rows[nameIndex],
          content: rows[contentIndex],
        }));

        setPages(parsedPages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Google Sheets data: ", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchGoogleSheetsData();
  }, []);

  const filteredPages = pages.filter((page) =>
  // 입력된 검색어에 따라 pages 배열을 필터링 
    page.name.toLowerCase().includes(search.toLowerCase())
    // page.name을 소문자로 변환하고, 입력된 search 값과 비교 
  );

  return (
    <div>
      <h1>Searchable Subpages</h1>
      <input // 검색창 
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        // 사용자가 입력하려고 하면(변화 있으면) setSearch로 상태 업데이트 
      />

      <ul>
        {filteredPages.map((page) => (
          <li key={page.slug}> 
            <Link href={`/${page.slug}`}>{page.name}</Link> 
          </li>
          // Link 컴포넌트를 사용하여 해당 slug로 이동
        ))}
      </ul>
    </div>
  );
}
