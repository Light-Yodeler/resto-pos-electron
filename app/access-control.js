/* Role-based access control and PIN-authorized void operations. */
const ROLE_VIEWS = ['pos', 'tables', 'kitchen', 'inventory', 'menuManagement', 'tableManagement', 'users', 'reports', 'shift', 'settings'];
const ROLE_COPY = {
  id: {
    roleManagement: 'Manajemen role', roleIntro: 'Atur menu yang dapat dibuka oleh setiap role. Otorisasi void tetap khusus PIN Owner atau Admin.', addRole: '+ Tambah role', usersTitle: 'Pengguna dan PIN', usersIntro: 'Hubungkan setiap pengguna ke role dan PIN masing-masing.', role: 'Role', permissions: 'Hak akses menu', roleNameId: 'Nama role (Indonesia)', roleNameEn: 'Nama role (English)', saveRole: 'Simpan role', editRole: 'Edit role', deleteRole: 'Hapus role', systemRole: 'Role bawaan', customRole: 'Role tambahan', roleInUse: 'Role masih digunakan oleh pengguna.', ownerProtected: 'Role Owner tidak dapat diubah.', noPermission: 'Pilih minimal satu hak akses.', manageRoles: 'Kelola role', voidPermission: 'Void transaksi',
    voidTitle: 'Otorisasi void transaksi', voidHint: 'Pilih Owner atau Admin lalu masukkan PIN untuk mengesahkan void.', authorizer: 'Pemberi otorisasi', pin: 'PIN Owner/Admin', reason: 'Alasan void', authorizeVoid: 'Otorisasi dan void', wrongPin: 'PIN tidak sesuai.', authorizedRoleOnly: 'Void membutuhkan PIN Owner atau Admin yang aktif.', voidSaved: 'berhasil di-void.', requestedBy: 'Diminta oleh'
  },
  en: {
    roleManagement: 'Role management', roleIntro: 'Choose which areas each role can access. Void authorization always requires an Owner or Admin PIN.', addRole: '+ Add role', usersTitle: 'Users and PINs', usersIntro: 'Assign every user to a role and an individual PIN.', role: 'Role', permissions: 'Menu permissions', roleNameId: 'Role name (Indonesian)', roleNameEn: 'Role name (English)', saveRole: 'Save role', editRole: 'Edit role', deleteRole: 'Delete role', systemRole: 'Built-in role', customRole: 'Custom role', roleInUse: 'This role is still assigned to a user.', ownerProtected: 'The Owner role cannot be changed.', noPermission: 'Select at least one permission.', manageRoles: 'Manage roles', voidPermission: 'Void transactions',
    voidTitle: 'Authorize transaction void', voidHint: 'Select an Owner or Admin and enter their PIN to approve this void.', authorizer: 'Authorizing user', pin: 'Owner/Admin PIN', reason: 'Void reason', authorizeVoid: 'Authorize and void', wrongPin: 'Incorrect PIN.', authorizedRoleOnly: 'Void requires the PIN of an active Owner or Admin.', voidSaved: 'was voided.', requestedBy: 'Requested by'
  }
};
const roleText = key => ROLE_COPY[state.language]?.[key] || ROLE_COPY.id[key] || key;

function ensureRoles() {
  const defaults = [
    { id: 'owner', nameId: 'Owner', nameEn: 'Owner', system: true, permissions: [...ROLE_VIEWS, 'manageRoles', 'voidTransactions'] },
    { id: 'admin', nameId: 'Admin', nameEn: 'Admin', system: true, permissions: ['pos', 'tables', 'kitchen', 'inventory', 'menuManagement', 'tableManagement', 'reports', 'shift', 'settings', 'voidTransactions'] },
    { id: 'cashier', nameId: 'Kasir', nameEn: 'Cashier', system: true, permissions: ['pos', 'tables', 'kitchen', 'shift'] }
  ];
  if (!Array.isArray(state.roles)) state.roles = defaults;
  for (const preset of defaults) {
    const role = state.roles.find(item => item.id === preset.id);
    if (!role) state.roles.push(structuredClone(preset));
    else {
      role.nameId ||= preset.nameId; role.nameEn ||= preset.nameEn; role.system = true;
      if (!Array.isArray(role.permissions)) role.permissions = [...preset.permissions];
      if (role.id === 'owner') role.permissions = [...new Set([...role.permissions, ...preset.permissions])];
      if (['owner', 'admin'].includes(role.id) && !role.permissions.includes('voidTransactions')) role.permissions.push('voidTransactions');
    }
  }
  state.users.forEach(user => { if (!state.roles.some(role => role.id === user.role)) user.role = 'cashier'; });
}

function currentRole() { ensureRoles(); return state.roles.find(role => role.id === state.user.role) || state.roles.find(role => role.id === 'cashier'); }
function canAccess(permission) { return Boolean(currentRole()?.permissions.includes(permission)); }
function roleLabel(roleId) { ensureRoles(); const role = state.roles.find(item => item.id === roleId); return role ? (state.language === 'en' ? role.nameEn : role.nameId) : roleId; }

renderNav = function() {
  ensureRoles(); let allowed = ROLE_VIEWS.filter(view => canAccess(view));
  if (!state.settings.kitchenEnabled) allowed = allowed.filter(view => view !== 'kitchen');
  if (!allowed.includes(state.activeView)) state.activeView = allowed[0] || 'pos';
  $('#nav').innerHTML = allowed.map(view => `<button class="nav-btn ${state.activeView === view ? 'active' : ''}" data-view="${view}"><i>${icons[view]}</i><span>${t(names[view])}</span></button>`).join('');
};

renderUsers = function() {
  ensureRoles();
  const roleCards = state.roles.map(role => `<article class="role-card"><div><span class="status-pill ${role.system ? '' : 'inactive'}">${role.system ? roleText('systemRole') : roleText('customRole')}</span><h3>${esc(roleLabel(role.id))}</h3><p>${role.permissions.filter(permission => ROLE_VIEWS.includes(permission)).map(permission => t(names[permission])).join(' · ') || '—'}</p></div><div>${role.id !== 'owner' && canAccess('manageRoles') ? `<button class="mini" data-role-edit="${esc(role.id)}">${roleText('editRole')}</button>` : ''}${!role.system && canAccess('manageRoles') ? `<button class="mini danger-text" data-role-delete="${esc(role.id)}">${roleText('deleteRole')}</button>` : ''}</div></article>`).join('');
  return `<div class="section-title"><div><h2>${roleText('usersTitle')}</h2><p class="muted">${roleText('usersIntro')}</p></div><button class="primary" id="addUser">+ ${state.language === 'en' ? 'User' : 'Pengguna'}</button></div><div class="user-role-summary">${state.roles.map(role => `<div class="stat"><small>${esc(roleLabel(role.id))}</small><strong>${state.users.filter(user => user.role === role.id && user.active).length}</strong></div>`).join('')}</div><div class="report-table-wrap user-table-wrap"><table class="inventory-table"><thead><tr><th>${state.language === 'en' ? 'Name' : 'Nama'}</th><th>${roleText('role')}</th><th>${state.language === 'en' ? 'Status' : 'Status'}</th><th></th></tr></thead><tbody>${state.users.map(user => `<tr><td><strong>${esc(user.name)}</strong>${user.id === state.user.id ? ` <span class="status-pill">${state.language === 'en' ? 'Current' : 'Aktif saat ini'}</span>` : ''}</td><td>${esc(roleLabel(user.role))}</td><td>${user.active ? (state.language === 'en' ? 'Active' : 'Aktif') : (state.language === 'en' ? 'Inactive' : 'Nonaktif')}</td><td><button class="mini edit-user" data-id="${user.id}">${state.language === 'en' ? 'Edit / PIN' : 'Edit / PIN'}</button>${user.id !== state.user.id ? `<button class="mini toggle-user" data-id="${user.id}">${user.active ? (state.language === 'en' ? 'Deactivate' : 'Nonaktifkan') : (state.language === 'en' ? 'Activate' : 'Aktifkan')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>${canAccess('manageRoles') ? `<div class="role-section-heading"><div><h2>${roleText('roleManagement')}</h2><p>${roleText('roleIntro')}</p></div><button class="secondary" id="addRole">${roleText('addRole')}</button></div><div class="role-grid">${roleCards}</div>` : ''}`;
};

showUserForm = function(id) {
  ensureRoles(); const user = state.users.find(item => item.id === id) || { name: '', role: 'cashier', active: true };
  openModal(`<h2>${id ? (state.language === 'en' ? 'Edit user' : 'Edit pengguna') : (state.language === 'en' ? 'Add user' : 'Tambah pengguna')}</h2><form id="userForm"><label class="field"><span>${state.language === 'en' ? 'User name' : 'Nama pengguna'}</span><input name="name" value="${esc(user.name)}" required maxlength="40"></label><label class="field"><span>${roleText('role')}</span><select name="role">${state.roles.map(role => `<option value="${esc(role.id)}" ${user.role === role.id ? 'selected' : ''}>${esc(roleLabel(role.id))}</option>`).join('')}</select></label><label class="field"><span>${id ? (state.language === 'en' ? 'New PIN (leave blank to keep current)' : 'PIN baru (kosongkan jika tidak diubah)') : (state.language === 'en' ? '4–8 digit PIN' : 'PIN 4–8 angka')}</span><input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" ${id ? '' : 'required'} autocomplete="new-password"></label><label class="check"><input name="active" type="checkbox" ${user.active ? 'checked' : ''} ${user.id === state.user.id ? 'disabled' : ''}> ${state.language === 'en' ? 'Active user' : 'Pengguna aktif'}</label><div class="modal-actions"><button type="button" class="secondary close-modal">${t('close')}</button><button class="primary">${state.language === 'en' ? 'Save user' : 'Simpan pengguna'}</button></div></form>`);
  $('#userForm').onsubmit = async event => {
    event.preventDefault(); const form = new FormData(event.target), name = String(form.get('name')).trim(), role = String(form.get('role')), pin = String(form.get('pin') || ''), active = user.id === state.user.id ? true : form.get('active') === 'on';
    if (user.role === 'owner' && role !== 'owner' && state.users.filter(item => item.role === 'owner' && item.active).length === 1) { toast(state.language === 'en' ? 'At least one active Owner is required.' : 'Minimal satu Owner aktif diperlukan.'); return; }
    const data = { name, role, active }; if (pin) data.pinHash = await hashPin(pin);
    if (id) Object.assign(user, data); else state.users.push({ id: Math.max(0, ...state.users.map(item => item.id)) + 1, pinHash: await hashPin(pin), ...data });
    if (id === state.user.id) { state.user = { id: user.id, name: user.name, role: user.role }; if (!canAccess(state.activeView)) state.activeView = 'pos'; }
    await save(); closeModal(); render();
  };
};

function showRoleForm(roleId = null) {
  ensureRoles(); const existing = state.roles.find(role => role.id === roleId), role = existing || { nameId: '', nameEn: '', permissions: ['pos'] };
  if (roleId === 'owner') { toast(roleText('ownerProtected')); return; }
  const permissions = ROLE_VIEWS.map(view => `<label class="permission-option"><input type="checkbox" name="permission" value="${view}" ${role.permissions.includes(view) ? 'checked' : ''}><span><b>${esc(t(names[view]))}</b><small>${view}</small></span></label>`).join('');
  openModal(`<h2>${existing ? roleText('editRole') : roleText('addRole').replace('+ ', '')}</h2><form id="roleForm"><div class="form-grid"><label class="field"><span>${roleText('roleNameId')}</span><input name="nameId" value="${esc(role.nameId)}" required maxlength="32"></label><label class="field"><span>${roleText('roleNameEn')}</span><input name="nameEn" value="${esc(role.nameEn)}" required maxlength="32"></label></div><h3>${roleText('permissions')}</h3><div class="permission-grid">${permissions}<label class="permission-option"><input type="checkbox" name="permission" value="manageRoles" ${role.permissions.includes('manageRoles') ? 'checked' : ''}><span><b>${roleText('manageRoles')}</b><small>manageRoles</small></span></label></div><p class="form-error" id="roleError"></p><div class="modal-actions"><button type="button" class="secondary close-modal">${t('close')}</button><button class="primary">${roleText('saveRole')}</button></div></form>`);
  $('#roleForm').onsubmit = async event => { event.preventDefault(); const form = new FormData(event.target), selected = form.getAll('permission').map(String); if (!selected.length) { $('#roleError').textContent = roleText('noPermission'); return; } if (existing?.id === 'admin') selected.push('voidTransactions'); const data = { nameId: String(form.get('nameId')).trim(), nameEn: String(form.get('nameEn')).trim(), permissions: [...new Set(selected)] }; if (existing) Object.assign(existing, data); else state.roles.push({ id: `role-${Date.now()}`, system: false, ...data }); await save(); closeModal(); render(); };
}

async function deleteRole(roleId) {
  ensureRoles(); const role = state.roles.find(item => item.id === roleId); if (!role || role.system) return;
  if (state.users.some(user => user.role === roleId)) { toast(roleText('roleInUse')); return; }
  if (!confirm(`${roleText('deleteRole')} ${roleLabel(roleId)}?`)) return; state.roles = state.roles.filter(item => item.id !== roleId); await save(); render();
}

showVoidForm = function(transactionId) {
  ensureRoles(); const transaction = reportPageRows.get(transactionId) || state.transactions.find(item => item.id === transactionId); if (!transaction || isVoid(transaction)) return;
  const authorizers = state.users.filter(user => user.active && ['owner', 'admin'].includes(user.role));
  if (!authorizers.length) { toast(roleText('authorizedRoleOnly')); return; }
  openModal(`<h2>${roleText('voidTitle')}</h2><div class="void-warning"><strong>${esc(transaction.id)} · ${money(transaction.total)}</strong><span>${esc(transaction.table)} · ${esc(transaction.cashier)}</span></div><p>${roleText('voidHint')}</p><form id="voidForm"><label class="field"><span>${roleText('authorizer')}</span><select name="authorizerId">${authorizers.map(user => `<option value="${user.id}">${esc(user.name)} · ${esc(roleLabel(user.role))}</option>`).join('')}</select></label><label class="field"><span>${roleText('pin')}</span><input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" required autocomplete="off"></label><label class="field"><span>${roleText('reason')}</span><textarea name="reason" required minlength="5" maxlength="250"></textarea></label><p class="form-error" id="voidError"></p><div class="modal-actions"><button type="button" class="secondary close-modal">${t('close')}</button><button class="danger">${roleText('authorizeVoid')}</button></div></form>`);
  $('#voidForm').onsubmit = async event => {
    event.preventDefault(); const form = new FormData(event.target), authorizer = authorizers.find(user => user.id === Number(form.get('authorizerId'))), enteredHash = await hashPin(form.get('pin')), reason = String(form.get('reason')).trim();
    if (!authorizer || enteredHash !== authorizer.pinHash) { $('#voidError').textContent = roleText('wrongPin'); event.target.pin.select(); return; }
    transaction.status = 'void'; transaction.voidReason = reason; transaction.voidAt = new Date().toISOString(); transaction.voidBy = authorizer.name; transaction.voidById = authorizer.id; transaction.voidAuthorizedRole = authorizer.role; transaction.voidRequestedBy = state.user.name; transaction.voidRequestedById = state.user.id;
    (transaction.lineItems || []).forEach(item => { const product = state.products.find(product => product.id === item.productId); if (product && !product.unlimitedStock) product.stock += Number(item.qty) || 0; });
    try { if (window.desktop?.updateTransaction) await window.desktop.updateTransaction(transaction); const local = state.transactions.find(item => item.id === transaction.id); if (local) Object.assign(local, transaction); await save(); closeModal(); render(); toast(`${transaction.id} ${roleText('voidSaved')}`); } catch (error) { $('#voidError').textContent = error.message; }
  };
};

document.addEventListener('click', event => {
  if (event.target.closest('#addRole')) showRoleForm();
  const edit = event.target.closest('[data-role-edit]'), remove = event.target.closest('[data-role-delete]');
  if (edit) showRoleForm(edit.dataset.roleEdit); if (remove) deleteRole(remove.dataset.roleDelete);
});

ensureRoles();
const renderBeforeRoleEnhancement = render;
render = function() {
  renderBeforeRoleEnhancement();
  const avatar = $('#userBtn'), label = roleLabel(state.user.role);
  if (avatar) avatar.textContent = label.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || 'US';
};
if (sessionLocked) showUsers(true);
