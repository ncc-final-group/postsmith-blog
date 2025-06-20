import { NextRequest, NextResponse } from 'next/server';

const SPRING_API_URL = process.env.NEXT_PUBLIC_API_SERVER || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId') || '1';
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '20';
    const fileType = searchParams.get('fileType');
    const search = searchParams.get('search');

    // Spring Boot API로 요청 전달
    const apiUrl = new URL(`${SPRING_API_URL}/api/media`);
    apiUrl.searchParams.set('blogId', blogId);
    apiUrl.searchParams.set('page', page);
    apiUrl.searchParams.set('size', size);

    if (fileType) apiUrl.searchParams.set('fileType', fileType);
    if (search) apiUrl.searchParams.set('search', search);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      // Spring Boot 서버가 응답하지 않을 때 더미 데이터 반환
      const dummyData = {
        content: [
          {
            id: 1,
            filename: 'sample-image.jpg',
            uri: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
            fileType: 'image',
            fileSize: 1024000,
            altText: '',
            description: '',
            blogId: parseInt(blogId),
            createdAt: new Date().toISOString(),
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: parseInt(size),
        number: parseInt(page),
        first: true,
        last: true,
      };

      return NextResponse.json(dummyData);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // 오류 발생 시 빈 데이터 반환
    const emptyData = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
    };

    return NextResponse.json(emptyData);
  }
}
