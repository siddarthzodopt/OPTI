const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create({ name, email, password, role = 'user', plan = 'basic', createdBy }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, plan, created_by, must_change_password) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, plan, createdBy, true]
    );

    return this.findById(result.insertId);
  }

  // Find user by ID
  static async findById(id, includePassword = false) {
    const fields = includePassword 
      ? '*' 
      : 'id, name, email, role, plan, status, must_change_password, created_by, last_login, password_changed_at, created_at, updated_at';
    
    const [rows] = await pool.query(
      `SELECT ${fields} FROM users WHERE id = ?`,
      [id]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  // Find user by email
  static async findByEmail(email, includePassword = false) {
    const fields = includePassword 
      ? '*' 
      : 'id, name, email, role, plan, status, must_change_password, created_by, last_login, password_changed_at, created_at, updated_at';
    
    const [rows] = await pool.query(
      `SELECT ${fields} FROM users WHERE email = ?`,
      [email]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  // Find all users by admin ID with pagination and filters
  static async findByCreatedBy(createdBy, { search, status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, name, email, role, plan, status, must_change_password, created_by, last_login, created_at, updated_at FROM users WHERE created_by = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE created_by = ?';
    const params = [createdBy];
    const countParams = [createdBy];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      countQuery += ' AND (name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    };
  }

  // Update user
  static async update(id, data) {
    const updates = [];
    const values = [];

    if (data.name) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.email) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
      updates.push('password_changed_at = NOW()');
    }
    if (data.role) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (data.plan) {
      updates.push('plan = ?');
      values.push(data.plan);
    }
    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.must_change_password !== undefined) {
      updates.push('must_change_password = ?');
      values.push(data.must_change_password);
    }
    if (data.last_login) {
      updates.push('last_login = ?');
      values.push(data.last_login);
    }
    if (data.refresh_token !== undefined) {
      updates.push('refresh_token = ?');
      values.push(data.refresh_token);
    }

    if (updates.length === 0) return null;

    values.push(id);
    
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  // Delete user
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Toggle status
  static async toggleStatus(id) {
    await pool.query(
      `UPDATE users SET status = CASE 
        WHEN status = 'active' THEN 'inactive' 
        ELSE 'active' 
      END WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Count users by admin
  static async countByCreatedBy(createdBy) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_by = ?',
      [createdBy]
    );
    return rows[0].count;
  }

  // Check if password was changed after JWT was issued
  static passwordChangedAfter(passwordChangedAt, jwtTimestamp) {
    if (!passwordChangedAt) return false;
    const changedTimestamp = Math.floor(new Date(passwordChangedAt).getTime() / 1000);
    return jwtTimestamp < changedTimestamp;
  }
}

module.exports = User;
