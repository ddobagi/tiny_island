"use client"; 
// 클라이언트 컴포넌트로 지정해 클라이언트 사이드에서 실행되도록 함
// 그래야지 클라이언트 사이드에서만 실행되는 훅(useState) 사용 가능

import Link from "next/link";
import { useState } from "react";

const pages = [
  { name: "NVIDIA", slug: "nvidia", content: "NVIDIA is a technology company specializing in GPUs." },
  { name: "Walmart", slug: "wm", content: "Walmart is a multinational retail corporation." },
  { name: "Visa", slug: "visa", content: "Visa is a global payments technology company." },
];

export default function Home() {
// 메인 컴포넌트 함수 
  const [search, setSearch] = useState("");
  // useState를 사용해 search라는 상태 변수 생성성

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
