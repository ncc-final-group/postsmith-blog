import { NextRequest, NextResponse } from 'next/server';
import { getContentsByBlogId } from '../tbContents';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = parseInt(searchParams.get('blogId') || '1');
    
    // 실제 데이터베이스에서 콘텐츠 데이터 가져오기
    const contents = await getContentsByBlogId(blogId);

    return NextResponse.json({
      success: true,
      data: contents,
      message: 'Contents fetched successfully'
    });
  } catch (error) {
    // 에러 발생시 빈 배열 반환
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Using fallback contents due to error: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
} 