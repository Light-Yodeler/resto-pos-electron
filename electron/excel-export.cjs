const ExcelJS = require('exceljs');

async function createExcelReportWorkbook(data = {}) {
  const {
    restaurantName = 'Anda POS',
    language = 'id',
    period = { from: '', to: '' },
    filters = { payment: 'all', cashier: 'all' },
    transactions = []
  } = data;

  const english = language === 'en';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = restaurantName;
  workbook.lastModifiedBy = 'Anda POS';
  workbook.created = new Date();
  workbook.modified = new Date();

  const isVoid = trx => trx.status === 'void';
  const valid = transactions.filter(t => !isVoid(t));

  const grossSales = valid.reduce((s, x) => s + (Number(x.subtotal) || 0), 0);
  const totalDiscounts = valid.reduce((s, x) => s + (Number(x.discountAmount) || 0), 0);
  const netSales = grossSales - totalDiscounts;
  const taxableSales = valid.reduce((s, x) => s + (Number(x.taxableSubtotal) || 0), 0);
  const taxExemptSales = Math.max(0, netSales - taxableSales);
  const totalTax = valid.reduce((s, x) => s + (Number(x.tax) || 0), 0);
  const totalCollected = valid.reduce((s, x) => s + (Number(x.total) || 0), 0);
  const paidCount = valid.length;
  const voidCount = transactions.length - valid.length;

  const paymentMatches = (x, code) => x.paymentCode === code || (code === 'cash' && x.payment === 'Tunai') || (code === 'card' && x.payment === 'Kartu') || (code === 'qris' && x.payment === 'QRIS');
  const paymentTotals = {
    cash: valid.filter(x => paymentMatches(x, 'cash')).reduce((s, x) => s + (Number(x.total) || 0), 0),
    card: valid.filter(x => paymentMatches(x, 'card')).reduce((s, x) => s + (Number(x.total) || 0), 0),
    qris: valid.filter(x => paymentMatches(x, 'qris')).reduce((s, x) => s + (Number(x.total) || 0), 0)
  };

  const itemMap = new Map();
  valid.forEach(trx => {
    (trx.lineItems || []).forEach(item => {
      const key = item.name || 'Item';
      if (!itemMap.has(key)) {
        itemMap.set(key, { name: item.name, nameEn: item.nameEn || item.name, category: item.category || 'General', qty: 0, total: 0 });
      }
      const agg = itemMap.get(key);
      agg.qty += Number(item.qty) || 0;
      agg.total += Number(item.lineTotal) || (Number(item.price || 0) * Number(item.qty || 0));
    });
  });
  const topItems = [...itemMap.values()].sort((a, b) => b.qty - a.qty);

  const fontDefault = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
  const fontTitle = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FF0F172A' } };
  const fontSubtitle = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF64748B' } };
  const fontSection = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  const fontHeader = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fillHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A4B' } };
  const fillSection = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  const fillGrand = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  const fillVoid = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
  const fontVoid = { name: 'Segoe UI', size: 10, color: { argb: 'FFDC2626' } };
  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };
  const numFmtCurrency = '"Rp"#,##0;[Red]("-Rp"#,##0);"Rp0"';

  // ----------------------------------------------------
  // Sheet 1: Executive Summary
  // ----------------------------------------------------
  const sheetSummary = workbook.addWorksheet(english ? 'Executive Summary' : 'Ringkasan Eksekutif', {
    views: [{ showGridLines: true }]
  });
  sheetSummary.columns = [
    { width: 32 },
    { width: 22 },
    { width: 38 },
    { width: 20 }
  ];

  const rowTitle = sheetSummary.addRow([`${restaurantName.toUpperCase()} - ${english ? 'FINANCIAL & AUDIT REPORT' : 'LAPORAN KEUANGAN & OPERASIONAL'}`]);
  rowTitle.font = fontTitle;

  const rowSub = sheetSummary.addRow([`${english ? 'Period' : 'Periode'}: ${period.from || 'Awal'} s/d ${period.to || 'Sekarang'} | ${english ? 'Export Date' : 'Dicetak pada'}: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} | ${english ? 'Payment' : 'Pembayaran'}: ${filters.payment} | ${english ? 'Cashier' : 'Kasir'}: ${filters.cashier}`]);
  rowSub.font = fontSubtitle;

  sheetSummary.addRow([]);

  const rowSec1 = sheetSummary.addRow([`1. ${english ? 'ACCOUNTING & TAX FLOW' : 'ALUR NILAI PENJUALAN & PAJAK'}`, english ? 'AMOUNT' : 'JUMLAH', english ? 'DESCRIPTION' : 'KETERANGAN']);
  rowSec1.font = fontSection;
  rowSec1.eachCell(c => { c.fill = fillSection; c.border = borderThin; });

  const kpis = [
    [english ? 'Gross Sales' : 'Penjualan Kotor', grossSales, english ? 'Before discounts, excluding tax' : 'Sebelum diskon, tanpa pajak', false],
    [english ? 'Total Discounts' : 'Total Diskon', totalDiscounts, english ? 'Order & item level discounts' : 'Diskon nota dan diskon per item', false],
    [english ? 'Net Sales' : 'Penjualan Bersih', netSales, english ? 'Gross sales minus discounts' : 'Penjualan kotor dikurangi total diskon', true],
    [english ? 'Taxable Sales Base (DPP)' : 'Dasar Pengenaan Pajak (DPP)', taxableSales, english ? 'Taxable portion of net sales' : 'Bagian penjualan bersih yang dikenakan pajak', false],
    [english ? 'Tax-Exempt Sales' : 'Penjualan Bebas Pajak', taxExemptSales, english ? 'Non-taxable portion of net sales' : 'Bagian penjualan bersih bebas pajak', false],
    [english ? 'Tax Collected' : 'Pajak Terkumpul', totalTax, english ? 'PB1 / Restaurant Tax collected' : 'Pajak restoran yang dipungut', false],
    [english ? 'Total Collected' : 'Total Pembayaran', totalCollected, english ? 'Net sales plus tax' : 'Penjualan bersih ditambah pajak', true],
    [english ? 'Paid Transactions' : 'Transaksi Lunas', paidCount, english ? 'Successful closed bills' : 'Jumlah transaksi selesai', false, true],
    [english ? 'Void Transactions' : 'Transaksi Void', voidCount, english ? 'Cancelled / voided transactions' : 'Jumlah transaksi dibatalkan', false, true]
  ];

  kpis.forEach(([label, value, desc, isGrand, isCount]) => {
    const row = sheetSummary.addRow([label, value, desc]);
    row.font = isGrand ? { ...fontDefault, bold: true } : fontDefault;
    if (isGrand) row.eachCell(c => c.fill = fillGrand);
    row.getCell(1).border = borderThin;
    row.getCell(3).border = borderThin;
    const cellVal = row.getCell(2);
    cellVal.border = borderThin;
    if (isCount) {
      cellVal.numFmt = '#,##0';
    } else {
      cellVal.numFmt = numFmtCurrency;
    }
  });

  sheetSummary.addRow([]);

  const rowSec2 = sheetSummary.addRow([`2. ${english ? 'PAYMENT METHODS' : 'PENERIMAAN METODE PEMBAYARAN'}`, english ? 'TOTAL RECEIVED' : 'TOTAL DITERIMA', english ? 'SHARE' : 'PORSI']);
  rowSec2.font = fontSection;
  rowSec2.eachCell(c => { c.fill = fillSection; c.border = borderThin; });

  const pMethods = [
    [english ? 'Cash' : 'Tunai', paymentTotals.cash],
    [english ? 'Card (Debit / Credit)' : 'Kartu (Debit / Kredit)', paymentTotals.card],
    ['QRIS', paymentTotals.qris]
  ];
  pMethods.forEach(([name, amount]) => {
    const share = totalCollected > 0 ? (amount / totalCollected * 100).toFixed(1) + '%' : '0%';
    const row = sheetSummary.addRow([name, amount, share]);
    row.font = fontDefault;
    row.eachCell(c => c.border = borderThin);
    row.getCell(2).numFmt = numFmtCurrency;
  });

  sheetSummary.addRow([]);

  const rowSec3 = sheetSummary.addRow([`3. ${english ? 'TOP 10 BEST SELLERS' : '10 MENU TERLARIS'}`, english ? 'CATEGORY' : 'KATEGORI', english ? 'QTY SOLD' : 'PORSI TERJUAL', english ? 'TOTAL REVENUE' : 'TOTAL OMZET']);
  rowSec3.font = fontSection;
  rowSec3.eachCell(c => { c.fill = fillSection; c.border = borderThin; });

  if (topItems.length === 0) {
    const emptyRow = sheetSummary.addRow([english ? 'No item data' : 'Belum ada data item', '-', 0, 0]);
    emptyRow.font = fontDefault;
    emptyRow.eachCell(c => c.border = borderThin);
  } else {
    topItems.slice(0, 10).forEach((item, idx) => {
      const row = sheetSummary.addRow([
        `${idx + 1}. ${english ? (item.nameEn || item.name) : item.name}`,
        item.category,
        item.qty,
        item.total
      ]);
      row.font = fontDefault;
      row.eachCell(c => c.border = borderThin);
      row.getCell(3).numFmt = '#,##0';
      row.getCell(4).numFmt = numFmtCurrency;
    });
  }

  // ----------------------------------------------------
  // Sheet 2: Transactions Ledger
  // ----------------------------------------------------
  const sheetLedger = workbook.addWorksheet(english ? 'Transactions Ledger' : 'Buku Besar Transaksi', {
    views: [{ showGridLines: true }]
  });

  const ledgerHeaders = english
    ? ['Status', 'Void Reason', 'Void Authorized By', 'Void Requested By', 'Date', 'Time', 'Invoice ID', 'Order ID', 'Table', 'Waiter', 'Cashier', 'Shift ID', 'Shift Name', 'Payment Method', 'Amount Tendered', 'Change Given', 'Gross Sales', 'Discounts', 'Net Sales', 'Taxable Sales Base', 'Tax-Exempt Sales', 'Tax Rate (%)', 'Tax Collected', 'Total Collected', 'Items Summary']
    : ['Status', 'Alasan Void', 'Otorisasi Void', 'Permintaan Void', 'Tanggal', 'Waktu', 'No Invoice', 'No Order', 'Meja', 'Waiter', 'Kasir', 'Shift ID', 'Nama Shift', 'Metode Pembayaran', 'Uang Tamu', 'Kembalian', 'Penjualan Kotor', 'Diskon', 'Penjualan Bersih', 'Dasar Kena Pajak', 'Penjualan Bebas Pajak', 'Tarif Pajak (%)', 'Pajak', 'Total Pembayaran', 'Ringkasan Item'];

  sheetLedger.columns = [
    { width: 12 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 13 }, { width: 10 },
    { width: 20 }, { width: 20 }, { width: 12 }, { width: 15 }, { width: 15 }, { width: 18 },
    { width: 14 }, { width: 15 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 },
    { width: 16 }, { width: 17 }, { width: 17 }, { width: 13 }, { width: 15 }, { width: 18 },
    { width: 40 }
  ];

  const rowLedgerHeader = sheetLedger.addRow(ledgerHeaders);
  rowLedgerHeader.font = fontHeader;
  rowLedgerHeader.eachCell(c => { c.fill = fillHeader; c.alignment = { horizontal: 'center', vertical: 'middle' }; });

  transactions.slice().reverse().forEach(trx => {
    const isV = isVoid(trx);
    const gross = Number(trx.subtotal) || 0;
    const disc = Number(trx.discountAmount) || 0;
    const net = gross - disc;
    const taxable = Number(trx.taxableSubtotal) || 0;
    const nonTax = Math.max(0, net - taxable);
    const taxRate = Number(trx.taxRate ?? 10);
    const taxAmt = Number(trx.tax) || 0;
    const grand = Number(trx.total) || 0;
    const itemsSummary = (trx.lineItems || []).map(i => `${i.qty}x ${i.name}${i.discountAmount ? ` (-${i.discountAmount})` : ''}`).join('; ') || (trx.items || []).join('; ');

    const row = sheetLedger.addRow([
      isV ? 'VOID' : 'CLOSED',
      trx.voidReason || '',
      trx.voidBy || '',
      trx.voidRequestedBy || '',
      trx.date || '',
      trx.time || '',
      trx.id || '',
      trx.orderId || '',
      trx.table || '',
      trx.waiter || '',
      trx.cashier || '',
      trx.shiftId || '',
      trx.shiftName || trx.shiftId || '',
      trx.payment || '',
      trx.tendered !== null && trx.tendered !== undefined ? Number(trx.tendered) : '',
      trx.change !== null && trx.change !== undefined ? Number(trx.change) : '',
      gross,
      disc,
      net,
      taxable,
      nonTax,
      taxRate,
      taxAmt,
      grand,
      itemsSummary
    ]);

    row.font = isV ? fontVoid : fontDefault;
    if (isV) row.eachCell(c => c.fill = fillVoid);
    row.eachCell(c => c.border = borderThin);

    [15, 16, 17, 18, 19, 20, 21, 23, 24].forEach(colIndex => {
      const cell = row.getCell(colIndex);
      if (typeof cell.value === 'number') {
        cell.numFmt = numFmtCurrency;
      }
    });
    row.getCell(22).numFmt = '0.00';
  });

  // ----------------------------------------------------
  // Sheet 3: Itemized Breakdown
  // ----------------------------------------------------
  const sheetItems = workbook.addWorksheet(english ? 'Itemized Breakdown' : 'Rincian Item Terjual', {
    views: [{ showGridLines: true }]
  });

  const itemHeaders = english
    ? ['Status', 'Date', 'Time', 'Invoice ID', 'Table', 'Waiter', 'Cashier', 'Menu Category', 'Menu Item Name', 'Quantity', 'Unit Price', 'Item Discount', 'Line Total (Net)', 'Tax Status']
    : ['Status', 'Tanggal', 'Waktu', 'No Invoice', 'Meja', 'Waiter', 'Kasir', 'Kategori Menu', 'Nama Menu', 'Jumlah', 'Harga Satuan', 'Diskon Item', 'Total Bersih', 'Status Pajak'];

  sheetItems.columns = [
    { width: 12 }, { width: 13 }, { width: 10 }, { width: 20 }, { width: 12 }, { width: 15 },
    { width: 15 }, { width: 18 }, { width: 28 }, { width: 10 }, { width: 16 }, { width: 15 },
    { width: 17 }, { width: 15 }
  ];

  const rowItemHeader = sheetItems.addRow(itemHeaders);
  rowItemHeader.font = fontHeader;
  rowItemHeader.eachCell(c => { c.fill = fillHeader; c.alignment = { horizontal: 'center', vertical: 'middle' }; });

  transactions.slice().reverse().forEach(trx => {
    const isV = isVoid(trx);
    (trx.lineItems || []).forEach(item => {
      const unitPrice = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      const itemDisc = Number(item.discountAmount) || 0;
      const lineNet = Number(item.lineTotal) || (unitPrice * qty - itemDisc);
      const taxStatus = item.taxable !== false ? (english ? 'Taxable' : 'Kena Pajak') : (english ? 'Tax-Exempt' : 'Bebas Pajak');

      const row = sheetItems.addRow([
        isV ? 'VOID' : 'CLOSED',
        trx.date || '',
        trx.time || '',
        trx.id || '',
        trx.table || '',
        trx.waiter || '',
        trx.cashier || '',
        item.category || 'General',
        english ? (item.nameEn || item.name) : item.name,
        qty,
        unitPrice,
        itemDisc,
        lineNet,
        taxStatus
      ]);

      row.font = isV ? fontVoid : fontDefault;
      if (isV) row.eachCell(c => c.fill = fillVoid);
      row.eachCell(c => c.border = borderThin);

      row.getCell(10).numFmt = '#,##0';
      row.getCell(11).numFmt = numFmtCurrency;
      row.getCell(12).numFmt = numFmtCurrency;
      row.getCell(13).numFmt = numFmtCurrency;
    });
  });

  return workbook;
}

module.exports = { createExcelReportWorkbook };
