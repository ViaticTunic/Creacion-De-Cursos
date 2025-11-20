// Configuración de base de datos - Compatible con MySQL y PostgreSQL
const dotenv = require('dotenv');
dotenv.config();

// Si DATABASE_URL existe, usamos PostgreSQL (Supabase)
// Si no, usamos MySQL (local)
if (process.env.DATABASE_URL) {
  // PostgreSQL (Supabase)
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') 
      ? { rejectUnauthorized: false }
      : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Error en el pool de PostgreSQL:', err);
    process.exit(-1);
  });

  // Función para convertir consultas de MySQL a PostgreSQL
  function convertMySQLToPostgreSQL(sql, params) {
    let pgSql = sql.trim();
    // Reemplazar backticks por comillas dobles
    pgSql = pgSql.replace(/`([^`]+)`/g, '"$1"');
    // Convertir LIMIT offset, count a LIMIT count OFFSET offset
    pgSql = pgSql.replace(/LIMIT\s+(\d+)\s*,\s*(\d+)/gi, 'LIMIT $2 OFFSET $1');
    
    // Convertir placeholders ? a $1, $2, etc. para PostgreSQL
    if (params && params.length > 0) {
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
    }
    
    return pgSql;
  }

  // Compatibilidad con getConnection (para server/index.js)
  pool.getConnection = (callback) => {
    pool.connect((err, client, release) => {
      if (err) return callback(err, null);
      const connection = {
        query: (sql, params, cb) => {
          if (typeof params === 'function') {
            cb = params;
            params = [];
          }
          const pgSql = convertMySQLToPostgreSQL(sql, params);
          client.query(pgSql, params, (err, result) => {
            if (err) return cb(err, null);
            const mysqlResult = {
              insertId: result.insertId || (result.rows[0]?.id),
              affectedRows: result.rowCount || 0,
              rows: result.rows
            };
            cb(null, [mysqlResult]);
          });
        },
        release: release
      };
      callback(null, connection);
    });
  };

  // Promisificar para usar async/await (compatible con db.promise.query)
  const promisePool = {
    query: async (sql, params) => {
      const pgSql = convertMySQLToPostgreSQL(sql, params || []);
      const result = await pool.query(pgSql, params || []);
      
      // Formatear resultado para compatibilidad con MySQL
      let rows = result.rows;
      if (rows && rows.length > 0 && rows[0].id !== undefined) {
        rows.insertId = rows[0].id;
        rows[0].insertId = rows[0].id;
      }
      
      return [rows];
    }
  };

  module.exports = pool;
  module.exports.promise = promisePool;
} else {
  // MySQL (local)
  const mysql = require('mysql2');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'plataforma_cursos',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const promisePool = pool.promise();
  
  module.exports = pool;
  module.exports.promise = promisePool;
}
