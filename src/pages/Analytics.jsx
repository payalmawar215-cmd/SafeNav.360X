import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle2, Shield, Clock, Filter, RefreshCw, Loader2, Trash2, Flag, ThumbsUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const TYPE_COLORS = {
  harassment: '#ef4444', unsafe_street: '#f59e0b',
  suspicious: '#8b5cf6', poor_lighting: '#3b82f6', other: '#6b7280',
};
const TYPE_FILTERS = ['All', 'harassment', 'unsafe_street', 'suspicious', 'poor_lighting', 'other'];
const STATUS_FILTERS = ['All', 'pending', 'approved', 'flagged'];

function StatCard({ icon, label, value, color }) {
  const colors = { primary: 'bg-primary/10 text-primary', safe: 'bg-safe/10 text-safe', caution: 'bg-caution/10 text-caution', danger: 'bg-danger/10 text-danger' };
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colors[color])}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function Analytics() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => base44.entities.IncidentReport.list('-created_date', 100),
    refetchInterval: 20000,
  });

  // Subscribe for real-time
  useEffect(() => {
    const unsub = base44.entities.IncidentReport.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    });
    return unsub;
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IncidentReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IncidentReport.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reports'] }); setSelected([]); },
  });

  const bulkDelete = () => selected.forEach(id => deleteMutation.mutate(id));
  const bulkApprove = () => selected.forEach(id => updateMutation.mutate({ id, data: { status: 'approved' } }));

  const filtered = reports.filter(r => {
    const typeMatch = typeFilter === 'All' || r.type === typeFilter;
    const statusMatch = statusFilter === 'All' || r.status === statusFilter;
    const searchMatch = !search || (r.description || '').toLowerCase().includes(search.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  // Charts
  const byType = Object.entries(
    reports.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {})
  ).map(([type, count]) => ({ type, count, color: TYPE_COLORS[type] }));

  const approved = reports.filter(r => r.status === 'approved').length;
  const pending = reports.filter(r => r.status === 'pending' || !r.status).length;

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div className="flex flex-col px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">{t('analytics')}</h2>
          <p className="text-xs text-muted-foreground">Real-time safety insights</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 rounded-xl text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Admin badge or lock */}
      {!isAdmin && (
        <div className="mb-4 bg-caution/10 border border-caution/20 rounded-2xl p-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-caution" />
          <p className="text-xs text-caution font-medium">Admin actions (approve/delete) require admin role.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Total Reports" value={reports.length} color="caution" />
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Approved" value={approved} color="safe" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Pending" value={pending} color="primary" />
        <StatCard icon={<Shield className="w-4 h-4" />} label="Flagged" value={reports.filter(r => r.status === 'flagged').length} color="danger" />
      </div>

      {/* Pie chart */}
      {byType.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <p className="text-sm font-semibold mb-3">Reports by Type</p>
          <div className="flex gap-4 items-center">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={byType} dataKey="count" cx="50%" cy="50%" outerRadius={50} innerRadius={28}>
                  {byType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1">
              {byType.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-[11px] text-muted-foreground capitalize">{item.type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[11px] font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search & Filters */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Incident Reports</p>
          {selected.length > 0 && isAdmin && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs text-safe border-safe/30 rounded-lg" onClick={bulkApprove}>
                ✓ Approve ({selected.length})
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs rounded-lg" onClick={bulkDelete}>
                Delete ({selected.length})
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..."
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground" />
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
          {TYPE_FILTERS.map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={cn("shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                typeFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground")}>
              {f === 'All' ? 'All Types' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn("shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                statusFilter === f ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground")}>
              {f === 'All' ? 'All Status' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {isLoading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground text-center py-6">No reports match filters</p>
          )}
          {filtered.map(report => (
            <div key={report.id} onClick={() => isAdmin && toggleSelect(report.id)}
              className={cn("flex items-start gap-2.5 p-3 rounded-xl border transition-all",
                isAdmin && "cursor-pointer",
                selected.includes(report.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/20")}>
              {isAdmin && (
                <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                  selected.includes(report.id) ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                  {selected.includes(report.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold capitalize">{report.type?.replace('_', ' ')}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                    report.status === 'approved' ? "bg-safe/10 text-safe"
                      : report.status === 'flagged' ? "bg-danger/10 text-danger"
                      : "bg-caution/10 text-caution")}>
                    {report.status || 'pending'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{report.description || 'No description'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(report.created_date).toLocaleDateString()} · {report.lat?.toFixed(3)}, {report.lng?.toFixed(3)}
                </p>
              </div>
              {isAdmin && (
                <div className="flex flex-col gap-1">
                  <button onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: report.id, data: { status: 'approved' } }); }}
                    className="p-1 rounded hover:bg-safe/10 text-safe"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: report.id, data: { status: 'flagged' } }); }}
                    className="p-1 rounded hover:bg-caution/10 text-caution"><Flag className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(report.id); }}
                    className="p-1 rounded hover:bg-danger/10 text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}