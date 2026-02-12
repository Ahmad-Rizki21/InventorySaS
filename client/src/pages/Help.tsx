import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  MessageCircle,
  Mail,
  Phone,
} from 'lucide-react';
import { cn } from '../lib/utils';

const faqs = [
  {
    question: 'Bagaimana cara menambah produk baru?',
    answer: 'Masuk ke menu Products > FTTH SECTION > Produk, lalu klik tombol "Tambah Produk" di pojok kanan atas. Isi SKU, Nama, Kategori, dan Unit.',
  },
  {
    question: 'Apa bedanya Stok dan Items (SN)?',
    answer: 'Stok untuk barang yang tidak punya serial number (kabel, splitter) dihitung per meter/pcs. Items (SN) untuk barang yang punya serial number unik (ONT, modem).',
  },
  {
    question: 'Bagaimana cara scan Serial Number?',
    answer: 'Gunakan fitur Audit/Scan di FTTH SECTION. Buka halaman tersebut dan klik "Scan QR" untuk menggunakan kamera HP scan QR/Barcode item.',
  },
  {
    question: 'Apa itu status item (GUDANG, TERPASANG, TEKNISI, RUSAK)?',
    answer: 'GUDANG = barang di gudang, TERPASANG = sudah dipasang ke pelanggan, TEKNISI = dibawa teknisi, RUSAK = perlu diganti.',
  },
];

export function Help() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bantuan</h1>
        <p className="text-muted-foreground">Panduan dan dokumentasi sistem inventory</p>
      </div>

      {/* Quick Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Butuh Bantuan Langsung?</CardTitle>
          <CardDescription>Hubungi tim support kami</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="mailto:support@inventorysaas.com"
              className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">support@inventorysaas.com</p>
              </div>
            </a>
            <a
              href="https://wa.me/62xxxxxxxx"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-xs text-muted-foreground">0812-3456-7890</p>
              </div>
            </a>
            <a
              href="tel:+622134567890"
              className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Phone className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Telepon</p>
                <p className="text-xs text-muted-foreground">(021) 3456-7890</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Pertanyaan yang Sering Diajukan (FAQ)</CardTitle>
          <CardDescription>Jawaban untuk pertanyaan umum seputar sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border rounded-lg overflow-hidden"
              >
                <details className="group">
                  <summary className="flex items-center justify-between p-4 hover:bg-accent transition-colors cursor-pointer list-none">
                    <span className="font-medium pr-4">{faq.question}</span>
                    <span className="text-muted-foreground group-open:rotate-90 transition-transform">▶</span>
                  </summary>
                  <div className="p-4 pt-0 text-sm text-muted-foreground border-t">
                    {faq.answer}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Versi Aplikasi</dt>
              <dd className="text-base font-medium">v1.0.0</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Terakhir Update</dt>
              <dd className="text-base font-medium">Februari 2026</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
