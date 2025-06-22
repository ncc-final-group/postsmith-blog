import mysql from 'mysql2/promise';

// 환경 변수 검증
const validateEnvironment = () => {
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`필수 환경 변수가 누락되었습니다: ${missingVars.join(', ')}`);
  }
};

// 환경 변수 검증 실행
validateEnvironment();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 재시도 함수
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // 재시도 가능한 오류인지 확인
      const isRetryableError =
        lastError.message.includes('ECONNRESET') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('ENOTFOUND') ||
        lastError.message.includes('Connection lost') ||
        lastError.message.includes('Protocol connection lost');

      if (!isRetryableError || attempt === maxRetries) {
        throw lastError;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // 지수 백오프
    }
  }

  throw lastError!;
};

export const selectSQL = async <T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> => {
  return retryOperation(async () => {
    try {
      const [rows] = await pool.query(sqlQuery, params);
      return rows as T[];
    } catch (err) {
      const error = err as Error;

      throw new Error(`DB SELECT ERROR: ${error.message}`);
    }
  });
};

// INSERT 쿼리 실행 함수
export const insertSQL = async (sqlQuery: string, params: any[] = []): Promise<{ insertId: number; affectedRows: number }> => {
  return retryOperation(async () => {
    try {
      const [result] = await pool.query(sqlQuery, params);
      const resultHeader = result as mysql.ResultSetHeader;
      return {
        insertId: resultHeader.insertId,
        affectedRows: resultHeader.affectedRows,
      };
    } catch (err) {
      const error = err as Error;

      throw new Error(`DB INSERT ERROR: ${error.message}`);
    }
  });
};

// UPDATE 쿼리 실행 함수
export const updateSQL = async (sqlQuery: string, params: any[] = []): Promise<{ affectedRows: number; changedRows: number }> => {
  return retryOperation(async () => {
    try {
      const [result] = await pool.query(sqlQuery, params);
      const resultHeader = result as mysql.ResultSetHeader;
      return {
        affectedRows: resultHeader.affectedRows,
        changedRows: resultHeader.changedRows || 0,
      };
    } catch (err) {
      const error = err as Error;

      throw new Error(`DB UPDATE ERROR: ${error.message}`);
    }
  });
};

// DELETE 쿼리 실행 함수
export const deleteSQL = async (sqlQuery: string, params: any[] = []): Promise<{ affectedRows: number }> => {
  return retryOperation(async () => {
    try {
      const [result] = await pool.query(sqlQuery, params);
      const resultHeader = result as mysql.ResultSetHeader;
      return { affectedRows: resultHeader.affectedRows };
    } catch (err) {
      const error = err as Error;

      throw new Error(`DB DELETE ERROR: ${error.message}`);
    }
  });
};

// 트랜잭션 실행 함수
export const executeTransaction = async <T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> => {
  return retryOperation(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      const error = err as Error;

      throw new Error(`DB TRANSACTION ERROR: ${error.message}`);
    } finally {
      connection.release();
    }
  });
};

// 연결 상태 확인 함수
export const checkConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
};

// DB 초기화 함수
export const initializeDatabase = async (): Promise<void> => {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const isConnected = await checkConnection();
      if (isConnected) {
        return;
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error('DB 초기화에 실패했습니다. 데이터베이스 연결을 확인해주세요.');
      }

      // 다음 시도 전 대기
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Pool 종료 함수 (graceful shutdown용)
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
  } catch (error) {}
};
