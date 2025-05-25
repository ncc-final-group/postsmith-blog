import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 임시 데이터 생성 (실제로는 DB에서 가져와야 함)
    const today = new Date();
    // 1년치 데이터 생성 (월간 통계를 위해)
    const last365Days = Array.from({ length: 365 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (364 - i));
      return {
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100), // 임시로 랜덤 데이터 생성
        visitors: Math.floor(Math.random() * 50) // 방문자수는 조회수보다 적게 설정
      };
    });

    res.status(200).json(last365Days);
  } catch (error) {
    console.error('Stats API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 