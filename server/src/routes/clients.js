import { Router } from 'express';
import prisma from '../prisma.js';

const r = Router();

r.get('/', async (req, res) => {
  const { search = '' } = req.query;
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { name:    { contains: search } },
        { phone:   { contains: search } },
        { gstin:   { contains: search } },
        { address: { contains: search } },
      ],
    },
    orderBy: { name: 'asc' },
  });
  res.json(clients);
});

r.get('/:id', async (req, res) => {
  const c = await prisma.client.findUnique({ where: { id: +req.params.id } });
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

r.post('/', async (req, res) => {
  const { name, address, phone, gstin, dl_20b, dl_21b, state, state_code } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const c = await prisma.client.create({
    data: { name: name.trim(), address: address || '', phone: phone || '',
            gstin: gstin || '', dl_20b: dl_20b || '', dl_21b: dl_21b || '',
            state: state || '', state_code: state_code || '' },
  });
  res.json(c);
});

r.put('/:id', async (req, res) => {
  const { name, address, phone, gstin, dl_20b, dl_21b, state, state_code } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const c = await prisma.client.update({
    where: { id: +req.params.id },
    data: { name: name.trim(), address, phone, gstin, dl_20b, dl_21b, state, state_code },
  });
  res.json(c);
});

r.delete('/:id', async (req, res) => {
  const inv = await prisma.invoice.findFirst({ where: { client_id: +req.params.id } });
  if (inv) return res.status(400).json({ error: 'Client has invoices — cannot delete' });
  await prisma.client.delete({ where: { id: +req.params.id } });
  res.json({ ok: true });
});

export default r;
