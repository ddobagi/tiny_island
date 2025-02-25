"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SubPage() {
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
          console.error("Insufficient rows returned from API");
          setPageData(null);
          return;
        }

        const headers = rows[0];
        const slugIndex = headers.indexOf("slug");

        const matchedRow = rows.find(
          (row, index) =>
            index > 1 &&
            row[slugIndex]?.toString().trim().toLowerCase() ===
              slug.toLowerCase().trim()
        );

        if (matchedRow) {
          const pageDataObject = headers.reduce((acc, header, idx) => {
            acc[header] = matchedRow[idx] || "";
            return acc;
          }, {});

          setPageData(pageDataObject);
        } else {
          console.error("No matching row found for slug: ", slug);
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
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="md:shrink-0">
            <img
              className="h-48 w-full object-cover md:h-full md:w-48"
              src={pageData.thumbnail}
              alt="Video Thumbnail"
            />
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
              {pageData.channel}
            </div>
            <a href="#" className="block mt-1 text-lg leading-tight font-medium text-black hover:underline">
              {pageData.name}
            </a>
            <p className="mt-2 text-gray-500">조회수: {pageData.view} · {pageData.date}</p>
            <div className="flex items-center mt-4">
              <img
                className="h-10 w-10 rounded-full"
                src={pageData.profile}
                alt="Channel Profile"
              />
              <p className="ml-4 text-gray-700">{pageData.channel}</p>
            </div>
            <p className="mt-2 text-gray-500">영상 길이: {pageData.length}</p>
          </div>
        </div>
      </div>
      <Link href="/" className="text-blue-500 hover:underline mt-4 block">
        Back to Home
      </Link>
    </div>
  );
}
