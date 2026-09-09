# Anda POS

Aplikasi kasir desktop offline untuk restoran dan kafe, dirancang untuk berjalan langsung di komputer lokal tanpa ketergantungan koneksi internet. Aplikasi ini menangani alur transaksi dine-in dan takeaway, split bill per tamu, pencetakan struk thermal ESC/POS, shift kerja kasir, serta pelaporan keuangan berbasis SQLite.

## Informasi Aplikasi

Aplikasi dibangun menggunakan arsitektur desktop berbasis Electron dan penyimpanan lokal SQLite:

- Runtime: Electron 37 dan Node.js 22
- Antarmuka: HTML5, CSS kustom, dan Vanilla JavaScript tanpa build tools yang memperlambat startup
- Database: SQLite lokal (`anda-pos.db`) memanfaatkan modul bawaan `node:sqlite` dengan mode Write-Ahead Logging (WAL)
- Ekspor Dokumen: Pustaka `exceljs` untuk menghasilkan berkas native Excel (`.xlsx`) multi-lembar kerja
- Kompatibilitas OS: Windows 10/11 dan macOS (Apple Silicon serta Intel)

Seluruh data transaksi, data menu, pengaturan meja, dan riwayat shift tersimpan di penyimpanan lokal komputer pengguna. Tidak ada data yang dikirim ke server luar.

## Kegunaan dan Alur Operasional

### 1. Penjualan dan Pengelolaan Meja
Kasir dapat memilih tipe pesanan Dine-In atau Takeaway. Pada pesanan Dine-In, sistem meminta kasir memilih nomor meja dan mencatat nama waiter yang melayani. Fitur transfer meja memungkinkan pemindahan seluruh pesanan aktif ke meja lain tanpa menghapus catatan pesanan yang sudah masuk.

### 2. Split Bill Fleksibel
Untuk rombongan tamu yang ingin membayar terpisah, kasir dapat memindahkan sebagian porsi makanan atau minuman ke bill terpisah (Saved Bill). Setiap sub-bill mencatat rincian porsi tamu secara tersendiri, dapat dicetak terpisah, dan diselesaikan tanpa mengganggu sisa pesanan di meja utama.

### 3. Pembayaran dan Kasir
Aplikasi mendukung tiga metode pembayaran:
- Tunai: Dilengkapi kalkulator kembalian, pilihan pecahan cepat dari Rp100 hingga Rp100.000, serta tombol bayar dengan uang pas.
- Kartu: Pencatatan nomor referensi pembayaran kartu debit atau kredit.
- QRIS: Pencatatan pembayaran dompet digital non-tunai.

### 4. Pencetakan Struk Thermal 80 mm
Pencetakan struk mendukung printer thermal berukuran 80 mm melalui dua jalur di Windows:
- Jalur Teks Native ESC/POS: Mengirim perintah teks langsung ke spooler printer RAW dengan pilihan kerapatan 42 atau 48 karakter.
- Jalur Raster Monokrom: Mengubah struk menjadi gambar hitam-putih 1:1 pada lebar 576 dot (203 DPI) untuk mencetak font TrueType dengan angka 6, 8, dan 9 yang terbaca jelas.
- Pengaturan Struk: Tersedia pilihan margin konten (64 mm, 68 mm, atau 72 mm), opsi feed 6 hingga 10 baris, serta perintah pemotong kertas otomatis (auto-cut).

### 5. Pengendalian Shift Kasir
Setiap sesi kerja kasir wajib diawali dengan membuka shift baru:
- Kasir mencatat modal uang tunai awal di laci kas.
- Sistem mencatat seluruh transaksi yang diselesaikan selama shift tersebut aktif.
- Saat shift ditutup, kasir memasukkan jumlah uang fisik aktual di laci.
- Sistem langsung menghitung selisih kas (apakah seimbang, lebih, atau kurang) dan menyimpan rincian shift ke database.

### 6. Hak Akses dan Keamanan Berbasis PIN
Navigasi dan fungsi penting dilindungi oleh sistem login PIN 4 angka:
- PIN disimpan dalam format hash SHA-256 di database lokal.
- Tindakan berisiko tinggi seperti Void Transaksi dan Reset Transaksi memerlukan verifikasi PIN milik Owner atau Admin.
- Sistem mencatat identitas peminta void, nama otorisator, waktu, serta alasan pembatalan untuk keperluan audit.

### 7. Laporan Akuntansi dan Pajak
Laporan keuangan menyusun ringkasan penjualan dengan alur yang jelas:
- Penjualan Kotor dikurangi Diskon menghasilkan Penjualan Bersih.
- Pajak restoran (tarif default 10%, dapat disesuaikan) dihitung dari dasar penjualan kena pajak.
- Audit memisahkan penjualan yang kena pajak dan penjualan bebas pajak.
- Ekspor laporan ke format Excel native (`.xlsx`) menghasilkan tiga lembar kerja: Ringkasan Eksekutif, Buku Besar Seluruh Transaksi, dan Rincian Menu Terjual.

## Performa dan Skala Data

Untuk menangani operasional restoran bervolume tinggi, sistem penyimpanan database dioptimalkan secara khusus:

- Pagination SQLite: Tampilan tabel transaksi dan riwayat shift menggunakan query `LIMIT` dan `OFFSET` langsung pada SQLite dengan opsi 25, 50, atau 100 baris per halaman.
- Indeks Tanggal Bisnis: Database memakai indeks pada kolom `business_date` sehingga pemfilteran tanggal dan pencarian ID tetap responsif pada database besar.
- Pengujian Skala 100.000 Transaksi: Repository menyertakan skrip pembuat data pengujian (`npm run dummy-db`) yang mengisi database dengan 100.000 transaksi acak selama 730 hari operasional. Pengujian memvalidasi bahwa query filter laporan bulanan, grafik harian, dan paginasi berjalan dalam hitungan milidetik tanpa membebani memori render.
- Suite Pengujian Otomatis: Memiliki 94 skenario pengujian unit (`npm test`) yang memverifikasi logika perpajakan, split bill, rekonsiliasi kas shift, integritas file backup, dan kalkulasi ekspor Excel.

## Akun Bawaan Awal

Saat aplikasi pertama kali dijalankan, sistem menyediakan tiga akun awal:

- Owner: PIN `1234` (Akses penuh seluruh menu, manajemen user, reset data, dan backup)
- Admin: PIN `2345` (Akses menu operasional, laporan, dan otorisasi void)
- Kasir 01: PIN `3456` (Akses transaksi penjualan dan shift kasir)

Ubah seluruh PIN bawaan melalui menu Manajemen Pengguna setelah masuk sebagai Owner.

## Kebutuhan Sistem

- Node.js versi 22.0.0 atau yang lebih baru
- npm versi 10.0.0 atau yang lebih baru
- Windows 10/11 (64-bit) atau macOS 12 Monterey ke atas

## Cara Instalasi dan Menjalankan

1. Kloning repositori:
```bash
git clone https://github.com/Light-Yodeler/resto-pos-electron.git
cd resto-pos-electron
```

2. Pasang dependensi:
```bash
npm install
```

3. Jalankan aplikasi dalam mode pengembangan:
```bash
npm start
```
Atau gunakan:
```bash
npm run dev
```

4. Jalankan uji unit otomatis:
```bash
npm test
```

## Membangun Paket Distribusi Installer

Untuk menghasilkan file instalasi desktop mandiri:

- Paket macOS (DMG dan berkas ZIP):
```bash
npm run dist:mac
```
Output berkas akan dibuat di folder `release/`.

- Paket Windows (Installer NSIS dan versi Portable 64-bit):
```bash
npm run dist:win
```
Output berkas installer `.exe` akan tersimpan di folder `release/`.

## Backup dan Pemulihan Data

Menu Pengaturan menyediakan opsi pemeliharaan data:

- Backup Database Penuh: Menghasilkan salinan database SQLite aktif (`.db`). File ini memuat seluruh pengaturan, pengguna, menu, shift, dan riwayat transaksi.
- Restore Database: Mengganti database aktif dengan file cadangan `.db`. Sistem melakukan uji integritas SQLite (`PRAGMA quick_check`) sebelum penimpaan data disetujui. Opsi ini dilindungi verifikasi PIN Owner.
- Backup dan Restore Menu: Format berkas khusus berekstensi `.andamenu` untuk memindahkan daftar kategori dan produk menu antar cabang tanpa memengaruhi catatan transaksi lokal.

## Membuat Database Uji untuk Benchmark

Jalankan perintah berikut untuk membuat database pengujian dengan 100.000 transaksi:

```bash
npm run dummy-db
```

Perintah ini akan menghasilkan berkas `outputs/Anda-POS-Dummy-100K.db`. Anda dapat memuat berkas ini melalui menu Pengaturan > Restore database untuk menguji kecepatan query dan tampilan laporan pada data riil berskala besar.
