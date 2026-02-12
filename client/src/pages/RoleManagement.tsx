import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

const PERMISSION_LIST = [
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'inventory.view',
  'inventory.stock_in',
  'inventory.stock_out',
  'inventory.audit',
  'users.manage',
  'settings.view',
  'activity_log.view',
  'roles.view',
  'roles.create',
  'roles.update',
  'roles.delete'
];

export default function RoleManagement() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRolePermissions, setEditRolePermissions] = useState<string[]>([]);

  // Check if user has permission to manage roles
  const canManageRoles = user?.role && user.role.permissions && 
                         (user.role.permissions.includes('roles.update') || 
                         user.role.permissions.includes('roles.create') ||
                         user.role.permissions.includes('roles.delete'));

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.data);
      } else {
        throw new Error('Failed to fetch roles');
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast.error(error.message || 'Gagal mengambil data role');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Nama role harus diisi');
      return;
    }

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newRoleName.trim(),
          permissions: newRolePermissions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRoles([...roles, data.data]);
        setNewRoleName('');
        setNewRolePermissions([]);
        setIsCreateDialogOpen(false);
        toast.success('Role berhasil dibuat');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal membuat role');
      }
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Gagal membuat role');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || !editRoleName.trim()) {
      toast.error('Nama role harus diisi');
      return;
    }

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editRoleName.trim(),
          permissions: editRolePermissions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(roles.map(role => role.id === selectedRole.id ? data.data : role));
        setIsEditDialogOpen(false);
        toast.success('Role berhasil diperbarui');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui role');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Gagal memperbarui role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus role ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setRoles(roles.filter(role => role.id !== roleId));
        toast.success('Role berhasil dihapus');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menghapus role');
      }
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(error.message || 'Gagal menghapus role');
    }
  };

  const togglePermission = (permission: string, isCreating: boolean) => {
    if (isCreating) {
      if (newRolePermissions.includes(permission)) {
        setNewRolePermissions(newRolePermissions.filter(p => p !== permission));
      } else {
        setNewRolePermissions([...newRolePermissions, permission]);
      }
    } else {
      if (editRolePermissions.includes(permission)) {
        setEditRolePermissions(editRolePermissions.filter(p => p !== permission));
      } else {
        setEditRolePermissions([...editRolePermissions, permission]);
      }
    }
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setEditRoleName(role.name);
    setEditRolePermissions([...role.permissions]);
    setIsEditDialogOpen(true);
  };

  if (!canManageRoles) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 font-medium">Anda tidak memiliki izin untuk mengakses halaman ini</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Role</h1>
        <p className="text-muted-foreground">Kelola role dan hak akses pengguna</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Tambah Role Baru</Button>
        
        {isCreateDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsCreateDialogOpen(false)}
            />
            <div className="relative z-50 bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Tambah Role Baru</h2>
                <p className="text-sm text-muted-foreground">
                  Buat role baru dengan hak akses yang ditentukan
                </p>
              </div>
              <div className="space-y-4 py-4">
                <div>
                  <label htmlFor="role-name" className="block text-sm font-medium mb-1">
                    Nama Role
                  </label>
                  <Input
                    id="role-name"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Contoh: MANAGER"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                    {PERMISSION_LIST.map((permission) => (
                      <div key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`perm-${permission}`}
                          checked={newRolePermissions.includes(permission)}
                          onChange={() => togglePermission(permission, true)}
                          className="mr-2"
                        />
                        <label htmlFor={`perm-${permission}`} className="text-sm">
                          {permission}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button onClick={handleCreateRole}>Simpan Role</Button>
              </div>
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{role.name}</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      Hapus
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Dibuat: {new Date(role.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-2">Permissions:</h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.length > 0 ? (
                    role.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Tidak ada permissions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Role Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsEditDialogOpen(false)}
          />
          <div className="relative z-50 bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Edit Role</h2>
              <p className="text-sm text-muted-foreground">
                Perbarui nama dan hak akses role
              </p>
            </div>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="edit-role-name" className="block text-sm font-medium mb-1">
                  Nama Role
                </label>
                <Input
                  id="edit-role-name"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="Contoh: MANAGER"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {PERMISSION_LIST.map((permission) => (
                    <div key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-perm-${permission}`}
                        checked={editRolePermissions.includes(permission)}
                        onChange={() => togglePermission(permission, false)}
                        className="mr-2"
                      />
                      <label htmlFor={`edit-perm-${permission}`} className="text-sm">
                        {permission}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleUpdateRole}>Perbarui Role</Button>
            </div>
            <button
              onClick={() => setIsEditDialogOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}