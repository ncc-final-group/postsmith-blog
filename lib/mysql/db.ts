import mysql from 'mysql2/promise';

// MySQL 연결 설정
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postsmith',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// SELECT 쿼리 실행 함수
export async function selectSQL<T>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    // console.error('Database query error:', error);
    throw error;
  }
}

// INSERT 쿼리 실행 함수
export async function insertSQL(query: string, params: any[] = []): Promise<number> {
  try {
    const [result] = await pool.execute(query, params);
    return (result as any).insertId;
  } catch (error) {
    // console.error('Database insert error:', error);
    throw error;
  }
}

// UPDATE 쿼리 실행 함수
export async function updateSQL(query: string, params: any[] = []): Promise<number> {
  try {
    const [result] = await pool.execute(query, params);
    return (result as any).affectedRows;
  } catch (error) {
    // console.error('Database update error:', error);
    throw error;
  }
}

// DELETE 쿼리 실행 함수
export async function deleteSQL(query: string, params: any[] = []): Promise<number> {
  try {
    const [result] = await pool.execute(query, params);
    return (result as any).affectedRows;
  } catch (error) {
    // console.error('Database delete error:', error);
    throw error;
  }
}
