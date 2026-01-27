const mysql = require('mysql2/promise');
const { getDatabaseCredentials } = require('./secretsManager');

let pool = null;

// Create connection pool
const createPool = async () => {
  if (pool) return pool;

  try {
    // Get credentials from Secrets Manager or environment variables
    const dbConfig = await getDatabaseCredentials();

    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    return pool;
  } catch (error) {
    console.error(`❌ Error creating database connection pool: ${error.message}`);
    throw error;
  }
};

// Get connection pool (create if doesn't exist)
const getPool = async () => {
  if (!pool) {
    await createPool();
  }
  return pool;
};

// Test connection
const connectDB = async () => {
  try {
    const pool = await getPool();
    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected: ${connection.config.host}`);
    connection.release();
  } catch (error) {
    console.error(`❌ Error connecting to MySQL: ${error.message}`);
    process.exit(1);
  }
};

// Clean up expired OTPs (run periodically)
const cleanupExpiredOTPs = async () => {
  try {
    const pool = await getPool();
    const [result] = await pool.query(
      'DELETE FROM otps WHERE expires_at < NOW()'
    );
    if (result.affectedRows > 0) {
      console.log(`🧹 Cleaned up ${result.affectedRows} expired OTPs`);
    }
  } catch (error) {
    console.error('Error cleaning up OTPs:', error.message);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  pool: getPool, // Export as function
  connectDB,
};
