import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH   = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const BACKUP_DIR= path.join(__dirname, '..', '..', 'backups');

const r = Router();

// Download live SQLite file
r.get('/export-db', (_req, res) => {
  if (!fs.existsSync(DB_PATH)) return res.status(404).json({ error: 'DB not found' });
  res.download(DB_PATH, `billing_backup_${Date.now()}.db`);
});

// Named backup copy
r.post('/snapshot', (_req, res) => {
  if (!fs.existsSync(DB_PATH)) return res.status(404).json({ error: 'DB not found' });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `billing_${ts}.db`;
  fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, filename));
  res.json({ ok: true, filename });
});

export default r;
