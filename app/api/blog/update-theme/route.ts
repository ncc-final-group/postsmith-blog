import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../../lib/constants';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { blogId, themeHtml, themeCss } = body;

    if (!blogId) {
      return NextResponse.json({ error: 'blogId가 필요합니다.' }, { status: 400 });
    }

    if (!themeHtml && !themeCss) {
      return NextResponse.json({ error: 'themeHtml 또는 themeCss가 필요합니다.' }, { status: 400 });
    }

    // 현재 블로그 정보 가져오기
    const getBlogResponse = await fetch(`${API_BASE_URL}/api/blog/${blogId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!getBlogResponse.ok) {
      throw new Error(`블로그 정보 조회 실패: ${getBlogResponse.status}`);
    }

    const currentBlogData = await getBlogResponse.json();

    // BlogDto 형태로 업데이트 데이터 구성 (필요한 필드만)
    const updateBlogDto = {
      ...currentBlogData,
      themeHtml: themeHtml || currentBlogData.themeHtml,
      themeCss: themeCss || currentBlogData.themeCss,
    };

    // Spring의 updateBlog API 호출
    const updateResponse = await fetch(`${API_BASE_URL}/api/blog/${blogId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBlogDto),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`블로그 업데이트 실패: ${updateResponse.status} - ${errorText}`);
    }

    const result = await updateResponse.text();

    return NextResponse.json({
      success: true,
      message: '커스텀 테마가 성공적으로 저장되었습니다.',
      result: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '테마 업데이트 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
