import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Timeline,
  TimelineContent,
  TimelineItem,
  TimelineLine,
  TimelineOppositeContent,
  TimelineSeparator,
} from '../components/ui/timeline';
import { 
  Clock, 
  Package, 
  MapPin, 
  User, 
  AlertTriangle, 
  ArchiveRestore,
  Move3D,
  Edit3,
  Hash
} from 'lucide-react';
import { cn } from '../lib/utils';

interface HistoryItem {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  field: string | null;
  notes: string | null;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}



interface ItemTimelineProps {
  itemId: string;
}

const actionIcons = {
  CREATE: Package,
  UPDATE_STATUS: MapPin,
  UPDATE_SN: Hash,
  UPDATE_MAC: Hash,
  UPDATE_NOTES: Edit3,
  UPDATE_LOCATION: MapPin,
  DELETE: AlertTriangle,
  RESTORE: ArchiveRestore,
  MOVE: Move3D,
  IMPORT: Package,
  Lainnya: Clock,
};

const actionLabels = {
  CREATE: 'Dibuat',
  UPDATE_STATUS: 'Status Diubah',
  UPDATE_SN: 'SN Diubah',
  UPDATE_MAC: 'MAC Diubah',
  UPDATE_NOTES: 'Catatan Diubah',
  UPDATE_LOCATION: 'Lokasi Diubah',
  DELETE: 'Dihapus',
  RESTORE: 'Dipulihkan',
  MOVE: 'Dipindahkan',
  IMPORT: 'Impor Artacom',
  Lainnya: 'Lainnya',
};

const actionColors = {
  CREATE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  UPDATE_STATUS: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  UPDATE_SN: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  UPDATE_MAC: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  UPDATE_NOTES: 'bg-green-500/10 text-green-600 border-green-500/20',
  UPDATE_LOCATION: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
  RESTORE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  MOVE: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  IMPORT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Lainnya: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

export function ItemTimeline({ itemId }: ItemTimelineProps) {
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchItemHistory();
  }, [itemId]);

  const fetchItemHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/histories/items/${itemId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHistories(data.data || data);
      } else {
        setError('Gagal memuat histori item');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat histori');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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



  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline Histori
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Memuat histori...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline Histori
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-red-500">
          {error}
          <Button variant="outline" className="mt-4" onClick={fetchItemHistory}>
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline Histori
        </CardTitle>
        <CardDescription>
          Riwayat perubahan untuk item ini
        </CardDescription>
      </CardHeader>
      <CardContent>
        {histories.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Belum ada histori untuk item ini
          </div>
        ) : (
          <Timeline>
            {histories.map((history, index) => {
              const ActionIcon = actionIcons[history.action as keyof typeof actionIcons] || Clock;
              const actionLabel = actionLabels[history.action as keyof typeof actionLabels] || history.action;
              
              return (
                <TimelineItem key={history.id}>
                  <TimelineOppositeContent className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(history.createdAt)}
                    </span>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border",
                      actionColors[history.action as keyof typeof actionColors]
                    )}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    {index !== histories.length - 1 && (
                      <TimelineLine />
                    )}
                  </TimelineSeparator>
                  <TimelineContent>
                    <div className="mb-2">
                      <Badge className={cn(
                        "mr-2",
                        actionColors[history.action as keyof typeof actionColors]
                      )}>
                        {actionLabel}
                      </Badge>
                      {history.user ? (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {history.user.name}
                        </span>
                      ) : (
                        (() => {
                          try {
                            const meta = history.metadata ? JSON.parse(history.metadata) : null;
                            if (meta && meta.artacomUser) {
                              return (
                                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {meta.artacomUser} (Artacom)
                                </span>
                              );
                            }
                          } catch (e) { /* ignore */ }
                          return null;
                        })()
                      )}
                    </div>
                    
                    <div className="text-sm">
                      {history.notes && <p className="mb-1">{history.notes}</p>}
                      
                      {history.field && (
                        <div className="text-xs bg-muted/50 rounded p-2 mt-2">
                          <span className="font-medium">Field:</span> {history.field}
                          {history.oldValue !== null && history.newValue !== null && (
                            <>
                              <br />
                              <span className="font-medium">Sebelum:</span> {history.oldValue}
                              <br />
                              <span className="font-medium">Sesudah:</span> {history.newValue}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
}