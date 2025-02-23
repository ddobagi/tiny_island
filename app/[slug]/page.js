"use client"; 
// 서버 측이 아닌, 클라이언트 측(브라우저)에서 코드가 실행되도록 함
// 사용자와 상호작용할 수 있는 React Hook(ex. useState, useEffect, useParams 등)을 사용할 수 있음

import { useParams } from "next/navigation";
// useParams: 현재 URL의 파라미터, 특히 slug를 가져오기 위한 React Hook
import { useEffect, useState } from "react";
// useEffect: 컴포넌트가 DOM에 추가 or 업데이트되어 렌더링될 때(화면에 나타날 때) 작업을 수행하는 React Hook
// useState: 컴포넌트의 상태를 관리하는 React Hook
import Link from "next/link";
// 전체 새로 고침 대신, 필요한 데이터만 불러와 빠르게 페이지를 전환하는 컴포넌트

export default function SubPage() {
// Subpage라는 컴포넌트를 정의
// export default를 사용하면 다른 파일에서도 Subpage 컴포넌트를 사용 가능 
  const params = useParams(); 
  // useParams 훅으으로 slug 값을 가져옴
  // ex. URL이 /subpage/nvidia라면 params.slug는 nvidia
  const slug = params?.slug;
  // ?. 은 optional chaining으로, params 값이 null이나 undefined면 undefined를 반환함
  // params 값이 null이나 undefined가 아니라면 이후의 코드를 정상적으로 실행함

  // useState 훅을 사용하여 3개의 변수(pageData, pythonOutput, loading)를 정의함 
  const [pageData, setPageData] = useState(null);
  // pageData: google sheets API에서 가져온 데이터(slug, name, content)를 저장함 
  // 초기값: null 
  const [pythonOutput, setPythonOutput] = useState(null);
  // pythonOutput: python API에서 가져온 데이터를 저장함
  // 초기값: null
  const [loading, setLoading] = useState(false);
  // loading: 로딩 여부를 저장함
  // 초기값: false

  // 📌📌📌 google sheets 데이터 가져오기 📌📌📌//
  useEffect(() => {
  // 앞서 설명한 리액트 훅, 컴포넌트가 마운트되거나 페이지의 slug 값이 변경될 때 실행됨 
    const fetchGoogleSheetsData = async () => {
    // google sheets에서 데이터를 가져오는 "비동기" 함수인 fetchGoogleSheetsData를 정의함
    // 비동기 함수(async): 병렬로 실행되는 함수. 백그라운드에서 실행되는 것처럼 이해해도 될 듯.
      try {
        const res = await fetch(
          `https://python-island.onrender.com/google-sheets/${slug}`
          // 앞서 slug 변수를 설정했음. 해당 slug 변수에 해당하는 데이터를 fetch해서 res 변수에 저장 
          // ❓❓ index.js(백엔드)에서 정의한 경로 ('app.get('/google-sheets/:slug', ... )에서 fetch 진행 
          // await: async 함수의 병렬 작업이 끝날 때까지 기다림 
        );

        if (!res.ok) {
          throw new Error(`Google Sheets API error: ${res.status}`);
        }
        // 응답 코드가 200~299가 아닐 경우, 에러를 발생시킴 

        const data = await res.json();
        // res 변수에 저장한 데이터를 json으로 변환 
        console.log("Fetched Data:", data);
        // json으로 변환된 데이터를 출력해 확인 

        const rows = data.values;
        // json 파일의 value들을 추출해 rows 변수에 담음. 이때 rows는 '배열'이 됨.
        if (!rows || rows.length < 3) {
          console.error("Insufficient rows returned from API");
          setPageData(null);
          return;
        }
        // 이때 rows 배열이 비어있다면 에러를 발생시키고 pageData를 null로 설정 

        const headers = rows[0];
        const toggles = rows[1];

        console.log("Headers: ", headers);
        console.log("Toggles: ", toggles);
        // 스프레드시트에서 첫 번째 행은 header로 인식하도록 설정합니다.

        const slugIndex = headers.indexOf("slug");
        if (slugIndex === -1) {
          console.error("Slug header not found in headers: ", headers);
          setPageData(null);
          return
        } else {
          console.log("Slug index found at position: ", slugIndex);
        }

        const matchedRow = rows.find(
        // 다음 조건을 만족하는 row가 몇 행인지 찾습니다 
          (row, index) =>
          // row와 index를 변수로 삼아, 다음 코드를 실행합니다.
            index > 1 &&
            // index가 0인 것은 header, index가 1인 것은 toggle 
            row[slugIndex]?.toString().trim().toLowerCase() === slug.toLowerCase().trim()
            // 조건 2. slug 변수에 저장된, 현재 페이지의 slug와 같은 값이 있는 셀이
            // slugIndex 열, 몇 번째 헹이 있는지 찾습니다
        );
        console.log("Matched Row: ", matchedRow);

        if (matchedRow) {
        // 만약 match되는 행이 있다면, 
          const pageDataObject = headers.reduce((acc, header, idx) => {
            const toggleValue = toggles[idx]?.toLowerCase().trim();

            if (toggleValue === "on") {
              acc[header] = matchedRow[idx] || "";
            }
            return acc;
          }, {});

          setPageData(pageDataObject);
        } else {
          console.error("No matching row found for slug: ", slug);
          setPageData(null);
        }
      }  catch (error) {
        console.error("Error fetching Google Sheets data: ", error);
        setPageData(null);
      }
    };

    if (slug) {
      fetchGoogleSheetsData();
      // slug 값이 존재할 때만 fetchGoogleSheetsData()를 호출합니다 
    }
  }, [slug]);
  // 뜬금없어 보이지만, 사실 useEffect의 의존성 배열(괄호)의 뒷부분에 해당합니다
  // useEffect 훅의 작동이 slug에 의존한다는 뜻으로, 페이지의 slug 값이 변경될 때마다 훅이 작동합니다. 

  // python 데이터 가져오기 
  useEffect(() => {
  // 앞서 설명한 리액트 훅, 컴포넌트가 마운트되거나 페이지의 slug 값이 변경될 때 실행됨 
  // 겉보기에는 새로운 함수 같지만, 여전히 Subpage 함수 내에 존재하는 구문이며, 앞서 설정한 변수들을 그대로 사용합니다 
    const fetchPythonOutput = async () => {
    // python API를 통해 데이터를 가져오는 "비동기" 함수인 fetchPythonOutput를 정의함
    // 비동기 함수(async): 병렬로 실행되는 함수. 백그라운드에서 실행되는 것처럼 이해해도 될 듯.
      setLoading(true);
      // API 호출 전, 로딩 상태를 true로 설정합니다. 로딩되는 동안 사용자에게 'Loading...' 등이 나타납니다 
      try {
        const res = await fetch(`https://python-island.onrender.com/run-python/${slug}`); 
        // 앞서 slug 변수를 설정했음. 해당 slug 변수에 해당하는 데이터를 fetch해서 res 변수에 저장 
        // 이때 slug 변수의 값이 동적으로 fetch되는 URL에 삽입됨 
        // ❓❓ index.js(백엔드)에서 정의한 경로 (app.get('/run-python/:slug', ... )로 fetch를 요청!!함 
        // await: async 함수의 병렬 작업이 끝날 때까지 기다림 
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        // res.ok**는 상태 코드가 200~299일 때 true, true가 아니라면 에러 메시지를 출력함 

        const data = await res.json();
        // fetch된 데이터를 json 파일로 변환 
        setPythonOutput(data.result || "No output from Python");
        // pythonOutput 변수에 data.result 값을 저장합니다
        // 저장할 data.result 값이 없다면 "No output from Python"을 표시합니다
      } catch (error) {
        console.error("Error fetching Python output:", error);
        setPythonOutput(`Error: ${error.message}`);
         // 에러 발생 시 에러 메시지를 출력합니다 
      } finally {
        setLoading(false);
        // 로딩 상태를 종료합니다 
      }
    };

    if (slug) {
      fetchPythonOutput();
    } 
    // slug 값이 존재하는 경우에만 fetchPythonOutput 함수를 호출합니다 
}, [slug]);
// 뜬금없어 보이지만, 사실 useEffect의 의존성 배열(괄호)의 뒷부분에 해당합니다
// useEffect 훅의 작동이 slug에 의존한다는 뜻으로, 페이지의 slug 값이 변경될 때마다 훅이 작동합니다. 

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
  // 404 에러와 메인 페이지로 돌아가는 버튼을 표시합니다 

  //정적 데이터(딕셔너리)에서 추출한 name과 content를 화면에 표시합니다
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{pageData.name || "Page Details"}</h1>

      {pageData && Object.entries(pageData).map(([header,value], index) => (
      // Object.entires(pageData) : pageData 객체의 [key,value] 쌍을 배열로 반환함
      // ex. { slug: "example", name: "Test", content: "Some content" }를
      // [["slug", "example"], ["name", "Test"], ["content", "Some content"]]로 반환환
        <div key={index}>
          <h2 className="text-xl font-bold mt-6">{header}</h2>
          <div className="mt-2 p-4 bg-gray-100 rounded-lg">
            <p>{value}</p>
          </div>
        </div>
      ))}

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