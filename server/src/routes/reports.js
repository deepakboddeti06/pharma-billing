import { Router } from 'express';
import XLSX from 'xlsx';
import prisma from '../prisma.js';

const r = Router();

r.get('/by-client', async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from || to) where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  const rows = await prisma.invoice.groupBy({
    by: ['client_id'],
    where,
    _count: { id: true },
    _sum:   { net_total: true, total_qty: true },
    orderBy: { _sum: { net_total: 'desc' } },
  });

  const clientIds = rows.map(r => r.client_id);
  const clients   = await prisma.client.findMany({ where: { id: { in: clientIds } } });
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  const data = rows.map(row => ({
    client_id:     row.client_id,
    client_name:   clientMap[row.client_id]?.name || '—',
    invoice_count: row._count.id,
    total_qty:     row._sum.total_qty || 0,
    total_amount:  +(row._sum.net_total || 0).toFixed(2),
  }));
  res.json(data);
});

r.get('/by-month', async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  const invoices = await prisma.invoice.findMany({
    where: { date: { gte: `${year}-01-01`, lte: `${year}-12-31` } },
    select: { date: true, net_total: true, total_qty: true },
  });

  const byMonth = {};
  for (const inv of invoices) {
    const m = inv.date.slice(0, 7); // YYYY-MM
    if (!byMonth[m]) byMonth[m] = { month: m, invoice_count: 0, total_qty: 0, total_amount: 0 };
    byMonth[m].invoice_count++;
    byMonth[m].total_qty    += inv.total_qty;
    byMonth[m].total_amount += inv.net_total;
  }
  const data = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  data.forEach(d => { d.total_amount = +d.total_amount.toFixed(2); });
  res.json(data);
});

r.get('/export', async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from || to) where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  const invoices = await prisma.invoice.findMany({
    where,
    include: { client: true },
    orderBy: { date: 'desc' },
  });

  const data = invoices.map(inv => ({
    'Invoice No':  inv.invoice_no,
    'Date':        inv.date,
    'Client':      inv.client.name,
    'Total Qty':   inv.total_qty,
    'Subtotal':    inv.subtotal,
    'Discount':    inv.discount,
    'Round Off':   inv.round_off,
    'Net Total':   inv.net_total,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=invoices_${Date.now()}.xlsx`);
  res.send(buf);
});

export default r;
