import { NextRequest, NextResponse } from 'next/server';

import { getAllBlogs, getBlogByAddress } from '../tbBlogs';

export async function GET(request: NextRequest) {
  try {
    // 모든 블로그 조회
    const allBlogs = await getAllBlogs();

    // '주소' 블로그 조회
    const targetBlog = await getBlogByAddress('주소');

    return NextResponse.json({
      success: true,
      data: {
        allBlogs,
        targetBlog,
        totalBlogs: allBlogs.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
