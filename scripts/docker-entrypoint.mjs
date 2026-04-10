#!/usr/bin/env node
// scripts/docker-entrypoint.mjs
// Entrypoint for both dev and production containers.
// Creates a minimal database if none exists.

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'products.db');

async function initDatabase() {
  const dataDir = path.dirname(DB_PATH);

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    console.log(`[entrypoint] Creating data directory: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create minimal database if missing
  if (!fs.existsSync(DB_PATH)) {
    console.log(`[entrypoint] No database found at ${DB_PATH}`);
    console.log('[entrypoint] Creating minimal database with schema and ingredients...');

    const initScript = path.join(__dirname, 'init-minimal-db.mjs');

    await new Promise((resolve, reject) => {
      const child = spawn('node', [initScript], {
        stdio: 'inherit',
        env: { ...process.env, DB_PATH }
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('[entrypoint] Database initialized successfully');
          resolve();
        } else {
          reject(new Error(`init-minimal-db.mjs exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  } else {
    console.log(`[entrypoint] Database found at ${DB_PATH}`);
  }
}

async function main() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('[entrypoint] Database initialization failed:', err.message);
    process.exit(1);
  }

  // Execute the main command (CMD from Dockerfile or override)
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('[entrypoint] No command specified');
    process.exit(1);
  }

  console.log(`[entrypoint] Starting: ${args.join(' ')}`);

  const child = spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    env: process.env
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main();
