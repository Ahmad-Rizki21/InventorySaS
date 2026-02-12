# Konfigurasi Artacom API

Berikut adalah panduan untuk mengkonfigurasi integrasi Artacom API di aplikasi InventorySaaS Anda.

## Variabel Lingkungan

Tambahkan baris berikut ke file `.env` di direktori `server/`:

```env
# Artacom API Configuration
ARTACOM_BASE_URL="https://billingftth.my.id"
ARTACOM_EMAIL="ahmad@ajnusa.com"
ARTACOM_PASSWORD="password"
```

## Endpoint API yang Didukung

Saat ini, service Artacom mencoba beberapa kemungkinan endpoint:

### Otentikasi
- `/api/auth/login`
- `/api/v1/auth/login`
- `/api/login`
- `/auth/login`
- `/api/auth/token`

### Inventory
- `/api/inventory`
- `/api/v1/inventory`
- `/api/inventory/items`
- `/api/devices`
- `/api/v1/devices`
- `/api/stock`
- `/api/v1/stock`

## Troubleshooting

Jika sinkronisasi gagal:

1. Pastikan kredensial Anda benar
2. Periksa apakah API Artacom aktif
3. Hubungi administrator sistem Artacom untuk informasi endpoint API yang benar
4. Endpoint API mungkin berbeda dari yang tercantum di atas

## Catatan

- Service ini dirancang untuk mencoba berbagai kemungkinan endpoint secara otomatis
- Jika semua endpoint gagal, kemungkinan besar struktur API berbeda dari yang didukung
- Anda mungkin perlu menghubungi tim Artacom untuk dokumentasi API resmi