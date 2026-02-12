import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Calendar, Search, Download, FileText, User, Package, PackagePlus, PackageMinus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface AuditLog {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  entity: string;
  entityId: string;
  description: string;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch audit logs from API
  const fetchAuditLogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      
      if (entityFilter !== 'all') {
        params.append('entity', entityFilter);
      }
      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }

      const response = await fetch(`${API_URL}/api/audit/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
        setFilteredLogs(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = logs.filter(log => 
        log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  }, [searchTerm, logs]);

  // Fetch logs on component mount and when filters change
  useEffect(() => {
    fetchAuditLogs(currentPage);
  }, [entityFilter, actionFilter, currentPage, pageSize]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch ALL data matching current filters for export
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Large limit for export
      });
      
      if (entityFilter !== 'all') params.append('entity', entityFilter);
      if (actionFilter !== 'all') params.append('action', actionFilter);

      const response = await fetch(`${API_URL}/api/audit/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      
      const result = await response.json();
      const allLogs = result.data;

      if (allLogs.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
      }

      const data = allLogs.map((log: AuditLog) => {
        let metaDisplay = '-';
        if (log.metadata) {
          try {
            const parsed = JSON.parse(log.metadata);
            metaDisplay = Object.entries(parsed)
              .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
              .join(' | ');
          } catch (e) {
            metaDisplay = log.metadata;
          }
        }

        return {
          'Waktu': format(new Date(log.createdAt), 'dd MMMM yyyy HH:mm:ss', { locale: id }),
          'Nama Pengguna': log.user.name,
          'Email': log.user.email,
          'Aksi': log.action,
          'Entitas': log.entity || '-',
          'Deskripsi': log.description,
          'Detail Metadata': metaDisplay,
          'IP Address': log.ipAddress || '-',
          'User Agent': log.userAgent || '-',
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Log Audit');

      // Auto-size columns for better readability
      const colWidths = Object.keys(data[0] || {}).map(key => {
        const headerLen = key.length;
        const maxDataLen = Math.max(...data.map((row: any) => String(row[key as keyof typeof row] || '').length));
        return { wch: Math.min(Math.max(headerLen, maxDataLen) + 2, 50) }; // Cap at 50 chars
      });
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Report-Audit-Log-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Terjadi kesalahan saat mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  // Get icon based on entity type
  const getEntityIcon = (entity: string | null) => {
    switch (entity) {
      case 'PRODUCT': return <Package className="h-4 w-4" />;
      case 'ITEM': return <PackagePlus className="h-4 w-4" />;
      case 'STOCK': return <PackageMinus className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Get badge variant based on action
  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE': return 'default';
      case 'UPDATE': 
      case 'STOCK_IN': 
        return 'secondary';
      case 'DELETE': return 'destructive';
      case 'STOCK_OUT': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Aktivitas Pengeditan</h1>
          <p className="text-muted-foreground">Pelacakan siapa yang mengedit data inventory, produk, stock in, dan stock out</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchAuditLogs(currentPage)}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={exportToExcel} disabled={isExporting} size="sm">
            {isExporting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export ke Excel'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Gunakan filter untuk mencari log aktivitas tertentu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari nama pengguna, deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Entitas</Label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Entitas</SelectItem>
                  <SelectItem value="PRODUCT">Produk</SelectItem>
                  <SelectItem value="ITEM">Inventory/Item</SelectItem>
                  <SelectItem value="STOCK">Stok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Aksi</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="STOCK_IN">Stock In</SelectItem>
                  <SelectItem value="STOCK_OUT">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Item per Halaman</Label>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per halaman</SelectItem>
                  <SelectItem value="25">25 per halaman</SelectItem>
                  <SelectItem value="50">50 per halaman</SelectItem>
                  <SelectItem value="100">100 per halaman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Aktivitas</CardTitle>
          <CardDescription>
            Menampilkan {filteredLogs.length} dari {logs.length} log aktivitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada log aktivitas yang ditemukan
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Waktu</th>
                      <th className="text-left p-3">Pengguna</th>
                      <th className="text-left p-3">Aksi</th>
                      <th className="text-left p-3">Entitas</th>
                      <th className="text-left p-3">Deskripsi</th>
                      <th className="text-left p-3">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: id })}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{log.user.name}</div>
                              <div className="text-xs text-muted-foreground">{log.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {getEntityIcon(log.entity)}
                            <span>{log.entity || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="truncate" title={log.description}>
                            {log.description}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (log.metadata) {
                                alert(`Metadata:\n${JSON.stringify(JSON.parse(log.metadata), null, 2)}`);
                              } else {
                                alert('Tidak ada metadata tambahan');
                              }
                            }}
                          >
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t font-outfit">
                  <div className="text-sm text-muted-foreground">
                    Halaman <span className="font-semibold text-foreground">{currentPage}</span> dari <span className="font-semibold text-foreground">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-9 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              "h-9 w-9 p-0 transition-all duration-200",
                              currentPage === pageNum ? "shadow-md shadow-primary/20" : "hover:border-primary/50"
                            )}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-9 px-3"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}