import { NextResponse } from 'next/server';

import { checkConnection } from '../../_lib/mysql/db';

export async function GET() {
  try {
    const isDbConnected = await checkConnection();

    const healthStatus = {
      status: isDbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: isDbConnected,
        host: process.env.DB_HOST ? 'configured' : 'missing',
        database: process.env.DB ? 'configured' : 'missing',
      },
      version: process.env.npm_package_version || 'unknown',
    };

    return NextResponse.json(healthStatus, { status: isDbConnected ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
