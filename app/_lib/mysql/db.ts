import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB
});

export const selectSQL = async <T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> => {
  try {
    const [rows] = await pool.query(sqlQuery, params);
    return rows as T[];
  } catch (err) {
    throw new Error(`DB SELECT ERROR: ${(err as Error).message}`);
  }
};