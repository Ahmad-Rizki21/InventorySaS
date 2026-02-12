# Sistem Permissions InventorySaaS

Sistem ini menyediakan manajemen role dan permissions untuk aplikasi InventorySaaS. Berikut adalah panduan penggunaannya:

## Struktur Database

### Model Role
- `id`: String (UUID)
- `name`: String (unik) - Nama role (ADMIN, GUDANG, TEKNISI)
- `permissions`: Array[String] - Daftar permissions yang dimiliki role
- `users`: Relasi ke model User
- `createdAt`, `updatedAt`: DateTime

### Perubahan pada Model User
- `roleId`: String - Foreign key ke model Role
- `role`: Relasi ke model Role

## API Endpoints

### Role Management
- `GET /api/roles` - Mendapatkan semua role (memerlukan permission: `roles.view`)
- `GET /api/roles/:id` - Mendapatkan role berdasarkan ID (memerlukan permission: `roles.view`)
- `POST /api/roles` - Membuat role baru (memerlukan permission: `roles.create`)
- `PUT /api/roles/:id` - Memperbarui role (memerlukan permission: `roles.update`)
- `PATCH /api/roles/:id/permissions` - Memperbarui permissions role (memerlukan permission: `roles.update`)
- `DELETE /api/roles/:id` - Menghapus role (memerlukan permission: `roles.delete`)

## Permissions Default

### ADMIN
- `products.view`, `products.create`, `products.update`, `products.delete`
- `inventory.view`, `inventory.stock_in`, `inventory.stock_out`, `inventory.audit`
- `users.manage`, `settings.view`, `activity_log.view`

### GUDANG
- `products.view`
- `inventory.view`, `inventory.stock_in`, `inventory.stock_out`, `inventory.audit`
- `activity_log.view`

### TEKNISI
- `inventory.view`, `inventory.audit`

## Frontend Components

### Sidebar
Sidebar sekarang menampilkan menu berdasarkan permissions pengguna. Jika pengguna tidak memiliki permission untuk menu tertentu, maka menu tersebut tidak akan ditampilkan.

### Role Management Page
Halaman `/role-management` menyediakan antarmuka untuk mengelola role dan permissions.

## Cara Setup

1. Jalankan migrasi database:
   ```
   cd server
   npx prisma migrate dev --name add_role_permissions
   ```

2. Jalankan seeding untuk membuat role-role default:
   ```
   node src/scripts/seedRoles.js
   ```

3. Restart server untuk memastikan semua perubahan diterapkan.

## Penambahan Permissions Baru

Untuk menambahkan permissions baru:
1. Tambahkan permission ke dalam daftar `PERMISSION_LIST` di `RoleManagement.tsx`
2. Tambahkan permission ke role yang sesuai saat seeding atau melalui antarmuka
3. Gunakan permission tersebut di sidebar atau komponen lain dengan menambahkan properti `permission` ke item navigasi

## Protected Route Berdasarkan Permission

Gunakan komponen `ProtectedRouteByPermission` untuk melindungi halaman berdasarkan permission:
```jsx
import { ProtectedRouteByPermission } from '../components/ProtectedRouteByPermission';

// Di dalam route
<Route 
  path="/some-protected-page" 
  element={
    <ProtectedRouteByPermission permission="some.permission">
      <SomeProtectedComponent />
    </ProtectedRouteByPermission>
  } 
/>
```

## Catatan Penting

- Pastikan untuk selalu memeriksa permissions sebelum menampilkan elemen UI atau mengizinkan akses ke fitur tertentu
- Jangan menghapus role yang masih digunakan oleh pengguna
- Permissions bersifat case-sensitive
- Aplikasi hanya menyediakan fitur login, tidak ada fitur register. User harus dibuat melalui seeding atau admin panel.