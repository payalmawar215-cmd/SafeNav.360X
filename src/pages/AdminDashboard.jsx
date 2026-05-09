import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle2, Clock, Flag, Trash2,
  RefreshCw, Loader2, Filter, Lock, TrendingUp, Users,
  MapPin, Eye, BarChart2, ChevronRight, X, Map
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TYPE_COLORS = {
  harassment: '#ef4444', unsafe_street: '#f59e0b',
  suspicious: '#8b5cf6', poor_lighting: '#3b82f6', other: '#6b7280',
};

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        {sub && <span className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>{sub}</span>}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{label}</p>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'map', label: 'Risk Map', icon: Map },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-all-reports'],
    queryFn: () => base44.entities.IncidentReport.list('-created_date', 200),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const unsub = base44.entities.IncidentReport.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-reports'] });
    });
    return unsub;
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IncidentReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-reports'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IncidentReport.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-all-reports'] }); setSelected([]); },
  });

  const filtered = reports.filter(r => {
    const typeMatch = typeFilter === 'All' || r.type === typeFilter;
    const statusMatch = statusFilter === 'All' || r.status === statusFilter;
    const searchMatch = !search || (r.description || '').toLowerCase().includes(search.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  const byType = Object.entries(
    reports.reduce((acc, r) => { acc[r.type || 'other'] = (acc[r.type || 'other'] || 0) + 1; return acc; }, {})
  ).map(([type, count]) => ({ type, count, color: TYPE_COLORS[type] || '#6b7280' }));

  const byStatus = [
    { name: 'Pending', value: reports.filter(r => r.status === 'pending' || !r.status).length, color: '#F59E0B' },
    { name: 'Approved', value: reports.filter(r => r.status === 'approved').length, color: '#10B981' },
    { name: 'Flagged', value: reports.filter(r => r.status === 'flagged').length, color: '#EF4444' },
  ];

  // Weekly trend mock from reports
  const now = Date.now();
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * 86400000);
    const count = reports.filter(r => {
      const d = new Date(r.created_date);
      return d.toDateString() === day.toDateString();
    }).length;
    return { day: day.toLocaleDateString('en', { weekday: 'short' }), count };
  });

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const bulkDelete = () => selected.forEach(id => deleteMutation.mutate(id));
  const bulkApprove = () => { selected.forEach(id => updateMutation.mutate({ id, data: { status: 'approved' } })); setSelected([]); };

  // RBAC: only admins — after all hooks
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: '#0B0F1A' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <Lock className="w-8 h-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-center mb-6" style={{ color: '#9CA3AF' }}>
          This admin dashboard is restricted to authorized administrators only.
        </p>
        <button onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }}>
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B0F1A' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4"
        style={{ background: 'rgba(11,15,26,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X className="w-4 h-4 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">Admin Dashboard</h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-[10px]" style={{ color: '#6B7280' }}>SafeNav360X · {user.email}</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <RefreshCw className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={tab === t.id ? {
                  background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                  color: 'white',
                  boxShadow: '0 2px 12px rgba(79,70,229,0.4)',
                } : { color: '#9CA3AF' }}>
                <Icon className="w-3.5 h-3.5" />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 pb-16">
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Total Reports" value={reports.length} color="#F59E0B" />
              <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Approved" value={byStatus[1].value} color="#10B981" />
              <StatCard icon={<Clock className="w-4 h-4" />} label="Pending" value={byStatus[0].value} color="#818CF8" />
              <StatCard icon={<Flag className="w-4 h-4" />} label="Flagged" value={byStatus[2].value} color="#EF4444" />
            </div>

            {/* Weekly trend */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm font-bold text-white mb-3">Weekly Incident Trend</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 }} />
                  <Bar dataKey="count" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By type */}
            {byType.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-sm font-bold text-white mb-3">Reports by Type</p>
                <div className="flex gap-3 items-center">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={byType} dataKey="count" cx="50%" cy="50%" outerRadius={46} innerRadius={24}>
                        {byType.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 flex-1">
                    {byType.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-[11px] capitalize" style={{ color: '#9CA3AF' }}>{item.type.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[11px] font-bold text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INCIDENTS TAB */}
        {tab === 'incidents' && (
          <div>
            {/* Bulk actions */}
            {selected.length > 0 && (
              <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="flex gap-2 mb-3 p-2 rounded-2xl"
                style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.25)' }}>
                <button onClick={bulkApprove}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}>
                  ✓ Approve ({selected.length})
                </button>
                <button onClick={bulkDelete}
                  className="flex-1 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                  🗑 Delete ({selected.length})
                </button>
                <button onClick={() => setSelected([])}
                  className="w-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </motion.div>
            )}

            {/* Search + filters */}
            <div className="flex items-center gap-2 mb-2 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: '#6B7280' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
                className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-gray-600" />
            </div>

            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
              {['All', 'harassment', 'unsafe_street', 'suspicious', 'poor_lighting', 'other'].map(f => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className={cn("shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all",
                    typeFilter === f
                      ? "text-white"
                      : "text-muted-foreground"
                  )}
                  style={typeFilter === f
                    ? { background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                  }>
                  {f === 'All' ? 'All Types' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              {['All', 'pending', 'approved', 'flagged'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={cn("shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all")}
                  style={statusFilter === f
                    ? { background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22D3EE' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280' }
                  }>
                  {f === 'All' ? 'All Status' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4F46E5' }} /></div>}

            <div className="space-y-2">
              {filtered.map(report => (
                <div key={report.id}
                  onClick={() => toggleSelect(report.id)}
                  className="rounded-2xl p-3 cursor-pointer transition-all"
                  style={{
                    background: selected.includes(report.id) ? 'rgba(79,70,229,0.1)' : 'rgba(255,255,255,0.03)',
                    border: selected.includes(report.id) ? '1px solid rgba(79,70,229,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  <div className="flex items-start gap-2.5">
                    <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                      selected.includes(report.id) ? "border-primary bg-primary" : "border-white/20")}>
                      {selected.includes(report.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold capitalize text-white">{report.type?.replace('_', ' ')}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={report.status === 'approved' ? { background: 'rgba(16,185,129,0.1)', color: '#10B981' }
                            : report.status === 'flagged' ? { background: 'rgba(239,68,68,0.1)', color: '#EF4444' }
                            : { background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                          {report.status || 'pending'}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{report.description || 'No description'}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>
                        {new Date(report.created_date).toLocaleDateString()} · {report.lat?.toFixed(3)}, {report.lng?.toFixed(3)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: report.id, data: { status: 'approved' } }); }}
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: report.id, data: { status: 'flagged' } }); }}
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                        <Flag className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(report.id); }}
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !isLoading && (
                <p className="text-xs text-center py-8" style={{ color: '#6B7280' }}>No reports match filters</p>
              )}
            </div>
          </div>
        )}

        {/* RISK MAP TAB */}
        {tab === 'map' && (
          <div>
            <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
              Heat zones based on incident frequency. Tap circles for details.
            </p>
            <div className="rounded-3xl overflow-hidden" style={{ height: 380, border: '1px solid rgba(255,255,255,0.08)' }}>
              <MapContainer center={[20.5937, 78.9629]} zoom={5}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {reports.filter(r => r.lat && r.lng).map(r => {
                  const color = r.type === 'harassment' ? '#ef4444'
                    : r.type === 'unsafe_street' ? '#f59e0b'
                    : r.type === 'suspicious' ? '#8b5cf6'
                    : '#3b82f6';
                  return (
                    <Circle key={r.id} center={[r.lat, r.lng]} radius={800}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 1.5 }}>
                      <Popup>
                        <div style={{ fontSize: 12 }}>
                          <b>{r.type?.replace('_', ' ')}</b>
                          <p>{r.description?.slice(0, 60) || 'No desc'}</p>
                          <p style={{ color: '#6B7280' }}>{new Date(r.created_date).toLocaleDateString()}</p>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}
              </MapContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-[10px] capitalize" style={{ color: '#9CA3AF' }}>{type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}