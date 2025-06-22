import { NextRequest, NextResponse } from 'next/server';

const SPRING_API_URL = process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const blogId = searchParams.get('blogId');

    if (!blogId) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
    }

    const menuData = await request.json();
    // Spring Boot API로 메뉴 추가 요청
    const response = await fetch(`${SPRING_API_URL}/api/menus/add?blogId=${blogId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to add menu: ${response.status}`,
          details: responseText,
        },
        { status: response.status },
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON response from Spring Boot API',
          details: responseText,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
