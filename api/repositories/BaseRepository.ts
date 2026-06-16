import { queryOne, queryMany, execute } from '../database';

export abstract class BaseRepository<T> {
  protected abstract tableName: string;

  protected abstract mapRow(row: any): T;

  findById(id: string): T | null {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = queryOne<any>(sql, [id]);
    return row ? this.mapRow(row) : null;
  }

  findAll(): T[] {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
    const rows = queryMany<any>(sql);
    return rows.map(row => this.mapRow(row));
  }

  delete(id: string): boolean {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    return execute(sql, [id]) > 0;
  }

  count(): number {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = queryOne<{ count: number }>(sql);
    return result ? result.count : 0;
  }
}
