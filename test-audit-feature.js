// Script untuk menguji fitur log audit
// File: test-audit-feature.js

const API_BASE_URL = 'http://localhost:8000/api';

// Token autentikasi - ganti dengan token valid dari sesi login Anda
let authToken = '';

async function testAuditFeature() {
  console.log('=== Testing Audit Feature ===\n');
  
  // 1. Coba ambil log audit
  console.log('1. Mengambil log audit...');
  try {
    const response = await fetch(`${API_BASE_URL}/audit/logs`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Berhasil mengambil log audit');
      console.log(`  Jumlah log: ${data.data?.length || 0}`);
      console.log(`  Total halaman: ${data.pagination?.pages || 0}\n`);
    } else {
      console.log('✗ Gagal mengambil log audit:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('✗ Error saat mengambil log audit:', error.message);
  }

  // 2. Coba buat produk baru untuk menguji log audit
  console.log('2. Membuat produk baru untuk menguji log audit...');
  try {
    const newProduct = {
      sku: `TEST-${Date.now()}`,
      name: `Test Product ${Date.now()}`,
      category: 'Active',
      unit: 'Pcs'
    };
    
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newProduct)
    });
    
    if (response.ok) {
      const product = await response.json();
      console.log('✓ Produk berhasil dibuat');
      console.log(`  ID Produk: ${product.id}`);
      console.log(`  Nama: ${product.name}\n`);
      
      // 3. Coba update produk untuk menguji log update
      console.log('3. Memperbarui produk untuk menguji log update...');
      try {
        const updatedProduct = {
          ...newProduct,
          name: `Updated Test Product ${Date.now()}`
        };
        
        const updateResponse = await fetch(`${API_BASE_URL}/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedProduct)
        });
        
        if (updateResponse.ok) {
          const updated = await updateResponse.json();
          console.log('✓ Produk berhasil diperbarui');
          console.log(`  Nama baru: ${updated.name}\n`);
        } else {
          console.log('✗ Gagal memperbarui produk:', updateResponse.status, updateResponse.statusText);
        }
      } catch (error) {
        console.log('✗ Error saat memperbarui produk:', error.message);
      }
      
      // 4. Coba hapus produk untuk menguji log delete
      console.log('4. Menghapus produk untuk menguji log delete...');
      try {
        const deleteResponse = await fetch(`${API_BASE_URL}/products/${product.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (deleteResponse.ok) {
          console.log('✓ Produk berhasil dihapus\n');
        } else {
          console.log('✗ Gagal menghapus produk:', deleteResponse.status, deleteResponse.statusText);
        }
      } catch (error) {
        console.log('✗ Error saat menghapus produk:', error.message);
      }
    } else {
      console.log('✗ Gagal membuat produk:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('✗ Error saat membuat produk:', error.message);
  }

  // 5. Ambil kembali log audit untuk melihat perubahan
  console.log('5. Mengambil kembali log audit untuk melihat perubahan...');
  try {
    const response = await fetch(`${API_BASE_URL}/audit/logs`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Berhasil mengambil log audit terbaru');
      console.log(`  Jumlah log terbaru: ${data.data?.length || 0}`);
      
      // Tampilkan beberapa log terbaru
      if (data.data && data.data.length > 0) {
        console.log('\n  Beberapa log terbaru:');
        data.data.slice(0, 5).forEach(log => {
          console.log(`    - ${log.action} ${log.entity}: ${log.description}`);
          console.log(`      Oleh: ${log.user.name} (${log.user.email})`);
          console.log(`      Waktu: ${new Date(log.createdAt).toLocaleString('id-ID')}\n`);
        });
      }
    } else {
      console.log('✗ Gagal mengambil log audit terbaru:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('✗ Error saat mengambil log audit terbaru:', error.message);
  }

  console.log('=== Testing Selesai ===');
}

// Fungsi untuk login dan mendapatkan token
async function loginAndGetToken(email, password) {
  console.log('Mencoba login untuk mendapatkan token...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      console.log('✓ Login berhasil, token diperoleh\n');
      return authToken;
    } else {
      console.log('✗ Login gagal:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.log('✗ Error saat login:', error.message);
    return null;
  }
}

// Jalankan tes - pastikan untuk mengganti email dan password dengan akun valid
console.log('Catatan: Untuk menjalankan tes ini, Anda perlu menyediakan akun pengguna valid.');
console.log('Silakan ganti email dan password di bawah ini dengan akun yang valid.\n');

// Contoh penggunaan:
// loginAndGetToken('admin@example.com', 'password123')
//   .then(token => {
//     if (token) {
//       testAuditFeature();
//     }
//   });

// Jika Anda sudah memiliki token, Anda bisa langsung menggunakannya:
// authToken = 'your-jwt-token-here';
// testAuditFeature();