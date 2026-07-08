import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool(config.database);

const createDatabase = async () => {
  const client = new pg.Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
  });

  try {
    await client.connect();
    
    // Check if database exists
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database.database]
    );
    
    if (res.rows.length === 0) {
      console.log(`Creating database: ${config.database.database}`);
      await client.query(`CREATE DATABASE "${config.database.database}"`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
  } finally {
    await client.end();
  }
};

const runMigrations = async () => {
  const migrationsPath = path.join(__dirname, 'migrations');
  
  const client = await pool.connect();
  
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get all migration files
    const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).sort();
    
    for (const file of files) {
      const migrationName = file;
      
      // Check if migration was already executed
      const result = await client.query('SELECT id FROM migrations WHERE name = $1', [migrationName]);
      
      if (result.rows.length === 0) {
        console.log(`Running migration: ${migrationName}`);
        
        const filePath = path.join(migrationsPath, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [migrationName]);
        
        console.log(`✓ Migration completed: ${migrationName}`);
      } else {
        console.log(`⊘ Migration already executed: ${migrationName}`);
      }
    }
  } catch (error) {
    console.error('Error running migrations:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

const migrate = async () => {
  try {
    console.log('Starting database migration...');
    await createDatabase();
    await runMigrations();
    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
