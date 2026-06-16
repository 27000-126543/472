import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let SQL: SqlJsStatic;
let db: Database;
let dbFilePath: string;

const DB_FILENAME = 'drone_delivery.db';

export async function initDatabase(): Promise<void> {
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  SQL = await initSqlJs({
    locateFile: () => wasmPath
  });

  dbFilePath = path.join(process.cwd(), DB_FILENAME);

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
    migrateDatabase();
    console.log('Database loaded from file');
  } else {
    db = new SQL.Database();
    createTables();
    seedData();
    saveDatabase();
    console.log('Database created and initialized');
  }
}

function migrateDatabase(): void {
  const columns = queryMany<any>("PRAGMA table_info(orders)").map(c => c.name);
  
  if (!columns.includes('received_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN received_at DATETIME');
    console.log('Migration: Added received_at column to orders table');
  }
  
  if (!columns.includes('route_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN route_id TEXT');
    console.log('Migration: Added route_id column to orders table');
  }
  if (!columns.includes('mission_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN mission_id TEXT');
    console.log('Migration: Added mission_id column to orders table');
  }
  if (!columns.includes('total_cost')) {
    db.exec('ALTER TABLE orders ADD COLUMN total_cost REAL');
    console.log('Migration: Added total_cost column to orders table');
  }
  if (!columns.includes('distance')) {
    db.exec('ALTER TABLE orders ADD COLUMN distance REAL');
    console.log('Migration: Added distance column to orders table');
  }
  if (!columns.includes('receipt_image')) {
    db.exec('ALTER TABLE orders ADD COLUMN receipt_image TEXT');
    console.log('Migration: Added receipt_image column to orders table');
  }
  if (!columns.includes('receipt_url')) {
    db.exec('ALTER TABLE orders ADD COLUMN receipt_url TEXT');
    console.log('Migration: Added receipt_url column to orders table');
  }
  if (!columns.includes('receipt_proof')) {
    db.exec('ALTER TABLE orders ADD COLUMN receipt_proof TEXT');
    console.log('Migration: Added receipt_proof column to orders table');
  }
  if (!columns.includes('notes')) {
    db.exec('ALTER TABLE orders ADD COLUMN notes TEXT');
    console.log('Migration: Added notes column to orders table');
  }
  if (!columns.includes('delivered_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN delivered_at DATETIME');
    console.log('Migration: Added delivered_at column to orders table');
  }
  
  const nfzColumns = queryMany<any>("PRAGMA table_info(no_fly_zones)").map(c => c.name);
  if (!nfzColumns.includes('effective_from')) {
    db.exec('ALTER TABLE no_fly_zones ADD COLUMN effective_from DATETIME');
    console.log('Migration: Added effective_from column to no_fly_zones table');
  }
  if (!nfzColumns.includes('effective_to')) {
    db.exec('ALTER TABLE no_fly_zones ADD COLUMN effective_to DATETIME');
    console.log('Migration: Added effective_to column to no_fly_zones table');
  }
  if (!nfzColumns.includes('is_active')) {
    db.exec('ALTER TABLE no_fly_zones ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1');
    console.log('Migration: Added is_active column to no_fly_zones table');
  }
  
  const missionColumns = queryMany<any>("PRAGMA table_info(flight_missions)").map(c => c.name);
  if (!missionColumns.includes('updated_at')) {
    db.exec('ALTER TABLE flight_missions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    console.log('Migration: Added updated_at column to flight_missions table');
  }
  
  const reassignTableExists = queryOne<any>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='mission_reassignments'"
  );
  if (!reassignTableExists) {
    db.exec(`
      CREATE TABLE mission_reassignments (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        old_drone_id TEXT NOT NULL,
        new_drone_id TEXT NOT NULL,
        reassigned_by TEXT NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_reassignments_mission_id ON mission_reassignments(mission_id);
      CREATE INDEX idx_reassignments_order_id ON mission_reassignments(order_id);
    `);
    console.log('Migration: Created mission_reassignments table');
  }
  
  saveDatabase();
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFilePath, buffer);
}

function createTables(): void {
  const ddl = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      full_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS drones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT NOT NULL UNIQUE,
      max_payload REAL NOT NULL,
      max_flight_time INTEGER NOT NULL,
      cruise_speed REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      battery INTEGER NOT NULL DEFAULT 100,
      battery_level INTEGER NOT NULL DEFAULT 100,
      signal_strength INTEGER NOT NULL DEFAULT 100,
      current_lat REAL,
      current_lng REAL,
      altitude REAL,
      operator_id TEXT,
      last_maintenance DATETIME,
      next_maintenance DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_phone TEXT NOT NULL,
      sender_address TEXT NOT NULL,
      sender_lat REAL NOT NULL,
      sender_lng REAL NOT NULL,
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      receiver_address TEXT NOT NULL,
      receiver_lat REAL NOT NULL,
      receiver_lng REAL NOT NULL,
      package_type TEXT NOT NULL,
      package_weight REAL NOT NULL,
      package_length REAL,
      package_width REAL,
      package_height REAL,
      estimated_cost REAL NOT NULL,
      actual_cost REAL,
      total_cost REAL,
      distance REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      drone_id TEXT,
      route_id TEXT,
      mission_id TEXT,
      receipt_image TEXT,
      receipt_url TEXT,
      receipt_proof TEXT,
      remark TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delivered_at DATETIME,
      received_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (drone_id) REFERENCES drones(id)
    );

    CREATE TABLE IF NOT EXISTS flight_routes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      start_lat REAL NOT NULL,
      start_lng REAL NOT NULL,
      start_address TEXT NOT NULL,
      end_lat REAL NOT NULL,
      end_lng REAL NOT NULL,
      end_address TEXT NOT NULL,
      waypoints TEXT NOT NULL,
      distance REAL NOT NULL,
      estimated_time INTEGER NOT NULL,
      estimated_battery INTEGER NOT NULL,
      is_valid BOOLEAN NOT NULL DEFAULT 1,
      validation_errors TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS flight_missions (
      id TEXT PRIMARY KEY,
      mission_no TEXT NOT NULL UNIQUE,
      order_id TEXT NOT NULL,
      drone_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      operator_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      start_time DATETIME,
      takeoff_time DATETIME,
      delivery_time DATETIME,
      return_time DATETIME,
      end_time DATETIME,
      actual_flight_time INTEGER,
      actual_distance REAL,
      battery_used INTEGER,
      max_altitude REAL,
      max_speed REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (drone_id) REFERENCES drones(id),
      FOREIGN KEY (route_id) REFERENCES flight_routes(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mission_reassignments (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      old_drone_id TEXT NOT NULL,
      new_drone_id TEXT NOT NULL,
      reassigned_by TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mission_id) REFERENCES flight_missions(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (old_drone_id) REFERENCES drones(id),
      FOREIGN KEY (new_drone_id) REFERENCES drones(id),
      FOREIGN KEY (reassigned_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS telemetry (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      drone_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      altitude REAL NOT NULL,
      speed REAL NOT NULL,
      heading REAL NOT NULL,
      battery INTEGER NOT NULL,
      battery_level INTEGER NOT NULL,
      signal_strength INTEGER NOT NULL,
      temperature REAL NOT NULL,
      is_abnormal BOOLEAN NOT NULL DEFAULT 0,
      abnormal_type TEXT,
      FOREIGN KEY (mission_id) REFERENCES flight_missions(id),
      FOREIGN KEY (drone_id) REFERENCES drones(id)
    );

    CREATE TABLE IF NOT EXISTS abnormal_events (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT NOT NULL,
      handled BOOLEAN NOT NULL DEFAULT 0,
      resolved BOOLEAN NOT NULL DEFAULT 0,
      handled_at DATETIME,
      handler_id TEXT,
      FOREIGN KEY (mission_id) REFERENCES flight_missions(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS no_fly_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      coordinates TEXT NOT NULL,
      min_altitude REAL NOT NULL DEFAULT 0,
      max_altitude REAL NOT NULL,
      effective_from DATETIME,
      effective_to DATETIME,
      reason TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      related_id TEXT,
      related_type TEXT,
      recipient_ids TEXT NOT NULL,
      read_by TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      report_date TEXT NOT NULL,
      total_orders INTEGER NOT NULL DEFAULT 0,
      completed_orders INTEGER NOT NULL DEFAULT 0,
      cancelled_orders INTEGER NOT NULL DEFAULT 0,
      pending_orders INTEGER NOT NULL DEFAULT 0,
      total_flight_time INTEGER NOT NULL DEFAULT 0,
      total_distance REAL NOT NULL DEFAULT 0,
      avg_delivery_time INTEGER NOT NULL DEFAULT 0,
      success_rate REAL NOT NULL DEFAULT 0,
      abnormal_count INTEGER NOT NULL DEFAULT 0,
      abnormal_stats TEXT NOT NULL DEFAULT '{}',
      drones_active INTEGER NOT NULL DEFAULT 0,
      drones_in_maintenance INTEGER NOT NULL DEFAULT 0,
      revenue REAL NOT NULL DEFAULT 0,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_missions_drone_id ON flight_missions(drone_id);
    CREATE INDEX IF NOT EXISTS idx_missions_status ON flight_missions(status);
    CREATE INDEX IF NOT EXISTS idx_missions_order_id ON flight_missions(order_id);
    CREATE INDEX IF NOT EXISTS idx_reassignments_mission_id ON mission_reassignments(mission_id);
    CREATE INDEX IF NOT EXISTS idx_reassignments_order_id ON mission_reassignments(order_id);
    CREATE INDEX IF NOT EXISTS idx_telemetry_mission_id ON telemetry(mission_id);
    CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
  `;

  db.exec(ddl);
}

function seedData(): void {
  const passwordHash = bcrypt.hashSync('admin123', 10);
  const userPasswordHash = bcrypt.hashSync('user123', 10);
  const opPasswordHash = bcrypt.hashSync('operator123', 10);
  const dispPasswordHash = bcrypt.hashSync('dispatcher123', 10);

  const insertUsers = `
    INSERT INTO users (id, username, email, phone, role, password_hash) VALUES 
    ('admin-001', 'admin', 'admin@drone-delivery.com', '13800138000', 'admin', ?),
    ('op-001', 'operator1', 'operator1@drone-delivery.com', '13800138001', 'operator', ?),
    ('op-002', 'operator2', 'operator2@drone-delivery.com', '13800138002', 'operator', ?),
    ('disp-001', 'dispatcher', 'dispatcher@drone-delivery.com', '13800138003', 'dispatcher', ?),
    ('user-001', 'testuser', 'user@drone-delivery.com', '13800138004', 'user', ?);
  `;
  db.run(insertUsers, [passwordHash, opPasswordHash, opPasswordHash, dispPasswordHash, userPasswordHash]);

  const insertDrones = `
    INSERT INTO drones (id, name, model, serial_number, max_payload, max_flight_time, cruise_speed, status, battery) VALUES 
    ('drone-001', '飞翼-001', 'DJI Matrice 300 RTK', 'SN-DJI-2024-001', 2.7, 55, 15, 'ready', 95),
    ('drone-002', '飞翼-002', 'DJI Matrice 300 RTK', 'SN-DJI-2024-002', 2.7, 55, 15, 'ready', 88),
    ('drone-003', '飞翼-003', 'DJI Mavic 3 Enterprise', 'SN-DJI-2024-003', 0.8, 45, 12, 'charging', 45),
    ('drone-004', '飞翼-004', 'DJI Matrice 300 RTK', 'SN-DJI-2024-004', 2.7, 55, 15, 'ready', 100),
    ('drone-005', '飞翼-005', 'DJI Mavic 3 Enterprise', 'SN-DJI-2024-005', 0.8, 45, 12, 'maintenance', 60);
  `;
  db.run(insertDrones);

  const nfz1Coords = JSON.stringify([
    { lat: 40.0801, lng: 116.5846 },
    { lat: 40.0801, lng: 116.6446 },
    { lat: 40.0401, lng: 116.6446 },
    { lat: 40.0401, lng: 116.5846 }
  ]);
  const nfz2Coords = JSON.stringify([
    { lat: 39.9187, lng: 116.3915 },
    { lat: 39.9187, lng: 116.4075 },
    { lat: 39.9027, lng: 116.4075 },
    { lat: 39.9027, lng: 116.3915 }
  ]);
  const nfz3Coords = JSON.stringify([
    { lat: 39.9999, lng: 116.2755 },
    { lat: 39.9999, lng: 116.3055 },
    { lat: 39.9799, lng: 116.3055 },
    { lat: 39.9799, lng: 116.2755 }
  ]);

  const insertNoFlyZones = `
    INSERT INTO no_fly_zones (id, name, type, coordinates, min_altitude, max_altitude, reason) VALUES 
    ('nfz-001', '首都机场禁飞区', 'forbidden', ?, 0, 120, '机场核心禁飞区'),
    ('nfz-002', '天安门广场限制区', 'restricted', ?, 0, 30, '敏感区域低空限制'),
    ('nfz-003', '城市公园警告区', 'warning', ?, 0, 60, '人员密集区域');
  `;
  db.run(insertNoFlyZones, [nfz1Coords, nfz2Coords, nfz3Coords]);
}

export function queryOne<T>(sql: string, params: any[] = []): T | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    return stmt.getAsObject() as T;
  }
  return null;
}

export function queryMany<T>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  return results;
}

export function execute(sql: string, params: any[] = []): number {
  db.run(sql, params);
  saveDatabase();
  return db.getRowsModified();
}

export function getLastInsertId(): string {
  const result = queryOne<{ 'last_insert_rowid()': string }>('SELECT last_insert_rowid()');
  return result ? result['last_insert_rowid()'] : '';
}
