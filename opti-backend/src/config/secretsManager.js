const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize AWS Secrets Manager client
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

// Cache for the secret to avoid repeated API calls
let secretCache = null;
let lastFetchTime = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all secrets from AWS Secrets Manager (single secret containing all values)
 * Falls back to environment variables if Secrets Manager is not available
 * 
 * Expected secret format in AWS Secrets Manager:
 * {
 *   "DB_HOST": "your-rds-endpoint.rds.amazonaws.com",
 *   "DB_PORT": "3306",
 *   "DB_USER": "admin",
 *   "DB_PASSWORD": "your-password",
 *   "DB_NAME": "opti_db",
 *   "SMTP_HOST": "smtp.gmail.com",
 *   "SMTP_PORT": "587",
 *   "SMTP_USER": "your-email@gmail.com",
 *   "SMTP_PASSWORD": "your-app-password",
 *   "GROQ_API_KEY": "your-groq-key",
 *   "LLM_MODEL": "llama-70b-8192",
 *   "JWT_SECRET": "your-jwt-secret",
 *   "JWT_REFRESH_SECRET": "your-refresh-secret"
 * }
 */
async function getAllSecrets() {
  // Return cached secret if still valid
  if (secretCache && lastFetchTime && (Date.now() - lastFetchTime < CACHE_TTL)) {
    return secretCache;
  }

  // Try to get from Secrets Manager
  try {
    const secretId = process.env.SECRET_ARN || process.env.SECRET_NAME;
    
    if (!secretId) {
      console.warn('⚠️  SECRET_ARN or SECRET_NAME not configured in .env');
      console.warn('   Falling back to environment variables...');
      return null;
    }

    const command = new GetSecretValueCommand({
      SecretId: secretId,
    });

    const response = await client.send(command);
    const secret = JSON.parse(response.SecretString);
    
    // Cache the secret
    secretCache = secret;
    lastFetchTime = Date.now();
    
    console.log(`✅ Secrets loaded from AWS Secrets Manager`);
    console.log(`   Secret: ${secretId.split(':').pop()}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'ap-south-1'}`);
    
    return secret;
  } catch (error) {
    console.warn(`⚠️  Could not load secrets from AWS Secrets Manager`);
    console.warn(`   Error: ${error.message}`);
    console.warn(`   Falling back to environment variables...`);
    
    return null;
  }
}

/**
 * Get database credentials
 * @returns {Promise<object>} Database configuration
 */
async function getDatabaseCredentials() {
  // Try AWS Secrets Manager first
  const secrets = await getAllSecrets();
  
  if (secrets && secrets.DB_HOST && secrets.DB_USER && secrets.DB_PASSWORD) {
    console.log('📝 Using database credentials from AWS Secrets Manager');
    return {
      host: secrets.DB_HOST,
      port: parseInt(secrets.DB_PORT) || 3306,
      username: secrets.DB_USER,
      password: secrets.DB_PASSWORD,
      database: secrets.DB_NAME || 'opti_db',
    };
  }

  // Fallback to environment variables
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
    console.log('📝 Using database credentials from environment variables');
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'opti_db',
    };
  }

  throw new Error('Database credentials not found in Secrets Manager or environment variables');
}

/**
 * Get JWT secrets
 * @returns {Promise<object>} JWT configuration
 */
async function getJWTSecrets() {
  // Try AWS Secrets Manager first
  const secrets = await getAllSecrets();
  
  if (secrets && secrets.JWT_SECRET && secrets.JWT_REFRESH_SECRET) {
    console.log('📝 Using JWT secrets from AWS Secrets Manager');
    return {
      jwt_secret: secrets.JWT_SECRET,
      jwt_refresh_secret: secrets.JWT_REFRESH_SECRET,
      jwt_expire: process.env.JWT_EXPIRE || '7d',
      jwt_refresh_expire: process.env.JWT_REFRESH_EXPIRE || '30d',
    };
  }

  // Fallback to environment variables
  if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
    console.log('📝 Using JWT secrets from environment variables');
    return {
      jwt_secret: process.env.JWT_SECRET,
      jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
      jwt_expire: process.env.JWT_EXPIRE || '7d',
      jwt_refresh_expire: process.env.JWT_REFRESH_EXPIRE || '30d',
    };
  }

  throw new Error('JWT secrets not found in Secrets Manager or environment variables');
}

/**
 * Get email credentials
 * @returns {Promise<object>} Email configuration
 */
async function getEmailCredentials() {
  // Try AWS Secrets Manager first
  const secrets = await getAllSecrets();
  
  if (secrets && secrets.SMTP_USER && secrets.SMTP_PASSWORD) {
    console.log('📝 Using email credentials from AWS Secrets Manager');
    return {
      host: secrets.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(secrets.SMTP_PORT) || 587,
      user: secrets.SMTP_USER,
      password: secrets.SMTP_PASSWORD,
      from: 'OPTI <noreply@opti.com>',
    };
  }

  // Fallback to environment variables
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    console.log('📝 Using email credentials from environment variables');
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: 'OPTI <noreply@opti.com>',
    };
  }

  throw new Error('Email credentials not found in Secrets Manager or environment variables');
}

/**
 * Get GROQ API credentials (optional)
 * @returns {Promise<object|null>} GROQ configuration or null if not available
 */
async function getGroqCredentials() {
  // Try AWS Secrets Manager first
  const secrets = await getAllSecrets();
  
  if (secrets && secrets.GROQ_API_KEY) {
    console.log('📝 Using GROQ credentials from AWS Secrets Manager');
    return {
      apiKey: secrets.GROQ_API_KEY,
      model: secrets.LLM_MODEL || 'llama-70b-8192',
    };
  }

  // Fallback to environment variables
  if (process.env.GROQ_API_KEY) {
    console.log('📝 Using GROQ credentials from environment variables');
    return {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.LLM_MODEL || 'llama-70b-8192',
    };
  }

  console.log('ℹ️  GROQ credentials not configured (optional)');
  return null;
}

/**
 * Clear secret cache (useful for testing or secret rotation)
 */
function clearSecretCache() {
  secretCache = null;
  lastFetchTime = null;
  console.log('🗑️  Secret cache cleared');
}

/**
 * Get a specific secret value by key
 * @param {string} key - The key name (e.g., 'DB_HOST', 'JWT_SECRET')
 * @returns {Promise<string|null>} Secret value or null if not found
 */
async function getSecretValue(key) {
  const secrets = await getAllSecrets();
  
  if (secrets && secrets[key]) {
    return secrets[key];
  }
  
  // Fallback to environment variable
  return process.env[key] || null;
}

module.exports = {
  getAllSecrets,
  getDatabaseCredentials,
  getJWTSecrets,
  getEmailCredentials,
  getGroqCredentials,
  getSecretValue,
  clearSecretCache,
};
