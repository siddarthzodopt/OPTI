const { pool: getPool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  // Create new admin
  static async create({ email, password, role = 'admin' }) {
    const pool = await getPool();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const defaultFeatures = JSON.stringify([
      'Unlimited chats',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
    ]);

    const [result] = await pool.query(
      `INSERT INTO admins (email, password, role, plan_features) 
       VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, role, defaultFeatures]
    );

    return this.findById(result.insertId);
  }

  // Find admin by ID
  static async findById(id, includePassword = false) {
    const pool = await getPool();
    const fields = includePassword 
      ? '*' 
      : 'id, email, role, plan_name, plan_max_users, plan_features, is_active, last_login, created_at, updated_at';
    
    const [rows] = await pool.query(
      `SELECT ${fields} FROM admins WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    
    const admin = rows[0];
    if (admin.plan_features) {
      admin.plan_features = JSON.parse(admin.plan_features);
    }
    
    return admin;
  }

  // Find admin by email
  static async findByEmail(email, includePassword = false) {
    const pool = await getPool();
    const fields = includePassword 
      ? '*' 
      : 'id, email, role, plan_name, plan_max_users, plan_features, is_active, last_login, created_at, updated_at';
    
    const [rows] = await pool.query(
      `SELECT ${fields} FROM admins WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) return null;
    
    const admin = rows[0];
    if (admin.plan_features) {
      admin.plan_features = JSON.parse(admin.plan_features);
    }
    
    return admin;
  }

  // Update admin
  static async update(id, data) {
    const pool = await getPool();
    const updates = [];
    const values = [];

    if (data.email) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (data.plan_name) {
      updates.push('plan_name = ?');
      values.push(data.plan_name);
    }
    if (data.plan_max_users) {
      updates.push('plan_max_users = ?');
      values.push(data.plan_max_users);
    }
    if (data.plan_features) {
      updates.push('plan_features = ?');
      values.push(JSON.stringify(data.plan_features));
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active);
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
      `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get company plan with current user count
  static async getCompanyPlanWithStats(adminId) {
    const pool = await getPool();
    const admin = await this.findById(adminId);
    if (!admin) return null;

    const [userCount] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_by = ?',
      [adminId]
    );

    return {
      name: admin.plan_name,
      maxUsers: admin.plan_max_users,
      currentUsers: userCount[0].count,
      features: admin.plan_features,
    };
  }
}

module.exports = Admin;
