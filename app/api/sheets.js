import { NextResponse } from "next/server";

let sheetsData = {}; // 메모리 내에서 저장

export async function POST(req) {
  const { userId, sheetsId } = await req.json();
  sheetsData[userId] = sheetsId;
  return NextResponse.json({ message: "저장 완료" });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  return NextResponse.json({ sheetsId: sheetsData[userId] || null });
}
