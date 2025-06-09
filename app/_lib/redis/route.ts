import { NextResponse } from 'next/server';

import { redis } from '@lib/redis';

export async function GET() {
  try {
    const result = await redis.set('test', 'Hello World');
    return NextResponse.json({
      message: 'Hello World',
      result,
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error',
      error,
    });
  }
}
