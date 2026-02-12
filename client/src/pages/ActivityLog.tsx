import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Activity,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  FileText,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  user: {
    id: string;
    name: string;
    email: string;
    roleLegacy: string;
    role?: {
      id: string;
      name: string;
      permissions: string[];
    };
  };
}


const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-500/10 text-green-600',
  LOGOUT: 'bg-gray-500/10 text-gray-600',
  CREATE_PRODUCT: 'bg-blue-500/10 text-blue-600',
  UPDATE_PRODUCT: 'bg-yellow-500/10 text-yellow-600',
  DELETE_PRODUCT: 'bg-red-500/10 text-red-600',
  STOCK_IN: 'bg-teal-500/10 text-teal-600',
  STOCK_OUT: 'bg-orange-500/10 text-orange-600',
  CHANGE_PASSWORD: 'bg-purple-500/10 text-purple-600',
  CREATE_USER: 'bg-indigo-500/10 text-indigo-600',
  UPDATE_USER: 'bg-cyan-500/10 text-cyan-600',
  DELETE_USER: 'bg-pink-500/10 text-pink-600',
  MOVE: 'bg-blue-500/10 text-blue-600',
  RESET_PASSWORD: 'bg-red-500/10 text-red-600',
  UPDATE_STATUS: 'bg-amber-500/10 text-amber-600',
};

const actionLabels: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  CREATE_PRODUCT: 'Tambah Produk',
  UPDATE_PRODUCT: 'Update Produk',
  DELETE_PRODUCT: 'Hapus Produk',
  STOCK_IN: 'Stok Masuk',
  STOCK_OUT: 'Stok Keluar',
  CHANGE_PASSWORD: 'Ganti Password',
  CREATE_USER: 'Tambah User',
  UPDATE_USER: 'Update User',
  DELETE_USER: 'Hapus User',
  MOVE: 'Pergerakan Barang',
  RESET_PASSWORD: 'Reset Password',
  UPDATE_STATUS: 'Update Status',
};

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (userFilter !== 'all') params.append('userId', userFilter);
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/activity-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActionTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/activity-logs/meta/actions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActionTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch action types:', error);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
      });

      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (userFilter !== 'all') params.append('userId', userFilter);
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/activity-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch data for export');
      
      const result = await response.json();
      const allLogs = result.data;

      const data = allLogs.map((log: ActivityLogEntry) => ({
        'Waktu': format(new Date(log.createdAt), 'dd MMMM yyyy HH:mm', { locale: id }),
        'Nama Pengguna': log.user.name,
        'Role': log.user.roleLegacy,
        'Aksi': getActionLabel(log.action),
        'Deskripsi': log.description,
        'IP Address': log.ipAddress || '-',
        'User Agent': log.userAgent || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Activity Log');
      
      const colWidths = Object.keys(data[0] || {}).map(key => {
        const headerLen = key.length;
        const maxDataLen = Math.max(...data.map((row: any) => String(row[key as keyof typeof row] || '').length));
        return { wch: Math.min(Math.max(headerLen, maxDataLen) + 2, 50) };
      });
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Report-Activity-Log-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`);
    } catch (error) {
      console.error('Failed to export activity logs:', error);
      alert('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchActionTypes();
  }, [currentPage, actionFilter, userFilter, dateFrom, dateTo]);

  const filteredLogs = logs.filter(
    (log) =>
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-gray-500/10 text-gray-600';
  };

  const getActionLabel = (action: string) => {
    return actionLabels[action] || action;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setUserFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">Riwayat aktivitas pengguna di sistem</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari aktivitas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label>Tipe Aksi</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {getActionLabel(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>Sampai Tanggal</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Reset Button */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetFilters}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Aktivitas</CardTitle>
              <CardDescription>Total {total} aktivitas tercatat</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              disabled={isExporting || logs.length === 0}
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tidak ada aktivitas ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.user.roleLegacy}
                      </Badge>

                      <Badge className={cn('text-xs', getActionColor(log.action))}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.createdAt)}
                      </div>
                      {log.ipAddress && (
                        <div>IP: {log.ipAddress}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <div className="flex items-center gap-1">
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
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
