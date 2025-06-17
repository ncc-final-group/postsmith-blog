import { NextRequest, NextResponse } from 'next/server';
import { getPagesByBlogId } from '../../api/tbContents';
import { getBlogByAddress } from '../../api/tbBlogs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogAddress = searchParams.get('blog') || 'testblog';
    
    const blog = await getBlogByAddress(blogAddress);
    if (!blog) {
      return NextResponse.json({ error: '블로그를 찾을 수 없습니다' }, { status: 404 });
    }

    const pages = await getPagesByBlogId(blog.id);
    
    return NextResponse.json({
      blogId: blog.id,
      blogAddress: blog.address,
      blogNickname: blog.nickname,
      totalPages: pages.length,
      pages: pages.map(page => ({
        id: page.id,
        sequence: page.sequence,
        title: page.title,
        type: page.type,
        is_public: page.is_public,
        is_temp: page.is_temp,
        created_at: page.created_at
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: '오류가 발생했습니다', 
      details: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
} 