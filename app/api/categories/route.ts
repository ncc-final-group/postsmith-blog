import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesByBlogId } from '../tbCategories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = parseInt(searchParams.get('blogId') || '1');
    
    // 실제 데이터베이스에서 카테고리 데이터 가져오기
    const categories = await getCategoriesByBlogId(blogId);

    return NextResponse.json({
      success: true,
      data: categories,
      message: 'Categories fetched successfully'
    });
  } catch (error) {
    // 에러 발생시 기본 카테고리 제공
    const fallbackCategories = [
      { id: 1, name: '기술', description: '기술 관련 포스트', parent_id: null, type: 'blog', sort_order: 1, post_count: 0, user_id: 1 },
      { id: 2, name: '일상', description: '일상 생활 포스트', parent_id: null, type: 'blog', sort_order: 2, post_count: 0, user_id: 1 },
      { id: 3, name: '리뷰', description: '리뷰 포스트', parent_id: null, type: 'blog', sort_order: 3, post_count: 0, user_id: 1 },
      { id: 4, name: '기타', description: '기타 포스트', parent_id: null, type: 'blog', sort_order: 4, post_count: 0, user_id: 1 }
    ];

    return NextResponse.json({
      success: true,
      data: fallbackCategories,
      message: 'Using fallback categories due to error: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
} 