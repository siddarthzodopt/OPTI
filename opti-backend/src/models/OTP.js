const { pool } = require('../config/database');

class OTP {
  // Create new OTP
  static async create({ email, otp, userType }) {
    // Delete any existing OTPs for this email
    await this.deleteByEmail(email, userType);

    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const [result] = await pool.query(
      `INSERT INTO otps (email, otp, user_type, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [email, otp, userType, expiresAt]
    );

    return this.findById(result.insertId);
  }

  // Find OTP by ID
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  // Find OTP by email, code, and user type
  static async findByEmailAndOTP(email, otp, userType) {
    const [rows] = await pool.query(
      `SELECT * FROM otps 
       WHERE email = ? AND otp = ? AND user_type = ? AND verified = false 
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp, userType]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  // Find verified OTP
  static async findVerified(email, userType) {
    const [rows] = await pool.query(
      `SELECT * FROM otps 
       WHERE email = ? AND user_type = ? AND verified = true 
       ORDER BY created_at DESC LIMIT 1`,
      [email, userType]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  // Mark OTP as verified
  static async markAsVerified(id) {
    await pool.query(
      'UPDATE otps SET verified = true WHERE id = ?',
      [id]
    );
    return this.findById(id);
  }

  // Check if OTP is expired
  static isExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
  }

  // Delete OTP by ID
  static async deleteById(id) {
    const [result] = await pool.query('DELETE FROM otps WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Delete OTPs by email
  static async deleteByEmail(email, userType) {
    const [result] = await pool.query(
      'DELETE FROM otps WHERE email = ? AND user_type = ?',
      [email, userType]
    );
    return result.affectedRows;
  }

  // Delete expired OTPs
  static async deleteExpired() {
    const [result] = await pool.query('DELETE FROM otps WHERE expires_at < NOW()');
    return result.affectedRows;
  }
}

module.exports = OTP;
