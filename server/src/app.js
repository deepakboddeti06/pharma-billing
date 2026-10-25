import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

import settingsRouter  from './routes/settings.js';
import clientsRouter   from './routes/clients.js';
import productsRouter  from './routes/products.js';
import invoicesRouter  from './routes/invoices.js';
import reportsRouter   from './routes/reports.js';
import backupRouter    from './routes/backup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '..', 'uploads');

try {
  fs.mkdirSync(UPLOADS, { recursive: true });
} catch {
  // Ignore in read-only environments
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS));

app.use('/api/settings', settingsRouter);
app.use('/api/clients',  clientsRouter);
app.use('/api/products', productsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/reports',  reportsRouter);
app.use('/api/backup',   backupRouter);

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString(), env: process.env.NODE_ENV || 'development' })
);

export default app;
