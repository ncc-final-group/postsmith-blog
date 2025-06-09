import { NextRequest, NextResponse } from 'next/server';

import { selectSQL } from '../../../_lib/mysql/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.id);

    if (isNaN(categoryId)) {
      return NextResponse.json({
        success: false,
        message: '유효하지 않은 카테고리 ID입니다.',
        data: null
      }, { status: 400 });
    }

    // 데이터베이스에서 카테고리 조회
    const result = await selectSQL('SELECT * FROM categories WHERE id = ?', [categoryId]);
    
    if (!result || result.length === 0) {
      return NextResponse.json({
        success: false,
        message: '카테고리를 찾을 수 없습니다.',
        data: null
      }, { status: 404 });
    }

    // 첫 번째 결과 반환
    const category = result[0];

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category fetched successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      data: null
    }, { status: 500 });
  }
} 