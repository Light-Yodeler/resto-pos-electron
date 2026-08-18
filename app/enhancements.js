/* Anda POS 1.9 commercial and audit workflows. Loaded after app.js. */
let explicitTableSelection = false;

function commercialDefaults() {
  state.settings.taxRate = Math.max(0, Math.min(100, Number(state.settings.taxRate ?? 10)));
  if (!Array.isArray(state.settings.discountOptions)) state.settings.discountOptions = structuredClone(seed.settings.discountOptions);
  state.settings.discountOptions = state.settings.discountOptions.filter(x => x && x.label && ['percent', 'fixed'].includes(x.type)).map(x => ({
    id: String(x.id || `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    label: String(x.label), type: x.type, value: Math.max(0, Number(x.value) || 0)
  }));
}

function currentTaxRate() { commercialDefaults(); return state.settings.taxRate; }
function dynamicTaxLabel(rate = currentTaxRate()) { return `${state.language === 'en' ? 'Tax' : 'Pajak'} (${Number(rate).toLocaleString('id-ID')}%)`; }
function currentOrderMeta() { return state.orderMeta[cartKey()] || null; }
function currentDiscount() {
  const meta = currentOrderMeta();
  if (!meta?.discountId) return null;
  return state.settings.discountOptions.find(x => x.id === meta.discountId) || null;
}
function rawSubtotal(items) { return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0); }
function discountForItems(items, subtotal) {
  const option = currentDiscount(), meta = currentOrderMeta();
  if (!option || subtotal <= 0) return { amount: 0, option: null };
  if (option.type === 'percent') return { amount: Math.min(subtotal, Math.round(subtotal * option.value / 100)), option };
  const remaining = Math.max(0, option.value - Number(meta?.discountUsed || 0));
  const openSubtotal = rawSubtotal(allOpenItems());
  const amount = subtotal >= openSubtotal || !openSubtotal ? remaining : Math.round(remaining * subtotal / openSubtotal);
  return { amount: Math.min(subtotal, amount), option };
}

function calculateItemDiscount(item) {
  if (!item || !item.itemDiscount) return 0;
  const qty = Number(item.qty) || 0;
  const rawTotal = (Number(item.price) || 0) * qty;
  if (rawTotal <= 0) return 0;
  if (item.itemDiscount.type === 'percent') {
    return Math.min(rawTotal, Math.round(rawTotal * (Number(item.itemDiscount.value) || 0) / 100));
  }
  const unitDiscount = Number(item.itemDiscount.value) || 0;
  return Math.min(rawTotal, Math.round(unitDiscount * (item.itemDiscount.perUnit !== false ? qty : 1)));
}

totals = function(items = currentCart(), forcedDiscount = null) {
  const subtotal = rawSubtotal(items);
  const itemDiscountsTotal = items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
  const remainingSubtotal = Math.max(0, subtotal - itemDiscountsTotal);
  const rawTaxableSubtotal = items.reduce((sum, item) => {
    if (item.taxable === false) return sum;
    const itemRaw = Number(item.price || 0) * Number(item.qty || 0);
    const itemDisc = calculateItemDiscount(item);
    return sum + Math.max(0, itemRaw - itemDisc);
  }, 0);
  const selected = discountForItems(items, remainingSubtotal);
  const orderDiscountAmount = Math.max(0, Math.min(remainingSubtotal, forcedDiscount === null ? selected.amount : Number(forcedDiscount) || 0));
  const totalDiscountAmount = itemDiscountsTotal + orderDiscountAmount;
  const taxableOrderDiscount = remainingSubtotal > 0 ? Math.round(orderDiscountAmount * rawTaxableSubtotal / remainingSubtotal) : 0;
  const taxableSubtotal = Math.max(0, rawTaxableSubtotal - taxableOrderDiscount);
  const taxRate = currentTaxRate();
  const tax = Math.round(taxableSubtotal * taxRate / 100);
  return { subtotal, itemDiscountsTotal, orderDiscountAmount, discountAmount: totalDiscountAmount, discountLabel: selected.option?.label || (itemDiscountsTotal ? (state.language === 'en' ? 'Item discount' : 'Diskon item') : ''), taxableSubtotal, taxRate, tax, total: subtotal - totalDiscountAmount + tax };
};

function orderContextReady() {
  if (!state.shift?.open) { toast('Mulai shift kasir sebelum membuat pesanan.'); state.activeView = 'shift'; render(); return false; }
  if (state.orderType === 'dineIn') {
    const tableExists = state.tables.some(x => x.id === state.table);
    const continuingOrder = tableExists && allOpenItems(`table:${state.table}`).length > 0;
    if (!tableExists || (!explicitTableSelection && !continuingOrder)) { toast('Pilih meja terlebih dahulu melalui menu Meja.'); state.activeView = 'tables'; render(); return false; }
  }
  return true;
}

const baseAddProduct = add;
add = function(id) { if (orderContextReady()) baseAddProduct(id); };

function showMiscellaneousForm() {
  if (!orderContextReady()) return;
  openModal(`<h2>Miscellaneous</h2><p class="muted">Tambahkan item yang belum tersedia di daftar menu.</p><form id="miscForm"><label class="field"><span>Nama item</span><input name="name" required maxlength="60" autofocus placeholder="Contoh: Biaya tambahan"></label><label class="field"><span>Harga satuan (Rp)</span><input name="price" type="number" min="0" step="1" required></label><label class="field"><span>Jumlah</span><input name="qty" type="number" min="1" step="1" value="1" required></label><label class="check"><input name="taxable" type="checkbox" checked> Kenakan ${dynamicTaxLabel()}</label><div class="modal-actions"><button type="button" class="secondary close-modal">Batal</button><button class="primary">Tambahkan ke pesanan</button></div></form>`);
  $('#miscForm').onsubmit = async event => {
    event.preventDefault();
    const form = new FormData(event.target), item = {
      id: -Date.now(), name: String(form.get('name')).trim(), en: String(form.get('name')).trim(), category: 'Miscellaneous', icon: '＋',
      price: Math.max(0, Number(form.get('price')) || 0), qty: Math.max(1, Number(form.get('qty')) || 1), taxable: form.get('taxable') === 'on',
      miscellaneous: true, unlimitedStock: true
    };
    if (!item.name) return;
    if (!state.orderMeta[cartKey()] && !allOpenItems().length) {
      closeModal();
      showWaiterPromptForMisc(item);
      return;
    }
    ensureOrderId(); currentCart().push(item); await save(); closeModal(); renderOrder(); toast('Item miscellaneous ditambahkan.');
  };
}

function showWaiterPromptForMisc(item) {
  openModal(`<h2>Order baru</h2><p>Masukkan nama waiter yang menangani tamu ini.</p><form id="waiterMiscForm"><label class="field"><span>Nama waiter</span><input name="waiter" required maxlength="50" autofocus></label><div class="modal-actions"><button type="button" class="secondary close-modal">Batal</button><button class="primary">Mulai order</button></div></form>`);
  $('#waiterMiscForm').onsubmit = async event => {
    event.preventDefault(); const waiter = String(new FormData(event.target).get('waiter')).trim(); if (!waiter) return;
    state.orderMeta[cartKey()] = { waiter, createdAt: new Date().toISOString() }; ensureOrderId(); currentCart().push(item);
    await save(); closeModal(); renderOrder();
  };
}

function showItemDiscountPicker(cartIndex) {
  const cart = currentCart(), item = cart[cartIndex];
  if (!item) return;
  const english = state.language === 'en', itemName = english ? (item.en || item.name) : item.name, selectedId = item.itemDiscount?.id || '';
  openModal(`<h2>${english ? `Discount for ${esc(itemName)}` : `Diskon untuk ${esc(itemName)}`}</h2><p class="muted">${Number(item.qty)}× @ ${money(item.price)} = <strong>${money(item.price * item.qty)}</strong></p><div class="discount-picker"><button data-item-discount-choice="" class="${selectedId ? '' : 'selected'}"><strong>${english ? 'No discount' : 'Tanpa diskon'}</strong><span>${english ? 'Regular price' : 'Harga normal'}</span></button>${state.settings.discountOptions.map(x => `<button data-item-discount-choice="${esc(x.id)}" class="${selectedId === x.id ? 'selected' : ''}"><strong>${esc(x.label)}</strong><span>${x.type === 'percent' ? `${x.value}%` : money(x.value)}</span></button>`).join('')}</div><div class="modal-actions"><button type="button" class="secondary" id="backToDiscountManager">${english ? 'Back' : 'Kembali'}</button></div>`);
  $('#backToDiscountManager').onclick = showDiscountPicker;
  document.querySelectorAll('[data-item-discount-choice]').forEach(button => {
    button.onclick = async () => {
      const choiceId = button.dataset.itemDiscountChoice;
      if (!choiceId) delete item.itemDiscount;
      else {
        const option = state.settings.discountOptions.find(x => x.id === choiceId);
        if (option) item.itemDiscount = { id: option.id, label: option.label, type: option.type, value: option.value };
      }
      await save(); showDiscountPicker(); renderOrder();
      toast(choiceId ? (english ? 'Item discount applied.' : 'Diskon item diterapkan.') : (english ? 'Item discount removed.' : 'Diskon item dihapus.'));
    };
  });
}

function showDiscountPicker() {
  commercialDefaults();
  const cart = currentCart(), bills = currentSplitBills();
  if (!cart.length && !bills.length) { toast(state.language === 'en' ? 'Add items before choosing discounts.' : 'Tambahkan item sebelum memilih diskon.'); return; }
  const selected = currentOrderMeta()?.discountId || '', english = state.language === 'en';
  const orderSection = `<div class="discount-manager-section"><h3><span>1. ${english ? 'Whole Order Discount' : 'Diskon Seluruh Pesanan'}</span></h3><p class="muted">${english ? 'Discounts apply before tax.' : 'Diskon diterapkan sebelum pajak. Diskon nominal dibagi proporsional pada split bill.'}</p><div class="discount-picker"><button data-discount-choice="" class="${selected ? '' : 'selected'}"><strong>${english ? 'No discount' : 'Tanpa diskon'}</strong><span>${english ? 'Regular price' : 'Harga normal'}</span></button>${state.settings.discountOptions.map(x => `<button data-discount-choice="${esc(x.id)}" class="${selected === x.id ? 'selected' : ''}"><strong>${esc(x.label)}</strong><span>${x.type === 'percent' ? `${x.value}%` : money(x.value)}</span></button>`).join('')}</div></div>`;
  const itemRows = cart.map((item, idx) => {
    const itemName = english ? (item.en || item.name) : item.name, disc = calculateItemDiscount(item);
    return `<div class="discount-item-row"><div><strong>${Number(item.qty)}× ${esc(itemName)}</strong><small>${money(item.price * item.qty)}${disc ? ` · <span style="color:var(--leaf);font-weight:700">−${money(disc)} (${esc(item.itemDiscount.label)})</span>` : ''}</small></div><div class="discount-item-actions"><button type="button" class="mini" data-item-disc-idx="${idx}">${disc ? (english ? 'Change' : 'Ubah') : (english ? '+ Discount' : '+ Diskon')}</button>${disc ? `<button type="button" class="mini danger-text" data-item-disc-clear="${idx}">×</button>` : ''}</div></div>`;
  }).join('') || `<p class="muted">${english ? 'No items in active cart.' : 'Tidak ada item dalam keranjang aktif.'}</p>`;
  const itemSection = `<div class="discount-manager-section"><h3><span>2. ${english ? 'Item-Specific Discounts' : 'Diskon per Item Tertentu'}</span></h3><div class="discount-item-list">${itemRows}</div></div>`;
  openModal(`<h2>${english ? 'Discounts' : 'Pilihan Diskon'}</h2><p class="muted">${english ? 'Discounts apply before tax.' : 'Diskon diterapkan sebelum pajak.'}</p><div class="discount-manager-wrap">${orderSection}${itemSection}</div><div class="modal-actions"><button class="secondary close-modal">${english ? 'Close' : 'Tutup'}</button></div>`);
  $('#modalBody').classList.add('wide');
  document.querySelectorAll('[data-discount-choice]').forEach(button => button.onclick = async () => {
    state.orderMeta[cartKey()] ||= { waiter: '—', createdAt: new Date().toISOString() };
    state.orderMeta[cartKey()].discountId = button.dataset.discountChoice || null;
    state.orderMeta[cartKey()].discountUsed = 0;
    await save(); closeModal(); renderOrder(); toast(button.dataset.discountChoice ? (english ? 'Order discount applied.' : 'Diskon order diterapkan.') : (english ? 'Order discount removed.' : 'Diskon order dihapus.'));
  });
  document.querySelectorAll('[data-item-disc-idx]').forEach(btn => btn.onclick = () => showItemDiscountPicker(Number(btn.dataset.itemDiscIdx)));
  document.querySelectorAll('[data-item-disc-clear]').forEach(btn => btn.onclick = async () => {
    const idx = Number(btn.dataset.itemDiscClear);
    if (cart[idx]) {
      delete cart[idx].itemDiscount;
      await save(); showDiscountPicker(); renderOrder();
      toast(english ? 'Item discount removed.' : 'Diskon item dihapus.');
    }
  });
}

function showTransferTableModal(sourceTable = state.table) {
  if (state.orderType !== 'dineIn') {
    toast(state.language === 'en' ? 'Table transfer is only for dine-in orders.' : 'Pindah meja hanya untuk pesanan dine-in.');
    return;
  }
  const sourceKey = `table:${sourceTable}`, sourceItems = allOpenItems(sourceKey);
  if (!sourceItems.length) { toast(state.language === 'en' ? 'No items to transfer.' : 'Tidak ada pesanan untuk dipindahkan.'); return; }
  const availableTables = state.tables.filter(t => t.id !== sourceTable), english = state.language === 'en';
  openModal(`<h2>${english ? `Move order from Table ${sourceTable}` : `Pindah pesanan Meja ${sourceTable}`}</h2><p class="muted">${english ? 'Choose the destination table for this guest.' : 'Pilih meja tujuan untuk memindahkan pesanan tamu ini.'}</p><div class="table-picker-grid">${availableTables.map(t => {
    const isOccupied = allOpenItems(`table:${t.id}`).length > 0;
    return `<button type="button" class="table-card ${isOccupied ? 'occupied' : 'available'}" data-transfer-target="${esc(t.id)}"><strong>${esc(t.id)}</strong><span>${t.seats} ${english ? 'seats' : 'kursi'} · ${isOccupied ? (english ? 'Occupied (Merge)' : 'Terisi (Gabung)') : (english ? 'Available' : 'Kosong')}</span></button>`;
  }).join('')}</div><div class="modal-actions"><button type="button" class="secondary close-modal">${english ? 'Cancel' : 'Batal'}</button></div>`);
  document.querySelectorAll('[data-transfer-target]').forEach(button => {
    button.onclick = () => {
      const targetTable = button.dataset.transferTarget, targetOccupied = allOpenItems(`table:${targetTable}`).length > 0;
      if (targetOccupied) {
        if (!confirm(english ? `Table ${targetTable} already has an active order. Merge orders into Table ${targetTable}?` : `Meja ${targetTable} sudah memiliki pesanan. Gabungkan pesanan ke Meja ${targetTable}?`)) return;
      }
      transferTable(sourceTable, targetTable);
    };
  });
}

function savedBillItemsHTML(items) {
  return `<div class="saved-bill-items">${items.map(item => {
    const itemName = state.language === 'en' ? (item.en || item.name) : item.name;
    return `<span><b>${Number(item.qty) || 0}×</b><em>${esc(itemName)}</em></span>`;
  }).join('')}</div>`;
}

renderOrder = function() {
  const panel = $('#orderPanel'), cart = currentCart(), bills = currentSplitBills(), sum = totals(cart), orderId = state.orderIds[cartKey()], discount = currentDiscount();
  const hasItems = allOpenItems(`table:${state.table}`).length > 0, isDineIn = state.orderType === 'dineIn';
  const tableLabel = !isDineIn ? 'Takeaway' : ((explicitTableSelection || hasItems) ? `Meja ${state.table}` : 'Pilih meja');
  const transferButton = isDineIn && hasItems ? `<button type="button" class="transfer-btn" id="transferTableBtn" title="Pindah meja">⇄ Pindah</button>` : '';
  panel.innerHTML = `<div class="order-head"><div><p class="eyebrow">${tableLabel} ${transferButton}</p><h2>${orderId || 'Pesanan baru'}</h2></div><button class="icon-btn" id="clearCart">×</button></div><div class="order-type"><button data-type="dineIn" class="${state.orderType === 'dineIn' ? 'active' : ''}">${t('dineIn')}</button><button data-type="takeaway" class="${state.orderType === 'takeaway' ? 'active' : ''}">${t('takeaway')}</button></div><div class="cart-tools"><button class="secondary" id="addMisc">＋ Miscellaneous</button><button class="secondary" id="selectDiscount">％ ${discount ? esc(discount.label) : (sum.itemDiscountsTotal ? 'Diskon Item' : 'Diskon')}</button></div>${bills.length ? `<div class="saved-bills"><div class="saved-bills-title"><strong>Bill tersimpan</strong><button class="mini" id="manageBills">Kelola semua</button></div>${bills.map(b => { const bt = totals(b.items), quantity = b.items.reduce((s, i) => s + i.qty, 0); return `<div class="saved-bill-card"><div class="saved-bill-summary"><strong>${esc(b.label)}</strong><small>${quantity} ${state.language === 'en' ? 'portions' : 'porsi'} · ${money(bt.total)}</small></div><div class="saved-bill-card-actions"><button class="mini unpaid-saved-bill" data-unpaid-bill="${b.id}">Unpaid</button><button class="mini pay-saved-bill" data-pay-bill="${b.id}">Bayar</button></div>${savedBillItemsHTML(b.items)}</div>`; }).join('')}</div>` : ''}<div class="cart">${cart.length ? cart.map(x => {
    const itemDisc = calculateItemDiscount(x);
    return `<div class="cart-item"><div><strong>${esc(state.language === 'id' ? x.name : x.en)}</strong><small>${money(x.price)} · ${x.taxable === false ? 'tanpa pajak' : dynamicTaxLabel().toLowerCase()}${x.miscellaneous ? ' · miscellaneous' : ''}</small>${itemDisc ? `<small class="item-discount-label">🏷️ ${esc(x.itemDiscount?.label || 'Diskon')} (−${money(itemDisc)})</small>` : ''}</div><div class="qty"><button data-minus="${x.id}">−</button><b>${x.qty}</b><button data-plus="${x.id}">+</button></div></div>`;
  }).join('') : `<div class="cart-empty">◌<br><br>${bills.length ? 'Semua item berada dalam bill tersimpan.' : t('empty')}</div>`}</div><div class="totals"><div class="total-row"><span>Subtotal</span><b>${money(sum.subtotal)}</b></div>${sum.discountAmount ? `<div class="total-row discount-row"><span>${esc(sum.discountLabel || discount?.label || 'Diskon')}</span><b>−${money(sum.discountAmount)}</b></div>` : ''}<div class="total-row"><span>Dasar kena pajak</span><b>${money(sum.taxableSubtotal)}</b></div><div class="total-row"><span>${dynamicTaxLabel()}</span><b>${money(sum.tax)}</b></div><div class="total-row grand"><span>Total</span><b>${money(sum.total)}</b></div></div><div class="prebill-actions"><button class="secondary" id="unpaidBill" ${!cart.length ? 'disabled' : ''}>Cetak unpaid bill</button></div><div class="pay-actions"><button class="secondary" id="splitBtn" ${!cart.length && !bills.length ? 'disabled' : ''}>${bills.length ? 'Kelola split' : 'Split bill'}</button><button class="primary" id="payBtn" ${!cart.length ? 'disabled' : ''}>Bayar · ${money(sum.total)}</button></div>`;
  decorateOrderPanel(); bindOrder();
};

const baseBindOrder = bindOrder;
bindOrder = function() {
  baseBindOrder();
  document.querySelectorAll('[data-type]').forEach(button => button.onclick = () => {
    state.orderType = button.dataset.type;
    if (state.orderType === 'dineIn' && !allOpenItems(`table:${state.table}`).length) explicitTableSelection = false;
    renderOrder(); save();
  });
  $('#addMisc').onclick = showMiscellaneousForm;
  $('#selectDiscount').onclick = showDiscountPicker;
  const transferBtn = $('#transferTableBtn');
  if (transferBtn) transferBtn.onclick = () => showTransferTableModal();
  $('#unpaidBill').onclick = () => showUnpaidBill(currentCart());
  document.querySelectorAll('[data-unpaid-bill]').forEach(button => button.onclick = () => {
    const bill = currentSplitBills().find(x => x.id === button.dataset.unpaidBill); showUnpaidBill(bill.items, bill.personNumber);
  });
};

function provisionalBill(items, person = null) {
  const sum = totals(items), now = new Date(), meta = currentOrderMeta() || {};
  return { id: `UNPAID-${state.orderIds[cartKey()] || ensureOrderId()}`, orderId: state.orderIds[cartKey()], status: 'unpaid', date: businessDate(now), time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), payment: 'BELUM DIBAYAR / UNPAID', cashier: state.user.name, cashierId: state.user.id, shiftId: state.shift.id, shiftName: state.shift.name, waiter: meta.waiter || '—', table: state.orderType === 'dineIn' ? state.table : 'Takeaway', splitPerson: person, ...sum, lineItems: items.map(x => ({ productId: x.id, name: x.name, nameEn: x.en, category: x.category, qty: x.qty, price: x.price, taxable: x.taxable !== false, miscellaneous: Boolean(x.miscellaneous), itemDiscount: x.itemDiscount ? { ...x.itemDiscount } : null, discountAmount: calculateItemDiscount(x), lineTotal: Math.max(0, x.price * x.qty - calculateItemDiscount(x)), rawLineTotal: x.price * x.qty })) };
}

function showUnpaidBill(items, person = null) {
  if (!orderContextReady() || !items.length) return;
  const bill = provisionalBill(items.map(x => ({ ...x })), person);
  openModal(`${receiptHTML(bill, 0, 'customer')}<div class="modal-actions receipt-actions"><button class="secondary close-modal">Tutup</button><button class="primary" id="printReceipt">Cetak unpaid bill</button></div>`);
  $('#printReceipt').onclick = () => printReceipt();
}

function cashButtons() { return [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]; }
function showCashTender(items, confirmPayment, back) {
  const total = totals(items).total;
  openModal(`<h2>Pembayaran tunai</h2><div class="cash-total"><span>Total tagihan</span><strong>${money(total)}</strong></div><label class="field"><span>Jumlah uang tamu (Rp)</span><input id="cashTendered" type="number" min="0" step="1" inputmode="numeric" value="0" autofocus></label><div class="cash-denominations"><button class="exact-cash" data-cash-exact>Uang pas</button>${cashButtons().map(value => `<button data-cash-add="${value}">+ ${money(value).replace(/,00$/, '')}</button>`).join('')}</div><div class="cash-change"><span>Kembalian</span><strong id="cashChange">${money(0)}</strong></div><p class="form-error" id="cashError"></p><div class="modal-actions"><button class="secondary" id="cashBack">Kembali</button><button class="primary" id="confirmCash" disabled>Konfirmasi tunai</button></div>`);
  const input = $('#cashTendered'), change = $('#cashChange'), confirm = $('#confirmCash'), error = $('#cashError');
  const refresh = () => { const tendered = Number(input.value) || 0, due = tendered - total; change.textContent = money(Math.max(0, due)); confirm.disabled = tendered < total; error.textContent = tendered && tendered < total ? `Masih kurang ${money(total - tendered)}.` : ''; };
  input.oninput = refresh;
  document.querySelectorAll('[data-cash-add]').forEach(button => button.onclick = () => { input.value = (Number(input.value) || 0) + Number(button.dataset.cashAdd); refresh(); });
  $('[data-cash-exact]').onclick = () => { input.value = total; refresh(); };
  $('#cashBack').onclick = back;
  confirm.onclick = () => { const tendered = Number(input.value) || 0; if (tendered >= total) confirmPayment({ tendered, change: tendered - total }); };
  refresh();
}

showPayment = function() {
  if (!orderContextReady()) return;
  const sum = totals();
  openModal(`<h2>Konfirmasi pembayaran</h2><p>${state.orderIds[cartKey()]} · ${state.orderType === 'dineIn' ? `Meja ${state.table}` : 'Takeaway'} · <strong>${money(sum.total)}</strong></p><div class="payment-grid">${[['cash', '💵'], ['card', '💳'], ['qris', '▦']].map(([key, icon]) => `<button data-payment="${key}">${icon}<span>${t(key)}</span></button>`).join('')}</div><div class="modal-actions"><button class="secondary close-modal">Tutup</button></div>`);
  document.querySelectorAll('[data-payment]').forEach(button => button.onclick = () => button.dataset.payment === 'cash' ? showCashTender(currentCart(), details => completePayment('cash', details), showPayment) : completePayment(button.dataset.payment));
};

showSavedBillPayment = function(billId) {
  if (!orderContextReady()) return;
  const bill = currentSplitBills().find(x => x.id === billId), sum = totals(bill.items);
  openModal(`<h2>Bayar ${esc(bill.label)}</h2><p>${state.orderIds[cartKey()]} · Meja ${state.table} · <strong>${money(sum.total)}</strong></p><div class="pending-bill-preview">${bill.items.map(i => `<div class="total-row"><span>${i.qty}× ${esc(state.language === 'en' ? (i.en || i.name) : i.name)}</span><strong>${money(i.price * i.qty)}</strong></div>`).join('')}</div><div class="payment-grid">${[['cash', '💵'], ['card', '💳'], ['qris', '▦']].map(([key, icon]) => `<button data-saved-payment="${key}">${icon}<span>${t(key)}</span></button>`).join('')}</div><div class="modal-actions"><button class="secondary" id="backSavedBills">Kembali</button></div>`);
  $('#backSavedBills').onclick = showSplit;
  document.querySelectorAll('[data-saved-payment]').forEach(button => button.onclick = () => button.dataset.savedPayment === 'cash' ? showCashTender(bill.items, details => completeSavedBillPayment(billId, 'cash', details), () => showSavedBillPayment(billId)) : completeSavedBillPayment(billId, button.dataset.savedPayment));
};

makeTransaction = function(items, method, person = null, paymentDetails = {}) {
  const sum = totals(items), now = new Date(), orderId = state.orderIds[cartKey()] || ensureOrderId(), meta = state.orderMeta[cartKey()] || {};
  if (sum.orderDiscountAmount) meta.discountUsed = Number(meta.discountUsed || 0) + sum.orderDiscountAmount;
  return { id: nextDocumentId('INV', 'nextInvoiceNumber'), orderId, status: 'closed', date: businessDate(now), timestamp: now.toISOString(), time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), payment: t(method), paymentCode: method, tendered: paymentDetails.tendered ?? null, change: paymentDetails.change ?? null, cashier: state.user.name, cashierId: state.user.id, shiftId: state.shift.id, shiftName: state.shift.name, waiter: meta.waiter || '—', table: state.orderType === 'dineIn' ? state.table : 'Takeaway', splitPerson: person, ...sum, lineItems: items.map(x => { const disc = calculateItemDiscount(x); return { productId: x.id, name: x.name, nameEn: x.en, category: x.category, qty: x.qty, price: x.price, taxable: x.taxable !== false, miscellaneous: Boolean(x.miscellaneous), itemDiscount: x.itemDiscount ? { ...x.itemDiscount } : null, discountAmount: disc, lineTotal: Math.max(0, x.price * x.qty - disc), rawLineTotal: x.price * x.qty }; }), items: items.map(x => `${x.qty}× ${x.name}`) };
};

function localizedReceiptItemName(item) {
  if (state.language !== 'en') return item.name;
  return item.nameEn || item.en || state.products.find(product => product.id === item.productId)?.en || item.name;
}

const RECEIPT_FONT_FAMILIES = {
  distinct: '"Segoe UI", "Trebuchet MS", "Lucida Sans Unicode", "DejaVu Sans", sans-serif',
  sansClean: 'Tahoma, Verdana, "Segoe UI", sans-serif',
  bold: 'Arial, "Segoe UI", sans-serif',
  medium: 'Arial, "Segoe UI", sans-serif',
  clear: 'Consolas, "Courier New", monospace'
};

function getReceiptFontFamily(style) {
  const s = style || state.settings?.receiptFontStyle || 'clear';
  return RECEIPT_FONT_FAMILIES[s] || RECEIPT_FONT_FAMILIES.clear;
}

function applyReceiptFontToDOM() {
  const fontFam = getReceiptFontFamily();
  document.documentElement.style.setProperty('--receipt-font', fontFam);
}

receiptHTML = function(transaction, index = 0, copyType = 'customer') {
  const logo = state.settings.brandLogo ? `<img class="receipt-logo" src="${state.settings.brandLogo}" alt="Logo">` : '';
  const status = transaction.status === 'unpaid' ? 'UNPAID BILL / BELUM DIBAYAR' : transaction.status === 'void' ? 'VOID' : 'CLOSED BILL / LUNAS';
  const copy = copyType === 'restaurant' ? '<br>SALINAN RESTO / RESTAURANT COPY' : '';
  const fontFam = getReceiptFontFamily();
  return `<div class="receipt" data-receipt="${index}" style="font-family: ${fontFam}">${logo}<h2>${esc(state.settings.restaurantName)}</h2><p style="text-align:center"><strong>${status}</strong>${copy}<br>${esc(transaction.id)}<br>${esc(transaction.orderId)} · ${esc(transaction.time)}<br>${esc(transaction.table)}${transaction.splitPerson ? ` · Orang ${transaction.splitPerson}` : ''}<br>Waiter: ${esc(transaction.waiter || '—')}</p>${(transaction.lineItems || []).map(x => { const discLine = x.discountAmount ? `<div class="receipt-line receipt-item-discount"><span>&nbsp;&nbsp;↳ ${esc(x.itemDiscount?.label || 'Diskon item')}</span><span>-${money(x.discountAmount)}</span></div>` : ''; return `<div class="receipt-line"><span>${x.qty}× ${esc(localizedReceiptItemName(x))}</span><span>${money(x.lineTotal ?? (x.price * x.qty))}</span></div>${discLine}`; }).join('')}<div class="receipt-line receipt-total"><span>Subtotal</span><span>${money(transaction.subtotal || 0)}</span></div>${transaction.discountAmount ? `<div class="receipt-line"><span>${esc(transaction.discountLabel || 'Diskon')}</span><span>-${money(transaction.discountAmount)}</span></div>` : ''}<div class="receipt-line"><span>Dasar kena pajak</span><span>${money(transaction.taxableSubtotal || 0)}</span></div><div class="receipt-line"><span>${dynamicTaxLabel(transaction.taxRate ?? 10)}</span><span>${money(transaction.tax || 0)}</span></div><div class="receipt-line"><strong>Total</strong><strong>${money(transaction.total || 0)}</strong></div>${transaction.paymentCode === 'cash' && transaction.tendered !== null ? `<div class="receipt-line"><span>Uang tamu</span><span>${money(transaction.tendered)}</span></div><div class="receipt-line"><span>Kembalian</span><span>${money(transaction.change || 0)}</span></div>` : ''}<p style="text-align:center">${esc(transaction.payment || '')}<br>Kasir: ${esc(transaction.cashier || state.user.name)}<br><br>Terima kasih · Thank you</p></div>`;
};



function showCompletedTransactions(transactions, copyType = 'customer') {
  const label = copyType === 'restaurant' ? 'salinan resto' : 'bill tamu';
  openModal(`${transactions.map((trx, index) => receiptHTML(trx, index, copyType)).join('<hr class="receipt-separator">')}<div class="modal-actions receipt-actions split-print-actions"><button class="secondary close-modal">Tutup</button><button class="secondary" id="switchReceiptCopy">${copyType === 'customer' ? 'Lihat salinan resto' : 'Lihat bill tamu'}</button><button class="primary" id="printReceipt">Cetak ${label}${transactions.length > 1 ? ' semua' : ''}</button></div>`);
  if (transactions.length > 1) $('#modalBody').classList.add('wide');
  $('#switchReceiptCopy').onclick = () => showCompletedTransactions(transactions, copyType === 'customer' ? 'restaurant' : 'customer');
  $('#printReceipt').onclick = () => printReceipt();
}

finalizeBillComponent = async function(transaction, items, billId = null) {
  const key = cartKey(); state.transactions.push(transaction);
  if (state.settings.kitchenEnabled) state.tickets.unshift({ id: `D-${transaction.id.split('-').pop()}`, orderId: transaction.orderId, table: state.orderType === 'dineIn' ? state.table : 'TA', items: items.map(x => `${x.qty}× ${x.name}`), status: 'cooking', time: transaction.time });
  items.forEach(item => { const product = state.products.find(x => x.id === item.id); if (product && !product.unlimitedStock) product.stock = Math.max(0, product.stock - item.qty); });
  if (billId) state.splitBills[key] = currentSplitBills().filter(x => x.id !== billId); else replaceCurrentCart([]);
  if (!currentCart().length && !currentSplitBills().length) { delete state.orderIds[key]; delete state.splitPersonCounters[key]; delete state.orderMeta[key]; explicitTableSelection = false; }
  await save(); render(); showCompletedTransactions([transaction]); toast('Pembayaran berhasil. Closed bill siap dicetak.');
};

finalizeOrder = async function(transactions, originalCart) {
  const key = cartKey(), orderId = state.orderIds[key], time = transactions[0].time; state.transactions.push(...transactions);
  if (state.settings.kitchenEnabled) state.tickets.unshift({ id: `D-${orderId.split('-').pop()}`, orderId, table: state.orderType === 'dineIn' ? state.table : 'TA', items: originalCart.map(x => `${x.qty}× ${x.name}`), status: 'cooking', time });
  originalCart.forEach(item => { const product = state.products.find(x => x.id === item.id); if (product && !product.unlimitedStock) product.stock = Math.max(0, product.stock - item.qty); });
  replaceCurrentCart([]); delete state.orderIds[key]; delete state.orderMeta[key]; delete state.splitPersonCounters[key]; explicitTableSelection = false;
  await save(); render(); showCompletedTransactions(transactions); toast(`${transactions.length} closed bill siap dicetak.`);
};

completePayment = async function(method, paymentDetails = {}) { const items = currentCart().map(x => ({ ...x })); await finalizeBillComponent(makeTransaction(items, method, null, paymentDetails), items); };
completeSavedBillPayment = async function(billId, method, paymentDetails = {}) { const bill = currentSplitBills().find(x => x.id === billId), items = bill.items.map(x => ({ ...x })); await finalizeBillComponent(makeTransaction(items, method, bill.personNumber, paymentDetails), items, billId); };

function shiftDisplay(transaction) {
  if (transaction.shiftName) return transaction.shiftName;
  if (state.shift?.id === transaction.shiftId) return state.shift.name;
  return state.shiftHistory.find(x => x.id === transaction.shiftId)?.name || transaction.shiftId || '—';
}
function isVoid(transaction) { return transaction.status === 'void'; }
function activeSalesTransactions(rows) { return rows.filter(x => !isVoid(x)); }

monthlyRevenueData = function(month = reportMonth) {
  const [year, monthNumber] = month.split('-').map(Number), days = new Date(year, monthNumber, 0).getDate(), values = Array(days).fill(0);
  activeSalesTransactions(state.transactions).filter(x => { const date = transactionDate(x); return date.startsWith(`${month}-`) && (reportPayment === 'all' || paymentMatches(x, reportPayment)) && (reportCashier === 'all' || String(x.cashierId) === reportCashier); }).forEach(x => { const day = Number(transactionDate(x).slice(8, 10)); if (day >= 1 && day <= days) values[day - 1] += (Number(x.subtotal) || 0) - (Number(x.discountAmount) || 0); });
  return { values, total: values.reduce((a, b) => a + b, 0), max: Math.max(0, ...values) };
};

summarizeTransactions = function(rows) {
  const valid = activeSalesTransactions(rows), byPayment = { cash: 0, card: 0, qris: 0 };
  for (const transaction of valid) { const code = ['cash', 'card', 'qris'].find(method => paymentMatches(transaction, method)); if (code) byPayment[code] += Number(transaction.total) || 0; }
  return { count: valid.length, voidCount: rows.length - valid.length, sales: valid.reduce((sum, transaction) => sum + (Number(transaction.subtotal) || 0) - (Number(transaction.discountAmount) || 0), 0), collected: valid.reduce((sum, transaction) => sum + (Number(transaction.total) || 0), 0), tax: valid.reduce((sum, transaction) => sum + (Number(transaction.tax) || 0), 0), byPayment };
};

mountReportWaiterColumn = function() {};
renderReports = function() {
  const rows = filteredTransactions(), valid = activeSalesTransactions(rows), subtotal = valid.reduce((s, x) => s + (x.subtotal || 0), 0), discounts = valid.reduce((s, x) => s + (x.discountAmount || 0), 0), sales = subtotal - discounts, tax = valid.reduce((s, x) => s + (x.tax || 0), 0), payments = ['cash', 'card', 'qris'].map(code => ({ code, total: valid.filter(x => paymentMatches(x, code)).reduce((s, x) => s + (x.total || 0), 0) })), itemSummary = {};
  valid.forEach(x => (x.lineItems || []).forEach(item => { itemSummary[item.name] ||= { name: item.name, qty: 0, total: 0 }; itemSummary[item.name].qty += item.qty; itemSummary[item.name].total += item.lineTotal; }));
  const topItems = Object.values(itemSummary).sort((a, b) => b.qty - a.qty).slice(0, 5);
  return `<div class="report-filters"><label>Dari<input id="reportFrom" type="date" value="${reportFrom}"></label><label>Sampai<input id="reportTo" type="date" value="${reportTo}"></label><label>Pembayaran<select id="reportPayment"><option value="all">Semua</option><option value="cash" ${reportPayment === 'cash' ? 'selected' : ''}>Tunai</option><option value="card" ${reportPayment === 'card' ? 'selected' : ''}>Kartu</option><option value="qris" ${reportPayment === 'qris' ? 'selected' : ''}>QRIS</option></select></label><label>Kasir<select id="reportCashier"><option value="all">Semua</option>${state.users.map(u => `<option value="${u.id}" ${reportCashier === String(u.id) ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label><button class="secondary" id="exportReport">Ekspor CSV</button></div><div class="report-cards"><div class="stat"><small>Subtotal</small><strong>${money(subtotal)}</strong></div><div class="stat"><small>Diskon</small><strong>${money(discounts)}</strong></div><div class="stat"><small>Pajak</small><strong>${money(tax)}</strong></div><div class="stat"><small>Penjualan bersih</small><strong>${money(sales)}</strong></div><div class="stat"><small>Transaksi lunas</small><strong>${valid.length}</strong></div><div class="stat void-stat"><small>Transaksi void</small><strong>${rows.length - valid.length}</strong></div></div><div class="report-breakdown"><div class="panel"><h3>Metode pembayaran</h3>${payments.map(x => `<div class="total-row"><span>${t(x.code)}</span><strong>${money(x.total)}</strong></div>`).join('')}</div><div class="panel"><h3>Menu terlaris</h3>${topItems.map((x, index) => `<div class="total-row"><span>${index + 1}. ${esc(x.name)} · ${x.qty} porsi</span><strong>${money(x.total)}</strong></div>`).join('') || '<p class="muted">Belum ada data item aktif.</p>'}</div></div><h3>Rincian transaksi</h3><div class="report-table-wrap"><table class="report-table detailed audit-table"><thead><tr><th>Status</th><th>Tanggal / invoice</th><th>Meja / waiter</th><th>Kasir / shift</th><th>Pembayaran</th><th>Subtotal</th><th>Diskon</th><th>Pajak</th><th>Total</th><th>Item / tindakan</th></tr></thead><tbody>${rows.slice().reverse().map(x => `<tr class="${isVoid(x) ? 'void-row' : ''}"><td><span class="status-pill ${isVoid(x) ? 'void-pill' : ''}">${isVoid(x) ? 'VOID' : 'CLOSED'}</span>${isVoid(x) ? `<small>${esc(x.voidReason || 'Tanpa alasan')}<br>Oleh ${esc(x.voidBy || '—')} · ${dateTime(x.voidAt)}</small>` : ''}</td><td><strong>${esc(x.id)}</strong><br><small>${esc(x.date || '—')} · ${esc(x.time || '—')}<br>${esc(x.orderId || '—')}</small></td><td>${esc(x.table || '—')}<br><small>Waiter: ${esc(x.waiter || '—')}</small></td><td>${esc(x.cashier || '—')}<br><small>${esc(shiftDisplay(x))}<br>${esc(x.shiftId || '—')}</small></td><td>${esc(x.payment || '—')}${x.tendered !== null && x.tendered !== undefined ? `<br><small>Uang ${money(x.tendered)}<br>Kembali ${money(x.change || 0)}</small>` : ''}</td><td>${money(x.subtotal || 0)}</td><td>${money(x.discountAmount || 0)}</td><td>${money(x.tax || 0)}<br><small>${Number(x.taxRate ?? 10)}%</small></td><td><strong>${money(x.total || 0)}</strong></td><td><details><summary>${(x.lineItems || x.items || []).length} item</summary><div class="detail-items">${x.lineItems?.map(i => `${i.qty}× ${esc(i.name)} — ${money(i.lineTotal)}`).join('<br>') || '—'}</div></details><div class="audit-actions"><button class="mini reprint-transaction" data-reprint="${esc(x.id)}">Cetak ulang</button>${!isVoid(x) && state.user.role !== 'cashier' ? `<button class="mini danger-text void-transaction" data-void="${esc(x.id)}">Void</button>` : ''}</div></td></tr>`).join('') || '<tr><td colspan="10">Tidak ada transaksi.</td></tr>'}</tbody></table></div>`;
};

exportReportCSV = function() {
  const rows = filteredTransactions(), safe = value => { let text = String(value ?? ''); if (/^[=+\-@]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  const header = ['Status', 'Alasan void', 'Tanggal', 'Waktu', 'Invoice', 'Order', 'Meja', 'Waiter', 'Kasir', 'Shift ID', 'Shift', 'Pembayaran', 'Uang tamu', 'Kembalian', 'Subtotal', 'Diskon', 'Pajak %', 'Pajak', 'Total', 'Item'];
  const lines = rows.map(x => [isVoid(x) ? 'VOID' : 'CLOSED', x.voidReason, x.date, x.time, x.id, x.orderId, x.table, x.waiter, x.cashier, x.shiftId, shiftDisplay(x), x.payment, x.tendered, x.change, x.subtotal, x.discountAmount, x.taxRate ?? 10, x.tax, x.total, (x.lineItems || []).map(i => `${i.qty}x ${i.name}`).join('; ')].map(safe).join(','));
  const blob = new Blob(['\ufeff' + [header.map(safe).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `laporan-anda-pos-${businessDate()}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};

renderShift = function() {
  const today = summarizeTransactions(todayTransactions()), activeRows = transactionsForShift(), active = summarizeTransactions(activeRows), history = state.shiftHistory || [];
  return `<div class="section-title"><div><h2>Shift kasir</h2><p class="muted">Transaksi void tidak dihitung sebagai penjualan.</p></div><button class="${state.shift.open ? 'danger' : 'primary'}" id="toggleShift">${state.shift.open ? 'Akhiri shift' : 'Mulai shift'}</button></div><div class="cards"><div class="stat"><small>Penjualan hari ini</small><strong>${money(today.sales)}</strong></div><div class="stat"><small>Transaksi hari ini</small><strong>${today.count}</strong></div><div class="stat"><small>Void hari ini</small><strong>${today.voidCount}</strong></div></div><br>${state.shift.open ? `<div class="panel"><div class="section-title"><div><h3>${esc(state.shift.name)}</h3><p>${esc(state.shift.cashierName)} · ${esc(state.shift.id)} · Dibuka ${dateTime(state.shift.openedAt)}</p></div><span class="status-pill">Shift aktif</span></div><div class="cards"><div class="stat"><small>Penjualan shift</small><strong>${money(active.sales)}</strong></div><div class="stat"><small>Transaksi shift</small><strong>${active.count}</strong></div><div class="stat"><small>Kas seharusnya</small><strong>${money((state.shift.openingCash || 0) + active.byPayment.cash)}</strong></div></div></div><h3>Transaksi shift · cetak ulang</h3><div class="recent-transactions">${activeRows.slice().reverse().map(x => `<article class="${isVoid(x) ? 'void-row' : ''}"><div><strong>${esc(x.id)}</strong><small>${esc(x.table)} · ${esc(x.payment)} · ${money(x.total)}${isVoid(x) ? ' · VOID' : ''}</small></div><button class="mini reprint-transaction" data-reprint="${esc(x.id)}">Cetak ulang</button></article>`).join('') || '<p class="muted">Belum ada transaksi pada shift ini.</p>'}</div><br>` : '<div class="panel"><h3>Tidak ada shift aktif</h3><p class="muted">Mulai shift sebelum memasukkan pesanan.</p></div><br>'}<h3>Riwayat shift</h3><div class="report-table-wrap"><table class="report-table"><thead><tr><th>Shift</th><th>Kasir</th><th>Dibuka / ditutup</th><th>Transaksi</th><th>Penjualan</th><th>Selisih kas</th></tr></thead><tbody>${history.slice(0, 30).map(shift => `<tr><td><strong>${esc(shift.name)}</strong><br><small>${esc(shift.id)}</small></td><td>${esc(shift.cashierName || '—')}</td><td>${dateTime(shift.openedAt)}<br><small>${dateTime(shift.closedAt)}</small></td><td>${shift.transactionCount || 0}</td><td>${money(shift.sales || 0)}</td><td>${money(shift.difference || 0)}</td></tr>`).join('') || '<tr><td colspan="6">Belum ada shift yang ditutup.</td></tr>'}</tbody></table></div>`;
};
const commercialRenderShift = renderShift;
renderShift = function() {
  const html = commercialRenderShift();
  if (state.shift.open) return html;
  const recent = todayTransactions().slice().reverse().slice(0, 50);
  const section = `<h3>Transaksi hari ini · cetak ulang</h3><div class="recent-transactions">${recent.map(x => `<article class="${isVoid(x) ? 'void-row' : ''}"><div><strong>${esc(x.id)}</strong><small>${esc(x.table || '—')} · ${esc(x.payment || '—')} · ${money(x.total || 0)}${isVoid(x) ? ' · VOID' : ''}</small></div><button class="mini reprint-transaction" data-reprint="${esc(x.id)}">Cetak ulang</button></article>`).join('') || '<p class="muted">Belum ada transaksi hari ini.</p>'}</div><br>`;
  return html.replace('<h3>Riwayat shift</h3>', `${section}<h3>Riwayat shift</h3>`);
};

function showTransactionReceipt(transactionId, copyType = 'customer') {
  const transaction = state.transactions.find(x => x.id === transactionId); if (!transaction) { toast('Transaksi tidak ditemukan.'); return; }
  openModal(`${receiptHTML(transaction, 0, copyType)}<div class="modal-actions receipt-actions"><button class="secondary close-modal">Tutup</button><button class="secondary" id="toggleCopy">${copyType === 'customer' ? 'Salinan resto' : 'Bill tamu'}</button><button class="primary" id="printReceipt">Cetak ulang</button></div>`);
  $('#toggleCopy').onclick = () => showTransactionReceipt(transactionId, copyType === 'customer' ? 'restaurant' : 'customer'); $('#printReceipt').onclick = () => printReceipt();
}

function showVoidForm(transactionId) {
  if (state.user.role === 'cashier') { toast('Void hanya dapat dilakukan Owner atau Admin.'); return; }
  const transaction = state.transactions.find(x => x.id === transactionId); if (!transaction || isVoid(transaction)) return;
  openModal(`<h2>Void transaksi</h2><div class="void-warning"><strong>${esc(transaction.id)} · ${money(transaction.total)}</strong><span>${esc(transaction.table)} · ${esc(transaction.cashier)}</span></div><form id="voidForm"><label class="field"><span>Alasan void</span><textarea name="reason" required minlength="5" maxlength="250" autofocus placeholder="Contoh: Transaksi terinput dua kali"></textarea></label><p class="muted">Transaksi tetap tersimpan di laporan dengan status VOID dan tidak dihitung sebagai pendapatan.</p><div class="modal-actions"><button type="button" class="secondary close-modal">Batal</button><button class="danger">Void transaksi</button></div></form>`);
  $('#voidForm').onsubmit = async event => {
    event.preventDefault(); const reason = String(new FormData(event.target).get('reason')).trim(); if (reason.length < 5) return;
    transaction.status = 'void'; transaction.voidReason = reason; transaction.voidAt = new Date().toISOString(); transaction.voidBy = state.user.name; transaction.voidById = state.user.id;
    (transaction.lineItems || []).forEach(item => { const product = state.products.find(x => x.id === item.productId); if (product && !product.unlimitedStock) product.stock += Number(item.qty) || 0; });
    await save(); closeModal(); render(); toast(`${transaction.id} berhasil di-void.`);
  };
}

function mountCommercialSettings() {
  commercialDefaults(); const form = $('#settingsForm'), dataPanel = form?.querySelector('.data-panel'); if (!form || !dataPanel || $('#commercialSettings')) return;
  const section = document.createElement('section'); section.className = 'setting-panel commercial-panel'; section.id = 'commercialSettings';
  section.innerHTML = `<div class="setting-icon">％</div><div><h3>Pajak & diskon</h3><p>Ubah tarif pajak dan pilihan diskon yang dapat digunakan kasir.</p><label class="field"><span>Tarif pajak (%)</span><input name="taxRate" type="number" min="0" max="100" step="0.01" value="${currentTaxRate()}" required></label><div class="discount-setting-head"><strong>Pilihan diskon</strong><button type="button" class="mini" id="addDiscountOption">+ Tambah</button></div><div class="discount-setting-list">${state.settings.discountOptions.map(x => `<div><span><strong>${esc(x.label)}</strong><small>${x.type === 'percent' ? `${x.value}%` : money(x.value)}</small></span><span><button type="button" class="mini edit-discount-option" data-discount-edit="${esc(x.id)}">Edit</button><button type="button" class="mini danger-text delete-discount-option" data-discount-delete="${esc(x.id)}">Hapus</button></span></div>`).join('') || '<small>Belum ada pilihan diskon.</small>'}</div></div>`;
  dataPanel.before(section);
  const actions = dataPanel.querySelector('.data-actions'); actions?.insertAdjacentHTML('beforeend', '<button type="button" class="secondary" id="backupMenu">Backup menu saja</button><button type="button" class="secondary" id="restoreMenu">Restore menu saja</button>');
}

function showDiscountOptionForm(id = null) {
  const option = state.settings.discountOptions.find(x => x.id === id) || { label: '', type: 'percent', value: 10 };
  openModal(`<h2>${id ? 'Edit' : 'Tambah'} pilihan diskon</h2><form id="discountOptionForm"><label class="field"><span>Nama pilihan</span><input name="label" value="${esc(option.label)}" required maxlength="40" autofocus placeholder="Contoh: Diskon pelanggan 10%"></label><label class="field"><span>Jenis diskon</span><select name="type"><option value="percent" ${option.type === 'percent' ? 'selected' : ''}>Persen (%)</option><option value="fixed" ${option.type === 'fixed' ? 'selected' : ''}>Nominal (Rp)</option></select></label><label class="field"><span>Nilai</span><input name="value" type="number" min="0" step="0.01" value="${option.value}" required></label><div class="modal-actions"><button type="button" class="secondary close-modal">Batal</button><button class="primary">Simpan pilihan</button></div></form>`);
  $('#discountOptionForm').onsubmit = async event => { event.preventDefault(); const form = new FormData(event.target), data = { label: String(form.get('label')).trim(), type: form.get('type') === 'fixed' ? 'fixed' : 'percent', value: Math.max(0, Number(form.get('value')) || 0) }; if (id) Object.assign(option, data); else state.settings.discountOptions.push({ id: `disc-${Date.now()}`, ...data }); await save(); closeModal(); render(); toast('Pilihan diskon disimpan.'); };
}

const baseRenderView = renderView;
renderView = function() { baseRenderView(); if (state.activeView === 'settings') mountCommercialSettings(); };
const baseRenderMenuManagement = renderMenuManagement;
renderMenuManagement = function() { return baseRenderMenuManagement().replaceAll('Tax 10%', dynamicTaxLabel()).replaceAll('tax 10%', dynamicTaxLabel().toLowerCase()); };
const baseShowProductForm = showProductForm;
showProductForm = function(id) { baseShowProductForm(id); const taxCheck = [...document.querySelectorAll('#productForm .check')].find(label => label.textContent.includes('Kenakan pajak')); if (taxCheck?.lastChild) taxCheck.lastChild.textContent = ` Kenakan ${dynamicTaxLabel()}`; };
showTestReceipt = function() { const now = new Date(), rate = currentTaxRate(), taxableSubtotal = 100000, tax = Math.round(taxableSubtotal * rate / 100), sample = { id: 'TEST-80MM', orderId: 'ORD-TEST', status: 'closed', time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), table: state.language === 'en' ? 'Test Table' : 'Meja Uji', waiter: state.language === 'en' ? 'Waiter Name' : 'Nama Waiter', cashier: state.user.name, shiftId: state.shift.id || 'SFT-TEST', shiftName: state.shift.name || 'Shift Uji', payment: 'TEST PRINT', subtotal: 150000, discountAmount: 0, taxableSubtotal, taxRate: rate, tax, total: 150000 + tax, lineItems: [{ qty: 1, name: 'Nasi Goreng Spesial', nameEn: 'Special Fried Rice', taxable: true, lineTotal: 100000 }, { qty: 1, name: 'Minuman Tanpa Pajak', nameEn: 'Tax-exempt Drink', taxable: false, lineTotal: 50000 }] }; openModal(`${receiptHTML(sample)}<div class="modal-actions receipt-actions"><button class="secondary close-modal">${state.language === 'en' ? 'Close' : 'Tutup'}</button><button class="primary" id="printReceipt">${state.language === 'en' ? 'Print 80 mm test' : 'Cetak uji 80 mm'}</button></div>`); $('#printReceipt').onclick = () => printReceipt(); };
const baseSaveOperationalSettings = saveOperationalSettings;
saveOperationalSettings = async function(form) { const rate = Number(new FormData(form).get('taxRate')); state.settings.taxRate = Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) : 10; await baseSaveOperationalSettings(form); applyReceiptFontToDOM(); };
applyReceiptFontToDOM();


async function backupMenuOnly() {
  const data = { categories: state.categories, products: state.products };
  if (window.desktop?.backupMenu) { const result = await window.desktop.backupMenu(data); if (result?.success) toast('Backup menu berhasil disimpan.'); else if (!result?.canceled) toast(result?.error || 'Backup menu gagal.'); return; }
  const blob = new Blob([JSON.stringify({ format: 'anda-pos-menu', version: 1, ...data }, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `anda-pos-menu-${businessDate()}.andamenu`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function showRestoreDatabaseModal() {
  const english = state.language === 'en';
  if (state.user.role !== 'owner') {
    toast(english ? 'Database restore is only permitted for the Owner.' : 'Restore database hanya dapat dilakukan oleh Owner.');
    return;
  }
  const owner = state.users.find(user => user.id === state.user.id && user.role === 'owner' && user.active !== false);
  if (!owner) {
    toast(english ? 'Active Owner account not found.' : 'Akun Owner aktif tidak ditemukan.');
    return;
  }
  openModal(`
    <div class="reset-warning">
      <span>⚠️</span>
      <div>
        <h2>${english ? 'Warning: Restore Full Database' : 'Peringatan: Restore Database Lengkap'}</h2>
        <p>${english ? 'Restoring a database will PERMANENTLY REPLACE and DELETE all current active data (menus, stock, transactions, shift history, tables, and settings).' : 'Restore akan MENGGANTI & MENGHAPUS PERMANEN seluruh database yang sedang aktif saat ini (menu, stok, riwayat transaksi, sesi shift, meja, dan pengaturan).'}</p>
      </div>
    </div>
    <div style="background:#fff8e6; border:1px solid #fde68a; border-radius:10px; padding:12px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
      <div>
        <strong style="color:#b45309; font-size:13px; display:block;">${english ? 'Need to back up current database first?' : 'Belum membuat backup database saat ini?'}</strong>
        <span style="font-size:11px; color:#78350f;">${english ? 'It is strongly recommended to back up before restoring.' : 'Sangat disarankan untuk membuat backup sebelum restore.'}</span>
      </div>
      <button type="button" class="secondary mini" id="modalBackupDbBtn" style="white-space:nowrap;">⬇️ ${english ? 'Backup now' : 'Buat backup sekarang'}</button>
    </div>
    <form id="restoreDatabaseForm">
      <label class="field">
        <span>${english ? 'Current Owner PIN' : 'PIN Owner saat ini'}</span>
        <input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" required autocomplete="off" autofocus>
      </label>
      <label class="reset-confirm-check">
        <input name="understood" type="checkbox" required>
        <span>${english ? 'I understand that current database will be permanently overwritten by the selected backup file.' : 'Saya memahami bahwa database saat ini akan diganti permanen oleh file backup yang dipilih.'}</span>
      </label>
      <p class="form-error" id="restoreDatabaseError"></p>
      <div class="modal-actions">
        <button type="button" class="secondary close-modal">${english ? 'Cancel' : 'Batal'}</button>
        <button class="danger">${english ? 'Proceed to select backup file…' : 'Lanjutkan pilih file backup…'}</button>
      </div>
    </form>
  `);

  const backupBtn = $('#modalBackupDbBtn');
  if (backupBtn) backupBtn.onclick = () => backupDatabase();

  $('#restoreDatabaseForm').onsubmit = async event => {
    event.preventDefault();
    const error = $('#restoreDatabaseError');
    const pin = new FormData(event.target).get('pin');
    const pinHash = await hashPin(pin);
    if (pinHash !== owner.pinHash) {
      error.textContent = english ? 'Incorrect Owner PIN.' : 'PIN Owner tidak sesuai.';
      event.target.pin.select();
      return;
    }
    if (!window.desktop?.restoreDatabase) {
      error.textContent = english ? 'Restore is only available in the desktop application.' : 'Restore hanya tersedia pada aplikasi desktop.';
      return;
    }
    closeModal();
    const result = await window.desktop.restoreDatabase();
    if (result?.success) {
      toast(english ? 'Database restored successfully. Reloading…' : 'Database berhasil dipulihkan. Memuat ulang aplikasi…');
      setTimeout(() => location.reload(), 600);
    } else if (!result?.canceled) {
      toast(result?.error || (english ? 'Database restore failed.' : 'Restore database gagal.'));
    }
  };
}

function showRestoreMenuModal() {
  const english = state.language === 'en';
  if (state.user.role !== 'owner') {
    toast(english ? 'Menu restore is only permitted for the Owner.' : 'Restore menu hanya dapat dilakukan oleh Owner.');
    return;
  }
  const owner = state.users.find(user => user.id === state.user.id && user.role === 'owner' && user.active !== false);
  if (!owner) {
    toast(english ? 'Active Owner account not found.' : 'Akun Owner aktif tidak ditemukan.');
    return;
  }
  openModal(`
    <div class="reset-warning">
      <span>⚠️</span>
      <div>
        <h2>${english ? 'Warning: Restore Menu Catalogue' : 'Peringatan: Restore Katalog Menu'}</h2>
        <p>${english ? 'Restoring the menu catalogue will replace all active menu categories, items, prices, and taxes.' : 'Restore menu akan mengganti seluruh kategori, menu, harga, dan pengaturan pajak yang aktif saat ini.'}</p>
      </div>
    </div>
    <form id="restoreMenuForm">
      <label class="field">
        <span>${english ? 'Current Owner PIN' : 'PIN Owner saat ini'}</span>
        <input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" required autocomplete="off" autofocus>
      </label>
      <label class="reset-confirm-check">
        <input name="understood" type="checkbox" required>
        <span>${english ? 'I understand that current menu catalogue will be replaced.' : 'Saya memahami bahwa katalog menu saat ini akan diganti.'}</span>
      </label>
      <p class="form-error" id="restoreMenuError"></p>
      <div class="modal-actions">
        <button type="button" class="secondary close-modal">${english ? 'Cancel' : 'Batal'}</button>
        <button class="primary">${english ? 'Proceed to select .andamenu file…' : 'Lanjutkan pilih file .andamenu…'}</button>
      </div>
    </form>
  `);

  $('#restoreMenuForm').onsubmit = async event => {
    event.preventDefault();
    const error = $('#restoreMenuError');
    const pin = new FormData(event.target).get('pin');
    const pinHash = await hashPin(pin);
    if (pinHash !== owner.pinHash) {
      error.textContent = english ? 'Incorrect Owner PIN.' : 'PIN Owner tidak sesuai.';
      event.target.pin.select();
      return;
    }
    if (!window.desktop?.restoreMenu) {
      error.textContent = english ? 'Menu restore is only available in the desktop application.' : 'Restore menu hanya tersedia pada aplikasi desktop.';
      return;
    }
    closeModal();
    const result = await window.desktop.restoreMenu();
    if (result?.success) {
      const categories = result.data.categories.map(x => String(x).trim()).filter(Boolean),
            products = result.data.products.filter(x => x && x.name && x.category && Number.isFinite(Number(x.price))).map((x, index) => ({ ...x, id: Number.isFinite(Number(x.id)) ? Number(x.id) : index + 1, price: Math.max(0, Number(x.price)), stock: Math.max(0, Number(x.stock) || 0), taxable: x.taxable !== false, unlimitedStock: Boolean(x.unlimitedStock), active: x.active !== false }));
      if (!categories.length || !products.length) { toast(english ? 'Backup file does not contain valid categories or items.' : 'File backup tidak berisi kategori dan menu yang valid.'); return; }
      state.categories = [...new Set(categories)];
      state.products = products;
      await save();
      render();
      toast(english ? 'Menu catalogue restored successfully.' : 'Katalog menu berhasil dipulihkan.');
    } else if (!result?.canceled) {
      toast(result?.error || (english ? 'Menu restore failed.' : 'Restore menu gagal.'));
    }
  };
}

async function restoreMenuOnly() {
  showRestoreMenuModal();
}

restoreDatabase = showRestoreDatabaseModal;

function showResetTransactions() {
  if (state.user.role !== 'owner') { toast(state.language === 'en' ? 'Only the Owner can reset transactions.' : 'Reset transaksi hanya dapat dilakukan Owner.'); return; }
  const owner = state.users.find(user => user.id === state.user.id && user.role === 'owner' && user.active !== false);
  if (!owner) { toast(state.language === 'en' ? 'Active Owner account not found.' : 'Akun Owner aktif tidak ditemukan.'); return; }
  const english = state.language === 'en', transactionCount = state.transactions.length, shiftCount = state.shiftHistory?.length || 0;
  openModal(`<div class="reset-warning"><span>!</span><div><h2>${english ? 'Reset all transactions?' : 'Reset seluruh transaksi?'}</h2><p>${english ? 'This cannot be undone. Create a database backup before continuing.' : 'Tindakan ini tidak dapat dibatalkan. Buat backup database sebelum melanjutkan.'}</p></div></div><div class="reset-impact"><strong>${transactionCount.toLocaleString(english ? 'en-US' : 'id-ID')}</strong><span>${english ? 'transactions' : 'transaksi'}</span><strong>${shiftCount.toLocaleString(english ? 'en-US' : 'id-ID')}</strong><span>${english ? 'shift records' : 'riwayat shift'}</span></div><p>${english ? 'Menus, stock, users, tables, restaurant identity, and settings will remain saved.' : 'Menu, stok, pengguna, meja, identitas restoran, dan pengaturan tetap tersimpan.'}</p><form id="resetTransactionsForm"><label class="field"><span>${english ? 'Current Owner PIN' : 'PIN Owner saat ini'}</span><input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" required autocomplete="off" autofocus></label><label class="reset-confirm-check"><input name="understood" type="checkbox" required><span>${english ? 'I understand that all transaction history and open orders will be permanently deleted.' : 'Saya memahami seluruh riwayat transaksi dan pesanan terbuka akan dihapus permanen.'}</span></label><p class="form-error" id="resetTransactionsError"></p><div class="modal-actions"><button type="button" class="secondary close-modal">${english ? 'Cancel' : 'Batal'}</button><button class="danger">${english ? 'Permanently reset' : 'Reset permanen'}</button></div></form>`);
  $('#resetTransactionsForm').onsubmit = async event => {
    event.preventDefault(); const error = $('#resetTransactionsError'), pinHash = await hashPin(new FormData(event.target).get('pin'));
    if (pinHash !== owner.pinHash) { error.textContent = english ? 'Incorrect Owner PIN.' : 'PIN Owner tidak sesuai.'; event.target.pin.select(); return; }
    if (!window.desktop?.resetTransactions) { error.textContent = english ? 'This feature is only available in the desktop application.' : 'Fitur ini hanya tersedia pada aplikasi desktop.'; return; }
    const submit = event.submitter; submit.disabled = true; submit.textContent = english ? 'Resetting…' : 'Mereset…';
    try {
      const result = await window.desktop.resetTransactions({ ownerId: owner.id, pinHash });
      if (!result?.success) { submit.disabled = false; submit.textContent = english ? 'Permanently reset' : 'Reset permanen'; error.textContent = result?.error || (english ? 'Transaction reset failed.' : 'Reset transaksi gagal.'); return; }
      closeModal(); toast(english ? `${result.deletedTransactions} transactions deleted.` : `${result.deletedTransactions} transaksi berhasil dihapus.`); setTimeout(() => location.reload(), 700);
    } catch (resetError) {
      submit.disabled = false; submit.textContent = english ? 'Permanently reset' : 'Reset permanen'; error.textContent = resetError?.message || (english ? 'Transaction reset failed.' : 'Reset transaksi gagal.');
    }
  };
}

const baseBindView = bindView;
bindView = function() {
  baseBindView();
  document.querySelectorAll('[data-table]').forEach(button => button.onclick = () => { explicitTableSelection = true; state.table = button.dataset.table; state.orderType = 'dineIn'; state.activeView = 'pos'; render(); save(); });
  document.querySelectorAll('[data-reprint]').forEach(button => button.onclick = () => showTransactionReceipt(button.dataset.reprint));
  document.querySelectorAll('[data-void]').forEach(button => button.onclick = () => showVoidForm(button.dataset.void));
};

document.addEventListener('click', async event => {
  if (event.target.closest('#addDiscountOption')) showDiscountOptionForm();
  const editDiscount = event.target.closest('[data-discount-edit]'), deleteDiscount = event.target.closest('[data-discount-delete]');
  if (editDiscount) showDiscountOptionForm(editDiscount.dataset.discountEdit);
  if (deleteDiscount && confirm('Hapus pilihan diskon ini?')) { state.settings.discountOptions = state.settings.discountOptions.filter(x => x.id !== deleteDiscount.dataset.discountDelete); await save(); render(); }
  if (event.target.closest('#backupMenu')) backupMenuOnly();
  if (event.target.closest('#restoreMenu')) showRestoreMenuModal();
  if (event.target.closest('#restoreDatabase')) showRestoreDatabaseModal();
  if (event.target.closest('#resetTransactions')) showResetTransactions();
});


commercialDefaults();

let transactionIdSearch = '', shiftIdSearch = '';
function normalizedIdSearch(value) { return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function idMatchesSearch(value, query) {
  const normalizedQuery = normalizedIdSearch(query); if (!normalizedQuery) return true;
  const normalizedValue = normalizedIdSearch(value);
  if (/^\d+$/.test(normalizedQuery)) return normalizedValue.replace(/\D/g, '').includes(normalizedQuery);
  return normalizedValue.includes(normalizedQuery);
}
function transactionMatchesIdSearch(transaction, query = transactionIdSearch) { return idMatchesSearch(transaction.id, query) || idMatchesSearch(transaction.orderId, query); }

const filteredTransactionsBeforeIdSearch = filteredTransactions;
filteredTransactions = function() { return filteredTransactionsBeforeIdSearch().filter(transaction => transactionMatchesIdSearch(transaction)); };
const monthlyRevenueBeforeIdSearch = monthlyRevenueData;
monthlyRevenueData = function(month = reportMonth) {
  if (!transactionIdSearch) return monthlyRevenueBeforeIdSearch(month);
  const originalTransactions = state.transactions;
  state.transactions = originalTransactions.filter(transaction => transactionMatchesIdSearch(transaction));
  try { return monthlyRevenueBeforeIdSearch(month); } finally { state.transactions = originalTransactions; }
};

const renderReportsBeforeIdSearch = renderReports;
renderReports = function() {
  const html = renderReportsBeforeIdSearch(), searchField = `<label class="id-search-field">Cari ID transaksi<input id="transactionIdSearch" type="search" inputmode="numeric" value="${esc(transactionIdSearch)}" placeholder="4 angka terakhir / 8 angka tanggal" autocomplete="off"></label>`;
  return html.replace('<div class="report-filters">', `<div class="report-filters">${searchField}`);
};

const renderShiftBeforeIdSearch = renderShift;
renderShift = function() {
  const originalHistory = state.shiftHistory;
  state.shiftHistory = originalHistory.filter(shift => idMatchesSearch(shift.id, shiftIdSearch));
  let html;
  try { html = renderShiftBeforeIdSearch(); } finally { state.shiftHistory = originalHistory; }
  const matched = originalHistory.filter(shift => idMatchesSearch(shift.id, shiftIdSearch)).length;
  const searchPanel = `<div class="shift-search panel"><label class="field"><span>Cari ID shift</span><input id="shiftIdSearch" type="search" inputmode="numeric" value="${esc(shiftIdSearch)}" placeholder="4 angka terakhir / 8 angka tanggal" autocomplete="off"></label><small>${shiftIdSearch ? `${matched} shift ditemukan` : 'Ketik ID lengkap, 4 angka terakhir, atau 8 angka tanggal.'}</small></div>`;
  return html.replace('<h3>Riwayat shift</h3>', `${searchPanel}<h3>Riwayat shift</h3>`);
};

const bindViewBeforeIdSearch = bindView;
bindView = function() {
  bindViewBeforeIdSearch();
  const transactionInput = $('#transactionIdSearch'), shiftInput = $('#shiftIdSearch');
  if (transactionInput && !window.desktop?.queryTransactions) transactionInput.oninput = () => { transactionIdSearch = transactionInput.value; renderView(); const next = $('#transactionIdSearch'); next?.focus(); next?.setSelectionRange(next.value.length, next.value.length); };
  if (shiftInput && !window.desktop?.queryShifts) shiftInput.oninput = () => { shiftIdSearch = shiftInput.value; renderView(); const next = $('#shiftIdSearch'); next?.focus(); next?.setSelectionRange(next.value.length, next.value.length); };
};

