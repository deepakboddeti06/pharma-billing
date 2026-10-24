import { Router } from 'express';
import prisma from '../prisma.js';

const r = Router();

r.get('/', async (_req, res) => {
  const s = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  res.json(s);
});

r.put('/', async (req, res) => {
  const s = await prisma.businessSettings.update({ where: { id: 1 }, data: req.body });
  res.json(s);
});

export default r;
