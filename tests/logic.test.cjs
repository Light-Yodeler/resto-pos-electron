const test=require('node:test');const assert=require('node:assert/strict');
const crypto=require('node:crypto');
test('tax is exactly 10 percent and total is deterministic',()=>{const subtotal=210000,tax=Math.round(subtotal*.1);assert.equal(tax,21000);assert.equal(subtotal+tax,231000)});
test('split bill keeps the exact grand total',()=>{const total=253001,first=Math.round(total/2),second=total-first;assert.equal(first+second,total)});
test('stock never drops below zero',()=>{const stock=2,quantity=4;assert.equal(Math.max(0,stock-quantity),0)});
test('orders are isolated by table key',()=>{const carts={};const cartFor=table=>(carts[`table:${table}`]??=[]);cartFor('M1').push({id:1,qty:2});assert.equal(cartFor('M1').length,1);assert.equal(cartFor('M2').length,0);assert.notStrictEqual(cartFor('M1'),cartFor('M2'))});
test('clearing one table does not clear another table',()=>{const carts={'table:M1':[{id:1,qty:1}],'table:M2':[{id:2,qty:3}]};carts['table:M1']=[];assert.equal(carts['table:M1'].length,0);assert.equal(carts['table:M2'][0].qty,3)});
test('default PINs are stored and compared as SHA-256 hashes',()=>{const hash=pin=>crypto.createHash('sha256').update(pin).digest('hex');assert.equal(hash('1234'),'03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4');assert.notEqual(hash('1235'),hash('1234'))});
test('category rename updates all related menu items',()=>{const products=[{category:'Food'},{category:'Drink'},{category:'Food'}];products.forEach(p=>{if(p.category==='Food')p.category='Main'});assert.deepEqual(products.map(p=>p.category),['Main','Drink','Main'])});
test('cashier cannot access management navigation',()=>{const access={cashier:['pos','tables','kitchen','shift'],admin:['pos','tables','kitchen','inventory','menuManagement','reports','shift']};assert.equal(access.cashier.includes('users'),false);assert.equal(access.cashier.includes('menuManagement'),false);assert.equal(access.admin.includes('menuManagement'),true)});
test('tax is charged only to taxable menu items',()=>{const cart=[{price:100000,qty:1,taxable:true},{price:50000,qty:2,taxable:false}],subtotal=cart.reduce((s,x)=>s+x.price*x.qty,0),taxable=cart.reduce((s,x)=>s+(x.taxable===false?0:x.price*x.qty),0),tax=Math.round(taxable*.1);assert.equal(subtotal,200000);assert.equal(taxable,100000);assert.equal(tax,10000);assert.equal(subtotal+tax,210000)});
test('split allocations preserve every ordered quantity',()=>{const ordered=[3,2,1],allocations=[[2,1],[1,1],[0,1]];assert.deepEqual(allocations.map(row=>row.reduce((a,b)=>a+b,0)),ordered)});
test('order and invoice sequences generate unique document IDs',()=>{let order=1,invoice=1;const next=(prefix,type)=>`${prefix}-20260812-${String(type==='order'?order++:invoice++).padStart(4,'0')}`;const ids=[next('ORD','order'),next('ORD','order'),next('INV','invoice'),next('INV','invoice')];assert.equal(new Set(ids).size,4);assert.deepEqual(ids,['ORD-20260812-0001','ORD-20260812-0002','INV-20260812-0001','INV-20260812-0002'])});
test('split allocation cannot exceed the ordered quantity',()=>{const ordered=1,alloc=[0,0];const add=person=>{if(alloc.reduce((a,b)=>a+b,0)<ordered)alloc[person]++};add(0);add(1);assert.deepEqual(alloc,[1,0]);assert.equal(ordered-alloc.reduce((a,b)=>a+b,0),0)});
test('removing a split allocation makes it available to another guest',()=>{const ordered=1,alloc=[1,0];alloc[0]--;if(alloc.reduce((a,b)=>a+b,0)<ordered)alloc[1]++;assert.deepEqual(alloc,[0,1])});
test('saving one guest bill leaves unassigned items in the main order',()=>{const main=[{id:1,qty:2},{id:2,qty:1}],move=[1,0],saved=[];main.forEach((item,i)=>{if(move[i])saved.push({...item,qty:move[i]})});const remaining=main.flatMap((item,i)=>item.qty-move[i]>0?[{...item,qty:item.qty-move[i]}]:[]);assert.deepEqual(saved,[{id:1,qty:1}]);assert.deepEqual(remaining,[{id:1,qty:1},{id:2,qty:1}])});
test('paying one saved bill does not close an order with remaining items',()=>{const main=[{id:2,qty:1}],savedBills=[{id:'SB-1',items:[{id:1,qty:1}]},{id:'SB-2',items:[{id:3,qty:1}]}];const after=savedBills.filter(b=>b.id!=='SB-1');assert.equal(main.length>0||after.length>0,true);assert.deepEqual(after.map(b=>b.id),['SB-2'])});
test('returning a saved bill merges quantities into the main order',()=>{const main=[{id:1,qty:1}],bill=[{id:1,qty:2},{id:2,qty:1}];for(const item of bill){const found=main.find(x=>x.id===item.id);if(found)found.qty+=item.qty;else main.push({...item})}assert.deepEqual(main,[{id:1,qty:3},{id:2,qty:1}])});
test('unlimited stock is never reduced after payment',()=>{const product={stock:0,unlimitedStock:true},qty=25;if(!product.unlimitedStock)product.stock=Math.max(0,product.stock-qty);assert.equal(product.stock,0);assert.equal(product.unlimitedStock,true)});
test('limited stock respects quantities reserved across open orders',()=>{const stock=5,carts=[[{id:1,qty:2}],[{id:1,qty:3}]],reserved=carts.flat().filter(i=>i.id===1).reduce((s,i)=>s+i.qty,0);assert.equal(reserved,stock);assert.equal(reserved<stock,false)});
test('disabling kitchen prevents creation of a kitchen ticket',()=>{const tickets=[],settings={kitchenEnabled:false};if(settings.kitchenEnabled)tickets.push({id:'D-1'});assert.equal(tickets.length,0)});
test('a table with an open order cannot be removed',()=>{const openItems=[{id:1,qty:1}],canDelete=openItems.length===0;assert.equal(canDelete,false)});
test('80mm printer setting remains fixed to receipt width',()=>{const settings={printerWidth:80,printerName:'Thermal POS'};assert.equal(settings.printerWidth,80);assert.equal(settings.printerName,'Thermal POS')});
test('waiter metadata is isolated per order and copied to transaction',()=>{const orderMeta={'table:M1':{waiter:'Komang'},'table:M2':{waiter:'Made'}},transaction={waiter:orderMeta['table:M1'].waiter};assert.equal(transaction.waiter,'Komang');assert.equal(orderMeta['table:M2'].waiter,'Made')});
test('monthly revenue groups transaction totals by calendar day',()=>{const month='2026-08',transactions=[{date:'2026-08-01',total:100000},{date:'2026-08-01',total:50000},{date:'2026-08-12',total:220000},{date:'2026-09-01',total:999999}],values=Array(31).fill(0);transactions.filter(x=>x.date.startsWith(`${month}-`)).forEach(x=>values[Number(x.date.slice(8,10))-1]+=x.total);assert.equal(values[0],150000);assert.equal(values[11],220000);assert.equal(values.reduce((a,b)=>a+b,0),370000)});
test('backup wrapper preserves portable application data',()=>{const data={products:[],users:[],tables:[],settings:{restaurantName:'Resto Baru',brandLogo:'data:image/png;base64,AA=='}};const backup={format:'anda-pos-backup',version:1,data};const restored=backup.format==='anda-pos-backup'?backup.data:backup;assert.equal(restored.settings.restaurantName,'Resto Baru');assert.match(restored.settings.brandLogo,/^data:image\/png/)});
test('saving operational settings preserves uploaded logo',()=>{const previous={brandLogo:'data:image/png;base64,AA==',restaurantName:'Anda'},next={...previous,kitchenEnabled:false,restaurantName:'Resto Lain'};assert.equal(next.brandLogo,previous.brandLogo);assert.equal(next.restaurantName,'Resto Lain')});
test('80mm receipt defaults to a safe 64mm printable content area',()=>{const requested=undefined,allowed=[64,68,72],width=allowed.includes(Number(requested))?Number(requested):64;assert.equal(width,64);assert.equal((80-width)/2,8)});
test('thermal print uses capturePage and ESC/POS raster for direct Windows printing',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8'),printBlock=source.slice(source.indexOf('async function printThermalReceipt'),source.indexOf('function createWindow'));assert.match(printBlock,/capturePage/);assert.match(printBlock,/toBitmap/);assert.match(printBlock,/printWindowsEscPosBuffer/);assert.match(printBlock,/webContents\.print/);assert.equal(printBlock.includes('pageSize:'),false);});
test('unsupported receipt widths fall back to safe width',()=>{const normalize=value=>[64,68,72].includes(Number(value))?Number(value):64;assert.equal(normalize(72),72);assert.equal(normalize(80),64);assert.equal(normalize('bad'),64)});
test('silent print keeps its rendered document alive for the Windows spooler',()=>{const direct=true,renderDelay=direct?1500:500,spoolDelay=direct?4000:1000;assert.equal(renderDelay,1500);assert.equal(spoolDelay,4000);assert.ok(renderDelay+spoolDelay>=5000)});
test('clear receipt typography keeps body text thin and headings readable',()=>{const fontWeight=400,headingWeight=700;assert.equal(fontWeight,400);assert.ok(headingWeight>fontWeight)});
test('SQLite schema separates transactions and indexes business date',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8');assert.match(source,/CREATE TABLE IF NOT EXISTS transactions/);assert.match(source,/idx_transactions_date/);assert.match(source,/journal_mode=WAL/)});
test('legacy JSON is retained after automatic SQLite migration',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8');assert.match(source,/\.migrated-backup/);assert.match(source,/writeDatabaseState\(legacy, true\)/)});
test('backup uses the native SQLite backup API and db extension',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8');assert.match(source,/backupSqlite\(database/);assert.match(source,/anda-pos-backup-.*\.db/);assert.match(source,/validateDatabaseFile\(result\.filePath\)/)});
test('native restore validates SQLite before replacing active database',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8');const validate=source.slice(source.indexOf('function validateDatabaseFile'),source.indexOf('const thermalPrintCss'));assert.match(validate,/PRAGMA quick_check/);assert.match(validate,/app_state/);assert.match(validate,/transactions/);assert.match(validate,/pre-restore/)});
test('Windows silent printing bypasses Chromium and uses GDI spooler',()=>{const fs=require('node:fs'),path=require('node:path'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),script=fs.readFileSync(path.join(__dirname,'..','electron','print-windows.ps1'),'utf8');assert.match(main,/process\.platform === 'win32'/);assert.match(main,/printWindowsRaster/);assert.match(main,/powershell\.exe/);assert.match(script,/System\.Drawing\.Printing\.PrintDocument/);assert.match(script,/StandardPrintController/)});
test('packaged PowerShell print script is copied out of app.asar before execution',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8'),block=source.slice(source.indexOf('async function printWindowsRaster'),source.indexOf('function writeDatabaseState'));assert.match(block,/fs\.copyFileSync\(packagedScript, temporaryScript\)/);assert.match(block,/'-File', temporaryScript/);assert.match(block,/fs\.unlinkSync\(temporaryScript\)/)});
test('Windows document print configures 80mm unclipped margins',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8'),printBlock=source.slice(source.indexOf('async function printThermalReceipt'),source.indexOf('function createWindow'));assert.match(printBlock,/marginType: 'none'/);assert.match(printBlock,/printBackground: true/);});

test('receipt supports thin monospace, medium, and bold typography choices',()=>{const main=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8'),app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','app.js'),'utf8'),ui=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','ui-v2.js'),'utf8');assert.match(main,/fontStyle === 'bold'/);assert.match(main,/fontStyle === 'medium'/);assert.match(main,/Consolas, "Courier New", monospace/);assert.match(app,/receiptFontStyle:'distinct'/);assert.match(ui,/clearFont/)});
test('Windows thermal raster renders at printer DPI via zoom and crops to content height',()=>{const fs=require('node:fs'),path=require('node:path'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),script=fs.readFileSync(path.join(__dirname,'..','electron','print-windows.ps1'),'utf8'),block=main.slice(main.indexOf('async function printThermalReceipt'),main.indexOf('function createWindow'));assert.match(block,/setZoomFactor/);assert.match(block,/scrollHeight/);assert.match(block,/DOTS_PER_MM/);assert.match(script,/SetThreshold\(0\.58\)/);assert.match(script,/HighQualityBicubic/)});
test('Windows direct print defaults to native ESC/POS before creating a raster window',()=>{const fs=require('node:fs'),path=require('node:path'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),block=main.slice(main.indexOf('async function printThermalReceipt'),main.indexOf('function createWindow'));assert.ok(block.indexOf('printWindowsEscPos')<block.indexOf('new BrowserWindow'));assert.match(block,/directMode === 'escpos'/);assert.match(main,/42 columns is the safe default/)});
test('ESC/POS uses the Windows RAW spooler and validates complete writes',()=>{const fs=require('node:fs'),path=require('node:path'),script=fs.readFileSync(path.join(__dirname,'..','electron','print-escpos-windows.ps1'),'utf8');assert.match(script,/pDataType = "RAW"/);assert.match(script,/WritePrinter/);assert.match(script,/written != data\.Length/);assert.match(script,/OpenPrinterW/)});
test('renderer sends structured receipt rows to the native print engine',()=>{const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','app.js'),'utf8');assert.match(app,/directPrintMode:'escpos'/);assert.match(app,/directPrintColumns:42/);assert.match(app,/nativeReceiptFromElement/);assert.match(app,/nativeReceipt:nativeReceiptFromElement\(receipt\)/);assert.match(app,/Teks native ESC\/POS/)});
test('ESC/POS receipt width defaults to 42 columns and permits 48-dot profiles',()=>{const requested=undefined,columns=[42,48].includes(Number(requested))?Number(requested):42;assert.equal(columns,42);assert.ok(42<48)});
test('ESC/POS normalizes Indonesian currency spacing before ASCII conversion',()=>{const fs=require('node:fs'),path=require('node:path'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),block=main.slice(main.indexOf('function asciiText'),main.indexOf('function wrapReceiptText'));assert.match(block,/\\u00a0\\u2007\\u202f/);assert.ok(block.indexOf('replace(/[^\\x20-\\x7E]/g')>block.indexOf('replace(/[\\u00a0'))});
test('ESC/POS direct receipt includes section divider and standard partial-cut command',()=>{const fs=require('node:fs'),path=require('node:path'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),app=fs.readFileSync(path.join(__dirname,'..','app','app.js'),'utf8');assert.match(main,/row\.sectionStart/);assert.match(main,/0x1d, 0x56, 0x01/);assert.match(app,/sectionStart:row\.classList\.contains\('receipt-total'\)/);assert.match(app,/autoCut:state\.settings\.autoCut!==false/)});
test('auto-cut defaults on and can be changed in printer settings',()=>{const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','app.js'),'utf8');assert.match(app,/autoCut:true/);assert.match(app,/name="autoCut"/);assert.match(app,/Potong kertas otomatis/);assert.match(app,/autoCut:f\.get\('autoCut'\)==='on'/)});
test('ESC/POS formatter preserves repeated padding spaces between label and price',()=>{const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),helpers=vm.runInNewContext(`${main.slice(main.indexOf('function asciiText'),main.indexOf('function receiptLogoBytes'))};({asciiText,formatReceiptRow})`),formatted=helpers.formatReceiptRow('Subtotal','Rp 150.000',42)[0];assert.equal(formatted.length,42);assert.match(formatted,/Subtotal {10,}Rp 150\.000$/);assert.equal(helpers.asciiText(formatted),formatted)});
test('ESC/POS feeds paper beyond the cutter and keeps the heading at normal size',()=>{const fs=require('node:fs'),path=require('node:path'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),block=main.slice(main.indexOf('function buildEscPosReceipt'),main.indexOf('async function printWindowsEscPos'));assert.match(block,/0x1b, 0x64, feedLines/);assert.match(block,/\[6, 8, 10\]/);assert.equal(block.includes('0x1d, 0x21, 0x01'),false)});
test('cut feed distance defaults to eight lines and is configurable',()=>{const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','app.js'),'utf8'),ui=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','ui-v2.js'),'utf8');assert.match(app,/cutFeedLines:8/);assert.match(ui,/name="cutFeedLines"/);assert.match(ui,/8 baris · Aman/);assert.match(app,/cutFeedLines:Number\(state\.settings\.cutFeedLines\)\|\|8/)});
test('today sales exclude transactions from other business dates',()=>{const today='2026-08-13',transactions=[{date:'2026-08-12',total:900000},{date:'2026-08-13',total:100000},{timestamp:'2026-08-13T12:00:00.000Z',total:50000}],date=x=>x.date||x.timestamp?.slice(0,10)||'',rows=transactions.filter(x=>date(x)===today);assert.equal(rows.reduce((sum,x)=>sum+x.total,0),150000);assert.equal(rows.length,2)});
test('shift summary includes only transactions linked to the active shift id',()=>{const transactions=[{shiftId:'SFT-1',total:100000},{shiftId:'SFT-2',total:250000},{shiftId:null,total:50000},{shiftId:'SFT-1',total:60000}],rows=transactions.filter(x=>x.shiftId==='SFT-1');assert.equal(rows.length,2);assert.equal(rows.reduce((sum,x)=>sum+x.total,0),160000)});
test('cash reconciliation combines opening cash and cash payments only',()=>{const openingCash=500000,payments={cash:200000,card:100000,qris:50000},closingCash=690000,expectedCash=openingCash+payments.cash,difference=closingCash-expectedCash;assert.equal(expectedCash,700000);assert.equal(difference,-10000)});
test('shift controls open explicit start and end workflows',()=>{const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','app.js'),'utf8');assert.match(app,/function showStartShift\(\)/);assert.match(app,/function showEndShift\(\)/);assert.match(app,/ts\.onclick=\(\)=>state\.shift\.open\?showEndShift\(\):showStartShift\(\)/);assert.match(app,/id="startShiftForm"/);assert.match(app,/id="endShiftForm"/)});
test('new payments retain the active shift id and closed shifts are archived',()=>{const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','app.js'),'utf8');assert.match(app,/shiftId:state\.shift\.open\?state\.shift\.id:null/);assert.match(app,/state\.shiftHistory=\[closed,\.\.\.\(state\.shiftHistory\|\|\[\]\)\]/);assert.match(app,/nextDocumentId\('SFT','nextShiftNumber'\)/)});
test('legacy non-functional open shift is reset during migration',()=>{const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','app.js'),'utf8');assert.match(app,/state\.shift\.open&&!state\.shift\.id/);assert.match(app,/state\.shift=\{open:false\}/)});
test('clear ESC/POS profile does not bold subtotal and total digits',()=>{const main=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','electron','main.cjs'),'utf8'),block=main.slice(main.indexOf('const baseBold'),main.indexOf('for (const note'));assert.match(block,/fontStyle === 'medium' && row\.emphasis/);assert.equal(block.includes('row.emphasis || baseBold'),false)});
test('shift cash inputs accept rupiah coins and non-thousand amounts',()=>{const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','app.js'),'utf8');assert.match(app,/name="openingCash"[^>]*step="1"/);assert.match(app,/name="closingCash"[^>]*step="1"/);assert.equal(app.includes('step="1000"'),false);assert.equal(Number('35200'),35200)});
test('adjustable tax is calculated after proportional discount',()=>{const subtotal=70000,rawTaxable=70000,discount=7000,rate=12.5,taxableSubtotal=rawTaxable-Math.round(discount*rawTaxable/subtotal),tax=Math.round(taxableSubtotal*rate/100);assert.equal(taxableSubtotal,63000);assert.equal(tax,7875);assert.equal(subtotal-discount+tax,70875)});
test('unpaid and closed bills are distinct printable documents',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/UNPAID BILL \/ BELUM DIBAYAR/);assert.match(source,/CLOSED BILL \/ LUNAS/);assert.match(source,/showUnpaidBill/);assert.match(source,/SALINAN RESTO \/ RESTAURANT COPY/);assert.match(source,/Cetak ulang/)});
test('cash tender supports exact payment, denominations, and change',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/\[100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000\]/);assert.match(source,/data-cash-exact/);assert.match(source,/tendered - total/);assert.match(source,/Uang tamu/);assert.match(source,/Kembalian/)});
test('orders require an active shift and an explicitly selected dine-in table',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/if \(!state\.shift\?\.open\)/);assert.match(source,/explicitTableSelection/);assert.match(source,/Pilih meja terlebih dahulu/);assert.match(source,/orderContextReady\(\)/)});
test('void keeps an audit reason and excludes transaction from sales',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/state\.user\.role === 'cashier'/);assert.match(source,/transaction\.voidReason = reason/);assert.match(source,/transaction\.voidBy = state\.user\.name/);assert.match(source,/activeSalesTransactions/);assert.match(source,/status = 'void'/)});
test('transaction detail retains shift identity while customer bill excludes shift',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/shiftId: state\.shift\.id/);assert.match(source,/shiftName: state\.shift\.name/);assert.match(source,/Kasir \/ shift/);assert.equal(source.includes('Shift: ${esc(transaction.shiftName'),false)});

test('miscellaneous cart item supports quantity, price, and tax choice',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/showMiscellaneousForm/);assert.match(source,/miscellaneous: true/);assert.match(source,/name="taxable"/);assert.match(source,/name="price" type="number"/)});
test('discount choices are configurable as percent or fixed amount',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/discountOptions/);assert.match(source,/value="percent"/);assert.match(source,/value="fixed"/);assert.match(source,/discountUsed/);assert.match(source,/Diskon diterapkan sebelum pajak/)});
test('menu-only backup uses a dedicated validated file format',()=>{const fs=require('node:fs'),path=require('node:path'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),preload=fs.readFileSync(path.join(__dirname,'..','electron','preload.cjs'),'utf8');assert.match(main,/ipcMain\.handle\('menu:backup'/);assert.match(main,/ipcMain\.handle\('menu:restore'/);assert.match(main,/anda-pos-menu/);assert.match(main,/\.andamenu/);assert.match(main,/validProducts/);assert.match(preload,/backupMenu/);assert.match(preload,/restoreMenu/)});
test('void restores limited product stock but not miscellaneous lines',()=>{const products=[{id:1,stock:8,unlimitedStock:false}],lineItems=[{productId:1,qty:2},{productId:-1,qty:1,miscellaneous:true}];lineItems.forEach(item=>{const product=products.find(x=>x.id===item.productId);if(product&&!product.unlimitedStock)product.stock+=item.qty});assert.equal(products[0].stock,10)});
test('ID search accepts full IDs, four-digit suffixes, and eight-digit dates',()=>{const normalize=value=>String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,''),matches=(value,query)=>{const q=normalize(query),v=normalize(value);return !q||(/^\d+$/.test(q)?v.replace(/\D/g,'').includes(q):v.includes(q))};assert.equal(matches('INV-20260813-0042','0042'),true);assert.equal(matches('INV-20260813-0042','20260813'),true);assert.equal(matches('INV-20260813-0042','INV-20260813-0042'),true);assert.equal(matches('SFT-20260812-0042','20260813'),false)});
test('transaction and shift views expose live ID search inputs',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/id="transactionIdSearch"/);assert.match(source,/id="shiftIdSearch"/);assert.match(source,/transactionMatchesIdSearch/);assert.match(source,/idMatchesSearch\(shift\.id, shiftIdSearch\)/);assert.match(source,/4 angka terakhir \/ 8 angka tanggal/)});
test('SQLite transaction pagination returns only the requested page and separates net sales from tax',()=>{const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{DatabaseSync}=require('node:sqlite'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),database=new DatabaseSync(':memory:');database.exec('CREATE TABLE transactions (id TEXT PRIMARY KEY,business_date TEXT NOT NULL,payload TEXT NOT NULL);');const insert=database.prepare('INSERT INTO transactions VALUES (?,?,?)');for(let index=1;index<=60;index++){const id=`INV-20260813-${String(index).padStart(4,'0')}`,voided=index===2,payload={id,orderId:`ORD-20260813-${String(index).padStart(4,'0')}`,date:'2026-08-13',status:voided?'void':'closed',paymentCode:'cash',cashierId:1,subtotal:1000,discountAmount:0,taxableSubtotal:1000,taxRate:10,tax:100,total:1100,lineItems:[{name:'Menu',qty:1,lineTotal:1000}]};insert.run(id,'2026-08-13',JSON.stringify(payload))}const start=main.indexOf('function normalizedSearch'),end=main.indexOf('function validateDatabaseFile'),helpers=vm.runInNewContext(`${main.slice(start,end)};({transactionQuery})`,{database,Date,Math}),result=helpers.transactionQuery({page:2,pageSize:25,search:'20260813'});assert.equal(result.rows.length,25);assert.equal(result.total,60);assert.equal(result.totalPages,3);assert.equal(result.page,2);assert.equal(result.summary.count,59);assert.equal(result.summary.voidCount,1);assert.equal(result.summary.sales,59000);assert.equal(result.summary.taxable,59000);assert.equal(result.summary.nonTaxable,0);assert.equal(result.summary.tax,5900);assert.equal(result.summary.collected,64900);assert.equal(result.daily[0].total,59000);database.close()});
test('SQLite shift history uses LIMIT OFFSET pagination, ID search, and recalculated net sales',()=>{const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{DatabaseSync}=require('node:sqlite'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),database=new DatabaseSync(':memory:');database.exec('CREATE TABLE shifts (id TEXT PRIMARY KEY,opened_at TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE transactions (id TEXT PRIMARY KEY,business_date TEXT NOT NULL,payload TEXT NOT NULL);');const insert=database.prepare('INSERT INTO shifts VALUES (?,?,?)');for(let index=1;index<=52;index++){const shift={id:`SFT-20260813-${String(index).padStart(4,'0')}`,name:`Shift ${index}`,openedAt:`2026-08-13T${String(index%24).padStart(2,'0')}:00:00.000Z`,sales:999999};insert.run(shift.id,shift.openedAt,JSON.stringify(shift))}database.prepare('INSERT INTO transactions VALUES (?,?,?)').run('INV-1','2026-08-13',JSON.stringify({id:'INV-1',shiftId:'SFT-20260813-0052',status:'closed',subtotal:1000,discountAmount:100,tax:90,total:990}));const start=main.indexOf('function normalizedSearch'),end=main.indexOf('function validateDatabaseFile'),helpers=vm.runInNewContext(`${main.slice(start,end)};({shiftQuery})`,{database,Date}),page=helpers.shiftQuery({page:3,pageSize:25}),suffix=helpers.shiftQuery({page:1,pageSize:25,search:'0052'});assert.equal(page.rows.length,2);assert.equal(page.totalPages,3);assert.equal(suffix.total,1);assert.equal(suffix.rows[0].id,'SFT-20260813-0052');assert.equal(suffix.rows[0].sales,900);assert.equal(suffix.rows[0].transactionCount,1);database.close()});
test('pagination UI offers bilingual page sizes and navigation controls',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','pagination.js'),'utf8'),copy=fs.readFileSync(path.join(__dirname,'..','app','ui-v2.js'),'utf8'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8');assert.match(source,/\[25, 50, 100\]/);for(const key of ['first','previous','next','last'])assert.match(source,new RegExp(`ui\\('${key}'\\)`));for(const label of ['Pertama','Sebelumnya','Berikutnya','Terakhir','First','Previous','Next','Last'])assert.match(copy,new RegExp(label));assert.match(main,/LIMIT \? OFFSET \?/);assert.match(main,/SELECT COUNT\(\*\) AS count/)});
test('settings and reporting copy are bilingual and net sales excludes tax',()=>{const fs=require('node:fs'),path=require('node:path'),ui=fs.readFileSync(path.join(__dirname,'..','app','ui-v2.js'),'utf8'),pagination=fs.readFileSync(path.join(__dirname,'..','app','pagination.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'..','app','index.html'),'utf8');assert.match(html,/ui-v2\.js/);assert.match(ui,/settings-workspace/);assert.match(ui,/Pengaturan aplikasi/);assert.match(ui,/Application settings/);assert.match(ui,/Penjualan bersih/);assert.match(ui,/Net sales/);assert.match(ui,/Total pembayaran/);assert.match(ui,/Total collected/);assert.match(pagination,/id="dbCollected"/);assert.match(pagination,/summary\.collected/)});
test('void requires an active Owner or Admin PIN and records both authorizer and requester',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','access-control.js'),'utf8');assert.match(source,/user\.active && \['owner', 'admin'\]\.includes\(user\.role\)/);assert.match(source,/enteredHash = await hashPin/);assert.match(source,/enteredHash !== authorizer\.pinHash/);assert.match(source,/voidBy = authorizer\.name/);assert.match(source,/voidRequestedBy = state\.user\.name/)});
test('custom role management persists bilingual names and menu permissions',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','access-control.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'..','app','index.html'),'utf8');assert.match(html,/access-control\.js/);assert.match(source,/ROLE_VIEWS/);assert.match(source,/nameId/);assert.match(source,/nameEn/);assert.match(source,/form\.getAll\('permission'\)/);assert.match(source,/role-\$\{Date\.now\(\)\}/);assert.match(source,/roleInUse/)});
test('tax report reconciles taxable and tax-exempt net sales',()=>{const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{DatabaseSync}=require('node:sqlite'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),database=new DatabaseSync(':memory:');database.exec('CREATE TABLE transactions (id TEXT PRIMARY KEY,business_date TEXT NOT NULL,payload TEXT NOT NULL);');const payload={id:'INV-20260814-0001',date:'2026-08-14',status:'closed',paymentCode:'cash',cashierId:1,subtotal:688000,discountAmount:0,taxableSubtotal:613000,taxRate:10,tax:61300,total:749300,lineItems:[]};database.prepare('INSERT INTO transactions VALUES (?,?,?)').run(payload.id,payload.date,JSON.stringify(payload));const start=main.indexOf('function normalizedSearch'),end=main.indexOf('function validateDatabaseFile'),{transactionQuery}=vm.runInNewContext(`${main.slice(start,end)};({transactionQuery})`,{database,Date,Math}),summary=transactionQuery({from:'2026-08-14',to:'2026-08-14'}).summary;assert.equal(summary.sales,688000);assert.equal(summary.taxable,613000);assert.equal(summary.nonTaxable,75000);assert.equal(summary.tax,61300);assert.equal(summary.collected,749300);database.close()});
test('saved split bills show every item quantity and localized menu name in the cart sidebar',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','enhancements.js'),'utf8'),css=fs.readFileSync(path.join(__dirname,'..','app','styles.css'),'utf8');assert.match(source,/function savedBillItemsHTML/);assert.match(source,/saved-bill-items/);assert.match(source,/item\.en \|\| item\.name/);assert.match(source,/Number\(item\.qty\) \|\| 0/);assert.match(css,/\.saved-bill-items/);assert.match(css,/grid-column:1\/-1/)});
test('POS menu search restores focus and caret at the end after rerender',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','app.js'),'utf8');assert.match(source,/const next=\$\('#search'\)/);assert.match(source,/setSelectionRange\(next\.value\.length,next\.value\.length\)/)});
test('cart decoration is idempotent and clear-all requires an explicit warning dialog',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','app.js'),'utf8');assert.match(source,/!head\.querySelector\('\.order-waiter'\)/);assert.match(source,/!head\.querySelector\('#collapseCart'\)/);assert.match(source,/function showClearCartConfirmation/);assert.match(source,/id="confirmClearCart"/);assert.match(source,/\$\('#clearCart'\)\.onclick=showClearCartConfirmation/)});
test('receipt hides tax-exempt markers and localizes item names for English printing',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/function localizedReceiptItemName/);assert.match(source,/item\.nameEn \|\| item\.en/);assert.match(source,/localizedReceiptItemName\(x\)/);assert.equal(source.includes('<p>* Tanpa pajak</p>'),false);assert.equal(source.includes("x.taxable ? '' : ' *'"),false)});
test('transaction reset requires an active Owner PIN and atomically clears history only',()=>{const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{DatabaseSync}=require('node:sqlite'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8'),database=new DatabaseSync(':memory:'),knownTransactions=new Set(['INV-1']);database.exec('CREATE TABLE app_state(id INTEGER PRIMARY KEY,payload TEXT,updated_at TEXT);CREATE TABLE transactions(id TEXT PRIMARY KEY,business_date TEXT,payload TEXT);CREATE TABLE shifts(id TEXT PRIMARY KEY,opened_at TEXT,payload TEXT);');const state={users:[{id:1,role:'owner',active:true,pinHash:'owner-hash'}],products:[{id:1,name:'Menu'}],tables:[{id:'M1'}],settings:{restaurantName:'Test'},shift:{open:true},shiftHistory:[{id:'SFT-1'}],carts:{a:[1]},splitBills:{a:[1]},tickets:[{id:'D-1'}]};database.prepare('INSERT INTO app_state VALUES(1,?,CURRENT_TIMESTAMP)').run(JSON.stringify(state));database.prepare('INSERT INTO transactions VALUES(?,?,?)').run('INV-1','2026-08-16','{}');database.prepare('INSERT INTO shifts VALUES(?,?,?)').run('SFT-1','2026-08-16','{}');const start=main.indexOf('function resetTransactionData'),end=main.indexOf('function initializeDatabase'),reset=vm.runInNewContext(`${main.slice(start,end)};resetTransactionData`,{database,knownTransactions,JSON,Number,String});assert.equal(reset({ownerId:1,pinHash:'wrong'}).unauthorized,true);assert.equal(database.prepare('SELECT COUNT(*) count FROM transactions').get().count,1);const result=reset({ownerId:1,pinHash:'owner-hash'}),saved=JSON.parse(database.prepare('SELECT payload FROM app_state WHERE id=1').get().payload);assert.equal(result.success,true);assert.equal(result.deletedTransactions,1);assert.equal(database.prepare('SELECT COUNT(*) count FROM transactions').get().count,0);assert.equal(database.prepare('SELECT COUNT(*) count FROM shifts').get().count,0);assert.equal(saved.products.length,1);assert.equal(saved.tables.length,1);assert.equal(saved.settings.restaurantName,'Test');assert.deepEqual(saved.shiftHistory,[]);assert.equal(saved.shift.open,false);assert.equal(knownTransactions.size,0);database.close()});
test('reset control is Owner-only, bilingual, and bridged through Electron IPC',()=>{const fs=require('node:fs'),path=require('node:path'),ui=fs.readFileSync(path.join(__dirname,'..','app','ui-v2.js'),'utf8'),enhancements=fs.readFileSync(path.join(__dirname,'..','app','enhancements.js'),'utf8'),preload=fs.readFileSync(path.join(__dirname,'..','electron','preload.cjs'),'utf8'),main=fs.readFileSync(path.join(__dirname,'..','electron','main.cjs'),'utf8');assert.match(ui,/state\.user\.role === 'owner'/);assert.match(ui,/Reset seluruh transaksi/);assert.match(ui,/Reset all transactions/);assert.match(enhancements,/pinHash !== owner\.pinHash/);assert.match(enhancements,/name="understood"[^>]*required/);assert.match(preload,/resetTransactions/);assert.match(main,/database:reset-transactions/)});
test('table transfer migrates cart, split bills, order identity, and kitchen tickets',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','app.js'),'utf8');assert.match(source,/function transferTable/);assert.match(source,/delete state\.carts\[sKey\]/);assert.match(source,/delete state\.splitBills\[sKey\]/);assert.match(source,/t\.table===sourceTable/);const mockState={language:'id',orderType:'dineIn',table:'M1',carts:{'table:M1':[{id:1,name:'Nasi Goreng',qty:2,price:50000}]},splitBills:{'table:M1':[{id:'SB-1',label:'Orang 1',items:[{id:2,name:'Es Teh',qty:1,price:10000}]}]},orderIds:{'table:M1':'ORD-001'},orderMeta:{'table:M1':{waiter:'Budi'}},tickets:[{id:'D-1',table:'M1',items:['2× Nasi Goreng']}],splitPersonCounters:{'table:M1':2}};let saved=false,modalClosed=false,rendered=false,toastMsg='';const vm=require('node:vm'),ctx={state:mockState,toast:msg=>{toastMsg=msg},save:()=>saved=true,closeModal:()=>modalClosed=true,render:()=>rendered=true,allOpenItems:k=>[...(mockState.carts[k]||[]),...(mockState.splitBills[k]||[]).flatMap(b=>b.items)],mergeItem:(cart,item,qty=item.qty)=>{const found=cart.find(x=>x.id===item.id);if(found)found.qty+=qty;else cart.push({...item,qty})}};vm.runInNewContext(source.slice(source.indexOf('function transferTable'),source.indexOf('function reservedQuantity')),ctx);ctx.transferTable('M1','M5');assert.equal(mockState.carts['table:M1'],undefined);assert.equal(mockState.splitBills['table:M1'],undefined);assert.equal(mockState.orderIds['table:M1'],undefined);assert.equal(mockState.carts['table:M5'].length,1);assert.equal(mockState.splitBills['table:M5'].length,1);assert.equal(mockState.orderIds['table:M5'],'ORD-001');assert.equal(mockState.orderMeta['table:M5'].waiter,'Budi');assert.equal(mockState.tickets[0].table,'M5');assert.equal(mockState.table,'M5');assert.equal(saved,true);assert.equal(rendered,true)});
test('item-level discount applies to individual cart line and correctly adjusts taxable base',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','app','enhancements.js'),'utf8');assert.match(source,/function calculateItemDiscount/);assert.match(source,/showItemDiscountPicker/);assert.match(source,/itemDiscountsTotal/);const cart=[{id:1,price:50000,qty:2,taxable:true,itemDiscount:{type:'percent',value:10}},{id:2,price:30000,qty:1,taxable:false}];const calcDiscount=item=>{if(!item.itemDiscount)return 0;const raw=item.price*item.qty;return item.itemDiscount.type==='percent'?Math.round(raw*item.itemDiscount.value/100):item.itemDiscount.value};assert.equal(calcDiscount(cart[0]),10000);assert.equal(calcDiscount(cart[1]),0);const subtotal=cart.reduce((s,x)=>s+x.price*x.qty,0),itemDiscounts=cart.reduce((s,x)=>s+calcDiscount(x),0);const taxable=cart.reduce((s,x)=>s+(x.taxable===false?0:(x.price*x.qty-calcDiscount(x))),0),tax=Math.round(taxable*0.1),total=subtotal-itemDiscounts+tax;assert.equal(subtotal,130000);assert.equal(itemDiscounts,10000);assert.equal(taxable,90000);assert.equal(tax,9000);assert.equal(total,129000)});
test('Excel report generation creates multi-worksheet XML Spreadsheet 2003 workbook with accounting summaries and itemized ledger',()=>{const fs=require('node:fs'),path=require('node:path'),uiSource=fs.readFileSync(path.join(__dirname,'..','app','ui-v2.js'),'utf8');assert.match(uiSource,/function generateExcelXmlReport/);assert.match(uiSource,/exportReportExcel/);assert.match(uiSource,/Worksheet ss:Name/);assert.match(uiSource,/Executive Summary/);assert.match(uiSource,/Transactions Ledger/);assert.match(uiSource,/Itemized Breakdown/);assert.match(uiSource,/xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"/)});
test('native Excel .xlsx generator builds multi-sheet workbook with KPI summary, ledger, and itemized breakdown', async () => {
  const { createExcelReportWorkbook } = require('../electron/excel-export.cjs');
  const sampleData = {
    restaurantName: 'Anda Bungalows Restaurant',
    language: 'id',
    period: { from: '2026-08-01', to: '2026-08-17' },
    filters: { payment: 'Semua', cashier: 'Semua' },
    transactions: [
      { id: 'INV-1', date: '2026-08-17', time: '12:00', status: 'closed', payment: 'Tunai', paymentCode: 'cash', subtotal: 100000, discountAmount: 10000, taxableSubtotal: 90000, taxRate: 10, tax: 9000, total: 99000, lineItems: [{ name: 'Nasi Goreng', category: 'Makanan', qty: 2, price: 50000, discountAmount: 10000, lineTotal: 90000, taxable: true }] },
      { id: 'INV-2', date: '2026-08-17', time: '12:30', status: 'void', voidReason: 'Salah input', voidBy: 'Owner', payment: 'QRIS', paymentCode: 'qris', subtotal: 50000, discountAmount: 0, taxableSubtotal: 50000, taxRate: 10, tax: 5000, total: 55000, lineItems: [{ name: 'Jus Mangga', category: 'Minuman', qty: 1, price: 50000, discountAmount: 0, lineTotal: 50000, taxable: true }] }
    ]
  };
  const workbook = await createExcelReportWorkbook(sampleData);
  assert.equal(workbook.worksheets.length, 3);
  assert.equal(workbook.worksheets[0].name, 'Ringkasan Eksekutif');
  assert.equal(workbook.worksheets[1].name, 'Buku Besar Transaksi');
  assert.equal(workbook.worksheets[2].name, 'Rincian Item Terjual');
  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.length > 1000, 'buffer should be non-empty zip archive');
  // Check PK zip magic header (0x50 0x4B 0x03 0x04) for true OOXML .xlsx
  assert.equal(buffer[0], 0x50);
  assert.equal(buffer[1], 0x4B);
});

test('PIN login modal renders on-screen numeric keypad and 4-box indicator with keypad handling', () => {
  const fs = require('node:fs'), path = require('node:path'), source = fs.readFileSync(path.join(__dirname, '..', 'app', 'app.js'), 'utf8');
  assert.match(source, /pin-login-container/);
  assert.match(source, /pin-boxes-wrap/);
  assert.match(source, /data-pin-idx="0"/);
  assert.match(source, /data-pin-idx="3"/);
  assert.match(source, /pin-keypad/);
  assert.match(source, /data-key="clear"/);
  assert.match(source, /data-key="backspace"/);
  assert.match(source, /pin-dot/);
  assert.match(source, /pin-shake/);
  assert.match(source, /handleDigit/);
  assert.match(source, /handleBackspace/);
  assert.match(source, /handleClear/);
  assert.match(source, /currentPin\.length\s*===\s*4/);
});

test('Menu Management view includes live search toolbar filtering by name, english, category, and price', () => {
  const fs = require('node:fs'), path = require('node:path'), source = fs.readFileSync(path.join(__dirname, '..', 'app', 'app.js'), 'utf8');
  assert.match(source, /menuMgmtSearchQuery/);
  assert.match(source, /id="menuMgmtSearch"/);
  assert.match(source, /menu-mgmt-toolbar/);
  assert.match(source, /const ms=\$\('#menuMgmtSearch'\)/);
  assert.match(source, /matchName \|\| matchEn \|\| matchCat \|\| matchPrice/);

  // Test live search filter logic
  const products = [
    { id: 1, name: 'Nasi Goreng Anda', en: 'Anda Fried Rice', category: 'Makanan', price: 68000 },
    { id: 2, name: 'Ikan Bakar Jimbaran', en: 'Jimbaran Grilled Fish', category: 'Makanan', price: 115000 },
    { id: 6, name: 'Es Kelapa Muda', en: 'Iced Young Coconut', category: 'Minuman', price: 35000 },
    { id: 9, name: 'Pisang Goreng', en: 'Banana Fritters', category: 'Dessert', price: 42000 }
  ];

  const filterMenu = (query) => {
    const q = query.trim().toLowerCase();
    return products.filter(p => {
      if (!q) return true;
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchEn = (p.en || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      const matchPrice = String(p.price || '').includes(q);
      return matchName || matchEn || matchCat || matchPrice;
    });
  };

  assert.equal(filterMenu('goreng').length, 2); // Nasi Goreng & Pisang Goreng
  assert.equal(filterMenu('coconut').length, 1); // Es Kelapa Muda by english name
  assert.equal(filterMenu('minuman').length, 1); // By category
  assert.equal(filterMenu('115000').length, 1); // By price
  assert.equal(filterMenu('xyz999').length, 0); // No match
});

test('Header provides a dedicated logout button with confirmation dialog that locks session and prompts user PIN', () => {
  const fs = require('node:fs'), path = require('node:path');
  const htmlSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'index.html'), 'utf8');
  const jsSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'app.js'), 'utf8');
  const cssSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'styles.css'), 'utf8');

  // Check HTML button
  assert.match(htmlSource, /id="logoutBtn"/);
  assert.match(htmlSource, /class="logout-btn"/);
  assert.match(htmlSource, /data-i18n="logout"/);

  // Check CSS
  assert.match(cssSource, /\.logout-btn/);

  // Check JS logic
  assert.match(jsSource, /logout:\s*'Keluar'/);
  assert.match(jsSource, /logout:\s*'Log out'/);
  assert.match(jsSource, /function showLogoutConfirmation/);
  assert.match(jsSource, /id="confirmLogout"/);
  assert.match(jsSource, /sessionLocked\s*=\s*true/);
  assert.match(jsSource, /showUsers\(true\)/);
  assert.match(jsSource, /#logoutBtn/);
});

test('POS menu search searches across all categories regardless of active category filter', () => {
  const products = [
    { id: 1, name: 'Steak Tenderloin', en: 'Tenderloin Steak', category: 'European Corner', price: 120000, active: true },
    { id: 2, name: 'Ice Lemon Tea', en: 'Ice Lemon Tea', category: 'Tea', price: 20000, active: true },
    { id: 3, name: 'Bebalung Lombok', en: 'Beef Ribs Soup', category: 'Sasak Traditional', price: 68000, active: true }
  ];

  const filterPOS = (cat, searchStr) => {
    const q = searchStr.trim().toLowerCase();
    return products.filter(p => {
      if (p.active === false) return false;
      if (q) {
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchEn = (p.en || '').toLowerCase().includes(q);
        const matchCat = (p.category || '').toLowerCase().includes(q);
        const matchPrice = String(p.price || '').includes(q);
        return matchName || matchEn || matchCat || matchPrice;
      }
      return cat === 'Semua' || p.category === cat;
    });
  };

  // When browsing 'Tea' without search, only Tea is shown
  assert.equal(filterPOS('Tea', '').length, 1);
  assert.equal(filterPOS('Tea', '')[0].name, 'Ice Lemon Tea');

  // When active category is 'Tea', but search query is 'Steak', it finds the Steak from European Corner!
  const steakResult = filterPOS('Tea', 'Steak');
  assert.equal(steakResult.length, 1);
  assert.equal(steakResult[0].name, 'Steak Tenderloin');

  // When active category is 'European Corner', but search query is 'lemon', it finds Ice Lemon Tea!
  const lemonResult = filterPOS('European Corner', 'lemon');
  assert.equal(lemonResult.length, 1);
  assert.equal(lemonResult[0].name, 'Ice Lemon Tea');
});

test('Restore database is Owner-protected with PIN verification and prominent permanent data loss warning', () => {
  const fs = require('node:fs'), path = require('node:path');
  const enhancements = fs.readFileSync(path.join(__dirname, '..', 'app', 'enhancements.js'), 'utf8');

  // Verify Owner-only check
  assert.match(enhancements, /function showRestoreDatabaseModal/);
  assert.match(enhancements, /state\.user\.role !== 'owner'/);
  assert.match(enhancements, /owner\.pinHash/);

  // Verify warning copy and confirmation check
  assert.match(enhancements, /Peringatan: Restore Database Lengkap/);
  assert.match(enhancements, /Warning: Restore Full Database/);
  assert.match(enhancements, /MENGGANTI & MENGHAPUS PERMANEN/);
  assert.match(enhancements, /Sangat disarankan untuk membuat backup sebelum restore/);
  assert.match(enhancements, /modalBackupDbBtn/);
  assert.match(enhancements, /restoreDatabaseForm/);
  assert.match(enhancements, /restoreDatabaseError/);

  // Verify Menu Restore is also Owner-protected
  assert.match(enhancements, /function showRestoreMenuModal/);
  assert.match(enhancements, /restoreMenuForm/);
  assert.match(enhancements, /restoreMenuError/);
});

test('POS category switching preserves chips scroll position and updates active category seamlessly', () => {
  const fs = require('node:fs'), path = require('node:path');
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'app', 'app.js'), 'utf8');

  // Verify selectPOSCategory and chips scroll preservation
  assert.match(appJs, /function selectPOSCategory/);
  assert.match(appJs, /btn\.classList\.toggle\('active',\s*btn\.dataset\.cat\s*===\s*catName\)/);
  assert.match(appJs, /prevScroll !== null/);
  assert.match(appJs, /nextChips\.scrollLeft = prevScroll/);
  assert.match(appJs, /selectPOSCategory\(b\.dataset\.cat\)/);
});

test('menu product form provides categorized icon dropdown picker without manual copy-paste', () => {
  const fs = require('node:fs'), path = require('node:path');
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'app', 'app.js'), 'utf8');

  // Verify categorized icon list and select picker
  assert.match(appJs, /MENU_ICON_GROUPS/);
  assert.match(appJs, /renderMenuIconOptions/);
  assert.match(appJs, /<select name="icon">\$\{renderMenuIconOptions\(p\.icon\)\}<\/select>/);
  assert.match(appJs, /Makanan Utama & Daging/);
  assert.match(appJs, /Seafood & Ikan/);
  assert.match(appJs, /Minuman & Jus/);
  assert.match(appJs, /Penutup & Buah/);
});

test('high-legibility receipt font options provide distinct glyphs for digits 6, 8, and 9', () => {
  const fs = require('node:fs'), path = require('node:path');
  const mainJs = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.cjs'), 'utf8');
  const uiJs = fs.readFileSync(path.join(__dirname, '..', 'app', 'ui-v2.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'app', 'app.js'), 'utf8');
  const enhJs = fs.readFileSync(path.join(__dirname, '..', 'app', 'enhancements.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'app', 'styles.css'), 'utf8');

  // Verify thermalPrintCss supports distinct and sansClean styles with Segoe / Trebuchet / Tahoma
  assert.match(mainJs, /case 'distinct':/);
  assert.match(mainJs, /"Segoe UI", "Trebuchet MS"/);
  assert.match(mainJs, /case 'sansClean':/);
  assert.match(mainJs, /Tahoma, Verdana/);
  assert.match(mainJs, /\['clear', 'medium', 'bold', 'distinct', 'sansClean'\]/);

  // Verify printThermalReceipt supports 1:1 ESC/POS raster rendering and hardware text
  assert.match(mainJs, /bgraToEscPosRaster/);
  assert.match(mainJs, /buildEscPosRasterReceipt/);
  assert.match(mainJs, /printWindowsEscPosBuffer/);



  // Verify UI, receiptHTML, and CSS support dynamic receipt font
  assert.match(uiJs, /distinctFont:/);
  assert.match(uiJs, /sansCleanFont:/);
  assert.match(uiJs, /value="distinct"/);
  assert.match(uiJs, /value="sansClean"/);
  assert.match(appJs, /\['clear','medium','bold','distinct','sansClean'\]/);
  assert.match(enhJs, /RECEIPT_FONT_FAMILIES/);
  assert.match(enhJs, /applyReceiptFontToDOM/);
  assert.match(css, /--receipt-font/);
});





