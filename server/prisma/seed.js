import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Business Settings ──────────────────────────────────────────────────────
  await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'SATYA SAI MEDICAL AGENCIES',
      address: 'plot no 143, Road No 8, Mothevari Thota, Pathebad, ELURU - 534002',
      phone: '9491722324',
      gstin: '37CBNPB8185P1ZR',
      dl_20b: 'AP/05/01/2014-120610',
      dl_21b: 'AP/05/01/2014-120611',
      state: 'AP',
      state_code: '37',
      bank_name: 'State Bank of India R.R.Pet, Eluru. BR',
      account_no: '37047328014',
      ifsc_code: 'SBIN0009771',
      terms: 'Drugs Supplied comply with Sec 18 of Drugs & Cosmetics Act 1940 and Rules there under.\nGoods sold on understanding buyer holds requisite drug municipal tax.\nNo claims for shortages/breakages once goods leave our premises.\nAll disputes subject to Eluru Jurisdiction only.',
      invoice_prefix: 'A',
      next_seq: 35,
    },
  });
  console.log('  ✅ Business settings seeded');

  // ── Client ─────────────────────────────────────────────────────────────────
  const client = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'SRI AYYAPPASAI MEDICAL STORES',
      address: 'D.NO:24A-1-4B, NEAR GANGACHIKEN CENTER, PATHEBADA, ELURU-2.',
      phone: '9885789444',
      gstin: '37AFNPP7333P2ZI',
      dl_20b: '133/AP/WG/E/2002/R',
      dl_21b: '133/AP/WG/E/2002/R',
      state: 'AP',
      state_code: '37',
    },
  });
  console.log(`  ✅ Client seeded: ${client.name}`);

  // ── Products ───────────────────────────────────────────────────────────────
  const productsData = [
    { mfr: 'LOGOS',    hsn: '30042099', name: 'FURABET-100 SR TABLET 10', batch_no: 'LGN12071/31', expiry: '11/26', uom: "10'S", mrp: 90.83, ptr: 60.00, default_rate: 52.00 },
    { mfr: 'MEDISH',   hsn: '30049099', name: 'LEVOTAZ-AX',               batch_no: 'GTM24028',    expiry: '12/25', uom: "10'S", mrp: 60.00, ptr: 40.00, default_rate: 30.00 },
    { mfr: 'ADDII',    hsn: '30049099', name: 'MAXIFEN-GEL 30GM',         batch_no: 'L21H',        expiry: '11/26', uom: '30GM', mrp: 85.00, ptr: 55.00, default_rate: 39.52 },
    { mfr: 'UNISPEED', hsn: '30049053', name: 'PANTONIX DSR CAP',         batch_no: 'C250501E',    expiry: '04/27', uom: "10'S", mrp: 110.00,ptr: 70.00, default_rate: 41.00 },
    { mfr: 'THRIFT',   hsn: '300490',   name: "VERTISYN 16 15'S",          batch_no: 'THT-33107',   expiry: '11/26', uom: "15'S", mrp: 145.00,ptr: 100.00,default_rate: 82.98 },
    { mfr: 'TEMPLE',   hsn: '21069099', name: 'ZYMETOR SYP 200ML',        batch_no: 'TAG-302',     expiry: '01/26', uom: '200ML',mrp: 115.00,ptr: 75.00, default_rate: 58.00 },
  ];

  for (const p of productsData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
      console.log(`  ✅ Product: ${p.name}`);
    } else {
      console.log(`  ↩  Exists: ${p.name}`);
    }
  }

  // ── Sample Invoice A000034 ─────────────────────────────────────────────────
  const exists = await prisma.invoice.findUnique({ where: { invoice_no: 'A000034' } });
  if (!exists) {
    const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });

    const rawItems = [
      { p: products[0], qty: 10, free: 0, disc: 0 },
      { p: products[1], qty: 5,  free: 0, disc: 0 },
      { p: products[2], qty: 8,  free: 0, disc: 0 },
      { p: products[3], qty: 20, free: 0, disc: 0 },
      { p: products[4], qty: 6,  free: 0, disc: 0 },
      { p: products[5], qty: 4,  free: 0, disc: 0 },
    ];

    const items = rawItems.map((r, idx) => {
      const amount = +(r.qty * r.p.default_rate).toFixed(2);
      const total  = +(amount * (1 - r.disc / 100)).toFixed(2);
      return {
        product_id:   r.p.id,
        mfr:          r.p.mfr,
        hsn:          r.p.hsn,
        name:         r.p.name,
        batch_no:     r.p.batch_no,
        expiry:       r.p.expiry,
        uom:          r.p.uom,
        mrp:          r.p.mrp,
        ptr:          r.p.ptr,
        qty:          r.qty,
        free:         r.free,
        rate:         r.p.default_rate,
        discount_pct: r.disc,
        amount,
        total,
        sort_order:   idx,
      };
    });

    const subtotal   = +items.reduce((s, r) => s + r.total, 0).toFixed(2);
    const roundOff   = +(Math.round(subtotal) - subtotal).toFixed(2);
    const netTotal   = +(subtotal + roundOff).toFixed(2);
    const totalQty   = items.reduce((s, r) => s + r.qty, 0);

    await prisma.invoice.create({
      data: {
        invoice_no:      'A000034',
        date:            '2024-10-05',
        client_id:       client.id,
        total_qty:       totalQty,
        subtotal,
        round_off:       roundOff,
        net_total:       netTotal,
        amount_in_words: numberToWords(netTotal),
        items:           { create: items },
      },
    });
    console.log(`  ✅ Sample invoice A000034 created (Net: ₹${netTotal})`);
  } else {
    console.log('  ↩  Invoice A000034 already exists');
  }

  console.log('\n🎉 Seed complete!');
}

// ── Indian number-to-words ─────────────────────────────────────────────────
function numberToWords(n) {
  n = Math.round(n);
  if (n === 0) return 'Zero Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const two = (x) => x < 20 ? ones[x] : (tens[Math.floor(x/10)] + (x%10 ? ' '+ones[x%10] : '')).trim();
  const three = (x) => x >= 100 ? ones[Math.floor(x/100)]+' Hundred'+(x%100?' '+two(x%100):'') : two(x);
  const parts = [];
  const cr = Math.floor(n/1e7); if(cr) { parts.push(three(cr)+' Crore'); n %= 1e7; }
  const la = Math.floor(n/1e5); if(la) { parts.push(three(la)+' Lakh'); n %= 1e5; }
  const th = Math.floor(n/1e3); if(th) { parts.push(three(th)+' Thousand'); n %= 1e3; }
  if(n) parts.push(three(n));
  return parts.join(' ') + ' Only';
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
