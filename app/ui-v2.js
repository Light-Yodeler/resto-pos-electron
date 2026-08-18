/* Unified bilingual UI copy and the reorganized settings workspace. */
const UI_COPY = {
  id: {
    settingsTitle: 'Pengaturan aplikasi', settingsIntro: 'Kelola identitas restoran, operasional, pajak, printer, dan keamanan data dari satu tempat.',
    identity: 'Identitas restoran', identityHint: 'Ditampilkan pada aplikasi dan setiap struk.', restaurantName: 'Nama restoran', currentLogo: 'Logo saat ini', uploadLogo: 'Upload logo', removeLogo: 'Hapus logo', logoHint: 'PNG, JPG, atau WebP · maksimal 2 MB',
    operations: 'Operasional', operationsHint: 'Atur modul yang digunakan pada outlet ini.', kitchenOrders: 'Pesanan dapur', kitchenHint: 'Kirim pesanan kasir ke layar atau tiket dapur.', enableKitchen: 'Aktifkan fitur dapur',
    printer: 'Printer struk 80 mm', printerHint: 'Pengaturan khusus thermal printer Windows dan macOS.', directEngine: 'Mode cetak langsung', nativeEscpos: 'Teks native ESC/POS · Paling tajam (Rekomendasi)', windowsGraphics: 'Grafis Windows · Kompatibilitas', nativeWidth: 'Lebar teks native', safe42: '42 karakter · Aman', wide48: '48 karakter · Printer 576-dot', graphicsWidth: 'Area konten mode grafis', safe64: '64 mm · Aman', medium68: '68 mm · Sedang', full72: '72 mm · Lebar penuh', receiptFont: 'Gaya font struk', clearFont: 'Font Standar · Monospace (Tajam & Tebal)', mediumFont: 'Font Standar · Spasi Renggang (Jarak Angka)', boldFont: 'Font Tebal · Emphasized', distinctFont: 'Font Ramping · Angka Terbuka (Beda Jelas 6, 8, 9)', sansCleanFont: 'Font Ramping · Spasi Ekstra', defaultPrinter: 'Printer default', chooseDialog: 'Pilih melalui dialog setiap mencetak', cutDistance: 'Jarak sebelum potong', shortFeed: '6 baris · Pendek', safeFeed: '8 baris · Aman', extraFeed: '10 baris · Ekstra aman', detectPrinter: 'Deteksi printer', testReceipt: 'Cetak struk uji', silentPrint: 'Cetak langsung tanpa dialog', autoCut: 'Potong kertas otomatis', printerNote: 'Gunakan ESC/POS untuk hasil teks paling tajam. Pilih Grafis Windows hanya bila printer tidak mendukung ESC/POS.',
    taxDiscount: 'Pajak dan diskon', taxDiscountHint: 'Tarif ini dipakai untuk transaksi baru; transaksi lama tidak berubah.', taxRate: 'Tarif pajak (%)', discountChoices: 'Pilihan diskon', add: '+ Tambah', edit: 'Edit', delete: 'Hapus', noDiscounts: 'Belum ada pilihan diskon.',
    dataSecurity: 'Data dan pemindahan perangkat', dataHint: 'Backup database lengkap atau hanya katalog menu.', fullDatabase: 'Database lengkap', fullDatabaseHint: 'Menu, transaksi, pengguna, meja, pengaturan, dan logo.', menuCatalog: 'Katalog menu', menuCatalogHint: 'Kategori, harga, pajak, dan stok menu saja.', createBackup: 'Buat backup .db', restoreBackup: 'Restore database', backupMenu: 'Backup menu', restoreMenu: 'Restore menu', restoreWarning: 'Restore mengganti data aktif. Buat backup terbaru terlebih dahulu.', resetTransactions: 'Reset seluruh transaksi', resetTransactionsHint: 'Hapus transaksi, riwayat shift, dan pesanan terbuka. Menu, stok, pengguna, meja, serta pengaturan tetap tersimpan.', resetAction: 'Reset transaksi', saveSettings: 'Simpan pengaturan',
    grossSales: 'Penjualan kotor', grossFormula: 'Sebelum diskon, tanpa pajak', discount: 'Diskon', netSales: 'Penjualan bersih', netFormula: 'Kotor − diskon, tanpa pajak', taxableSales: 'Dasar kena pajak', taxableFormula: 'Bagian penjualan bersih yang kena pajak', nonTaxableSales: 'Penjualan tanpa pajak', nonTaxableFormula: 'Bagian penjualan bersih bebas pajak', tax: 'Pajak terkumpul', totalCollected: 'Total pembayaran', collectedFormula: 'Penjualan bersih + pajak', paidTransactions: 'Transaksi lunas', voidTransactions: 'Transaksi void', paymentReceipts: 'Penerimaan berdasarkan pembayaran', bestSellers: 'Menu terlaris', transactionDetails: 'Rincian transaksi', dailyNetSales: 'PENJUALAN BERSIH HARIAN', loading: 'Memuat…', accountingFlow: 'ALUR NILAI PENJUALAN', taxBreakdown: 'RINCIAN DASAR PAJAK', activeReportPeriod: 'Rentang Laporan Transaksi',
    searchTransaction: 'Cari ID transaksi', idPlaceholder: '4 angka terakhir / 8 angka tanggal', from: 'Dari', to: 'Sampai', payment: 'Pembayaran', cashier: 'Kasir', all: 'Semua', exportCsv: 'Ekspor Excel', exportExcel: 'Ekspor Excel', status: 'Status', dateInvoice: 'Tanggal / invoice', tableWaiter: 'Meja / waiter', cashierShift: 'Kasir / shift', itemActions: 'Item / tindakan', noTransactions: 'Tidak ada transaksi untuk filter ini.', loadingSqlite: 'Memuat transaksi dari SQLite…', reprint: 'Cetak ulang', noReason: 'Tanpa alasan', authorizedBy: 'Diotorisasi oleh', cashReceived: 'Uang', change: 'Kembali', items: 'item', portions: 'porsi', noItems: 'Belum ada data item.',
    rows: 'Baris', data: 'data', page: 'Halaman', of: 'dari', first: 'Pertama', previous: 'Sebelumnya', next: 'Berikutnya', last: 'Terakhir', month: 'Bulan'
  },
  en: {
    settingsTitle: 'Application settings', settingsIntro: 'Manage restaurant identity, operations, tax, printing, and data security in one place.',
    identity: 'Restaurant identity', identityHint: 'Shown throughout the application and on every receipt.', restaurantName: 'Restaurant name', currentLogo: 'Current logo', uploadLogo: 'Upload logo', removeLogo: 'Remove logo', logoHint: 'PNG, JPG, or WebP · maximum 2 MB',
    operations: 'Operations', operationsHint: 'Choose which modules are used at this outlet.', kitchenOrders: 'Kitchen orders', kitchenHint: 'Send cashier orders to the kitchen display or ticket queue.', enableKitchen: 'Enable kitchen features',
    printer: '80 mm receipt printer', printerHint: 'Thermal printer settings for Windows and macOS.', directEngine: 'Direct-print mode', nativeEscpos: 'Native ESC/POS text · Sharpest (Recommended)', windowsGraphics: 'Windows graphics · Compatibility', nativeWidth: 'Native text width', safe42: '42 characters · Safe', wide48: '48 characters · 576-dot printer', graphicsWidth: 'Graphics content area', safe64: '64 mm · Safe', medium68: '68 mm · Medium', full72: '72 mm · Full width', receiptFont: 'Receipt font style', clearFont: 'Standard Font · Monospace (Sharp & Bold)', mediumFont: 'Standard Font · Wide Spacing (Clean Digits)', boldFont: 'Bold Font · Emphasized', distinctFont: 'Slim Font · Open Digits (Distinct 6, 8, 9)', sansCleanFont: 'Slim Font · Extra Spacing', defaultPrinter: 'Default printer', chooseDialog: 'Choose from the print dialog each time', cutDistance: 'Feed before cutting', shortFeed: '6 lines · Short', safeFeed: '8 lines · Safe', extraFeed: '10 lines · Extra safe', detectPrinter: 'Detect printers', testReceipt: 'Print test receipt', silentPrint: 'Print directly without dialog', autoCut: 'Cut paper automatically', printerNote: 'Use ESC/POS for the sharpest text. Select Windows graphics only when the printer does not support ESC/POS.',

    taxDiscount: 'Tax and discounts', taxDiscountHint: 'This rate applies to new transactions; previous transactions remain unchanged.', taxRate: 'Tax rate (%)', discountChoices: 'Discount choices', add: '+ Add', edit: 'Edit', delete: 'Delete', noDiscounts: 'No discount choices yet.',
    dataSecurity: 'Data and device transfer', dataHint: 'Back up the full database or only the menu catalogue.', fullDatabase: 'Full database', fullDatabaseHint: 'Menus, transactions, users, tables, settings, and logo.', menuCatalog: 'Menu catalogue', menuCatalogHint: 'Menu categories, prices, tax, and stock only.', createBackup: 'Create .db backup', restoreBackup: 'Restore database', backupMenu: 'Back up menu', restoreMenu: 'Restore menu', restoreWarning: 'Restore replaces active data. Create a current backup first.', resetTransactions: 'Reset all transactions', resetTransactionsHint: 'Delete transactions, shift history, and open orders. Menus, stock, users, tables, and settings remain saved.', resetAction: 'Reset transactions', saveSettings: 'Save settings',
    grossSales: 'Gross sales', grossFormula: 'Before discounts, excluding tax', discount: 'Discounts', netSales: 'Net sales', netFormula: 'Gross − discounts, excluding tax', taxableSales: 'Taxable sales base', taxableFormula: 'Taxable portion of net sales', nonTaxableSales: 'Tax-exempt sales', nonTaxableFormula: 'Tax-exempt portion of net sales', tax: 'Tax collected', totalCollected: 'Total collected', collectedFormula: 'Net sales + tax', paidTransactions: 'Paid transactions', voidTransactions: 'Voided transactions', paymentReceipts: 'Collections by payment method', bestSellers: 'Best-selling items', transactionDetails: 'Transaction details', dailyNetSales: 'DAILY NET SALES', loading: 'Loading…', accountingFlow: 'SALES VALUE FLOW', taxBreakdown: 'TAX BASE BREAKDOWN', activeReportPeriod: 'Active Report Period',
    searchTransaction: 'Search transaction ID', idPlaceholder: 'Last 4 digits / 8-digit date', from: 'From', to: 'To', payment: 'Payment', cashier: 'Cashier', all: 'All', exportCsv: 'Export Excel', exportExcel: 'Export Excel', status: 'Status', dateInvoice: 'Date / invoice', tableWaiter: 'Table / waiter', cashierShift: 'Cashier / shift', itemActions: 'Items / actions', noTransactions: 'No transactions match these filters.', loadingSqlite: 'Loading transactions from SQLite…', reprint: 'Reprint', noReason: 'No reason provided', authorizedBy: 'Authorized by', cashReceived: 'Tendered', change: 'Change', items: 'items', portions: 'portions', noItems: 'No item data yet.',
    rows: 'Rows', data: 'records', page: 'Page', of: 'of', first: 'First', previous: 'Previous', next: 'Next', last: 'Last', month: 'Month'
  }
};

function ui(key) { return UI_COPY[state.language]?.[key] || UI_COPY.id[key] || key; }

Object.assign(I18N.id, { tax: 'Pajak', average: 'Rata-rata transaksi' });
Object.assign(I18N.en, { tax: 'Tax', average: 'Average transaction' });

mountReceiptFontSetting = function() {};

renderSettings = function() {
  commercialDefaults();
  const options = [...(state.settings.printerName && !availablePrinters.some(printer => printer.name === state.settings.printerName) ? [{ name: state.settings.printerName, displayName: state.settings.printerName }] : []), ...availablePrinters];
  const discountRows = state.settings.discountOptions.map(option => `<div class="discount-option-row"><span><strong>${esc(option.label)}</strong><small>${option.type === 'percent' ? `${option.value}%` : money(option.value)}</small></span><span><button type="button" class="mini edit-discount-option" data-discount-edit="${esc(option.id)}">${ui('edit')}</button><button type="button" class="mini danger-text delete-discount-option" data-discount-delete="${esc(option.id)}">${ui('delete')}</button></span></div>`).join('') || `<small>${ui('noDiscounts')}</small>`;
  return `<div class="settings-heading"><div><span class="settings-kicker">ANDA POS · CONTROL ROOM</span><h2>${ui('settingsTitle')}</h2><p>${ui('settingsIntro')}</p></div></div><form id="settingsForm" class="settings-workspace">
    <section class="setting-card setting-card--identity"><header><span class="setting-card-icon">A</span><div><h3>${ui('identity')}</h3><p>${ui('identityHint')}</p></div></header><div class="setting-card-body"><label class="field"><span>${ui('restaurantName')}</span><input name="restaurantName" value="${esc(state.settings.restaurantName)}" required maxlength="80"></label><div class="logo-editor"><div class="logo-preview">${state.settings.brandLogo ? `<img src="${state.settings.brandLogo}" alt="${ui('currentLogo')}">` : `<span>${esc((state.settings.restaurantName || 'R')[0].toUpperCase())}</span>`}</div><div><label class="secondary file-button" for="logoInput">${ui('uploadLogo')}</label><input class="hidden" id="logoInput" type="file" accept="image/png,image/jpeg,image/webp">${state.settings.brandLogo ? `<button type="button" class="mini danger-text" id="removeLogo">${ui('removeLogo')}</button>` : ''}<small>${ui('logoHint')}</small></div></div></div></section>
    <section class="setting-card setting-card--operations"><header><span class="setting-card-icon">♨</span><div><h3>${ui('operations')}</h3><p>${ui('operationsHint')}</p></div></header><div class="setting-card-body"><div class="setting-feature"><div><strong>${ui('kitchenOrders')}</strong><small>${ui('kitchenHint')}</small></div><label class="toggle-control"><input name="kitchenEnabled" type="checkbox" ${state.settings.kitchenEnabled ? 'checked' : ''}><span></span><em>${ui('enableKitchen')}</em></label></div></div></section>
    <section class="setting-card setting-card--printer"><header><span class="setting-card-icon">▤</span><div><h3>${ui('printer')}</h3><p>${ui('printerHint')}</p></div></header><div class="setting-card-body printer-fields"><label class="field"><span>${ui('directEngine')}</span><select name="directPrintMode"><option value="escpos" ${state.settings.directPrintMode !== 'graphics' ? 'selected' : ''}>${ui('nativeEscpos')}</option><option value="graphics" ${state.settings.directPrintMode === 'graphics' ? 'selected' : ''}>${ui('windowsGraphics')}</option></select></label><label class="field"><span>${ui('nativeWidth')}</span><select name="directPrintColumns"><option value="42" ${Number(state.settings.directPrintColumns) !== 48 ? 'selected' : ''}>${ui('safe42')}</option><option value="48" ${Number(state.settings.directPrintColumns) === 48 ? 'selected' : ''}>${ui('wide48')}</option></select></label><label class="field"><span>${ui('graphicsWidth')}</span><select name="receiptContentWidth"><option value="64" ${Number(state.settings.receiptContentWidth) === 64 ? 'selected' : ''}>${ui('safe64')}</option><option value="68" ${Number(state.settings.receiptContentWidth) === 68 ? 'selected' : ''}>${ui('medium68')}</option><option value="72" ${Number(state.settings.receiptContentWidth) === 72 ? 'selected' : ''}>${ui('full72')}</option></select></label><label class="field"><span>${ui('receiptFont')}</span><select name="receiptFontStyle"><option value="clear" ${state.settings.receiptFontStyle === 'clear' ? 'selected' : ''}>${ui('clearFont')}</option><option value="medium" ${state.settings.receiptFontStyle === 'medium' ? 'selected' : ''}>${ui('mediumFont')}</option><option value="bold" ${state.settings.receiptFontStyle === 'bold' ? 'selected' : ''}>${ui('boldFont')}</option><option value="distinct" ${state.settings.receiptFontStyle === 'distinct' ? 'selected' : ''}>${ui('distinctFont')}</option><option value="sansClean" ${state.settings.receiptFontStyle === 'sansClean' ? 'selected' : ''}>${ui('sansCleanFont')}</option></select></label><label class="field field-wide"><span>${ui('defaultPrinter')}</span><select name="printerName"><option value="">${ui('chooseDialog')}</option>${options.map(printer => `<option value="${esc(printer.name)}" ${state.settings.printerName === printer.name ? 'selected' : ''}>${esc(printer.displayName || printer.name)}</option>`).join('')}</select></label><label class="field"><span>${ui('cutDistance')}</span><select name="cutFeedLines"><option value="6" ${Number(state.settings.cutFeedLines) === 6 ? 'selected' : ''}>${ui('shortFeed')}</option><option value="8" ${Number(state.settings.cutFeedLines || 8) === 8 ? 'selected' : ''}>${ui('safeFeed')}</option><option value="10" ${Number(state.settings.cutFeedLines) === 10 ? 'selected' : ''}>${ui('extraFeed')}</option></select></label><div class="printer-actions field-wide"><button type="button" class="secondary" id="detectPrinters">${ui('detectPrinter')}</button><button type="button" class="secondary" id="testReceipt">${ui('testReceipt')}</button></div><div class="switch-stack field-wide"><label class="switch-row"><input name="silentPrint" type="checkbox" ${state.settings.silentPrint ? 'checked' : ''} ${state.settings.printerName ? '' : 'disabled'}><span>${ui('silentPrint')}</span></label><label class="switch-row"><input name="autoCut" type="checkbox" ${state.settings.autoCut !== false ? 'checked' : ''}><span>${ui('autoCut')}</span></label></div><p class="setting-note field-wide">${ui('printerNote')}</p></div></section>

    <section class="setting-card setting-card--commercial" id="commercialSettings"><header><span class="setting-card-icon">％</span><div><h3>${ui('taxDiscount')}</h3><p>${ui('taxDiscountHint')}</p></div></header><div class="setting-card-body"><label class="field"><span>${ui('taxRate')}</span><input name="taxRate" type="number" min="0" max="100" step="0.01" value="${currentTaxRate()}" required></label><div class="discount-setting-head"><strong>${ui('discountChoices')}</strong><button type="button" class="mini" id="addDiscountOption">${ui('add')}</button></div><div class="discount-setting-list">${discountRows}</div></div></section>
    <section class="setting-card setting-card--data data-panel"><header><span class="setting-card-icon">↕</span><div><h3>${ui('dataSecurity')}</h3><p>${ui('dataHint')}</p></div></header><div class="setting-card-body data-lanes"><article><div><strong>${ui('fullDatabase')}</strong><small>${ui('fullDatabaseHint')}</small></div><div><button type="button" class="secondary" id="backupDatabase">${ui('createBackup')}</button><button type="button" class="danger" id="restoreDatabase">${ui('restoreBackup')}</button></div></article><article><div><strong>${ui('menuCatalog')}</strong><small>${ui('menuCatalogHint')}</small></div><div><button type="button" class="secondary" id="backupMenu">${ui('backupMenu')}</button><button type="button" class="secondary" id="restoreMenu">${ui('restoreMenu')}</button></div></article>${state.user.role === 'owner' ? `<article class="reset-data-lane"><div><strong>${ui('resetTransactions')}</strong><small>${ui('resetTransactionsHint')}</small></div><div><button type="button" class="danger" id="resetTransactions">${ui('resetAction')}</button></div></article>` : ''}<p class="setting-note">${ui('restoreWarning')}</p></div></section>
    <div class="settings-savebar"><span>${ui('settingsTitle')}</span><button class="primary">${ui('saveSettings')}</button></div></form>`;
};

function generateExcelXmlReport() {
  const rows = filteredTransactions(), valid = activeSalesTransactions(rows), english = state.language === 'en', restaurantName = state.settings.restaurantName || 'Anda POS';
  const grossSales = valid.reduce((s, x) => s + (Number(x.subtotal) || 0), 0);
  const totalDiscounts = valid.reduce((s, x) => s + (Number(x.discountAmount) || 0), 0);
  const netSales = grossSales - totalDiscounts;
  const taxableSales = valid.reduce((s, x) => s + (Number(x.taxableSubtotal) || 0), 0);
  const taxExemptSales = Math.max(0, netSales - taxableSales);
  const totalTax = valid.reduce((s, x) => s + (Number(x.tax) || 0), 0);
  const totalCollected = valid.reduce((s, x) => s + (Number(x.total) || 0), 0);
  const paidCount = valid.length, voidCount = rows.length - valid.length;
  const paymentTotals = {
    cash: valid.filter(x => paymentMatches(x, 'cash')).reduce((s, x) => s + (Number(x.total) || 0), 0),
    card: valid.filter(x => paymentMatches(x, 'card')).reduce((s, x) => s + (Number(x.total) || 0), 0),
    qris: valid.filter(x => paymentMatches(x, 'qris')).reduce((s, x) => s + (Number(x.total) || 0), 0)
  };
  const itemMap = new Map();
  valid.forEach(trx => {
    (trx.lineItems || []).forEach(item => {
      const key = item.name || 'Item';
      if (!itemMap.has(key)) itemMap.set(key, { name: item.name, nameEn: item.nameEn || item.name, category: item.category || 'General', qty: 0, total: 0 });
      const agg = itemMap.get(key);
      agg.qty += Number(item.qty) || 0;
      agg.total += Number(item.lineTotal) || (Number(item.price || 0) * Number(item.qty || 0));
    });
  });
  const topItems = [...itemMap.values()].sort((a, b) => b.qty - a.qty);
  const xmlEsc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const cStr = (v, style = 'Cell') => `<Cell ss:StyleID="${style}"><Data ss:Type="String">${xmlEsc(v)}</Data></Cell>`;
  const cNum = (v, style = 'Number') => `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${Number(v) || 0}</Data></Cell>`;
  const cCur = (v, style = 'Currency') => `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${Number(v) || 0}</Data></Cell>`;
  const cHead = v => `<Cell ss:StyleID="Header"><Data ss:Type="String">${xmlEsc(v)}</Data></Cell>`;

  let summaryRows = '';
  summaryRows += `<Row><Cell ss:StyleID="Title"><Data ss:Type="String">${xmlEsc(restaurantName.toUpperCase())} - ${english ? 'FINANCIAL &amp; AUDIT REPORT' : 'LAPORAN KEUANGAN &amp; OPERASIONAL'}</Data></Cell></Row>`;
  summaryRows += `<Row><Cell ss:StyleID="Subtitle"><Data ss:Type="String">${english ? 'Period' : 'Periode'}: ${reportFrom || 'Awal'} s/d ${reportTo || 'Sekarang'} | ${english ? 'Export Date' : 'Dicetak pada'}: ${businessDate()} ${new Date().toLocaleTimeString('id-ID')} | ${english ? 'Payment' : 'Pembayaran'}: ${reportPayment} | ${english ? 'Cashier' : 'Kasir'}: ${reportCashier === 'all' ? (english ? 'All' : 'Semua') : (state.users.find(u => String(u.id) === reportCashier)?.name || reportCashier)}</Data></Cell></Row>`;
  summaryRows += `<Row></Row>`;
  summaryRows += `<Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">1. ${english ? 'ACCOUNTING &amp; TAX FLOW' : 'ALUR NILAI PENJUALAN &amp; PAJAK'}</Data></Cell><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${english ? 'AMOUNT' : 'JUMLAH'}</Data></Cell><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${english ? 'DESCRIPTION' : 'KETERANGAN'}</Data></Cell></Row>`;
  summaryRows += `<Row>${cStr(english ? 'Gross Sales' : 'Penjualan Kotor')}${cCur(grossSales)}${cStr(english ? 'Before discounts, excluding tax' : 'Sebelum diskon, tanpa pajak')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Total Discounts' : 'Total Diskon')}${cCur(totalDiscounts)}${cStr(english ? 'Order & item level discounts' : 'Diskon nota dan diskon per item')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Net Sales' : 'Penjualan Bersih', 'CurrencyBold')}${cCur(netSales, 'CurrencyBold')}${cStr(english ? 'Gross sales minus discounts' : 'Penjualan kotor dikurangi total diskon', 'CurrencyBold')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Taxable Sales Base (DPP)' : 'Dasar Pengenaan Pajak (DPP)')}${cCur(taxableSales)}${cStr(english ? 'Taxable portion of net sales' : 'Bagian penjualan bersih yang dikenakan pajak')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Tax-Exempt Sales' : 'Penjualan Bebas Pajak')}${cCur(taxExemptSales)}${cStr(english ? 'Non-taxable portion of net sales' : 'Bagian penjualan bersih bebas pajak')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Tax Collected' : 'Pajak Terkumpul')}${cCur(totalTax)}${cStr(english ? 'PB1 / Restaurant Tax collected' : 'Pajak restoran yang dipungut')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Total Collected' : 'Total Pembayaran', 'CurrencyBold')}${cCur(totalCollected, 'CurrencyBold')}${cStr(english ? 'Net sales plus tax' : 'Penjualan bersih ditambah pajak', 'CurrencyBold')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Paid Transactions' : 'Transaksi Lunas')}${cNum(paidCount)}${cStr(english ? 'Successful closed bills' : 'Jumlah transaksi selesai')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Void Transactions' : 'Transaksi Void')}${cNum(voidCount)}${cStr(english ? 'Cancelled / voided transactions' : 'Jumlah transaksi dibatalkan')}</Row>`;
  summaryRows += `<Row></Row>`;
  summaryRows += `<Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">2. ${english ? 'PAYMENT METHODS' : 'PENERIMAAN METODE PEMBAYARAN'}</Data></Cell><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${english ? 'TOTAL RECEIVED' : 'TOTAL DITERIMA'}</Data></Cell><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${english ? 'SHARE' : 'PORSI'}</Data></Cell></Row>`;
  summaryRows += `<Row>${cStr(english ? 'Cash' : 'Tunai')}${cCur(paymentTotals.cash)}${cStr(totalCollected ? (paymentTotals.cash / totalCollected * 100).toFixed(1) + '%' : '0%')}</Row>`;
  summaryRows += `<Row>${cStr(english ? 'Card (Debit / Credit)' : 'Kartu (Debit / Kredit)')}${cCur(paymentTotals.card)}${cStr(totalCollected ? (paymentTotals.card / totalCollected * 100).toFixed(1) + '%' : '0%')}</Row>`;
  summaryRows += `<Row>${cStr('QRIS')}${cCur(paymentTotals.qris)}${cStr(totalCollected ? (paymentTotals.qris / totalCollected * 100).toFixed(1) + '%' : '0%')}</Row>`;
  summaryRows += `<Row></Row>`;
  summaryRows += `<Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">3. ${english ? 'TOP 10 BEST SELLERS' : '10 MENU TERLARIS'}</Data></Cell><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${english ? 'CATEGORY' : 'KATEGORI'}</Data></Cell><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${english ? 'QTY SOLD' : 'PORSI TERJUAL'}</Data></Cell><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">${english ? 'TOTAL REVENUE' : 'TOTAL OMZET'}</Data></Cell></Row>`;
  if (topItems.length === 0) summaryRows += `<Row>${cStr(english ? 'No item data' : 'Belum ada data item')}${cStr('-')}${cNum(0)}${cCur(0)}</Row>`;
  else topItems.slice(0, 10).forEach((item, idx) => { summaryRows += `<Row>${cStr(`${idx + 1}. ${english ? (item.nameEn || item.name) : item.name}`)}${cStr(item.category)}${cNum(item.qty)}${cCur(item.total)}</Row>`; });

  const ledgerHeaders = english
    ? ['Status', 'Void Reason', 'Void Authorized By', 'Void Requested By', 'Date', 'Time', 'Invoice ID', 'Order ID', 'Table', 'Waiter', 'Cashier', 'Shift ID', 'Shift Name', 'Payment Method', 'Amount Tendered', 'Change Given', 'Gross Sales', 'Discounts', 'Net Sales', 'Taxable Sales Base', 'Tax-Exempt Sales', 'Tax Rate (%)', 'Tax Collected', 'Total Collected', 'Items Summary']
    : ['Status', 'Alasan Void', 'Otorisasi Void', 'Permintaan Void', 'Tanggal', 'Waktu', 'No Invoice', 'No Order', 'Meja', 'Waiter', 'Kasir', 'Shift ID', 'Nama Shift', 'Metode Pembayaran', 'Uang Tamu', 'Kembalian', 'Penjualan Kotor', 'Diskon', 'Penjualan Bersih', 'Dasar Kena Pajak', 'Penjualan Bebas Pajak', 'Tarif Pajak (%)', 'Pajak', 'Total Pembayaran', 'Ringkasan Item'];
  let ledgerHeaderRow = `<Row>${ledgerHeaders.map(h => cHead(h)).join('')}</Row>`;
  let ledgerDataRows = '';
  rows.slice().reverse().forEach(trx => {
    const isV = isVoid(trx), cellStyle = isV ? 'VoidCell' : 'Cell', numStyle = isV ? 'VoidCell' : 'Number', curStyle = isV ? 'VoidCurrency' : 'Currency';
    const gross = Number(trx.subtotal) || 0, disc = Number(trx.discountAmount) || 0, net = gross - disc, taxable = Number(trx.taxableSubtotal) || 0, nonTax = Math.max(0, net - taxable), taxRate = Number(trx.taxRate ?? 10), taxAmt = Number(trx.tax) || 0, grand = Number(trx.total) || 0;
    const itemSummary = (trx.lineItems || []).map(i => `${i.qty}x ${i.name}${i.discountAmount ? ` (-${money(i.discountAmount)})` : ''}`).join('; ') || (trx.items || []).join('; ');
    ledgerDataRows += `<Row>${cStr(isV ? 'VOID' : 'CLOSED', cellStyle)}${cStr(trx.voidReason || '', cellStyle)}${cStr(trx.voidBy || '', cellStyle)}${cStr(trx.voidRequestedBy || '', cellStyle)}${cStr(trx.date || '', cellStyle)}${cStr(trx.time || '', cellStyle)}${cStr(trx.id || '', cellStyle)}${cStr(trx.orderId || '', cellStyle)}${cStr(trx.table || '', cellStyle)}${cStr(trx.waiter || '', cellStyle)}${cStr(trx.cashier || '', cellStyle)}${cStr(trx.shiftId || '', cellStyle)}${cStr(shiftDisplay(trx), cellStyle)}${cStr(trx.payment || '', cellStyle)}${trx.tendered !== null && trx.tendered !== undefined ? cCur(trx.tendered, curStyle) : cStr('-', cellStyle)}${trx.change !== null && trx.change !== undefined ? cCur(trx.change, curStyle) : cStr('-', cellStyle)}${cCur(gross, curStyle)}${cCur(disc, curStyle)}${cCur(net, curStyle)}${cCur(taxable, curStyle)}${cCur(nonTax, curStyle)}${cNum(taxRate, numStyle)}${cCur(taxAmt, curStyle)}${cCur(grand, curStyle)}${cStr(itemSummary, cellStyle)}</Row>`;
  });

  const itemHeaders = english
    ? ['Status', 'Date', 'Time', 'Invoice ID', 'Table', 'Waiter', 'Cashier', 'Menu Category', 'Menu Item Name', 'Quantity', 'Unit Price', 'Item Discount', 'Line Total (Net)', 'Tax Status']
    : ['Status', 'Tanggal', 'Waktu', 'No Invoice', 'Meja', 'Waiter', 'Kasir', 'Kategori Menu', 'Nama Menu', 'Jumlah', 'Harga Satuan', 'Diskon Item', 'Total Bersih', 'Status Pajak'];
  let itemHeaderRow = `<Row>${itemHeaders.map(h => cHead(h)).join('')}</Row>`;
  let itemDataRows = '';
  rows.slice().reverse().forEach(trx => {
    const isV = isVoid(trx), cellStyle = isV ? 'VoidCell' : 'Cell', curStyle = isV ? 'VoidCurrency' : 'Currency', numStyle = isV ? 'VoidCell' : 'Number';
    (trx.lineItems || []).forEach(item => {
      const unitPrice = Number(item.price) || 0, qty = Number(item.qty) || 0, itemDisc = Number(item.discountAmount) || 0, lineNet = Number(item.lineTotal) || (unitPrice * qty - itemDisc);
      const taxStatus = item.taxable !== false ? (english ? 'Taxable' : 'Kena Pajak') : (english ? 'Tax-Exempt' : 'Bebas Pajak');
      itemDataRows += `<Row>${cStr(isV ? 'VOID' : 'CLOSED', cellStyle)}${cStr(trx.date || '', cellStyle)}${cStr(trx.time || '', cellStyle)}${cStr(trx.id || '', cellStyle)}${cStr(trx.table || '', cellStyle)}${cStr(trx.waiter || '', cellStyle)}${cStr(trx.cashier || '', cellStyle)}${cStr(item.category || 'General', cellStyle)}${cStr(english ? (item.nameEn || item.name) : item.name, cellStyle)}${cNum(qty, numStyle)}${cCur(unitPrice, curStyle)}${cCur(itemDisc, curStyle)}${cCur(lineNet, curStyle)}${cStr(taxStatus, cellStyle)}</Row>`;
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>${xmlEsc(restaurantName)}</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/></Style>
  <Style ss:ID="Title"><Font ss:FontName="Segoe UI" ss:Size="15" ss:Bold="1" ss:Color="#0F172A"/></Style>
  <Style ss:ID="Subtitle"><Font ss:FontName="Segoe UI" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/></Style>
  <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders><Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1B3A4B" ss:Pattern="Solid"/></Style>
  <Style ss:ID="SectionHeader"><Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#1E293B"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style>
  <Style ss:ID="Currency"><NumberFormat ss:Format="Rp#,##0;[Red]\(Rp#,##0\);&quot;Rp0&quot;"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/></Borders></Style>
  <Style ss:ID="CurrencyBold"><Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/><NumberFormat ss:Format="Rp#,##0;[Red]\(Rp#,##0\);&quot;Rp0&quot;"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/></Borders></Style>
  <Style ss:ID="Number"><NumberFormat ss:Format="#,##0"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/></Borders></Style>
  <Style ss:ID="Cell"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/></Borders></Style>
  <Style ss:ID="VoidCell"><Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#DC2626"/><Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/></Borders></Style>
  <Style ss:ID="VoidCurrency"><Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#DC2626"/><NumberFormat ss:Format="Rp#,##0"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/></Borders></Style>
 </Styles>
 <Worksheet ss:Name="${english ? 'Executive Summary' : 'Ringkasan Eksekutif'}"><Table ss:DefaultRowHeight="20"><Column ss:Width="220"/><Column ss:Width="160"/><Column ss:Width="280"/><Column ss:Width="150"/>${summaryRows}</Table></Worksheet>
 <Worksheet ss:Name="${english ? 'Transactions Ledger' : 'Buku Besar Transaksi'}"><Table ss:DefaultRowHeight="20"><Column ss:Width="80"/><Column ss:Width="150"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="90"/><Column ss:Width="70"/><Column ss:Width="150"/><Column ss:Width="150"/><Column ss:Width="80"/><Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="120"/><Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="110"/><Column ss:Width="110"/><Column ss:Width="120"/><Column ss:Width="100"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="80"/><Column ss:Width="100"/><Column ss:Width="130"/><Column ss:Width="280"/>${ledgerHeaderRow}${ledgerDataRows}</Table></Worksheet>
 <Worksheet ss:Name="${english ? 'Itemized Breakdown' : 'Rincian Item Terjual'}"><Table ss:DefaultRowHeight="20"><Column ss:Width="80"/><Column ss:Width="90"/><Column ss:Width="70"/><Column ss:Width="150"/><Column ss:Width="80"/><Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="120"/><Column ss:Width="180"/><Column ss:Width="60"/><Column ss:Width="110"/><Column ss:Width="100"/><Column ss:Width="120"/><Column ss:Width="110"/>${itemHeaderRow}${itemDataRows}</Table></Worksheet>
</Workbook>`;
}

exportReportExcel = async function() {
  const english = state.language === 'en', cleanName = (state.settings.restaurantName || 'anda-pos').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const payload = {
    restaurantName: state.settings.restaurantName || 'Anda POS',
    language: state.language || 'id',
    period: { from: reportFrom, to: reportTo },
    filters: {
      payment: reportPayment,
      cashier: reportCashier === 'all' ? (english ? 'All' : 'Semua') : (state.users.find(u => String(u.id) === reportCashier)?.name || reportCashier),
      cashierId: reportCashier
    },
    search: transactionIdSearch || ''
  };

  if (window.desktop?.exportExcel) {
    const result = await window.desktop.exportExcel(payload);
    if (result?.success) {
      toast(english ? `Excel report exported (${result.count ?? 0} records).` : `Laporan Excel berhasil diekspor (${result.count ?? 0} data).`);
    } else if (!result?.canceled) {
      toast(result?.error || (english ? 'Excel export failed.' : 'Ekspor Excel gagal.'));
    }
    return;
  }

  const rows = filteredTransactions();
  payload.transactions = rows;
  const xml = generateExcelXmlReport();
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `${english ? 'report' : 'laporan'}-${cleanName}-${businessDate()}.xls`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
exportReportCSV = exportReportExcel;




const EN_EXACT = {
  'Tidak aktif': 'Inactive', 'sekarang': 'now', 'Area restoran': 'Restaurant floor', 'kursi': 'seats', 'Tidak ada pesanan': 'No orders', 'pesanan aktif': 'active orders', 'Belum ada pesanan aktif.': 'No active orders yet.',
  'Bahan & menu': 'Inventory and menu', 'Produk': 'Product', 'Kategori': 'Category', 'Harga': 'Price', 'Stok': 'Stock', 'Kategori menu': 'Menu categories', 'Susun menu, pajak, dan aturan stok per item.': 'Organize items, tax, and stock rules.', '+ Kategori': '+ Category', '+ Menu': '+ Item', 'Pajak': 'Tax', 'Status': 'Status', 'Tanpa pajak': 'Tax exempt', 'Nonaktif': 'Inactive', 'Aktif': 'Active', 'Edit': 'Edit', 'Hapus': 'Delete',
  'Pengguna & PIN': 'Users and PINs', 'Akses disesuaikan dengan peran setiap pengguna.': 'Access is controlled by each user role.', '+ Pengguna': '+ User', 'Nama': 'Name', 'Peran': 'Role', 'Aktif saat ini': 'Currently active', 'Edit / PIN': 'Edit / PIN', 'Nonaktifkan': 'Deactivate', 'Aktifkan': 'Activate',
  'Manajemen meja': 'Table management', 'Tambah meja, atur kapasitas, atau hapus meja kosong.': 'Add tables, set capacity, or remove empty tables.', '+ Tambah meja': '+ Add table', 'Ubah kursi': 'Edit seats',
  'Shift kasir': 'Cashier shift', 'Transaksi void tidak dihitung sebagai penjualan.': 'Voided transactions are excluded from sales.', 'Akhiri shift': 'End shift', 'Mulai shift': 'Start shift', 'Penjualan hari ini': 'Today’s net sales', 'Transaksi hari ini': 'Today’s transactions', 'Void hari ini': 'Today’s voids', 'Shift aktif': 'Active shift', 'Penjualan shift': 'Shift net sales', 'Transaksi shift': 'Shift transactions', 'Kas seharusnya': 'Expected cash', 'Riwayat shift': 'Shift history', 'Dibuka / ditutup': 'Opened / closed', 'Penjualan': 'Net sales', 'Selisih kas': 'Cash difference', 'Tidak ada shift aktif': 'No active shift', 'Mulai shift sebelum memasukkan pesanan.': 'Start a shift before entering orders.', 'Belum ada shift yang ditutup.': 'No closed shifts yet.',
  'Metode pembayaran': 'Payment method', 'Rincian transaksi': 'Transaction details', 'Diskon': 'Discount', 'Total': 'Total', 'Cetak ulang': 'Reprint', 'Batal': 'Cancel', 'Tutup': 'Close', 'Kembali': 'Back', 'Simpan': 'Save', 'Pembayaran': 'Payment', 'Tunai': 'Cash', 'Kartu': 'Card', 'Semua': 'All', 'Kasir': 'Cashier', 'Meja': 'Table', 'Orang': 'Guest', 'Item': 'Items', 'Bulan': 'Month', 'Memuat…': 'Loading…',
  'Pilih meja': 'Select table', 'Pesanan baru': 'New order', 'Nama waiter': 'Waiter name', 'Cetak unpaid bill': 'Print unpaid bill', 'Uang pas': 'Exact cash', 'Uang tamu': 'Amount tendered', 'Kembalian': 'Change', 'Konfirmasi pembayaran': 'Confirm payment', 'Tanpa diskon': 'No discount', 'Harga normal': 'Regular price', 'Tambah miscellaneous': 'Add miscellaneous item',
  'Masuk sebagai pengguna': 'Sign in as a user', 'Pilih pengguna lalu masukkan PIN.': 'Choose a user and enter the PIN.', 'Masuk': 'Sign in', 'Pengguna aktif': 'Active user', 'Simpan pengguna': 'Save user', 'Nama pengguna': 'User name',
  'Simpan menu': 'Save item', 'Nama kategori': 'Category name', 'Simpan kategori': 'Save category', 'Jumlah kursi': 'Number of seats', 'Simpan meja': 'Save table', 'Tampilkan di layar kasir': 'Show on POS screen', 'Stok awal': 'Opening stock', 'Stok unlimited (∞)': 'Unlimited stock (∞)',
  'Cari ID shift': 'Search shift ID', 'Ketik ID lengkap, 4 angka terakhir, atau 8 angka tanggal.': 'Enter a full ID, the last 4 digits, or an 8-digit date.', 'Tidak ada shift yang cocok.': 'No matching shifts.', 'Tidak ada transaksi.': 'No transactions.', 'Belum ada data item.': 'No item data yet.'
  , 'Bill tersimpan': 'Saved bills', 'Kelola semua': 'Manage all', 'Bayar': 'Pay', 'Semua item saat ini berada dalam bill tersimpan.': 'All items are currently assigned to saved bills.', 'Sisa pesanan utama': 'Remaining main order', 'Dasar kena pajak': 'Taxable amount', 'Kelola split': 'Manage split', 'Split bill fleksibel': 'Flexible split bill', 'Simpan bill satu orang sekarang. Sisa pesanan tetap berada di meja dan dapat dibagi lagi kapan saja.': 'Save one guest’s bill now. The remaining order stays on the table and can be split later.', 'Pesanan utama': 'Main order', 'Tertunda': 'Pending', 'Tambah / ubah': 'Add / edit', 'Kembalikan': 'Return', 'Belum ada bill tersimpan untuk meja ini.': 'No saved bills for this table yet.', '+ Simpan bill orang berikutnya': '+ Save next guest bill',
  'Menu tersisa': 'Remaining items', 'Tersedia': 'Available', 'Pindahkan ke bill': 'Move to bill', 'Simpan bill': 'Save bill', 'Tidak ada sisa pesanan untuk disimpan.': 'There are no remaining items to save.', 'Bill orang baru': 'New guest bill', 'Nama bill': 'Bill name', 'Alokasi bill': 'Bill allocation', 'Pesanan': 'Ordered', 'Sisa': 'Remaining', 'Metode pembayaran': 'Payment method', 'Bayar semua bill': 'Pay all bills', 'Setiap orang harus memiliki minimal satu porsi.': 'Each guest must have at least one portion.',
  'Mulai shift kasir': 'Start cashier shift', 'Nama shift': 'Shift name', 'Saldo awal laci kas (Rp)': 'Opening cash drawer balance (Rp)', 'Penjualan shift': 'Shift net sales', 'Uang tunai aktual di laci (Rp)': 'Actual cash in drawer (Rp)', 'Selisih kas': 'Cash difference', 'Konfirmasi akhiri shift': 'Confirm end shift',
  'Tambah kategori': 'Add category', 'Edit kategori': 'Edit category', 'Tambah menu': 'Add item', 'Edit menu': 'Edit item', 'Nama menu (Indonesia)': 'Item name (Indonesian)', 'Nama menu (English)': 'Item name (English)', 'Ikon/emoji': 'Icon/emoji', 'Harga (Rp)': 'Price (Rp)', 'Kenakan pajak': 'Apply tax', 'Kenakan pajak 10%': 'Apply 10% tax',
  'Tambah pengguna': 'Add user', 'Edit pengguna': 'Edit user', 'PIN baru (kosongkan jika tidak diubah)': 'New PIN (leave blank to keep current)', 'PIN 4–8 angka': '4–8 digit PIN', 'Tambah meja': 'Add table', 'Ubah meja': 'Edit table', 'ID meja': 'Table ID',
  'Void transaksi': 'Void transaction', 'Alasan void': 'Void reason', 'Transaksi tetap tersimpan di laporan dan tidak dihitung sebagai pendapatan.': 'The transaction remains in the report and is excluded from sales.', 'Void hanya dapat dilakukan Owner atau Admin.': 'Only an Owner or Admin can void a transaction.', 'Salinan resto': 'Restaurant copy', 'Bill tamu': 'Guest bill',
  'Pilihan diskon': 'Discount choices', 'Jenis diskon': 'Discount type', 'Nama pilihan': 'Choice name', 'Persen (%)': 'Percent (%)', 'Nominal (Rp)': 'Fixed amount (Rp)', 'Nilai': 'Value', 'Simpan pilihan': 'Save choice', 'Tambah pilihan diskon': 'Add discount choice', 'Edit pilihan diskon': 'Edit discount choice',
  'Miscellaneous': 'Miscellaneous item', 'Nama item': 'Item name', 'Jumlah': 'Quantity', 'Kenakan pajak': 'Apply tax', 'Tambahkan': 'Add item', 'Pilih diskon': 'Choose discount', 'Hapus diskon': 'Remove discount',
  'Cetak semua bill': 'Print all bills', 'Cetak bill': 'Print bill', 'Cetak struk': 'Print receipt', 'Cetak uji 80 mm': 'Print 80 mm test', 'Terima kasih': 'Thank you', 'Kasir:': 'Cashier:', 'Waiter:': 'Waiter:'
};

const EN_PATTERNS = [
  [/^(\d+) kursi$/, '$1 seats'], [/^(\d+) pesanan aktif$/, '$1 active orders'], [/^(\d+) menu$/, '$1 items'], [/^(\d+) porsi$/, '$1 portions'], [/^Orang (\d+)$/, 'Guest $1'], [/^(\d+) shift ditemukan$/, '$1 shifts found'],
  [/^Dibuka (.+)$/, 'Opened $1'], [/^Masuk sebagai (.+)$/, 'Signed in as $1'], [/^Tanggal (\d+):/, 'Date $1:'], [/^Query SQLite gagal:/, 'SQLite query failed:'], [/^Query shift gagal:/, 'Shift query failed:'], [/^Oleh (.+)/, 'By $1']
];

function translateText(text) {
  if (state.language !== 'en') return text;
  const leading = text.match(/^\s*/)?.[0] || '', trailing = text.match(/\s*$/)?.[0] || '', clean = text.trim();
  if (!clean) return text;
  if (EN_EXACT[clean]) return `${leading}${EN_EXACT[clean]}${trailing}`;
  for (const [pattern, replacement] of EN_PATTERNS) if (pattern.test(clean)) return `${leading}${clean.replace(pattern, replacement)}${trailing}`;
  return text;
}

function localizeTree(root = document) {
  if (state.language !== 'en') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => { if (!node.parentElement?.closest('script,style') && node.parentElement?.tagName !== 'OPTION') node.nodeValue = translateText(node.nodeValue); });
  root.querySelectorAll?.('option').forEach(option => { option.textContent = translateText(option.textContent); });
  root.querySelectorAll?.('[placeholder],[title],[alt]').forEach(element => ['placeholder', 'title', 'alt'].forEach(attribute => { if (element.hasAttribute(attribute)) element.setAttribute(attribute, translateText(element.getAttribute(attribute))); }));
}

const localizeObserver = new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) localizeTree(node); else if (node.nodeType === Node.TEXT_NODE) node.nodeValue = translateText(node.nodeValue); })));
localizeObserver.observe(document.body, { childList: true, subtree: true });
const renderWithLocalization = render;
render = function() { renderWithLocalization(); localizeTree(document); };
const renderViewWithLocalization = renderView;
renderView = function() { renderViewWithLocalization(); localizeTree($('#view')); };
const openModalWithLocalization = openModal;
openModal = function(html) { openModalWithLocalization(html); localizeTree($('#modalBody')); };
localizeTree(document);
