import { useParams } from "next/navigation";

export default function DashboardDetail() {
  const params = useParams(); // 동적 라우팅에서 slug 가져오기
  const { slug } = params;

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Dashboard 상세 페이지</h1>
      <p>현재 페이지 Slug: <strong>{slug}</strong></p>
    </div>
  );
}
