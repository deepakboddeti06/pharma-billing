import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import prisma from '../prisma.js';
import { numberToWords } from '../utils/numberToWords.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '..', '..', 'uploads');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch {}
const upload = multer({ dest: uploadDir });
const r = Router();

// ── next invoice number ───────────────────────────────────────────────────────
r.get('/next-number', async (_req, res) => {
  const s = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  let seq = s?.next_seq || 35;
  const prefix = s?.invoice_prefix || 'A';
  let no = `${prefix}${String(seq).padStart(6, '0')}`;
  while (await prisma.invoice.findUnique({ where: { invoice_no: no } })) {
    seq++;
    no = `${prefix}${String(seq).padStart(6, '0')}`;
  }
  if (s && seq !== s.next_seq) {
    await prisma.businessSettings.update({ where: { id: 1 }, data: { next_seq: seq } });
  }
  res.json({ next: no, invoice_no: no, next_seq: seq });
});

// ── list invoices ─────────────────────────────────────────────────────────────
r.get('/', async (req, res) => {
  const { q, client, from, to, limit = 200, offset = 0 } = req.query;
  const where = {};

  if (client) where.client_id = +client;
  if (from || to) where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (q) where.OR = [
    { invoice_no: { contains: q } },
    { client: { name: { contains: q } } },
  ];

  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where, skip: +offset, take: +limit,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      include: { client: { select: { id: true, name: true, phone: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);
  res.setHeader('X-Total-Count', total);
  res.json(invoices);
});

// ── get single invoice with all relations ────────────────────────────────────
r.get('/:id', async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: +req.params.id },
    include: {
      client: true,
      shipTo: true,
      items:  { orderBy: { sort_order: 'asc' } },
    },
  });
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  const settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  res.json({ ...invoice, settings });
});

// ── create invoice ────────────────────────────────────────────────────────────
r.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const body  = req.body;
    const items = Array.isArray(body.items)
      ? body.items
      : (typeof body.items === 'string' ? JSON.parse(body.items || '[]') : []);

    if (!body.client_id) return res.status(400).json({ error: 'client_id required' });
    if (!items.length)   return res.status(400).json({ error: 'At least one item required' });

    // Determine guaranteed unique invoice number
    const settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
    const prefix = settings?.invoice_prefix || 'A';
    let seq = settings?.next_seq || 35;
    let invoice_no = body.invoice_no?.trim();

    if (!invoice_no) {
      invoice_no = `${prefix}${String(seq).padStart(6, '0')}`;
      while (await prisma.invoice.findUnique({ where: { invoice_no } })) {
        seq++;
        invoice_no = `${prefix}${String(seq).padStart(6, '0')}`;
      }
    } else {
      // Check if manually supplied invoice_no already exists
      const exists = await prisma.invoice.findUnique({ where: { invoice_no } });
      if (exists) {
        // Auto-increment to next available
        while (await prisma.invoice.findUnique({ where: { invoice_no } })) {
          seq++;
          invoice_no = `${prefix}${String(seq).padStart(6, '0')}`;
        }
      }
    }

    const net = +body.net_total || 0;

    const result = await prisma.$transaction(async (tx) => {
      await tx.businessSettings.update({ where: { id: 1 }, data: { next_seq: seq + 1 } });

      const inv = await tx.invoice.create({
        data: {
          invoice_no,
          date:              body.date,
          client_id:         +body.client_id,
          ship_to_client_id: body.ship_to_client_id ? +body.ship_to_client_id : null,
          total_qty:         +body.total_qty  || 0,
          subtotal:          +body.subtotal   || 0,
          discount:          +body.discount   || 0,
          round_off:         +body.round_off  || 0,
          net_total:         net,
          amount_in_words:   numberToWords(net),
          attachment_path:   req.file ? `/uploads/${req.file.filename}` : null,
          is_quotation:      body.is_quotation === 'true',
          items: {
            create: items.map((it, idx) => ({
              product_id:   it.product_id ? +it.product_id : null,
              mfr:          it.mfr          || '',
              hsn:          it.hsn          || '',
              name:         it.name         || '',
              batch_no:     it.batch_no     || '',
              expiry:       it.expiry       || '',
              uom:          it.uom          || '',
              mrp:          +it.mrp         || 0,
              qty:          +it.qty         || 0,
              free:         +it.free        || 0,
              rate:         +it.rate        || 0,
              ptr:          +it.ptr         || 0,
              discount_pct: +it.discount_pct|| 0,
              amount:       +it.amount      || 0,
              total:        +it.total       || 0,
              sort_order:   idx,
            })),
          },
        },
        include: { items: true },
      });

      // Cut quantity from total stock of product
      for (const it of items) {
        if (it.product_id) {
          const cutQty = (+it.qty || 0) + (+it.free || 0);
          if (cutQty > 0) {
            await tx.product.update({
              where: { id: +it.product_id },
              data: { stock_qty: { decrement: cutQty } },
            });
          }
        }
      }

      return inv;
    });

    res.json({ id: result.id, invoice_no: result.invoice_no });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── update invoice ────────────────────────────────────────────────────────────
r.put('/:id', upload.single('attachment'), async (req, res) => {
  try {
    const body  = req.body;
    const items = Array.isArray(body.items)
      ? body.items
      : (typeof body.items === 'string' ? JSON.parse(body.items || '[]') : []);
    const net   = +body.net_total || 0;
    const invId = +req.params.id;

    await prisma.$transaction(async (tx) => {
      // Find old items and restore stock
      const oldInv = await tx.invoice.findUnique({
        where: { id: invId },
        include: { items: true },
      });

      if (oldInv?.items) {
        for (const oldIt of oldInv.items) {
          if (oldIt.product_id) {
            const restoreQty = (oldIt.qty || 0) + (oldIt.free || 0);
            if (restoreQty > 0) {
              await tx.product.update({
                where: { id: oldIt.product_id },
                data: { stock_qty: { increment: restoreQty } },
              });
            }
          }
        }
      }

      // Validate stock for new items
      for (const it of items) {
        if (it.product_id) {
          const prod = await tx.product.findUnique({ where: { id: +it.product_id } });
          if (prod) {
            const reqQty = (+it.qty || 0) + (+it.free || 0);
            if (prod.stock_qty <= 0) {
              throw new Error(`Tablet "${prod.name}" has no stock available.`);
            }
            if (reqQty > prod.stock_qty) {
              throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.stock_qty}, requested: ${reqQty}.`);
            }
          }
        }
      }

      // Update invoice and delete old items
      await tx.invoiceItem.deleteMany({ where: { invoice_id: invId } });
      await tx.invoice.update({
        where: { id: invId },
        data: {
          date:              body.date,
          client_id:         +body.client_id,
          ship_to_client_id: body.ship_to_client_id ? +body.ship_to_client_id : null,
          total_qty:         +body.total_qty || 0,
          subtotal:          +body.subtotal  || 0,
          discount:          +body.discount  || 0,
          round_off:         +body.round_off || 0,
          net_total:         net,
          amount_in_words:   numberToWords(net),
          is_quotation:      body.is_quotation === 'true',
          ...(req.file ? { attachment_path: `/uploads/${req.file.filename}` } : {}),
          items: {
            create: items.map((it, idx) => ({
              product_id:   it.product_id ? +it.product_id : null,
              mfr: it.mfr||'', hsn: it.hsn||'', name: it.name||'',
              batch_no: it.batch_no||'', expiry: it.expiry||'', uom: it.uom||'',
              mrp: +it.mrp||0, qty: +it.qty||0, free: +it.free||0,
              rate: +it.rate||0, ptr: +it.ptr||0,
              discount_pct: +it.discount_pct||0,
              amount: +it.amount||0, total: +it.total||0, sort_order: idx,
            })),
          },
        },
      });

      // Cut new quantities from stock
      for (const it of items) {
        if (it.product_id) {
          const cutQty = (+it.qty || 0) + (+it.free || 0);
          if (cutQty > 0) {
            await tx.product.update({
              where: { id: +it.product_id },
              data: { stock_qty: { decrement: cutQty } },
            });
          }
        }
      }
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── delete invoice ────────────────────────────────────────────────────────────
r.delete('/:id', async (req, res) => {
  try {
    const invId = +req.params.id;
    await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUnique({
        where: { id: invId },
        include: { items: true },
      });
      if (inv?.items) {
        for (const it of inv.items) {
          if (it.product_id) {
            const restoreQty = (it.qty || 0) + (it.free || 0);
            if (restoreQty > 0) {
              await tx.product.update({
                where: { id: it.product_id },
                data: { stock_qty: { increment: restoreQty } },
              }).catch(() => {});
            }
          }
        }
      }
      await tx.invoice.delete({ where: { id: invId } });
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;
