import { BaseRepository } from './BaseRepository';
import { User, UserRole } from '../../shared/types';
import { queryOne, queryMany, execute } from '../database';
import { generateId } from '../utils/helpers';
import bcrypt from 'bcryptjs';

interface UserRow {
  id: string;
  username: string;
  email: string;
  phone: string;
  full_name?: string;
  role: UserRole;
  password_hash: string;
  avatar?: string;
  is_active?: number;
  created_at: string;
  last_login?: string;
}

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';

  protected mapRow(row: UserRow): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      phone: row.phone,
      fullName: row.full_name,
      role: row.role,
      avatar: row.avatar,
      isActive: row.is_active !== undefined ? row.is_active === 1 : true,
      createdAt: row.created_at,
      lastLogin: row.last_login
    };
  }

  findByUsername(username: string): User | null {
    const sql = `SELECT * FROM users WHERE username = ?`;
    const row = queryOne<UserRow>(sql, [username]);
    return row ? this.mapRow(row) : null;
  }

  findByEmail(email: string): User | null {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const row = queryOne<UserRow>(sql, [email]);
    return row ? this.mapRow(row) : null;
  }

  findByRole(role: UserRole): User[] {
    const sql = `SELECT * FROM users WHERE role = ? ORDER BY created_at DESC`;
    const rows = queryMany<UserRow>(sql, [role]);
    return rows.map(row => this.mapRow(row));
  }

  verifyPassword(username: string, password: string): User | null {
    const sql = `SELECT * FROM users WHERE username = ?`;
    const row = queryOne<UserRow>(sql, [username]);
    if (!row) return null;

    const isValid = bcrypt.compareSync(password, row.password_hash);
    if (!isValid) return null;

    return this.mapRow(row);
  }

  create(data: {
    username: string;
    email: string;
    phone: string;
    role: UserRole;
    password: string;
    avatar?: string;
  }): User {
    const id = generateId('user');
    const passwordHash = bcrypt.hashSync(data.password, 10);
    const sql = `
      INSERT INTO users (id, username, email, phone, role, password_hash, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    execute(sql, [id, data.username, data.email, data.phone, data.role, passwordHash, data.avatar || null]);
    return this.findById(id)!;
  }

  update(id: string, data: Partial<{
    username: string;
    email: string;
    phone: string;
    role: UserRole;
    password: string;
    avatar: string;
  }>): User | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.username) { fields.push('username = ?'); params.push(data.username); }
    if (data.email) { fields.push('email = ?'); params.push(data.email); }
    if (data.phone) { fields.push('phone = ?'); params.push(data.phone); }
    if (data.role) { fields.push('role = ?'); params.push(data.role); }
    if (data.password) { fields.push('password_hash = ?'); params.push(bcrypt.hashSync(data.password, 10)); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); params.push(data.avatar); }

    if (fields.length === 0) return this.findById(id);

    fields.push('last_login = COALESCE(last_login, CURRENT_TIMESTAMP)');
    params.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    execute(sql, params);
    return this.findById(id);
  }

  updateLastLogin(id: string): void {
    const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
    execute(sql, [id]);
  }

  search(keyword: string): User[] {
    const sql = `
      SELECT * FROM users 
      WHERE username LIKE ? OR email LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC
    `;
    const searchTerm = `%${keyword}%`;
    const rows = queryMany<UserRow>(sql, [searchTerm, searchTerm, searchTerm]);
    return rows.map(row => this.mapRow(row));
  }
}

export const userRepository = new UserRepository();
