import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import path from 'path';

dotenv.config();

console.log('Using SQLite (local) client for persistence.');

const dbPath = path.resolve(process.cwd(), 'local.db');
const sqliteDb = new Database(dbPath);

// Initialize Schema
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    role TEXT DEFAULT 'user', -- 'user' or 'admin'
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT,
    code TEXT,
    api_key TEXT,
    endpoint TEXT,
    is_active INTEGER,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    Model_ID TEXT,
    provider TEXT,
    type TEXT,
    api_key TEXT,
    is_active INTEGER,
    endpoint TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    product_info TEXT,
    target_audience TEXT,
    budget_range TEXT,
    status TEXT,
    seed INTEGER,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS library (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    user_id TEXT,
    type TEXT,
    url TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    metadata TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    content TEXT,
    status TEXT,
    version INTEGER DEFAULT 1,
    model_id TEXT,
    model_name TEXT,
    metadata TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS storyboards (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    script_id TEXT,
    sequence_number INTEGER,
    image_prompt TEXT,
    image_url TEXT,
    video_url TEXT,
    metadata TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    script_id TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    status TEXT,
    metadata TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    category TEXT,
    tags TEXT,
    is_public INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT,
    status TEXT,
    input TEXT,
    output TEXT,
    error TEXT,
    created_at TEXT,
    updated_at TEXT
  );
`);

try {
sqliteDb.exec(`ALTER TABLE scripts ADD COLUMN version INTEGER DEFAULT 1`);
} catch (e) {}
try {
sqliteDb.exec(`ALTER TABLE scripts ADD COLUMN model_id TEXT`);
} catch (e) {}
try {
sqliteDb.exec(`ALTER TABLE scripts ADD COLUMN model_name TEXT`);
} catch (e) {}

try {
sqliteDb.exec(`ALTER TABLE storyboards ADD COLUMN video_url TEXT`);
} catch (e) {}

try {
sqliteDb.exec(`ALTER TABLE projects ADD COLUMN seed INTEGER`);
} catch (e) {}

try {
sqliteDb.exec(`ALTER TABLE storyboards ADD COLUMN script_id TEXT`);
} catch (e) {}

try {
sqliteDb.exec(`ALTER TABLE videos ADD COLUMN script_id TEXT`);
} catch (e) {}

try {
  const tableInfo = sqliteDb.prepare("PRAGMA table_info(models)").all() as any[];
  const hasId = tableInfo.some((col: any) => col.name === 'id');
  const hasModelId = tableInfo.some((col: any) => col.name === 'Model_ID');
  if (hasId && !hasModelId) {
     sqliteDb.exec(`ALTER TABLE models RENAME COLUMN id TO Model_ID`);
     console.log('Migrated models table: Renamed id to Model_ID');
   }
   
   const hasRowId = tableInfo.some((col: any) => col.name === 'row_id');
   // Re-check for 'id' as it might have been renamed
   const hasIdNow = tableInfo.some((col: any) => col.name === 'id') && !hasModelId; // Only if id wasn't just renamed
   // Actually, after first migration, id is gone. So hasIdNow is false.
   // But tableInfo is stale. I should re-fetch.
   
   const updatedTableInfo = sqliteDb.prepare("PRAGMA table_info(models)").all() as any[];
   const hasRowIdNow = updatedTableInfo.some((col: any) => col.name === 'row_id');
   const hasIdNowCheck = updatedTableInfo.some((col: any) => col.name === 'id');
   
   if (hasRowIdNow && !hasIdNowCheck) {
       sqliteDb.exec(`ALTER TABLE models RENAME COLUMN row_id TO id`);
       console.log('Migrated models table: Renamed row_id to id');
   }
 } catch (e) {
   console.log('Models table migration:', e);
 }
 
 try {
   // Remove old migration block
   const tableInfo = sqliteDb.prepare("PRAGMA table_info(models)").all() as any[];
   const hasRowId = tableInfo.some((col: any) => col.name === 'row_id');
   if (false) { // Disable old block
    sqliteDb.exec(`
      CREATE TABLE models_new (
        row_id TEXT PRIMARY KEY,
        Model_ID TEXT,
        provider TEXT,
        type TEXT,
        api_key TEXT,
        is_active INTEGER,
        endpoint TEXT,
        created_at TEXT
      )
    `);
    sqliteDb.exec(`
      INSERT INTO models_new (row_id, Model_ID, provider, type, api_key, is_active, endpoint, created_at)
      SELECT id, name, provider, type, api_key, is_active, endpoint, created_at FROM models
    `);
    sqliteDb.exec(`DROP TABLE models`);
    sqliteDb.exec(`ALTER TABLE models_new RENAME TO models`);
  }
} catch (e) {
  console.log('Models table migration:', e);
}

// Seed Data
const userCount = sqliteDb.prepare('SELECT count(*) as count FROM users').get() as any;
if (userCount.count === 0) {
  const insertUser = sqliteDb.prepare('INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('mock-user-id', 'demo@example.com', 'Demo User', 'user', new Date().toISOString());
  insertUser.run('admin-id', 'admin@example.com', 'Admin User', 'admin', new Date().toISOString());
}

const providerCount = sqliteDb.prepare('SELECT count(*) as count FROM providers').get() as any;
if (providerCount.count === 0) {
  const insertProvider = sqliteDb.prepare('INSERT INTO providers (id, name, code, api_key, endpoint, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertProvider.run('1', 'Doubao', 'doubao', 'sk-doubao-default', 'https://ark.cn-beijing.volces.com/api/v3', 1, new Date().toISOString());
  insertProvider.run('2', 'OpenAI', 'openai', 'sk-openai-default', 'https://api.openai.com/v1', 1, new Date().toISOString());
}

const modelCount = sqliteDb.prepare('SELECT count(*) as count FROM models').get() as any;
if (modelCount.count === 0) {
  const insertModel = sqliteDb.prepare('INSERT INTO models (id, Model_ID, provider, type, api_key, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const randomId = () => Math.random().toString(36).substring(2, 12);
  insertModel.run(randomId(), 'Doubao-Seed-2.0-lite', 'doubao', 'text', 'sk-********', 1, new Date().toISOString());
  insertModel.run(randomId(), 'Doubao-Seed-2.0-pro', 'doubao', 'text', 'sk-********', 1, new Date().toISOString());
  insertModel.run(randomId(), 'Doubao-Pixel-Pro', 'doubao', 'image', 'sk-********', 1, new Date().toISOString());
}

const projectCount = sqliteDb.prepare('SELECT count(*) as count FROM projects').get() as any;
if (projectCount.count === 0) {
  const insertProject = sqliteDb.prepare('INSERT INTO projects (id, user_id, name, product_info, target_audience, budget_range, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertProject.run('1', 'mock-user-id', 'Smart Coffee Maker', JSON.stringify({ description: 'A coffee maker that learns your preferences and brews the perfect cup every morning.' }), 'Coffee lovers', 'medium', 'draft', new Date().toISOString());
}

const promptCount = sqliteDb.prepare('SELECT count(*) as count FROM prompts').get() as any;
if (promptCount.count === 0) {
  const insertPrompt = sqliteDb.prepare('INSERT INTO prompts (id, title, content, category, tags, is_public, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertPrompt.run('1', '产品介绍脚本', '为{{产品名称}}创建一个{{时长}}秒的广告脚本，突出以下特点：{{特点列表}}。风格：{{风格}}。', 'script', '产品,脚本,广告', 1, 'admin-id', new Date().toISOString());
  insertPrompt.run('2', '分镜画面生成', '根据脚本内容生成分镜画面，场景{{场景编号}}：{{场景描述}}。风格要求：{{画面风格}}。', 'storyboard', '分镜,画面,场景', 1, 'admin-id', new Date().toISOString());
  insertPrompt.run('3', '视频创意文案', '为{{品牌名称}}创作一段{{风格}}风格的视频文案，目标受众是{{目标受众}}，核心卖点是{{核心卖点}}。', 'video', '视频,文案,创意', 1, 'admin-id', new Date().toISOString());
}

// Helper to parse JSON columns and booleans
const processResult = (row: any, table: string) => {
  if (!row) return null;
  const newRow = { ...row };
  if (table === 'projects' && newRow.product_info) {
      try { newRow.product_info = JSON.parse(newRow.product_info); } catch (e) {}
  }
  if (table === 'models' || table === 'providers') {
      newRow.is_active = !!newRow.is_active;
  }
  return newRow;
};

// SQLite client with Supabase-like interface
export const db = {
  auth: {
    getUser: async (token: string) => {
      if (token === 'admin-token') {
          return { data: { user: { id: 'admin-id', email: 'admin@example.com', role: 'admin' } }, error: null };
      }
      return { data: { user: { id: 'mock-user-id', email: 'mock@example.com', role: 'user' } }, error: null };
    },
    signUp: async (credentials: any) => ({
      data: { user: { id: 'mock-user-id', email: credentials.email, role: 'user' }, session: { access_token: 'valid-token' } },
      error: null
    }),
    signInWithPassword: async (credentials: any) => {
      const isAdmin = credentials.email === 'admin@example.com';
      return {
        data: { 
          user: { 
            id: isAdmin ? 'admin-id' : 'mock-user-id', 
            email: credentials.email,
            role: isAdmin ? 'admin' : 'user'
          }, 
          session: { access_token: isAdmin ? 'admin-token' : 'valid-token' } 
        },
        error: null
      };
    }
  },
  from: (table: string) => {
    const builder: any = {
      _operation: 'select',
      _filters: {} as Record<string, any>,
      _data: null,
      _return_data: false,
      _order: null as { column: string; ascending: boolean } | null,
      _limit: null as number | null,
      
      select: (columns = '*') => {
          if (builder._operation === 'insert' || builder._operation === 'update') {
              builder._return_data = true;
              return builder;
          }
          builder._operation = 'select';
          return builder;
      },
      insert: (data: any) => {
          builder._operation = 'insert';
          builder._data = data;
          return builder;
      },
      update: (data: any) => {
          builder._operation = 'update';
          builder._data = data;
          return builder;
      },
      delete: () => {
          builder._operation = 'delete';
          return builder;
      },
      eq: (col: string, val: any) => {
          builder._filters[col] = val;
          return builder;
      },
      in: (col: string, vals: any[]) => {
          builder._filters[col] = { in: vals };
          return builder;
      },
      order: (column: string, ascending: boolean = true) => {
          builder._order = { column, ascending };
          return builder;
      },
      limit: (count: number) => {
          builder._limit = count;
          return builder;
      },
      single: () => {
           return new Promise((resolve) => {
               builder.then((res: any) => {
                   if (res.data && Array.isArray(res.data)) {
                       if (res.data.length === 0) resolve({ data: null, error: { message: 'Row not found' } });
                       else resolve({ data: res.data[0], error: null });
                   } else if (res.data && !Array.isArray(res.data)) {
                       resolve({ data: res.data, error: null });
                   } else {
                       resolve(res);
                   }
               });
           });
      },
      then: (resolve: any, reject: any) => {
          try {
              if (builder._operation === 'select') {
                  let query = `SELECT * FROM ${table}`;
                  const params: any[] = [];
                  const conditions: string[] = [];
                  
                  for (const [key, val] of Object.entries(builder._filters)) {
                      if (val && typeof val === 'object' && 'in' in val) {
                          const inValues = (val as { in: any[] }).in;
                          const placeholders = inValues.map(() => '?').join(', ');
                          conditions.push(`${key} IN (${placeholders})`);
                          params.push(...inValues);
                      } else {
                          conditions.push(`${key} = ?`);
                          params.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
                      }
                  }
                  
                  if (conditions.length > 0) {
                      query += ` WHERE ${conditions.join(' AND ')}`;
                  }
                  
                  if (builder._order) {
                      query += ` ORDER BY ${builder._order.column} ${builder._order.ascending ? 'ASC' : 'DESC'}`;
                  }
                  
                  if (builder._limit) {
                      query += ` LIMIT ${builder._limit}`;
                  }
                  
                  const rows = sqliteDb.prepare(query).all(params);
                  const processed = rows.map(row => processResult(row, table));
                  resolve({ data: processed, error: null });
              } else if (builder._operation === 'insert') {
                   const dataToInsert = Array.isArray(builder._data) ? builder._data : [builder._data];
                   const results: any[] = [];
                   
                   const insertStmt = (item: any) => {
                       const keys = Object.keys(item);
                       const values = Object.values(item);
                       const id = item.id || Math.random().toString(36).substr(2, 9);
                       
                       if (!keys.includes('id')) {
                           keys.push('id');
                           values.push(id);
                       }

                       if (!keys.includes('created_at')) {
                           keys.push('created_at');
                           values.push(new Date().toISOString());
                       }
                       
                       // Handle JSON and Boolean
                       const processedValues = values.map(v => {
                           if (typeof v === 'object' && v !== null) return JSON.stringify(v);
                           if (typeof v === 'boolean') return v ? 1 : 0;
                           return v;
                       });

                       const placeholders = keys.map(() => '?').join(',');
                       const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
                       
                       sqliteDb.prepare(sql).run(processedValues);
                       
                       // Fetch back the inserted row
                       const inserted = sqliteDb.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
                       return processResult(inserted, table);
                   };

                   for (const item of dataToInsert) {
                       results.push(insertStmt(item));
                   }
                   
                   // If multiple inserts, return array. If single, return array (single() will handle unpacking)
                   resolve({ data: results, error: null });

              } else if (builder._operation === 'update') {
                  const updates: string[] = [];
                  const params: any[] = [];
                  
                  for (const [key, val] of Object.entries(builder._data)) {
                      updates.push(`${key} = ?`);
                      let v = val;
                      if (typeof v === 'object' && v !== null) v = JSON.stringify(v);
                      if (typeof v === 'boolean') v = v ? 1 : 0;
                      params.push(v);
                  }
                  
                  let query = `UPDATE ${table} SET ${updates.join(', ')}`;
                  const conditions: string[] = [];
                  
                  for (const [key, val] of Object.entries(builder._filters)) {
                      conditions.push(`${key} = ?`);
                      params.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
                  }
                  
                  if (conditions.length > 0) {
                      query += ` WHERE ${conditions.join(' AND ')}`;
                  } else {
                       resolve({ data: null, error: { message: 'Update requires filter' } });
                       return;
                  }

                  sqliteDb.prepare(query).run(params);
                  
                  let data = null;
                  if (builder._return_data) {
                       // Try to find the updated record(s)
                       const conditions: string[] = [];
                       const params: any[] = [];
                       
                       for (const [key, val] of Object.entries(builder._filters)) {
                           conditions.push(`${key} = ?`);
                           params.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
                       }
                       
                       if (conditions.length > 0) {
                           const query = `SELECT * FROM ${table} WHERE ${conditions.join(' AND ')}`;
                           const row = sqliteDb.prepare(query).get(params);
                           data = processResult(row, table);
                       }
                  }
                  resolve({ data, error: null });

              } else if (builder._operation === 'delete') {
                  let query = `DELETE FROM ${table}`;
                  const params: any[] = [];
                  const conditions: string[] = [];
                  
                  for (const [key, val] of Object.entries(builder._filters)) {
                      conditions.push(`${key} = ?`);
                      params.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
                  }
                  
                  if (conditions.length > 0) {
                      query += ` WHERE ${conditions.join(' AND ')}`;
                  }
                  
                  sqliteDb.prepare(query).run(params);
                  resolve({ data: null, error: null });
              }
          } catch (err: any) {
              console.error('SQLite Error:', err);
              resolve({ data: null, error: err });
          }
      }
    };
    return builder;
  },
  storage: {
    from: (bucket: string) => ({
      upload: async () => ({ data: { path: 'mock-path' }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://mock-storage/${path}` } })
    })
  }
};
