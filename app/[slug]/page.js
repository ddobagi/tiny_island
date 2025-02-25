"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function VideoPage() {
  const params = useParams();
  const slug = params?.slug;

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGoogleSheetsData = async () => {
      try {
        const res = await fetch(
          `https://python-island.onrender.com/google-sheets/${slug}`
        );

        if (!res.ok) {
          throw new Error(`Google Sheets API error: ${res.status}`);
        }

        const data = await res.json();
        const rows = data.values;

        if (!rows || rows.length < 2) {
          setPageData(null);
          return;
        }

        const headers = rows[0];
        const toggles = rows[1];

        const slugIndex = headers.indexOf("slug");
        const matchedRow = rows.find(
          (row, index) =>
            index > 1 &&
            row[slugIndex]?.toString().trim().toLowerCase() ===
              slug.toLowerCase().trim()
        );

        if (matchedRow) {
          const pageDataObject = headers.reduce((acc, header, idx) => {
            const toggleValue = toggles[idx]?.toLowerCase().trim();
            if (toggleValue === "on") {
              acc[header] = matchedRow[idx] || "";
            }
            return acc;
          }, {});

          setPageData(pageDataObject);
        } else {
          setPageData(null);
        }
      } catch (error) {
        console.error("Error fetching Google Sheets data: ", error);
        setPageData(null);
      }
    };

    if (slug) {
      fetchGoogleSheetsData();
    }
  }, [slug]);

  if (!pageData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
        <Link href="/" className="text-blue-500 hover:underline mt-4">
          Go back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="w-full">
        <div className="relative w-full aspect-video mb-4">
          <iframe
            src={pageData.video?.replace("watch?v=", "embed/")}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        </div>

        <h1 className="text-2xl font-bold mb-2">{pageData.name}</h1>

        <div className="flex items-center mb-4">
          <img
            src={pageData.profile}
            alt="Channel Profile"
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <h2 className="text-lg font-semibold">{pageData.channel}</h2>
            <p className="text-gray-500">구독자 {pageData.subscribers}</p>
          </div>
        </div>

        <div className="flex flex-wrap text-gray-600 mb-4 gap-4">
          <p>조회수 {pageData.view}</p>
          <p>게시일 {pageData.date}</p>
        </div>

        <p className="text-gray-700 mb-2">영상 길이: {pageData.length}</p>
        <p className="text-gray-700 mb-4">좋아요: {pageData.likes}</p>

        <Link href="/" className="text-blue-500 hover:underline mt-4">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
