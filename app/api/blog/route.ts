import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const id = searchParams.get('id');

  if (!address && !id) {
    return NextResponse.json({ error: 'address 또는 id 파라미터가 필요합니다.' }, { status: 400 });
  }

  const springUrl = address ? `http://localhost:8080/api/blog/address/${address}` : `http://localhost:8080/api/blog/${id}`;

  try {
    const res = await fetch(springUrl);
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Spring 서버 요청 실패' }, { status: 500 });
  }
}
