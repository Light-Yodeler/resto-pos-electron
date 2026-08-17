#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const rowCount = Math.max(1, Number(process.argv[2]) || 1000000);
const output = path.resolve(process.argv[3] || path.join(__dirname, '..', 'outputs', 'Anda-POS-Dummy-1M.db'));
const endDate = new Date('2026-08-17T00:00:00Z');
const dayCount = 1460;
const pinHashes = {
  owner: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  admin: '38083c7ee9121e17401883566a148aa5c2e2d55dc53bc4a94a026517dbff3c6b',
  cashier: 'ceaa28bba4caba687dc31b1bbe79eca3c70c33f871f1ce8f528cf9ab5cfd76dd'
};
const products = [
  { id: 1, name: 'Nasi Goreng Anda', en: 'Anda Fried Rice', category: 'Makanan', price: 68000, taxable: true, icon: '🍛' },
  { id: 2, name: 'Ikan Bakar Jimbaran', en: 'Jimbaran Grilled Fish', category: 'Makanan', price: 115000, taxable: true, icon: '🐟' },
  { id: 3, name: 'Sate Ayam', en: 'Chicken Satay', category: 'Makanan', price: 72000, taxable: true, icon: '🍢' },
  { id: 4, name: 'Gado-gado', en: 'Gado-gado', category: 'Makanan', price: 58000, taxable: true, icon: '🥗' },
  { id: 5, name: 'Mie Goreng Seafood', en: 'Seafood Fried Noodles', category: 'Makanan', price: 78000, taxable: true, icon: '🍜' },
  { id: 6, name: 'Es Kelapa Muda', en: 'Iced Young Coconut', category: 'Minuman', price: 35000, taxable: true, icon: '🥥' },
  { id: 7, name: 'Jus Mangga', en: 'Mango Juice', category: 'Minuman', price: 32000, taxable: true, icon: '🥭' },
  { id: 8, name: 'Kopi Bali', en: 'Balinese Coffee', category: 'Minuman', price: 28000, taxable: true, icon: '☕' },
  { id: 9, name: 'Air Mineral', en: 'Mineral Water', category: 'Minuman', price: 15000, taxable: false, icon: '💧' },
  { id: 10, name: 'Pisang Goreng', en: 'Banana Fritters', category: 'Dessert', price: 42000, taxable: true, icon: '🍌' },
  { id: 11, name: 'Es Krim Kelapa', en: 'Coconut Ice Cream', category: 'Dessert', price: 45000, taxable: true, icon: '🍨' },
  { id: 12, name: 'Welcome Drink', en: 'Welcome Drink', category: 'Minuman', price: 25000, taxable: false, icon: '🥤' }
].map(product => ({ ...product, stock: 1000000, unlimitedStock: true, active: true }));
const users = [
  { id: 1, name: 'Owner', role: 'owner', pinHash: pinHashes.owner, active: true },
  { id: 2, name: 'Admin', role: 'admin', pinHash: pinHashes.admin, active: true },
  { id: 3, name: 'Kasir 01', role: 'cashier', pinHash: pinHashes.cashier, active: true },
  { id: 4, name: 'Kasir 02', role: 'cashier', pinHash: pinHashes.cashier, active: true }
];
const roles = [
  { id: 'owner', nameId: 'Owner', nameEn: 'Owner', system: true, permissions: ['pos','tables','kitchen','inventory','menuManagement','tableManagement','users','reports','shift','settings','manageRoles','voidTransactions'] },
  { id: 'admin', nameId: 'Admin', nameEn: 'Admin', system: true, permissions: ['pos','tables','kitchen','inventory','menuManagement','tableManagement','reports','shift','settings','voidTransactions'] },
  { id: 'cashier', nameId: 'Kasir', nameEn: 'Cashier', system: true, permissions: ['pos','tables','kitchen','shift'] }
];

const dateCache = [];
for (let d = 0; d < dayCount; d++) {
  const date = new Date(endDate);
  date.setUTCDate(date.getUTCDate() - (dayCount - 1 - d));
  const iso = date.toISOString().slice(0, 10);
  dateCache.push({ iso, compact: iso.replaceAll('-', '') });
}

function compactDate(date) { return date.replaceAll('-', ''); }
function shiftId(dateKey, part) { return `SFT-${dateKey}-${part === 0 ? '0001' : '0002'}`; }
function roundCash(value) { return Math.ceil(value / 50000) * 50000; }

fs.mkdirSync(path.dirname(output), { recursive: true });
if (fs.existsSync(output)) fs.unlinkSync(output);
const database = new DatabaseSync(output);
database.exec(`
  PRAGMA journal_mode=MEMORY;
  PRAGMA synchronous=OFF;
  PRAGMA temp_store=MEMORY;
  PRAGMA cache_size=-64000;
  CREATE TABLE app_state (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE transactions (id TEXT PRIMARY KEY, business_date TEXT NOT NULL, payload TEXT NOT NULL);
  CREATE TABLE shifts (id TEXT PRIMARY KEY, opened_at TEXT NOT NULL, payload TEXT NOT NULL);
`);

const shifts = [];
for (let day = 0; day < dayCount; day++) {
  const { iso: date, compact: dateKey } = dateCache[day];
  for (let part = 0; part < 2; part++) {
    const cashier = users[2 + part];
    const openedAt = `${date}T${part === 0 ? '06:00:00' : '14:00:00'}.000Z`;
    const closedAt = `${date}T${part === 0 ? '14:00:00' : '22:00:00'}.000Z`;
    shifts.push({ id: shiftId(dateKey, part), name: part === 0 ? 'Shift Pagi' : 'Shift Sore', cashierId: cashier.id, cashierName: cashier.name, openedAt, closedAt, openingCash: 500000, closingCash: 500000, expectedCash: 500000, difference: 0, transactionCount: 0, sales: 0 });
  }
}
const shiftMap = new Map(shifts.map(shift => [shift.id, shift]));
const state = {
  language: 'id', activeView: 'reports', orderType: 'dineIn', table: 'M1', carts: {}, splitBills: {}, splitPersonCounters: {}, orderIds: {}, orderMeta: {},
  nextOrderNumber: rowCount + 1, nextInvoiceNumber: rowCount + 1, nextSplitBillNumber: 1, nextShiftNumber: shifts.length + 1,
  settings: { kitchenEnabled: true, taxRate: 10, discountOptions: [{ id: 'disc-10', label: 'Diskon 10%', type: 'percent', value: 10 }], printerWidth: 80, receiptContentWidth: 64, receiptFontStyle: 'clear', directPrintMode: 'escpos', directPrintColumns: 42, autoCut: true, cutFeedLines: 8, printerName: '', silentPrint: false, restaurantName: 'Anda Bungalows & Restaurant', brandLogo: '' },
  categories: ['Makanan', 'Minuman', 'Dessert'], users, roles, user: { id: 1, name: 'Owner', role: 'owner' }, shift: { open: false }, shiftHistory: shifts.slice(0, 30),
  products, tables: Array.from({ length: 20 }, (_, index) => ({ id: `M${index + 1}`, seats: [2, 4, 4, 6][index % 4], status: 'available' })), tickets: []
};
database.prepare('INSERT INTO app_state (id, payload) VALUES (1, ?)').run(JSON.stringify(state));
const insertShift = database.prepare('INSERT INTO shifts (id, opened_at, payload) VALUES (?, ?, ?)');

database.exec('BEGIN');
for (const shift of shifts) insertShift.run(shift.id, shift.openedAt, JSON.stringify(shift));
database.exec('COMMIT');

const insertTransaction = database.prepare('INSERT INTO transactions (id, business_date, payload) VALUES (?, ?, ?)');
const batchSize = 10000;
const waiters = ['Lena', 'Wayan', 'Made', 'Komang', 'Ayu'];
const paymentCodes = ['cash', 'card', 'qris'];
const paymentNames = ['Tunai', 'Kartu', 'QRIS'];

console.log(`Memulai pembuatan ${rowCount.toLocaleString('id-ID')} data transaksi...`);
const startTime = Date.now();

for (let batchStart = 0; batchStart < rowCount; batchStart += batchSize) {
  database.exec('BEGIN');
  const batchEnd = Math.min(rowCount, batchStart + batchSize);
  for (let index = batchStart; index < batchEnd; index++) {
    const serial = index + 1;
    const { iso: date, compact: dateKey } = dateCache[index % dayCount];
    const part = index % 2;
    const cashier = users[2 + part];
    const hour = 6 + (index * 7 % 16), minute = index * 13 % 60;
    const time = `${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`;
    const lineCount = 1 + (index % 5);
    const lineItems = [];
    for (let line = 0; line < lineCount; line++) {
      const product = products[(index * 7 + line * 3) % products.length];
      const qty = 1 + ((index + line) % 3);
      lineItems.push({ productId: product.id, name: product.name, en: product.en, qty, price: product.price, taxable: product.taxable, miscellaneous: false, lineTotal: product.price * qty });
    }
    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const rawTaxable = lineItems.filter(item => item.taxable).reduce((sum, item) => sum + item.lineTotal, 0);
    const discountAmount = index % 17 === 0 ? Math.min(5000, subtotal) : (index % 7 === 0 ? Math.round(subtotal * 0.1) : 0);
    const taxableDiscount = subtotal ? Math.round(discountAmount * rawTaxable / subtotal) : 0;
    const taxableSubtotal = Math.max(0, rawTaxable - taxableDiscount);
    const taxRate = 10;
    const tax = Math.round(taxableSubtotal * taxRate / 100);
    const netSales = subtotal - discountAmount;
    const total = netSales + tax;
    const payIdx = index % 3;
    const paymentCode = paymentCodes[payIdx];
    const payment = paymentNames[payIdx];
    const status = index % 97 === 0 ? 'void' : 'closed';
    const currentShiftId = shiftId(dateKey, part);
    const shift = shiftMap.get(currentShiftId);
    const tendered = paymentCode === 'cash' ? (index % 4 === 0 ? total : roundCash(total)) : null;
    const transaction = {
      id: `INV-${dateKey}-${String(serial).padStart(7, '0')}`,
      orderId: `ORD-${dateKey}-${String(serial).padStart(7, '0')}`,
      date, time,
      timestamp: `${date}T${time}:00.000Z`,
      status,
      orderType: index % 8 === 0 ? 'takeaway' : 'dineIn',
      table: index % 8 === 0 ? 'Takeaway' : `M${index % 20 + 1}`,
      waiter: waiters[index % 5],
      cashier: cashier.name,
      cashierId: cashier.id,
      shiftId: currentShiftId,
      shiftName: shift.name,
      payment, paymentCode,
      subtotal, discountAmount,
      discountLabel: discountAmount ? (index % 17 === 0 ? 'Diskon Rp5.000' : 'Diskon 10%') : '',
      taxableSubtotal, taxRate, tax, total,
      tendered, change: tendered === null ? null : tendered - total,
      lineItems
    };
    if (status === 'void') {
      Object.assign(transaction, { voidReason: 'Data dummy — pengujian void', voidAt: `${date}T23:00:00.000Z`, voidBy: 'Admin', voidById: 2, voidAuthorizedRole: 'admin', voidRequestedBy: cashier.name, voidRequestedById: cashier.id });
    } else {
      shift.transactionCount++;
      shift.sales += netSales;
    }
    insertTransaction.run(transaction.id, date, JSON.stringify(transaction));
  }
  database.exec('COMMIT');
  if (batchEnd % 50000 === 0 || batchEnd === rowCount) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\rMembuat transaksi: ${batchEnd.toLocaleString('id-ID')} / ${rowCount.toLocaleString('id-ID')} (${elapsed}s)`);
  }
}

console.log('\nMembuat indeks SQLite berkecepatan tinggi...');
database.exec(`
  CREATE INDEX idx_transactions_date ON transactions(business_date);
  CREATE INDEX idx_transactions_shift ON transactions(json_extract(payload, '$.shiftId'));
  CREATE INDEX idx_shifts_opened_at ON shifts(opened_at);
  PRAGMA journal_mode=WAL;
  PRAGMA synchronous=NORMAL;
  ANALYZE;
  PRAGMA optimize;
`);

const count = database.prepare('SELECT COUNT(*) AS count FROM transactions').get().count;
const voidCount = database.prepare("SELECT COUNT(*) AS count FROM transactions WHERE json_extract(payload, '$.status')='void'").get().count;
const firstDate = database.prepare('SELECT MIN(business_date) AS value FROM transactions').get().value;
const lastDate = database.prepare('SELECT MAX(business_date) AS value FROM transactions').get().value;
const integrity = Object.values(database.prepare('PRAGMA quick_check').get())[0];
database.close();
const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nSelesai dalam ${totalSeconds} detik! Berkas tersimpan di: ${output}`);
console.log(JSON.stringify({ count, voidCount, activeCount: count - voidCount, firstDate, lastDate, integrity, bytes: fs.statSync(output).size, sizeMb: (fs.statSync(output).size / (1024 * 1024)).toFixed(1) + ' MB' }, null, 2));
