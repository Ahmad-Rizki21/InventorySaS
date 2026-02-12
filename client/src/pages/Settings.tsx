import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../components/ui/dialog';
import {
  User,
  Bell,
  Shield,
  Database,
  Pencil,
  Key,
  Save,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profil Pengguna',
    description: 'Kelola informasi profil Anda',
    icon: User,
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    description: 'Atur preferensi notifikasi',
    icon: Bell,
  },
  {
    id: 'security',
    title: 'Keamanan',
    description: 'Password dan autentikasi',
    icon: Shield,
  },
  {
    id: 'system',
    title: 'Sistem',
    description: 'Pengaturan aplikasi',
    icon: Database,
  },
];

export function Settings() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState('profile');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update
    console.log('Profile update:', profileForm);
    setEditProfileOpen(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru tidak cocok dengan konfirmasi password' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password berhasil diubah' });
        setTimeout(() => {
          setChangePasswordOpen(false);
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal mengubah password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan. Coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{user?.name}</CardTitle>
                      <CardDescription>{user?.email}</CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => setEditProfileOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profil
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Nama Lengkap</dt>
                    <dd className="text-base font-medium">{user?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                    <dd className="text-base font-medium">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                    <dd className="text-base font-medium capitalize">{user?.role?.name || 'User'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Member Sejak</dt>
                    <dd className="text-base font-medium">
                      {user ? new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : '-'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ubah Password</CardTitle>
                <CardDescription>
                  Ganti password akun Anda secara berkala untuk keamanan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Saat Ini</Label>
                  <Input type="password" placeholder="••••••••" value="••••••••" disabled />
                </div>
                <Button onClick={() => setChangePasswordOpen(true)} className="w-full sm:w-auto">
                  <Key className="h-4 w-4 mr-2" />
                  Ganti Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sesi Login</CardTitle>
                <CardDescription>
                  Kelola sesi login di perangkat Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Perangkat Ini (Windows)</p>
                      <p className="text-xs text-muted-foreground">Login sekarang</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferensi Notifikasi</CardTitle>
                <CardDescription>
                  Pilih notifikasi yang ingin Anda terima
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'low-stock', title: 'Stok Menipis', desc: 'Notifikasi saat stok barang menipis' },
                  { id: 'new-items', title: 'Item Baru', desc: 'Notifikasi ada item baru ditambahkan' },
                  { id: 'deployed', title: 'Status Terpasang', desc: 'Notifikasi saat item terpasang' },
                  { id: 'damaged', title: 'Item Rusak', desc: 'Notifikasi saat item dilaporkan rusak' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="h-6 w-11 bg-primary rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 h-4 w-4 bg-primary-foreground rounded-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Sistem</CardTitle>
                <CardDescription>Versi dan konfigurasi sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Versi Aplikasi</dt>
                    <dd className="text-base font-medium">v1.0.0</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Environment</dt>
                    <dd className="text-base font-medium capitalize">Development</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Backend API</dt>
                    <dd className="text-base font-medium">Connected</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Database</dt>
                    <dd className="text-base font-medium">MySQL</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tampilan</CardTitle>
                <CardDescription>Personalisasi tampilan aplikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bahasa</Label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                    className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola preferensi dan konfigurasi akun Anda</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Menu Pengaturan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent',
                        activeSection === section.id && 'bg-accent'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="text-left">
                        <p>{section.title}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderSection()}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profil</DialogTitle>
            <DialogDescription>
              Ubah informasi profil Anda
            </DialogDescription>
          </DialogHeader>
          <DialogClose onClick={() => setEditProfileOpen(false)} />

          <form onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditProfileOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Password</DialogTitle>
            <DialogDescription>
              Masukkan password baru untuk akun Anda
            </DialogDescription>
          </DialogHeader>
          <DialogClose onClick={() => setChangePasswordOpen(false)} />

          <form onSubmit={handlePasswordSubmit}>
            <div className="grid gap-4 py-4">
              {/* Message Display */}
              {message && (
                <div className={cn(
                  'p-3 rounded-lg text-sm',
                  message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                )}>
                  {message.text}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="current-password">Password Saat Ini</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Memproses...' : 'Ganti Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
