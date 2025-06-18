import { NextRequest, NextResponse } from 'next/server';
import { getBlogByAddress } from '../../tbBlogs';
import { getCategoriesByBlogId } from '../../tbCategories';
import { getPostsByBlogIdWithPaging } from '../../tbContents';
import { getMenusByBlogId } from '../../tbMenu';
import { getSidebarData } from '../../sidebarData';
import { getUncategorizedCountByBlogId } from '../../tbContents';
import { extractBlogId } from '../../utils/blogUtils';

export async function GET(request: NextRequest) {
  try {
    // 블로그 ID 추출 (URL 파라미터 또는 호스트에서)
    let blogId = await extractBlogId(request);
    
    // URL 파라미터에서 blogId를 직접 지정한 경우
    const { searchParams } = new URL(request.url);
    const paramBlogId = searchParams.get('blogId');
    if (paramBlogId) {
      blogId = parseInt(paramBlogId);
    }

    if (!blogId) {
      return NextResponse.json({ 
        success: false, 
        error: '블로그를 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    // 블로그 정보 조회 (ID로 직접 조회)
    const blogQuery = 'SELECT * FROM blogs WHERE id = ?';
    const { selectSQL } = await import('../../../_lib/mysql/db');
    const blogResult = await selectSQL<any>(blogQuery, [blogId]);
    
    if (blogResult.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '블로그를 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    const blog = blogResult[0];

    // 홈 페이지 데이터 수집
    const [categories, paginatedContents, menus, uncategorizedCount, sidebarData] = await Promise.all([
      getCategoriesByBlogId(blog.id),
      getPostsByBlogIdWithPaging(blog.id, 1, 10), // 첫 페이지, 10개
      getMenusByBlogId(blog.id),
      getUncategorizedCountByBlogId(blog.id),
      getSidebarData(blog.id)
    ]);

    // 데이터 구조화
    const homeData = {
      blog: {
        id: blog.id,
        nickname: blog.nickname,
        description: blog.description || null,
        logo_image: blog.logo_image || null,
        address: blog.address,
      },
      categories: categories.map((category) => ({
        id: Number(category.id),
        name: String(category.name),
        post_count: Number(category.post_count),
        category_id: category.category_id == null ? null : Number(category.category_id),
      })),
      uncategorizedCount: Number(uncategorizedCount),
      totalContentsCount: Number(paginatedContents.pagination.totalContents),
      menus: menus.map((menu) => ({
        id: Number(menu.id),
        name: String(menu.name),
        type: String(menu.type),
        uri: String(menu.uri),
        is_blank: Boolean(menu.is_blank),
      })),
      contents: paginatedContents.contents.map((content) => ({
        sequence: Number(content.sequence),
        title: String(content.title),
        content_html: String(content.content_html),
        content_plain: String(content.content_plain),
        created_at: String(content.created_at),
        thumbnail: content.thumbnail ? String(content.thumbnail) : undefined,
        category: content.category
          ? {
              id: Number(content.category.id),
              name: String(content.category.name),
            }
          : undefined,
        reply_count: Number(content.reply_count ?? 0),
      })),
      recentContents: sidebarData.recentContents,
      popularContents: sidebarData.popularContents.map((item) => ({
        ...item,
        created_at: '',
        content_html: '',
        content_plain: '',
        thumbnail: undefined,
        category: undefined,
      })),
      recentReplies: sidebarData.recentReplies,
      pagination: paginatedContents.pagination,
    };

    return NextResponse.json({
      success: true,
      data: homeData
    });

  } catch (error) {
    console.error('홈 데이터 조회 오류:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: '홈 데이터 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 