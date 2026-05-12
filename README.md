# Fresh Laundry Indonesia

Fresh Laundry Indonesia adalah web app laundry statis untuk UMKM laundry Indonesia. Website ini cocok untuk GitHub Pages karena semua halaman, data, dan media disimpan langsung di repository.

## Arsitektur

- Frontend: HTML, CSS, dan vanilla JavaScript.
- Hosting: GitHub Pages.
- CMS: Pages CMS.
- Database: file JSON di folder `data/`.
- Media: file gambar di folder `uploads/images/`.
- Backend: tidak ada backend, PHP, Laravel, Node.js backend, atau database server.

Frontend membaca data dengan `fetch()` dari file JSON. Pages CMS mengedit file JSON tersebut melalui konfigurasi `.pages.yml`. Setelah editor menyimpan perubahan, Pages CMS membuat commit ke GitHub, lalu GitHub Pages menayangkan versi terbaru.

## Kenapa GitHub Pages

GitHub Pages gratis, cepat, dan cocok untuk website statis. Untuk UMKM laundry, pendekatan ini cukup untuk profil bisnis, daftar layanan, harga, galeri, testimoni, kalkulator harga, order WhatsApp, dan cek status invoice berbasis JSON.

## Kenapa Pages CMS

Pages CMS memberi antarmuka editor untuk file di repository. Pemilik bisnis tidak perlu mengedit JSON manual selama sudah memiliki akses repository GitHub yang benar.

## Struktur Folder

```text
.
|-- index.html
|-- admin-info.html
|-- assets/
|   |-- css/style.css
|   `-- js/app.js
|-- data/
|   |-- settings.json
|   |-- services.json
|   |-- prices.json
|   |-- testimonials.json
|   |-- gallery.json
|   |-- orders.json
|   `-- workers.json
|-- uploads/images/
|-- .pages.yml
`-- README.md
```

## Menjalankan Lokal

Karena website memakai `fetch()`, jalankan dari local server:

```bash
python -m http.server 8000
```

Buka `http://localhost:8000`.

## Deploy ke GitHub Pages

1. Push semua file ke repository GitHub.
2. Buka Settings repository.
3. Masuk ke Pages.
4. Pilih branch utama, misalnya `main`.
5. Pilih folder `/root`.
6. Simpan dan tunggu GitHub Pages selesai build.

## Menghubungkan Pages CMS

1. Pastikan `.pages.yml` berada di root repository.
2. Buka `https://app.pagescms.org/`.
3. Login dengan GitHub.
4. Pilih repository.
5. Pages CMS akan membaca konfigurasi `media` dan `content`.
6. Edit data, lalu simpan perubahan.

## Tentang `.pages.yml`

File `.pages.yml` mendefinisikan:

- Media folder: `uploads/images` dengan output relatif `uploads/images`.
- Business Settings: `data/settings.json`.
- Services: `data/services.json`.
- Prices: `data/prices.json`.
- Testimonials: `data/testimonials.json`.
- Gallery: `data/gallery.json`.
- Orders: `data/orders.json`.
- Workers: `data/workers.json`.

File list seperti services, prices, orders, dan workers memakai `list: true` agar Pages CMS menganggap isi JSON sebagai array.

## Mengedit Konten dari Pages CMS

Pemilik dapat mengubah nama bisnis, hero, nomor WhatsApp, harga, layanan, testimoni, galeri, order, dan pekerja dari Pages CMS. Perubahan akan tersimpan sebagai commit GitHub. Website otomatis membaca data terbaru setelah GitHub Pages memperbarui halaman.

## Mengelola Media

Upload gambar melalui field bertipe `image` di Pages CMS. File akan disimpan ke `uploads/images/`, dan URL yang masuk ke JSON memakai format relatif `uploads/images/nama-file`.

## Konsep Role

Role pada proyek ini hanya konsep data:

- Pemilik: mengelola semua konten lewat Pages CMS berdasarkan izin GitHub.
- Pekerja: tersimpan di `data/workers.json`, bisa dipilih di field `handled_by`, dan performanya dihitung dari order.

Dashboard `admin-info.html` bersifat read-only. Tidak ada login aman di frontend statis.

## Catatan Keamanan

Access control Pages CMS bergantung pada permission repository GitHub. Siapa pun yang punya izin edit repository dapat mengubah data melalui Pages CMS atau langsung melalui GitHub.

Static website tidak bisa menyediakan login pekerja yang benar-benar aman karena kode dan data dapat dibaca di browser. Simulasi login frontend tidak boleh dianggap sebagai keamanan produksi.

## Batasan Arsitektur Statis

- Tidak ada autentikasi aman untuk pekerja.
- Tidak ada validasi server-side.
- Tidak ada penyimpanan order otomatis dari form ke database.
- Order WhatsApp hanya membuka pesan yang sudah diformat.
- Dashboard admin hanya membaca JSON publik.
- Data order bersifat publik jika repository/site publik.

## Upgrade Produksi yang Disarankan

Untuk kebutuhan multi-user, login aman, dan data pelanggan sensitif, gunakan backend atau BaaS:

- Supabase Auth dan Supabase Database.
- Firebase Auth dan Firestore.
- Laravel API.
- Node.js API.
- Appwrite.

Dengan upgrade tersebut, pekerja dapat login aman, order bisa dibuat dari website, dan data pelanggan tidak perlu dipublikasikan sebagai JSON statis.
