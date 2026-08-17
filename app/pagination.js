/* SQLite-backed pagination for high-volume transaction and shift tables. */
let reportPage = 1, reportPageSize = 25, shiftPage = 1, shiftPageSize = 25, reportPageRows = new Map();
mountMonthlyRevenueChart = function() {};

function paginationControls(prefix, page, pageSize, totalPages = 1, total = 0) {
  const locale = state.language === 'id' ? 'id-ID' : 'en-US';
  return `<div class="pagination" data-pagination="${prefix}"><span>${total.toLocaleString(locale)} ${ui('data')} · ${ui('page')} ${page.toLocaleString(locale)} ${ui('of')} ${totalPages.toLocaleString(locale)}</span><div><label>${ui('rows')}<select id="${prefix}PageSize">${[25, 50, 100].map(size => `<option value="${size}" ${pageSize === size ? 'selected' : ''}>${size}</option>`).join('')}</select></label><button class="mini" id="${prefix}First" ${page <= 1 ? 'disabled' : ''}>« ${ui('first')}</button><button class="mini" id="${prefix}Prev" ${page <= 1 ? 'disabled' : ''}>‹ ${ui('previous')}</button><button class="mini" id="${prefix}Next" ${page >= totalPages ? 'disabled' : ''}>${ui('next')} ›</button><button class="mini" id="${prefix}Last" ${page >= totalPages ? 'disabled' : ''}>${ui('last')} »</button></div></div>`;
}

function reportShell() {
  return `<div class="report-filters"><label class="id-search-field">${ui('searchTransaction')}<input id="transactionIdSearch" type="search" inputmode="numeric" value="${esc(transactionIdSearch)}" placeholder="${ui('idPlaceholder')}" autocomplete="off"></label><label>${ui('from')}<input id="reportFrom" type="date" value="${reportFrom}"></label><label>${ui('to')}<input id="reportTo" type="date" value="${reportTo}"></label><label>${ui('payment')}<select id="reportPayment"><option value="all">${ui('all')}</option><option value="cash" ${reportPayment === 'cash' ? 'selected' : ''}>${t('cash')}</option><option value="card" ${reportPayment === 'card' ? 'selected' : ''}>${t('card')}</option><option value="qris" ${reportPayment === 'qris' ? 'selected' : ''}>QRIS</option></select></label><label>${ui('cashier')}<select id="reportCashier"><option value="all">${ui('all')}</option>${state.users.map(user => `<option value="${user.id}" ${reportCashier === String(user.id) ? 'selected' : ''}>${esc(user.name)}</option>`).join('')}</select></label><button class="secondary" id="exportReport">${ui('exportCsv')}</button></div><div class="report-header-banner" id="reportHeaderBanner"><div class="report-period-info"><span class="report-period-icon">📊</span><div><small>${ui('activeReportPeriod')}</small><h3 id="reportPeriodTitle">${ui('loading')}</h3></div></div><div class="report-filter-badges" id="reportActiveBadges"></div></div><section class="revenue-chart panel"><div class="chart-heading"><div><small>${ui('dailyNetSales')}</small><h3 id="dbChartMonth">${ui('loading')}</h3></div><label>${ui('month')}<input id="reportMonth" type="month" value="${reportMonth}"></label><strong id="dbChartTotal">${money(0)}</strong></div><div class="bar-chart" id="dbBarChart"></div></section><section class="accounting-ledger"><div class="ledger-kicker">${ui('accountingFlow')}</div><div class="ledger-flow"><article><small>${ui('grossSales')}</small><strong id="dbSubtotal">—</strong><span>${ui('grossFormula')}</span></article><i>−</i><article><small>${ui('discount')}</small><strong id="dbDiscount">—</strong><span>${ui('discount')}</span></article><i>=</i><article class="ledger-focus"><small>${ui('netSales')}</small><strong id="dbSales">—</strong><span>${ui('netFormula')}</span></article><i>+</i><article><small>${ui('tax')}</small><strong id="dbTax">—</strong><span>${ui('taxableSales')}</span></article><i>=</i><article class="ledger-total"><small>${ui('totalCollected')}</small><strong id="dbCollected">—</strong><span>${ui('collectedFormula')}</span></article></div></section><div class="tax-audit-wrap"><section class="tax-audit"><div><small>${ui('taxBreakdown')}</small><strong>${ui('netSales')}</strong></div><article><span>${ui('taxableSales')}</span><strong id="dbTaxable">—</strong><small>${ui('taxableFormula')}</small></article><article><span>${ui('nonTaxableSales')}</span><strong id="dbNonTaxable">—</strong><small>${ui('nonTaxableFormula')}</small></article><article><span>${ui('paidTransactions')}</span><strong id="dbCount">—</strong></article><article class="void-stat"><span>${ui('voidTransactions')}</span><strong id="dbVoidCount">—</strong></article></section></div><div class="report-breakdown"><div class="panel"><h3>${ui('paymentReceipts')}</h3><div id="dbPayments"><p class="muted">${ui('loading')}</p></div></div><div class="panel"><h3>${ui('bestSellers')}</h3><div id="dbTopItems"><p class="muted">${ui('loading')}</p></div></div></div><h3>${ui('transactionDetails')}</h3><div class="report-table-wrap"><table class="report-table detailed audit-table"><thead><tr><th>${ui('status')}</th><th>${ui('dateInvoice')}</th><th>${ui('tableWaiter')}</th><th>${ui('cashierShift')}</th><th>${ui('payment')}</th><th>${ui('grossSales')}</th><th>${ui('discount')}</th><th>${ui('taxableSales')}</th><th>${ui('tax')}</th><th>${ui('totalCollected')}</th><th>${ui('itemActions')}</th></tr></thead><tbody id="dbTransactionRows"><tr><td colspan="11">${ui('loadingSqlite')}</td></tr></tbody></table><div id="reportPagination">${paginationControls('report', 1, reportPageSize)}</div></div>`;
}

renderReports = reportShell;

function transactionTableRow(transaction) {
  const rate = Number(transaction.taxRate ?? 10), taxable = Number.isFinite(Number(transaction.taxableSubtotal))
    ? Number(transaction.taxableSubtotal)
    : (rate > 0 ? Number(transaction.tax || 0) * 100 / rate : 0);
  return `<tr class="${isVoid(transaction) ? 'void-row' : ''}"><td><span class="status-pill ${isVoid(transaction) ? 'void-pill' : ''}">${isVoid(transaction) ? 'VOID' : 'CLOSED'}</span>${isVoid(transaction) ? `<small>${esc(transaction.voidReason || ui('noReason'))}<br>${ui('authorizedBy')}: ${esc(transaction.voidBy || '—')} · ${dateTime(transaction.voidAt)}${transaction.voidRequestedBy ? `<br>${roleText('requestedBy')}: ${esc(transaction.voidRequestedBy)}` : ''}</small>` : ''}</td><td><strong>${esc(transaction.id)}</strong><br><small>${esc(transaction.date || '—')} · ${esc(transaction.time || '—')}<br>${esc(transaction.orderId || '—')}</small></td><td>${esc(transaction.table || '—')}<br><small>Waiter: ${esc(transaction.waiter || '—')}</small></td><td>${esc(transaction.cashier || '—')}<br><small>${esc(shiftDisplay(transaction))}<br>${esc(transaction.shiftId || '—')}</small></td><td>${esc(transaction.payment || '—')}${transaction.tendered !== null && transaction.tendered !== undefined ? `<br><small>${ui('cashReceived')} ${money(transaction.tendered)}<br>${ui('change')} ${money(transaction.change || 0)}</small>` : ''}</td><td>${money(transaction.subtotal || 0)}</td><td>${money(transaction.discountAmount || 0)}</td><td>${money(taxable)}</td><td>${money(transaction.tax || 0)}<br><small>${rate}%</small></td><td><strong>${money(transaction.total || 0)}</strong></td><td><details><summary>${(transaction.lineItems || transaction.items || []).length} ${ui('items')}</summary><div class="detail-items">${transaction.lineItems?.map(item => `${item.qty}× ${esc(item.name)} — ${money(item.lineTotal)}`).join('<br>') || '—'}</div></details><div class="audit-actions"><button class="mini" data-reprint="${esc(transaction.id)}">${ui('reprint')}</button>${!isVoid(transaction) && canAccess('voidTransactions') ? `<button class="mini danger-text" data-void="${esc(transaction.id)}">Void</button>` : ''}</div></td></tr>`;
}

function localTransactionPage() {
  const allRows = filteredTransactions(), total = allRows.length, totalPages = Math.max(1, Math.ceil(total / reportPageSize)), page = Math.min(reportPage, totalPages), rows = allRows.slice((page - 1) * reportPageSize, page * reportPageSize), valid = activeSalesTransactions(allRows);
  const summary = { count: valid.length, voidCount: total - valid.length, subtotal: valid.reduce((sum, x) => sum + (x.subtotal || 0), 0), discount: valid.reduce((sum, x) => sum + (x.discountAmount || 0), 0), tax: valid.reduce((sum, x) => sum + (x.tax || 0), 0), taxable: valid.reduce((sum, x) => sum + (x.taxableSubtotal || 0), 0), sales: valid.reduce((sum, x) => sum + (x.subtotal || 0) - (x.discountAmount || 0), 0), collected: valid.reduce((sum, x) => sum + (x.total || 0), 0), cash: valid.filter(x => paymentMatches(x, 'cash')).reduce((sum, x) => sum + x.total, 0), card: valid.filter(x => paymentMatches(x, 'card')).reduce((sum, x) => sum + x.total, 0), qris: valid.filter(x => paymentMatches(x, 'qris')).reduce((sum, x) => sum + x.total, 0) }; summary.nonTaxable = Math.max(0, summary.sales - summary.taxable);
  return { rows, total, totalPages, page, pageSize: reportPageSize, summary, topItems: [], daily: [], month: reportMonth };
}

let reportQuerySeq = 0, shiftQuerySeq = 0;
async function loadReportPage() {
  if (state.activeView !== 'reports' || !$('#dbTransactionRows')) return;
  const thisSeq = ++reportQuerySeq;
  const options = { page: reportPage, pageSize: reportPageSize, from: reportFrom, to: reportTo, payment: reportPayment, cashier: reportCashier, search: transactionIdSearch, month: reportMonth };
  let result;
  try { result = window.desktop?.queryTransactions ? await window.desktop.queryTransactions(options) : localTransactionPage(); } catch (error) { if (thisSeq !== reportQuerySeq) return; $('#dbTransactionRows').innerHTML = `<tr><td colspan="11">Query SQLite gagal: ${esc(error.message)}</td></tr>`; return; }
  if (state.activeView !== 'reports' || thisSeq !== reportQuerySeq) return;
  reportPage = result.page; reportPageRows = new Map(result.rows.map(row => [row.id, row]));
  $('#dbTransactionRows').innerHTML = result.rows.map(transactionTableRow).join('') || '<tr><td colspan="11">Tidak ada transaksi untuk filter ini.</td></tr>';
  const summary = result.summary; $('#dbSubtotal').textContent = money(summary.subtotal); $('#dbDiscount').textContent = money(summary.discount); $('#dbTax').textContent = money(summary.tax); $('#dbSales').textContent = money(summary.sales); $('#dbCollected').textContent = money(summary.collected ?? (Number(summary.sales) + Number(summary.tax))); $('#dbTaxable').textContent = money(summary.taxable || 0); $('#dbNonTaxable').textContent = money(summary.nonTaxable || 0); $('#dbCount').textContent = Number(summary.count).toLocaleString(state.language === 'id' ? 'id-ID' : 'en-US'); $('#dbVoidCount').textContent = Number(summary.voidCount).toLocaleString(state.language === 'id' ? 'id-ID' : 'en-US');
  $('#dbPayments').innerHTML = ['cash', 'card', 'qris'].map(code => `<div class="total-row"><span>${t(code)}</span><strong>${money(summary[code] || 0)}</strong></div>`).join('');
  $('#dbTopItems').innerHTML = (result.topItems || []).map((item, index) => `<div class="total-row"><span>${index + 1}. ${esc(item.name)} · ${Number(item.qty).toLocaleString(state.language === 'id' ? 'id-ID' : 'en-US')} ${ui('portions')}</span><strong>${money(item.total)}</strong></div>`).join('') || `<p class="muted">${ui('noItems')}</p>`;
  const [year, month] = result.month.split('-').map(Number), days = new Date(year, month, 0).getDate(), dailyMap = new Map((result.daily || []).map(day => [day.date, Number(day.total) || 0])), values = Array.from({ length: days }, (_, index) => dailyMap.get(`${result.month}-${String(index + 1).padStart(2, '0')}`) || 0), maximum = Math.max(0, ...values), locale = state.language === 'id' ? 'id-ID' : 'en-US';
  $('#dbChartMonth').textContent = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(`${result.month}-01T12:00:00`)); $('#dbChartTotal').textContent = money(values.reduce((a, b) => a + b, 0)); $('#dbBarChart').innerHTML = values.map((value, index) => `<div class="bar-column" title="Tanggal ${index + 1}: ${money(value)}"><div class="bar-value">${value ? money(value).replace(/,00$/, '') : ''}</div><div class="bar-track"><span style="height:${maximum ? Math.max(2, value / maximum * 100) : 0}%"></span></div><small>${index + 1}</small></div>`).join('');
  
  const periodTitleEl = $('#reportPeriodTitle');
  const badgesEl = $('#reportActiveBadges');
  if (periodTitleEl && badgesEl) {
    const isId = state.language === 'id';
    let periodText = '';
    const fromVal = reportFrom || (reportTo ? `${reportTo.slice(0, 7)}-01` : '');
    const toVal = reportTo || (reportFrom ? reportFrom : '');
    if (fromVal && toVal) {
      if (fromVal === toVal) {
        const d = new Date(`${fromVal}T12:00:00`);
        const formatted = new Intl.DateTimeFormat(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
        periodText = `${formatted} · ${isId ? 'Laporan 1 Hari' : '1-Day Report'}`;
      } else {
        const d1 = new Date(`${fromVal}T12:00:00`), d2 = new Date(`${toVal}T12:00:00`);
        const f1 = new Intl.DateTimeFormat(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(d1);
        const f2 = new Intl.DateTimeFormat(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(d2);
        const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
        periodText = `${f1} s/d ${f2} · ${diffDays} ${isId ? 'Hari' : 'Days'}`;
      }
    } else {
      const [mY, mM] = (result.month || reportMonth || businessDate().slice(0, 7)).split('-').map(Number);
      const mDate = new Date(mY, mM - 1, 1);
      const mName = new Intl.DateTimeFormat(isId ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' }).format(mDate);
      periodText = `${mName} · ${isId ? '1 Bulan Penuh' : 'Full Month'}`;
    }
    periodTitleEl.textContent = periodText;
    const badges = [];
    badges.push(`<span class="report-badge badge-count">📑 ${Number(result.total).toLocaleString(isId ? 'id-ID' : 'en-US')} ${isId ? 'transaksi' : 'transactions'}</span>`);
    if (transactionIdSearch) badges.push(`<span class="report-badge badge-search">🔍 ID: "${esc(transactionIdSearch)}"</span>`);
    if (reportPayment && reportPayment !== 'all') badges.push(`<span class="report-badge">💳 ${t(reportPayment)}</span>`);
    if (reportCashier && reportCashier !== 'all') {
      const u = state.users.find(x => String(x.id) === String(reportCashier));
      badges.push(`<span class="report-badge">👤 ${esc(u?.name || reportCashier)}</span>`);
    }
    badgesEl.innerHTML = badges.join('');
  }

  $('#reportPagination').innerHTML = paginationControls('report', result.page, result.pageSize, result.totalPages, result.total); bindPaginationButtons('report', result.totalPages); bindPagedTransactionActions();
}


function bindPaginationButtons(prefix, totalPages) {
  const isReport = prefix === 'report', getPage = () => isReport ? reportPage : shiftPage, setPage = value => { if (isReport) reportPage = value; else shiftPage = value; }, load = isReport ? loadReportPage : loadShiftPage;
  $(`#${prefix}PageSize`).onchange = event => { if (isReport) reportPageSize = Number(event.target.value); else shiftPageSize = Number(event.target.value); setPage(1); load(); };
  $(`#${prefix}First`).onclick = () => { setPage(1); load(); }; $(`#${prefix}Prev`).onclick = () => { setPage(Math.max(1, getPage() - 1)); load(); }; $(`#${prefix}Next`).onclick = () => { setPage(Math.min(totalPages, getPage() + 1)); load(); }; $(`#${prefix}Last`).onclick = () => { setPage(totalPages); load(); };
}

function bindPagedTransactionActions() {
  document.querySelectorAll('[data-reprint]').forEach(button => button.onclick = () => showTransactionReceipt(button.dataset.reprint));
  document.querySelectorAll('[data-void]').forEach(button => button.onclick = () => showVoidForm(button.dataset.void));
}

const showTransactionReceiptBeforePagination = showTransactionReceipt;
showTransactionReceipt = function(transactionId, copyType = 'customer') {
  const transaction = reportPageRows.get(transactionId);
  if (!transaction) return showTransactionReceiptBeforePagination(transactionId, copyType);
  openModal(`${receiptHTML(transaction, 0, copyType)}<div class="modal-actions receipt-actions"><button class="secondary close-modal">Tutup</button><button class="secondary" id="toggleCopy">${copyType === 'customer' ? 'Salinan resto' : 'Bill tamu'}</button><button class="primary" id="printReceipt">Cetak ulang</button></div>`); $('#toggleCopy').onclick = () => showTransactionReceipt(transactionId, copyType === 'customer' ? 'restaurant' : 'customer'); $('#printReceipt').onclick = () => printReceipt();
};

showVoidForm = function(transactionId) {
  if (state.user.role === 'cashier') { toast('Void hanya dapat dilakukan Owner atau Admin.'); return; }
  const transaction = reportPageRows.get(transactionId) || state.transactions.find(x => x.id === transactionId); if (!transaction || isVoid(transaction)) return;
  openModal(`<h2>Void transaksi</h2><div class="void-warning"><strong>${esc(transaction.id)} · ${money(transaction.total)}</strong><span>${esc(transaction.table)} · ${esc(transaction.cashier)}</span></div><form id="voidForm"><label class="field"><span>Alasan void</span><textarea name="reason" required minlength="5" maxlength="250" autofocus></textarea></label><p class="muted">Transaksi tetap tersimpan di laporan dan tidak dihitung sebagai pendapatan.</p><div class="modal-actions"><button type="button" class="secondary close-modal">Batal</button><button class="danger">Void transaksi</button></div></form>`);
  $('#voidForm').onsubmit = async event => { event.preventDefault(); const reason = String(new FormData(event.target).get('reason')).trim(); if (reason.length < 5) return; transaction.status = 'void'; transaction.voidReason = reason; transaction.voidAt = new Date().toISOString(); transaction.voidBy = state.user.name; transaction.voidById = state.user.id; (transaction.lineItems || []).forEach(item => { const product = state.products.find(x => x.id === item.productId); if (product && !product.unlimitedStock) product.stock += Number(item.qty) || 0; }); try { if (window.desktop?.updateTransaction) await window.desktop.updateTransaction(transaction); const local = state.transactions.find(x => x.id === transaction.id); if (local) Object.assign(local, transaction); await save(); closeModal(); render(); toast(`${transaction.id} berhasil di-void.`); } catch (error) { toast(`Void gagal: ${error.message}`); } };
};

const renderShiftBeforePagination = renderShift;
renderShift = function() { return renderShiftBeforePagination().replace('</table></div>', `</table><div id="shiftPagination">${paginationControls('shift', 1, shiftPageSize)}</div></div>`); };

async function loadShiftPage() {
  if (state.activeView !== 'shift') return; const body = $('.report-table tbody'); if (!body) return;
  const thisSeq = ++shiftQuerySeq;
  let result;
  try { result = window.desktop?.queryShifts ? await window.desktop.queryShifts({ page: shiftPage, pageSize: shiftPageSize, search: shiftIdSearch }) : { rows: state.shiftHistory.filter(x => idMatchesSearch(x.id, shiftIdSearch)).slice((shiftPage - 1) * shiftPageSize, shiftPage * shiftPageSize), total: state.shiftHistory.filter(x => idMatchesSearch(x.id, shiftIdSearch)).length, page: shiftPage, pageSize: shiftPageSize, totalPages: Math.max(1, Math.ceil(state.shiftHistory.filter(x => idMatchesSearch(x.id, shiftIdSearch)).length / shiftPageSize)) }; } catch (error) { if (thisSeq !== shiftQuerySeq) return; body.innerHTML = `<tr><td colspan="6">Query shift gagal: ${esc(error.message)}</td></tr>`; return; }
  if (state.activeView !== 'shift' || thisSeq !== shiftQuerySeq) return;
  shiftPage = result.page; body.innerHTML = result.rows.map(shift => `<tr><td><strong>${esc(shift.name)}</strong><br><small>${esc(shift.id)}</small></td><td>${esc(shift.cashierName || '—')}</td><td>${dateTime(shift.openedAt)}<br><small>${dateTime(shift.closedAt)}</small></td><td>${shift.transactionCount || 0}</td><td>${money(shift.sales || 0)}</td><td>${money(shift.difference || 0)}</td></tr>`).join('') || '<tr><td colspan="6">Tidak ada shift yang cocok.</td></tr>'; $('#shiftPagination').innerHTML = paginationControls('shift', result.page, result.pageSize, result.totalPages, result.total); bindPaginationButtons('shift', result.totalPages);
}

const bindViewBeforePagination = bindView;
bindView = function() {
  bindViewBeforePagination();
  if (state.activeView === 'reports') {
    const transactionInput = $('#transactionIdSearch');
    if (transactionInput) {
      transactionInput.oninput = () => {
        transactionIdSearch = transactionInput.value;
        reportPage = 1;
        clearTimeout(transactionInput._timer);
        transactionInput._timer = setTimeout(loadReportPage, 250);
      };
    }
    const rf = $('#reportFrom');
    if (rf) rf.onchange = event => {
      reportFrom = event.target.value;
      if (reportFrom && !reportTo) {
        reportTo = reportFrom;
        const toInput = $('#reportTo');
        if (toInput) toInput.value = reportTo;
      }
      reportPage = 1;
      loadReportPage();
    };
    const rt = $('#reportTo');
    if (rt) rt.onchange = event => {
      reportTo = event.target.value;
      if (!reportFrom && reportTo) {
        reportFrom = reportTo;
        const fromInput = $('#reportFrom');
        if (fromInput) fromInput.value = reportFrom;
      }
      reportPage = 1;
      loadReportPage();
    };
    const rp = $('#reportPayment');
    if (rp) rp.onchange = event => { reportPayment = event.target.value; reportPage = 1; loadReportPage(); };
    const rc = $('#reportCashier');
    if (rc) rc.onchange = event => { reportCashier = event.target.value; reportPage = 1; loadReportPage(); };
    const rm = $('#reportMonth');
    if (rm) rm.onchange = event => { reportMonth = event.target.value || businessDate().slice(0, 7); reportPage = 1; loadReportPage(); };
    const exp = $('#exportReport');
    if (exp) exp.onclick = exportReportCSV;
    loadReportPage();
  }
  if (state.activeView === 'shift') {
    const shiftInput = $('#shiftIdSearch');
    if (shiftInput) {
      shiftInput.oninput = () => {
        shiftIdSearch = shiftInput.value;
        shiftPage = 1;
        clearTimeout(shiftInput._timer);
        shiftInput._timer = setTimeout(loadShiftPage, 250);
      };
    }
    loadShiftPage();
  }
};



