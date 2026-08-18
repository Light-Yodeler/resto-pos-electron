const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { DatabaseSync, backup: backupSqlite } = require('node:sqlite');
const execFileAsync = promisify(execFile);

let window, database;
const knownTransactions = new Set(), knownShifts = new Set();
const dataDirectory = process.env.ANDA_POS_DATA_DIR || path.join(app.getPath('appData'), 'anda-bungalows-pos-AG');
app.setPath('userData', dataDirectory);
const getLegacyDataFile = () => path.join(app.getPath('userData'), 'anda-pos-data.json');
const getDatabaseFile = () => path.join(app.getPath('userData'), 'anda-pos.db');
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function asciiText(value) {
  return String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[×]/g, 'x').replace(/[·]/g, ' - ').replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/[\u00a0\u2007\u202f]/g, ' ').replace(/[\t\r\n\f\v]+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '?').trim();
}

function wrapReceiptText(value, columns) {
  const text = asciiText(value);
  if (!text) return [''];
  const lines = [];
  let rest = text;
  while (rest.length > columns) {
    let splitAt = rest.lastIndexOf(' ', columns);
    if (splitAt < Math.floor(columns * 0.45)) splitAt = columns;
    lines.push(rest.slice(0, splitAt).trimEnd());
    rest = rest.slice(splitAt).trimStart();
  }
  lines.push(rest);
  return lines;
}

function formatReceiptRow(left, right, columns) {
  const rightText = asciiText(right).slice(0, columns - 4);
  const minimumGap = 3;
  const available = Math.max(8, columns - rightText.length - minimumGap);
  const leftLines = wrapReceiptText(left, available);
  return leftLines.map((line, index) => index === leftLines.length - 1
    ? `${line}${' '.repeat(Math.max(minimumGap, columns - line.length - rightText.length))}${rightText}`
    : line);
}

function receiptLogoBytes(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return Buffer.alloc(0);
  try {
    let logo = nativeImage.createFromDataURL(dataUrl);
    if (logo.isEmpty()) return Buffer.alloc(0);
    const original = logo.getSize();
    const scale = Math.min(256 / original.width, 144 / original.height);
    const width = Math.max(8, Math.floor(original.width * scale / 8) * 8);
    const height = Math.max(1, Math.floor(original.height * scale));
    logo = logo.resize({ width, height, quality: 'best' });
    const bitmap = logo.getBitmap();
    const bytesPerRow = Math.ceil(width / 8);
    const pixels = Buffer.alloc(bytesPerRow * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const blue = bitmap[offset], green = bitmap[offset + 1], red = bitmap[offset + 2], alpha = bitmap[offset + 3] / 255;
        const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) * alpha + 255 * (1 - alpha);
        if (luminance < 150) pixels[y * bytesPerRow + Math.floor(x / 8)] |= 0x80 >> (x % 8);
      }
    }
    return Buffer.concat([Buffer.from([0x1d, 0x76, 0x30, 0, bytesPerRow & 0xff, bytesPerRow >> 8, height & 0xff, height >> 8]), pixels, Buffer.from('\n')]);
  } catch {
    return Buffer.alloc(0);
  }
}

function buildEscPosReceipt(receipt, fontStyle = 'clear', requestedColumns = 42, autoCut = true, requestedFeedLines = 8) {
  if (!receipt || typeof receipt !== 'object' || !Array.isArray(receipt.rows)) throw new Error('Data teks struk tidak valid.');
  const columns = [42, 48].includes(Number(requestedColumns)) ? Number(requestedColumns) : 42;
  const feedLines = [6, 8, 10].includes(Number(requestedFeedLines)) ? Number(requestedFeedLines) : 8;
  const chunks = [];
  const command = (...bytes) => chunks.push(Buffer.from(bytes));
  const line = value => chunks.push(Buffer.from(`${asciiText(value).slice(0, columns)}\n`, 'ascii'));
  const centered = value => wrapReceiptText(value, columns).forEach(text => line(text));
  const setBold = enabled => command(0x1b, 0x45, enabled ? 1 : 0);
  command(0x1b, 0x40); // Initialize printer.
  command(0x1b, 0x4d, 0); // Font A; 42 columns is the safe default for generic 80 mm printers.
  command(0x1b, 0x32); // Default line spacing.
  command(0x1b, 0x61, 1);
  const logo = receiptLogoBytes(receipt.logo);
  if (logo.length) chunks.push(logo);
  setBold(true);
  centered(receipt.heading || 'RECEIPT');
  setBold(false);
  for (const meta of (receipt.meta || []).slice(0, 12)) centered(meta);
  line('');
  command(0x1b, 0x61, 0);
  const baseBold = fontStyle === 'bold';
  for (const row of receipt.rows.slice(0, 500)) {
    if (row.sectionStart) line('-'.repeat(columns));
    const emphasized = Boolean(baseBold || (fontStyle === 'medium' && row.emphasis));
    setBold(emphasized);
    for (const formatted of formatReceiptRow(row.left, row.right, columns)) line(formatted);
    setBold(false);
  }
  for (const note of (receipt.notes || []).slice(0, 8)) line(note);
  line('');
  command(0x1b, 0x61, 1);
  for (const footer of (receipt.footer || []).slice(0, 12)) centered(footer);
  command(0x1b, 0x61, 0);
  setBold(false);
  command(0x1b, 0x64, feedLines); // Feed beyond the physical cutter before cutting.
  if (autoCut) command(0x1d, 0x56, 0x01); // Standard ESC/POS partial cut.
  return Buffer.concat(chunks);
}

async function printWindowsEscPos(printerName, receipt, fontStyle, columns, autoCut, cutFeedLines) {
  const jobId = `${process.pid}-${Date.now()}`;
  const temporaryData = path.join(os.tmpdir(), `anda-pos-receipt-${jobId}.bin`);
  const packagedScript = path.join(__dirname, 'print-escpos-windows.ps1');
  const temporaryScript = path.join(os.tmpdir(), `anda-pos-escpos-${jobId}.ps1`);
  try {
    fs.writeFileSync(temporaryData, buildEscPosReceipt(receipt, fontStyle, columns, autoCut, cutFeedLines));
    fs.copyFileSync(packagedScript, temporaryScript);
    await execFileAsync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', temporaryScript, '-PrinterName', printerName, '-DataPath', temporaryData], { windowsHide: true, timeout: 30000 });
    await wait(1200);
    return { success: true, method: 'windows-escpos' };
  } catch (error) {
    return { success: false, failureReason: `ESC/POS Windows: ${error.stderr || error.message}` };
  } finally {
    try { fs.unlinkSync(temporaryData); } catch {}
    try { fs.unlinkSync(temporaryScript); } catch {}
  }
}

async function printWindowsRaster(printerName, image, contentWidth) {
  const jobId = `${process.pid}-${Date.now()}`;
  const temporaryImage = path.join(os.tmpdir(), `anda-pos-receipt-${jobId}.png`);
  const packagedScript = path.join(__dirname, 'print-windows.ps1');
  const temporaryScript = path.join(os.tmpdir(), `anda-pos-print-${jobId}.ps1`);
  fs.writeFileSync(temporaryImage, image.toPNG());
  fs.copyFileSync(packagedScript, temporaryScript);
  try {
    await execFileAsync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', temporaryScript, '-PrinterName', printerName, '-ImagePath', temporaryImage, '-ContentWidthMm', String(contentWidth)], { windowsHide: true, timeout: 30000 });
    await wait(1500);
    return { success: true, method: 'windows-gdi' };
  } catch (error) {
    return { success: false, failureReason: `Windows Print Spooler: ${error.stderr || error.message}` };
  } finally {
    try { fs.unlinkSync(temporaryImage); } catch {}
    try { fs.unlinkSync(temporaryScript); } catch {}
  }
}



function writeDatabaseState(data, replaceTransactions = false) {
  if (!data || typeof data !== 'object') throw new Error('Data aplikasi tidak valid.');
  const base = { ...data };
  const transactions = Array.isArray(base.transactions) ? base.transactions : [];
  delete base.transactions;
  if (Array.isArray(base.shiftHistory)) {
    base.shiftHistory = base.shiftHistory.slice(0, 30);
  }
  database.exec('BEGIN IMMEDIATE');
  try {
    database.prepare('INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP').run(JSON.stringify(base));
    if (replaceTransactions) {
      database.exec('DELETE FROM transactions');
      database.exec('DELETE FROM shifts');
      knownTransactions.clear();
      knownShifts.clear();
    }
    const insert = database.prepare('INSERT OR REPLACE INTO transactions (id, business_date, payload) VALUES (?, ?, ?)');
    for (const transaction of transactions) {
      const id = String(transaction.id || '');
      if (!id || (!replaceTransactions && knownTransactions.has(id))) continue;
      insert.run(id, transaction.date || transaction.timestamp?.slice(0, 10) || '', JSON.stringify(transaction));
      knownTransactions.add(id);
    }
    const insertShift = database.prepare('INSERT OR REPLACE INTO shifts (id, opened_at, payload) VALUES (?, ?, ?)');
    for (const shift of (Array.isArray(data.shiftHistory) ? data.shiftHistory : [])) {
      const id = String(shift?.id || '');
      if (!id || (!replaceTransactions && knownShifts.has(id))) continue;
      insertShift.run(id, shift.openedAt || '', JSON.stringify(shift));
      knownShifts.add(id);
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function readDatabaseState() {
  const row = database.prepare('SELECT payload FROM app_state WHERE id=1').get();
  if (!row) return null;
  const state = JSON.parse(row.payload);
  state.transactions = database.prepare('SELECT payload FROM transactions ORDER BY business_date DESC, rowid DESC LIMIT 100').all().map(item => JSON.parse(item.payload)).reverse();
  state.shiftHistory = database.prepare('SELECT payload FROM shifts ORDER BY opened_at DESC, rowid DESC LIMIT 30').all().map(item => JSON.parse(item.payload));
  return state;
}


function resetTransactionData(authorization = {}) {
  const row = database.prepare('SELECT payload FROM app_state WHERE id=1').get();
  if (!row) return { success: false, error: 'Data utama aplikasi tidak ditemukan.' };
  const state = JSON.parse(row.payload), ownerId = Number(authorization.ownerId), pinHash = String(authorization.pinHash || '');
  const owner = (state.users || []).find(user => Number(user.id) === ownerId && user.role === 'owner' && user.active !== false);
  if (!owner || !pinHash || owner.pinHash !== pinHash) return { success: false, unauthorized: true, error: 'PIN Owner tidak sesuai.' };
  const cleaned = {
    ...state, carts: {}, splitBills: {}, splitPersonCounters: {}, orderIds: {}, orderMeta: {}, tickets: [],
    shift: { open: false }, shiftHistory: [], nextOrderNumber: 1, nextInvoiceNumber: 1, nextSplitBillNumber: 1, nextShiftNumber: 1
  };
  database.exec('BEGIN IMMEDIATE');
  try {
    const deletedTransactions = database.prepare('DELETE FROM transactions').run().changes;
    const deletedShifts = database.prepare('DELETE FROM shifts').run().changes;
    database.prepare('UPDATE app_state SET payload=?, updated_at=CURRENT_TIMESTAMP WHERE id=1').run(JSON.stringify(cleaned));
    database.exec('COMMIT');
    if (typeof knownTransactions !== 'undefined' && knownTransactions?.clear) knownTransactions.clear();
    if (typeof knownShifts !== 'undefined' && knownShifts?.clear) knownShifts.clear();
    return { success: true, deletedTransactions: Number(deletedTransactions), deletedShifts: Number(deletedShifts) };
  } catch (error) {
    try { database.exec('ROLLBACK'); } catch {}
    return { success: false, error: `Reset transaksi gagal: ${error.message}` };
  }
}

function initializeDatabase() {
  fs.mkdirSync(path.dirname(getDatabaseFile()), { recursive: true });
  database = new DatabaseSync(getDatabaseFile());
  database.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000; PRAGMA cache_size=-16000; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, business_date TEXT NOT NULL, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(business_date); CREATE INDEX IF NOT EXISTS idx_transactions_shift ON transactions(json_extract(payload, \'$.shiftId\')); CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, opened_at TEXT NOT NULL, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_shifts_opened_at ON shifts(opened_at);');
  knownTransactions.clear();
  knownShifts.clear();
  database.prepare('SELECT id FROM transactions').all().forEach(row => knownTransactions.add(row.id));
  database.prepare('SELECT id FROM shifts').all().forEach(row => knownShifts.add(row.id));
  if (!database.prepare('SELECT 1 AS found FROM app_state WHERE id=1').get()) {
    try {
      const legacy = JSON.parse(fs.readFileSync(getLegacyDataFile(), 'utf8'));
      writeDatabaseState(legacy, true);
      fs.copyFileSync(getLegacyDataFile(), `${getLegacyDataFile()}.migrated-backup`);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('JSON migration failed:', error);
    }
  }
}

function normalizedSearch(value) { return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function transactionQuery(options = {}) {
  const pageSize = [25, 50, 100].includes(Number(options.pageSize)) ? Number(options.pageSize) : 25, page = Math.max(1, Number(options.page) || 1), where = [], parameters = [];
  const month = /^\d{4}-\d{2}$/.test(String(options.month || '')) ? String(options.month) : new Date().toISOString().slice(0, 7);
  const search = normalizedSearch(options.search);
  let effectiveFrom = options.from || '';
  let effectiveTo = options.to || '';
  if (!effectiveFrom && effectiveTo) {
    effectiveFrom = `${effectiveTo.slice(0, 7)}-01`;
  } else if (effectiveFrom && !effectiveTo) {
    effectiveTo = effectiveFrom;
  }
  if (effectiveFrom) { where.push('transactions.business_date >= ?'); parameters.push(effectiveFrom); }
  if (effectiveTo) { where.push('transactions.business_date <= ?'); parameters.push(effectiveTo); }
  if (!effectiveFrom && !effectiveTo && !search) {
    where.push('transactions.business_date LIKE ?');
    parameters.push(`${month}-%`);
  }
  if (options.payment && options.payment !== 'all') { where.push("json_extract(transactions.payload, '$.paymentCode') = ?"); parameters.push(String(options.payment)); }
  if (options.cashier && options.cashier !== 'all') { where.push("CAST(json_extract(transactions.payload, '$.cashierId') AS TEXT) = ?"); parameters.push(String(options.cashier)); }
  if (search) {
    if (/^\d{8}$/.test(search)) {
      const dateStr = `${search.slice(0, 4)}-${search.slice(4, 6)}-${search.slice(6, 8)}`;
      where.push('(transactions.business_date = ? OR transactions.id LIKE ?)');
      parameters.push(dateStr, `%${search}%`);
    } else {
      where.push('(transactions.id LIKE ? OR UPPER(transactions.id) LIKE ?)');
      parameters.push(`%${search}%`, `%${search}%`);
    }
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '', total = database.prepare(`SELECT COUNT(*) AS count FROM transactions ${clause}`).get(...parameters).count, totalPages = Math.max(1, Math.ceil(total / pageSize)), safePage = Math.min(page, totalPages), offset = (safePage - 1) * pageSize;
  const rows = database.prepare(`SELECT payload FROM transactions ${clause} ORDER BY business_date DESC, rowid DESC LIMIT ? OFFSET ?`).all(...parameters, pageSize, offset).map(row => JSON.parse(row.payload));
  const summary = database.prepare(`SELECT COUNT(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' THEN 1 END) AS count, COUNT(CASE WHEN json_extract(payload, '$.status') = 'void' THEN 1 END) AS voidCount, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' THEN json_extract(payload, '$.subtotal') ELSE 0 END),0) AS subtotal, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' THEN COALESCE(json_extract(payload, '$.discountAmount'),0) ELSE 0 END),0) AS discount, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' THEN json_extract(payload, '$.tax') ELSE 0 END),0) AS tax, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' THEN COALESCE(json_extract(payload, '$.taxableSubtotal'), CASE WHEN COALESCE(json_extract(payload, '$.taxRate'),0) > 0 THEN json_extract(payload, '$.tax') * 100.0 / json_extract(payload, '$.taxRate') ELSE 0 END) ELSE 0 END),0) AS taxable, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' THEN json_extract(payload, '$.subtotal') - COALESCE(json_extract(payload, '$.discountAmount'),0) ELSE 0 END),0) AS sales, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' THEN json_extract(payload, '$.total') ELSE 0 END),0) AS collected, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' AND json_extract(payload, '$.paymentCode')='cash' THEN json_extract(payload, '$.total') ELSE 0 END),0) AS cash, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' AND json_extract(payload, '$.paymentCode')='card' THEN json_extract(payload, '$.total') ELSE 0 END),0) AS card, COALESCE(SUM(CASE WHEN COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' AND json_extract(payload, '$.paymentCode')='qris' THEN json_extract(payload, '$.total') ELSE 0 END),0) AS qris FROM transactions ${clause}`).get(...parameters);
  summary.nonTaxable = Math.max(0, Number(summary.sales) - Number(summary.taxable));
  const itemWhere = [...where, "COALESCE(json_extract(transactions.payload, '$.status'), 'closed') != 'void'"], itemParameters = [...parameters];
  const itemClause = `WHERE ${itemWhere.join(' AND ')}`;
  const topItems = database.prepare(`SELECT json_extract(item.value, '$.name') AS name, SUM(CAST(json_extract(item.value, '$.qty') AS INTEGER)) AS qty, SUM(CAST(json_extract(item.value, '$.lineTotal') AS REAL)) AS total FROM (SELECT payload FROM transactions ${itemClause} ORDER BY business_date DESC, rowid DESC LIMIT 2000), json_each(payload, '$.lineItems') AS item GROUP BY name ORDER BY qty DESC LIMIT 5`).all(...itemParameters);
  const graphWhere = ["business_date LIKE ?", "COALESCE(json_extract(payload, '$.status'), 'closed') != 'void'"], graphParameters = [`${month}-%`];
  if (options.payment && options.payment !== 'all') { graphWhere.push("json_extract(payload, '$.paymentCode') = ?"); graphParameters.push(String(options.payment)); }
  if (options.cashier && options.cashier !== 'all') { graphWhere.push("CAST(json_extract(payload, '$.cashierId') AS TEXT) = ?"); graphParameters.push(String(options.cashier)); }
  if (search) {
    if (/^\d{8}$/.test(search)) {
      const dateStr = `${search.slice(0, 4)}-${search.slice(4, 6)}-${search.slice(6, 8)}`;
      graphWhere.push('(business_date = ? OR id LIKE ?)');
      graphParameters.push(dateStr, `%${search}%`);
    } else {
      graphWhere.push('(id LIKE ? OR UPPER(id) LIKE ?)');
      graphParameters.push(`%${search}%`, `%${search}%`);
    }
  }
  const daily = database.prepare(`SELECT business_date AS date, SUM(CAST(json_extract(payload, '$.subtotal') AS REAL) - COALESCE(CAST(json_extract(payload, '$.discountAmount') AS REAL),0)) AS total FROM transactions WHERE ${graphWhere.join(' AND ')} GROUP BY business_date ORDER BY business_date`).all(...graphParameters);
  return { rows, total, page: safePage, pageSize, totalPages, summary, topItems, daily, month };
}


function shiftQuery(options = {}) {
  const pageSize = [25, 50, 100].includes(Number(options.pageSize)) ? Number(options.pageSize) : 25, page = Math.max(1, Number(options.page) || 1), search = normalizedSearch(options.search), where = search ? "WHERE (id LIKE ? OR UPPER(id) LIKE ?)" : '', parameters = search ? [`%${search}%`, `%${search}%`] : [], total = database.prepare(`SELECT COUNT(*) AS count FROM shifts ${where}`).get(...parameters).count, totalPages = Math.max(1, Math.ceil(total / pageSize)), safePage = Math.min(page, totalPages), offset = (safePage - 1) * pageSize;
  const shiftSales = database.prepare(`SELECT COUNT(*) AS transactionCount, COALESCE(SUM(CAST(json_extract(payload, '$.subtotal') AS REAL) - COALESCE(CAST(json_extract(payload, '$.discountAmount') AS REAL),0)),0) AS sales FROM transactions WHERE COALESCE(json_extract(payload, '$.status'), 'closed') != 'void' AND json_extract(payload, '$.shiftId') = ?`);
  const rows = database.prepare(`SELECT payload FROM shifts ${where} ORDER BY opened_at DESC, rowid DESC LIMIT ? OFFSET ?`).all(...parameters, pageSize, offset).map(row => { const shift = JSON.parse(row.payload), recalculated = shiftSales.get(shift.id); return { ...shift, transactionCount: recalculated.transactionCount, sales: recalculated.sales }; });
  return { rows, total, page: safePage, pageSize, totalPages };
}



function validateDatabaseFile(filePath) {
  const candidate = new DatabaseSync(filePath, { readOnly: true });
  try {
    const integrity = candidate.prepare('PRAGMA quick_check').get();
    if (!integrity || Object.values(integrity)[0] !== 'ok') throw new Error('Pemeriksaan integritas SQLite gagal.');
    const tables = new Set(candidate.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name));
    if (!tables.has('app_state') || !tables.has('transactions')) throw new Error('Tabel database Anda POS tidak lengkap.');
    const state = candidate.prepare('SELECT payload FROM app_state WHERE id=1').get();
    if (!state) throw new Error('Data utama aplikasi tidak ditemukan.');
    JSON.parse(state.payload);
    return true;
  } finally { candidate.close(); }
}

function restoreNativeDatabase(sourcePath) {
  const destination = getDatabaseFile();
  const temporary = `${destination}.restore-${Date.now()}`;
  const safety = `${destination}.pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.copyFileSync(sourcePath, temporary);
  validateDatabaseFile(temporary);
  database.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  database.close();
  database = null;
  try {
    fs.renameSync(destination, safety);
    fs.renameSync(temporary, destination);
    initializeDatabase();
    return safety;
  } catch (error) {
    if (fs.existsSync(destination)) fs.unlinkSync(destination);
    if (fs.existsSync(safety)) fs.renameSync(safety, destination);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    initializeDatabase();
    throw error;
  }
}
const thermalPrintCss = (contentWidth, fontStyle = 'clear') => {
  let typography;
  switch (fontStyle) {
    case 'distinct':
      typography = { family: '"Segoe UI", "Trebuchet MS", "Lucida Sans Unicode", "DejaVu Sans", sans-serif', weight: 600, heading: 700, total: 800, size: 12.5 };
      break;
    case 'sansClean':
      typography = { family: 'Tahoma, Verdana, "Segoe UI", sans-serif', weight: 600, heading: 700, total: 800, size: 12 };
      break;
    case 'bold':
      typography = { family: 'Arial, sans-serif', weight: 650, heading: 700, total: 700, size: 11.5 };
      break;
    case 'medium':
      typography = { family: 'Arial, sans-serif', weight: 500, heading: 650, total: 650, size: 12 };
      break;
    case 'clear':
    default:
      typography = { family: 'Consolas, "Courier New", monospace', weight: 400, heading: 700, total: 700, size: 12.5 };
      break;
  }
  return `
  @page { margin: 0; }
  * { box-sizing: border-box; }
  html, body { width: 80mm; margin: 0; padding: 0; background: #fff; color: #000; }
  body { font: ${typography.weight} ${typography.size}px/1.38 ${typography.family}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .receipt { width: ${contentWidth}mm; margin: 0 auto; padding: 4mm 0 5mm; overflow: hidden; }
  .receipt-logo { display: block; width: 22mm; height: 16mm; object-fit: contain; margin: 0 auto 2mm; }
  .receipt h2 { max-width: 100%; margin: 0 0 2mm; text-align: center; font: ${typography.heading} 16px/1.2 ${typography.family}; overflow-wrap: anywhere; }
  .receipt p { margin: 2mm 0; overflow-wrap: anywhere; font-weight: ${typography.weight}; }
  .receipt-line { display: grid; grid-template-columns: minmax(0, 1fr) max-content; align-items: start; gap: 2mm; margin: 1.6mm 0; }
  .receipt-line > span:first-child, .receipt-line > strong:first-child { min-width: 0; overflow-wrap: anywhere; }
  .receipt-line > span:last-child, .receipt-line > strong:last-child { white-space: nowrap; text-align: right; }
  .receipt-line { font-weight: ${typography.weight}; }
  .receipt-total { border-top: 1px dashed #000; margin-top: 2.5mm; padding-top: 2.5mm; font-weight: ${typography.total}; }
`;
};

async function printThermalReceipt(options = {}) {
  const contentWidth = [64, 68, 72].includes(Number(options.contentWidth)) ? Number(options.contentWidth) : 64;
  const fontStyle = ['clear', 'medium', 'bold', 'distinct', 'sansClean'].includes(options.fontStyle) ? options.fontStyle : 'clear';

  if (typeof options.html !== 'string' || !options.html.includes('receipt') || options.html.length > 6 * 1024 * 1024) {
    return { success: false, failureReason: 'Data struk tidak valid.' };
  }
  const direct = Boolean(options.silent && options.deviceName);
  const directMode = options.directMode === 'graphics' ? 'graphics' : 'escpos';
  if (direct && process.platform === 'win32' && directMode === 'escpos') {
    return await printWindowsEscPos(options.deviceName, options.nativeReceipt, fontStyle, options.nativeColumns, options.autoCut !== false, options.cutFeedLines);
  }
  const printWindow = new BrowserWindow({
    show: direct, x: direct ? -10000 : undefined, y: direct ? -10000 : undefined,
    width: 420, height: 800, backgroundColor: '#ffffff', skipTaskbar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
  });
  try {
    const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${thermalPrintCss(contentWidth, fontStyle)}</style></head><body>${options.html}</body></html>`;
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(documentHtml)}`);
    await printWindow.webContents.executeJavaScript(`(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve})));document.body.offsetHeight;return true})()`);
    if (direct) {
      const receiptBounds = await printWindow.webContents.executeJavaScript(`(()=>{const r=document.querySelector('.receipt').getBoundingClientRect();return{x:Math.max(0,Math.floor(r.x)),y:Math.max(0,Math.floor(r.y)),width:Math.ceil(r.width),height:Math.ceil(r.height)}})()`);
      printWindow.setContentSize(420, Math.min(12000, Math.max(300, receiptBounds.y + receiptBounds.height + 4)));
      printWindow.showInactive();
      await new Promise(resolve => setTimeout(resolve, 800));
      const image = await printWindow.webContents.capturePage(receiptBounds);
      if (process.platform === 'win32') return await printWindowsRaster(options.deviceName, image, contentWidth);
      const rasterHtml = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:0}html,body{width:80mm;margin:0;padding:0;background:#fff}img{display:block;width:${contentWidth}mm;height:auto;margin:0 auto;filter:contrast(1.35)}</style></head><body><img src="${image.toDataURL()}" alt="Receipt"></body></html>`;
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(rasterHtml)}`);
      await printWindow.webContents.executeJavaScript('(async()=>{await document.images[0].decode();document.body.offsetHeight;return true})()');
      await new Promise(resolve => setTimeout(resolve, 1200));
    } else await new Promise(resolve => setTimeout(resolve, 500));
    return await new Promise(resolve => {
      const printOptions = {
        silent: direct, deviceName: options.deviceName || undefined,
        printBackground: true, color: false, margins: { marginType: 'none' }, landscape: false
      };
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        setTimeout(() => resolve({ success, failureReason }), direct ? 4000 : 1000);
      });
    });
  } catch (error) {
    return { success: false, failureReason: error.message };
  } finally {
    if (!printWindow.isDestroyed()) printWindow.destroy();
  }
}

function createWindow() {
  window = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700,
    backgroundColor: '#f3f1e8',
    title: 'Anda POS',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  });
  window.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
}

ipcMain.handle('data:load', () => readDatabaseState());
ipcMain.handle('data:save', (_event, data) => { writeDatabaseState(data); return true; });
ipcMain.handle('transactions:query', (_event, options = {}) => transactionQuery(options));
ipcMain.handle('transactions:update', (_event, transaction) => {
  if (!transaction?.id) throw new Error('ID transaksi tidak valid.');
  const result = database.prepare('UPDATE transactions SET business_date=?, payload=? WHERE id=?').run(transaction.date || transaction.timestamp?.slice(0, 10) || '', JSON.stringify(transaction), String(transaction.id));
  if (!result.changes) throw new Error('Transaksi tidak ditemukan.');
  return true;
});
ipcMain.handle('shifts:query', (_event, options = {}) => shiftQuery(options));
ipcMain.handle('receipt:print', (_event, options = {}) => printThermalReceipt(options));
ipcMain.handle('printer:list', () => window.webContents.getPrintersAsync());
ipcMain.handle('database:backup', async () => {
  const result = await dialog.showSaveDialog(window, {
    title: 'Simpan backup SQLite',
    defaultPath: `anda-pos-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  if (result.canceled || !result.filePath) return { success: false, canceled: true };
  try {
    await backupSqlite(database, result.filePath, { rate: 100 });
    validateDatabaseFile(result.filePath);
    return { success: true, filePath: result.filePath };
  } catch (error) { return { success: false, error: `Backup SQLite gagal: ${error.message}` }; }
});
ipcMain.handle('database:restore', async () => {
  const result = await dialog.showOpenDialog(window, {
    title: 'Pilih backup database', properties: ['openFile'],
    filters: [{ name: 'Anda POS Database', extensions: ['db', 'andapos', 'json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return { success: false, canceled: true };
  const filePath = result.filePaths[0];
  if (fs.statSync(filePath).size > 2 * 1024 * 1024 * 1024) return { success: false, error: 'File backup melebihi 2 GB.' };
  try {
    if (path.extname(filePath).toLowerCase() === '.db') {
      const safety = restoreNativeDatabase(filePath);
      return { success: true, native: true, safety };
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const data = parsed.format === 'anda-pos-backup' ? parsed.data : parsed;
    if (!data || !Array.isArray(data.products) || !Array.isArray(data.users) || !Array.isArray(data.tables)) {
      return { success: false, error: 'Format backup tidak valid.' };
    }
    writeDatabaseState(data, true);
    return { success: true };
  } catch (error) { return { success: false, error: `Backup tidak dapat dipulihkan: ${error.message}` }; }
});
ipcMain.handle('database:reset-transactions', (_event, authorization = {}) => resetTransactionData(authorization));
ipcMain.handle('menu:backup', async (_event, menuData) => {
  if (!menuData || !Array.isArray(menuData.products) || !Array.isArray(menuData.categories)) return { success: false, error: 'Data menu tidak valid.' };
  const result = await dialog.showSaveDialog(window, {
    title: 'Simpan backup menu',
    defaultPath: `anda-pos-menu-${new Date().toISOString().slice(0, 10)}.andamenu`,
    filters: [{ name: 'Anda POS Menu', extensions: ['andamenu'] }]
  });
  if (result.canceled || !result.filePath) return { success: false, canceled: true };
  try {
    const payload = { format: 'anda-pos-menu', version: 1, exportedAt: new Date().toISOString(), categories: menuData.categories, products: menuData.products };
    fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), { flag: 'w' });
    return { success: true, filePath: result.filePath };
  } catch (error) { return { success: false, error: `Backup menu gagal: ${error.message}` }; }
});
ipcMain.handle('menu:restore', async () => {
  const result = await dialog.showOpenDialog(window, {
    title: 'Pilih backup menu', properties: ['openFile'],
    filters: [{ name: 'Anda POS Menu', extensions: ['andamenu', 'json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return { success: false, canceled: true };
  const filePath = result.filePaths[0];
  try {
    if (fs.statSync(filePath).size > 20 * 1024 * 1024) return { success: false, error: 'File menu melebihi 20 MB.' };
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const validProducts = Array.isArray(payload.products) && payload.products.length > 0 && payload.products.every(item => item && typeof item.name === 'string' && typeof item.category === 'string' && Number.isFinite(Number(item.price)));
    if (payload.format !== 'anda-pos-menu' || !Array.isArray(payload.categories) || !payload.categories.length || !validProducts) return { success: false, error: 'Format backup menu tidak valid.' };
    return { success: true, data: { categories: payload.categories, products: payload.products } };
  } catch (error) { return { success: false, error: `Backup menu tidak dapat dibaca: ${error.message}` }; }
});
ipcMain.handle('report:export-excel', async (_event, data = {}) => {
  const english = data.language === 'en';
  const cleanName = (data.restaurantName || 'anda-pos').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dateStr = new Date().toISOString().slice(0, 10);
  const result = await dialog.showSaveDialog(window, {
    title: english ? 'Export Excel Report' : 'Ekspor Laporan Excel',
    defaultPath: `${english ? 'report' : 'laporan'}-${cleanName}-${dateStr}.xlsx`,
    filters: [{ name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] }]
  });
  if (result.canceled || !result.filePath) return { success: false, canceled: true };
  try {
    let transactions = data.transactions;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      const where = [], parameters = [];
      let effectiveFrom = data.period?.from || '';
      let effectiveTo = data.period?.to || '';
      if (!effectiveFrom && effectiveTo) {
        effectiveFrom = `${effectiveTo.slice(0, 7)}-01`;
      } else if (effectiveFrom && !effectiveTo) {
        effectiveTo = effectiveFrom;
      }
      if (effectiveFrom) { where.push('business_date >= ?'); parameters.push(effectiveFrom); }
      if (effectiveTo) { where.push('business_date <= ?'); parameters.push(effectiveTo); }
      if (data.filters?.payment && data.filters.payment !== 'all') {
        where.push("json_extract(payload, '$.paymentCode') = ?");
        parameters.push(String(data.filters.payment));
      }
      if (data.filters?.cashierId && data.filters.cashierId !== 'all') {
        where.push("CAST(json_extract(payload, '$.cashierId') AS TEXT) = ?");
        parameters.push(String(data.filters.cashierId));
      }
      if (data.search) {
        const s = normalizedSearch(data.search);
        if (/^\d{8}$/.test(s)) {
          const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
          where.push('(business_date = ? OR id LIKE ?)');
          parameters.push(dateStr, `%${s}%`);
        } else {
          where.push('(id LIKE ? OR UPPER(id) LIKE ?)');
          parameters.push(`%${s}%`, `%${s}%`);
        }
      }
      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      transactions = database.prepare(`SELECT payload FROM transactions ${clause} ORDER BY business_date ASC, rowid ASC`).all(...parameters).map(r => JSON.parse(r.payload));
    }
    data.transactions = transactions;
    const { createExcelReportWorkbook } = require('./excel-export.cjs');
    const workbook = await createExcelReportWorkbook(data);
    await workbook.xlsx.writeFile(result.filePath);
    return { success: true, filePath: result.filePath, count: transactions.length };
  } catch (error) {
    return { success: false, error: `Ekspor Excel gagal: ${error.message}` };
  }
});


app.whenReady().then(() => { initializeDatabase(); createWindow(); app.on('activate', () => BrowserWindow.getAllWindows().length || createWindow()); });
app.on('before-quit', () => { if (database) database.close(); });
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());

