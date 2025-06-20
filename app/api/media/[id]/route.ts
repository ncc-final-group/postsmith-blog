import { NextRequest, NextResponse } from 'next/server';

const SPRING_API_URL = process.env.NEXT_PUBLIC_API_SERVER;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId') || '1';
    const { id } = await params;

    const apiUrl = `${SPRING_API_URL}/api/media/${id}?blogId=${blogId}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: '미디어 파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '미디어 파일 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId') || '1';
    const { id } = await params;
    const updateData = await request.json();

    const apiUrl = `${SPRING_API_URL}/api/media/${id}?blogId=${blogId}`;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      return NextResponse.json({ error: '미디어 파일 수정에 실패했습니다.' }, { status: 400 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '미디어 파일 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId') || '1';
    const { id } = await params;

    const apiUrl = `${SPRING_API_URL}/api/media/${id}?blogId=${blogId}`;

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: '미디어 파일 삭제에 실패했습니다.' }, { status: 400 });
    }

    return NextResponse.json({ message: '미디어 파일이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json({ error: '미디어 파일 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
