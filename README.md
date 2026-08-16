# Anda POS

MVP aplikasi kasir desktop offline yang dapat digunakan dengan identitas restoran sendiri. Mendukung kasir dine-in/takeaway, pencatatan waiter per order, manajemen meja, fitur dapur opsional, stok terbatas atau unlimited, split bill fleksibel dengan bill tertunda, pajak 10% per menu, laporan transaksi terperinci, grafik pendapatan harian per bulan dan ekspor CSV, nomor order/invoice unik, pembayaran tunai/kartu/QRIS, bahasa Indonesia/Inggris, pencetakan struk thermal 80 mm, manajemen menu per kategori, serta manajemen pengguna berbasis PIN.

## Akun awal

- Owner — PIN `1234`
- Admin — PIN `2345`
- Kasir 01 — PIN `3456`

Segera ubah PIN awal melalui menu **Manajemen pengguna** setelah login sebagai Owner. PIN disimpan sebagai hash SHA-256 di database lokal.

## Menjalankan

```bash
npm install
npm start
```

Data disimpan sebagai database SQLite `anda-pos.db` di folder data aplikasi milik pengguna. Menu **Pengaturan** menyediakan penggantian nama restoran dan logo, backup database SQLite asli berekstensi `.db`, serta restore untuk memindahkan seluruh data ke komputer lain. Untuk membuat installer macOS dan Windows, jalankan `npm run dist:mac` atau `npm run dist:win`.

## Database dummy 100.000 transaksi

Jalankan `npm run dummy-db` untuk membuat `outputs/Anda-POS-Dummy-100K.db`. Database pengujian ini berisi 100.000 transaksi selama 730 hari, transaksi void, dua shift per hari, pembayaran tunai/kartu/QRIS, diskon, serta menu kena pajak dan bebas pajak. Gunakan menu **Pengaturan → Restore database** untuk memuatnya. Akun pengujian tetap memakai PIN awal Owner `1234`, Admin `2345`, serta Kasir 01/02 `3456`. Restore mengganti database aktif, sehingga buat backup data asli terlebih dahulu.

## Versi 1.12.1

- Kartu saved bill pada sidebar split bill sekarang menampilkan seluruh isi bill dalam format `jumlah × nama menu`, sehingga kasir dapat langsung melihat makanan atau minuman milik setiap tamu tanpa membuka Manage all.
- Nama item dan keterangan jumlah porsi mengikuti bahasa Indonesia atau Inggris yang sedang digunakan.

## Versi 1.12.0

- Void transaksi kini selalu meminta PIN pengguna Owner atau Admin yang aktif. Laporan menyimpan pemberi otorisasi, peminta void, waktu, dan alasan void.
- Manajemen role memungkinkan Owner menambah role bilingual dan menentukan hak akses menu untuk setiap role.
- Laporan memakai alur akuntansi yang lebih jelas: penjualan kotor dikurangi diskon menjadi penjualan bersih, lalu pajak ditambahkan menjadi total diterima.
- Audit pajak memisahkan dasar penjualan kena pajak dan penjualan bebas pajak, termasuk pada rincian setiap invoice. Contoh penjualan bersih Rp688.000 dengan dasar kena pajak Rp613.000 menghasilkan pajak Rp61.300 pada tarif 10%, sementara Rp75.000 ditampilkan sebagai penjualan bebas pajak.
- Kartu laporan dan ukuran angka dibuat lebih teratur serta responsif untuk layar desktop yang berbeda.

## Versi 1.11.0

- Penjualan bersih dihitung sebelum pajak; pajak dan total pembayaran ditampilkan terpisah.
- Pengaturan disusun ulang menjadi workspace yang rapi dan responsif.
- Lapisan terjemahan Indonesia–Inggris mencakup layar, dialog, laporan, pagination, serta fitur baru.

Untuk thermal printer Windows, atur ukuran kertas printer ke **80 mm / Receipt** melalui Windows Printer Preferences. Setelah itu pilih printer melalui **Deteksi printer**, gunakan area konten **64 mm · Aman**, simpan pengaturan, lalu gunakan **Cetak struk uji**. Aplikasi menyerahkan panjang roll kepada driver Windows agar driver thermal yang tidak mendukung ukuran halaman dinamis tidak menghasilkan kertas kosong; jalur yang sama digunakan pada mode cetak langsung.

Versi 1.6.0 menggunakan SQLite lokal (`anda-pos.db`) dengan mode WAL dan indeks tanggal transaksi. Saat pertama dibuka, data JSON lama dimigrasikan otomatis dan salinan `anda-pos-data.json.migrated-backup` tetap dipertahankan. Cetak langsung Windows merasterisasi struk sebelum dikirim ke driver untuk menghindari keluaran kertas kosong pada driver thermal tertentu.

Mulai versi 1.6.1, menu **Buat backup** menghasilkan database SQLite asli berekstensi `.db`. Restore memeriksa integritas SQLite dan tabel wajib sebelum mengganti database aktif. Backup `.andapos` lama tetap didukung untuk restore.

Versi 1.6.2 melewati silent print Chromium pada Windows. Struk dirender menjadi PNG lalu dicetak langsung melalui Windows GDI Print Spooler tanpa dialog; mode cetak dengan dialog tetap menggunakan jalur Chromium yang sudah berfungsi.

Versi 1.6.3 mengekstrak skrip GDI dari paket `app.asar` ke folder sementara sebelum PowerShell dijalankan, lalu menghapus file sementara setelah pencetakan selesai.

Versi 1.6.4 memotong hasil raster tepat pada batas struk sebelum dikirim ke GDI. Ini menghilangkan pengecilan ganda sehingga lebar hasil cetak sesuai pilihan area konten 64/68/72 mm.

Versi 1.6.5 menambahkan pilihan gaya font struk: **Tipis & jelas** (Courier New monospace), **Sedang**, dan **Tebal**. Pilihan berlaku pada cetak langsung maupun cetak melalui dialog.

Versi 1.6.6 merender cetak langsung pada resolusi 2,25× dan mengubah raster menjadi hitam-putih murni sebelum dikirim ke printer 203 DPI. Profil **Jelas** memakai Arial/Segoe UI medium agar garis karakter tidak berlubang pada thermal head.

Versi 1.6.7 membatalkan skala 2,25× karena skala tersebut memperbesar tata letak dan memotong sisi kanan pada printer tertentu. Ukuran kembali proporsional, dengan ambang hitam-putih 0,58 yang lebih seimbang.

Versi 1.7.0 mengganti jalur utama **Cetak langsung tanpa dialog** di Windows menjadi teks native ESC/POS melalui spooler RAW. Huruf, jarak, dan kolom harga diproses langsung oleh printer tanpa screenshot, PDF, atau skala driver. Lebar default 42 karakter aman untuk printer 80 mm generik; 48 karakter tersedia untuk printer dengan area cetak 576-dot. Mode grafis Windows tetap tersedia sebagai kompatibilitas untuk printer yang tidak mendukung ESC/POS. Cetak melalui dialog memakai profil **Tipis & jelas** berbasis Courier New 400 agar teks tidak terlalu bold.

Versi 1.7.1 memperbaiki spasi Unicode pada format Rupiah agar tidak lagi menjadi tanda `?` di ESC/POS, menambah jarak antarkolom dan garis pemisah sebelum subtotal, memperbesar judul secara vertikal, serta mengirim perintah partial-cut setelah cetak langsung. Opsi auto-cut dapat dimatikan dari Pengaturan. Profil dialog memakai Consolas sebagai font utama agar goresan karakter lebih stabil pada thermal printer.

Versi 1.7.2 memperbaiki formatter ESC/POS yang sebelumnya tanpa sengaja merapatkan kembali spasi antarkolom. Nama item dan nominal kini benar-benar rata kiri/kanan pada 42 atau 48 karakter. Judul dikembalikan ke tinggi normal agar proporsinya menyerupai struk dialog. Sebelum partial-cut, printer sekarang melakukan feed 8 baris secara default; jaraknya dapat dipilih 6, 8, atau 10 baris dari Pengaturan agar footer tidak ikut terpotong.

Versi 1.8.0 memperbaiki siklus shift kasir. Shift sekarang memiliki ID unik, nama, kasir pembuka, waktu mulai/selesai, saldo awal, uang tunai aktual, selisih kas, rincian tunai/kartu/QRIS, dan riwayat. Transaksi baru menyimpan ID shift aktif. Ringkasan **Penjualan hari ini** hanya menghitung transaksi pada tanggal bisnis hari ini, sedangkan ringkasan shift hanya menghitung transaksi yang benar-benar terkait dengan shift tersebut. Data shift lama yang tidak memiliki ID direset ke status tutup agar dapat dimulai ulang secara benar. Pada profil ESC/POS **Tipis & jelas**, subtotal dan total tidak lagi dicetak bold sehingga angka seperti 160.000 tidak tampak menyerupai 180.000.

Versi 1.8.1 mengubah input saldo awal dan uang tunai aktual dari kelipatan Rp1.000 menjadi satuan Rp1. Kolom shift kini menerima nominal receh seperti Rp35.200.

Versi 1.9.0 menambahkan alur bill lengkap dan kontrol audit operasional. Kasir dapat mencetak unpaid bill sebelum pembayaran, closed bill setelah pembayaran, mencetak ulang transaksi, serta memilih bill tamu atau salinan resto. Pembayaran tunai mencatat uang tamu, tombol uang pas, pilihan pecahan Rp100–Rp100.000, dan kembalian. Tarif pajak dapat diubah dari Pengaturan dan setiap transaksi menyimpan tarif yang digunakan. Pengaturan juga menyediakan pilihan diskon persen/nominal, backup/restore khusus menu berekstensi `.andamenu`, serta item Miscellaneous dengan pilihan pajak. Owner dan Admin dapat melakukan void dengan alasan; transaksi void tetap muncul dalam laporan tetapi dikeluarkan dari pendapatan, grafik, dan perhitungan kas shift. Order baru diwajibkan memiliki shift aktif dan meja yang dipilih, sementara rincian transaksi sekarang menampilkan identitas shift.

Versi 1.9.1 menambahkan pencarian ID pada Laporan transaksi dan riwayat Shift kasir. Pengguna dapat memasukkan ID lengkap, empat angka nomor urut terakhir seperti `0042`, atau delapan angka tanggal di tengah seperti `20260813`. Pencarian transaksi memeriksa ID invoice dan ID order serta langsung memperbarui rincian, ringkasan, dan grafik laporan.

Versi 1.10.0 menambahkan pagination berbasis SQLite pada tabel rincian transaksi dan riwayat shift. Query memakai `COUNT`, `LIMIT`, dan `OFFSET`, dengan pilihan 25, 50, atau 100 baris per halaman serta navigasi Pertama, Sebelumnya, Berikutnya, dan Terakhir. Filter tanggal, metode pembayaran, kasir, dan pencarian ID dijalankan sebelum pagination. Ringkasan penjualan, metode pembayaran, menu terlaris, dan grafik bulanan tetap menghitung seluruh hasil filter, bukan hanya halaman aktif. Riwayat shift kini dicerminkan ke tabel SQLite berindeks agar tidak lagi dibatasi 30 data.
