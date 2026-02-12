#!/bin/bash
# Script untuk setup awal sistem permissions

echo "Menyiapkan sistem permissions..."

# Jalankan migrasi database
echo "Menjalankan migrasi database..."
cd server
npx prisma migrate dev --name add_role_permissions

# Jalankan seeding untuk membuat role-role default
echo "Menjalankan seeding role..."
node src/scripts/seedRoles.js

echo "Setup sistem permissions selesai!"
echo "Silakan restart server untuk memastikan semua perubahan diterapkan."