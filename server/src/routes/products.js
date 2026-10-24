import { Router } from 'express';
import prisma from '../prisma.js';

const r = Router();

r.get('/', async (req, res) => {
  const { search = '' } = req.query;
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: search } },
        { mfr:  { contains: search } },
        { hsn:  { contains: search } },
      ],
    },
    orderBy: { name: 'asc' },
  });
  res.json(products);
});

r.get('/:id', async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: +req.params.id } });
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

r.post('/', async (req, res) => {
  const { mfr, hsn, name, batch_no, expiry, uom, mrp, ptr, default_rate, stock_qty } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const p = await prisma.product.create({
    data: { mfr: mfr||'', hsn: hsn||'', name: name.trim(), batch_no: batch_no||'',
            expiry: expiry||'', uom: uom||'NOS', mrp: +mrp||0, ptr: +ptr||0,
            default_rate: +default_rate||0, stock_qty: +stock_qty || 0 },
  });
  res.json(p);
});

r.put('/:id', async (req, res) => {
  const { mfr, hsn, name, batch_no, expiry, uom, mrp, ptr, default_rate, stock_qty } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const p = await prisma.product.update({
    where: { id: +req.params.id },
    data: { mfr: mfr||'', hsn: hsn||'', name: name.trim(), batch_no: batch_no||'',
            expiry: expiry||'', uom: uom||'NOS', mrp: +mrp||0, ptr: +ptr||0,
            default_rate: +default_rate||0, stock_qty: +stock_qty || 0 },
  });
  res.json(p);
});

r.delete('/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: +req.params.id } });
  res.json({ ok: true });
});

export default r;
