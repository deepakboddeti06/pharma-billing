import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import settingsRouter  from './routes/settings.js';
import clientsRouter   from './routes/clients.js';
import productsRouter  from './routes/products.js';
import invoicesRouter  from './routes/invoices.js';
import reportsRouter   from './routes/reports.js';
import backupRouter    from './routes/backup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS));

app.use('/api/settings', settingsRouter);
app.use('/api/clients',  clientsRouter);
app.use('/api/products', productsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/reports',  reportsRouter);
app.use('/api/backup',   backupRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.listen(PORT, () =>
  console.log(`\x1b[32m✅ API ready → http://localhost:${PORT}\x1b[0m`)
);
