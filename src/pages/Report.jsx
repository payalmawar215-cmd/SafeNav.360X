import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n.jsx';
import { useAppContext } from '@/lib/AppContext.jsx';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, MapPin, CheckCircle2, Clock, Shield, Send,
  Loader2, ThumbsUp, RefreshCw, ImagePlus, Newspaper, Brain, Plus
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LiveNewsSection from '@/components/report/LiveNewsSection';
import RiskAnalysisSection from '@/components/report/RiskAnalysisSection';

const INCIDENT_TYPES = [
  { id: 'harassment',    icon: '🚫', label: 'Harassment',  bg: 'rgba(239,68,68,0.1)',  text: '#EF4444' },
  { id: 'unsafe_street', icon: '🛣️', label: 'Unsafe Road', bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
  { id: 'suspicious',    icon: '👁️', label: 'Suspicious',  bg: 'rgba(74,158,224,0.1)', text: '#4A9EE0' },
  { id: 'poor_lighting', icon: '💡', label: 'Poor Light',  bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
  { id: 'other',         icon: '📋', label: 'Other',       bg: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.6)' },
];

const TABS = [
  { id: 'report', label: 'Report',    icon: FileText },
  { id: 'news',   label: 'Live News', icon: Newspaper },
  { id: 'risk',   label: 'Risk AI',   icon: Brain },
];

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

export default function Report() {
  const { userLocation } = useAppContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('report');
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.IncidentReport.list('-created_date', 25),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const unsub = base44.entities.IncidentReport.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    });
    return unsub;
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      let media_url = null;
      if (mediaFile) {
        setUploadingMedia(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
        media_url = file_url;
        setUploadingMedia(false);
      }
      return base44.entities.IncidentReport.create({ ...data, media_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSubmitted(true);
      setSelectedType(null); setDescription(''); setMediaFile(null);
      setTimeout(() => setSubmitted(false), 3000);
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: ({ id, upvotes }) => base44.entities.IncidentReport.update(id, { upvotes: upvotes + 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const handleSubmit = () => {
    if (!selectedType) return;
    const trustScore = Math.min(100, 50 + (description.length > 30 ? 20 : 10) + (mediaFile ? 15 : 0) + (anonymous ? -10 : 5));
    createMutation.mutate({
      type: selectedType, description,
      lat: userLocation.lat, lng: userLocation.lng,
      location_name: `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`,
      trust_score: trustScore, anonymous, upvotes: 0,
    });
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#0D1B2E' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center" style={{ background: '#EFF1F5' }}>
              <FileText className="w-5 h-5" style={{ color: '#0D1B2E' }} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Reports</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Community safety platform</p>
            </div>
          </div>
          <button onClick={() => refetch()}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center"
            style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)' }}>
            <RefreshCw className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 rounded-[16px]" style={{ background: '#111E30' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-xs font-semibold transition-all"
                style={isActive
                  ? { background: '#EFF1F5', color: '#0D1B2E' }
                  : { color: 'rgba(255,255,255,0.35)' }}>
                <Icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'report' && (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-4 pt-4 pb-10">

            <AnimatePresence>
              {submitted && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-4 rounded-[16px] p-4 flex items-center gap-3"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <p className="text-sm font-semibold text-green-400">Report submitted successfully!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Incident type grid */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>INCIDENT TYPE</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {INCIDENT_TYPES.map(type => (
                <motion.button key={type.id} whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedType(type.id)}
                  className="flex flex-col items-center gap-2 py-3.5 rounded-[16px] transition-all"
                  style={selectedType === type.id
                    ? { background: '#EFF1F5' }
                    : { background: '#111E30', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-[10px] font-semibold text-center leading-tight"
                    style={{ color: selectedType === type.id ? '#0D1B2E' : 'rgba(255,255,255,0.55)' }}>
                    {type.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Description */}
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Add description (optional)…"
              className="w-full rounded-[16px] px-4 py-3 text-sm outline-none resize-none mb-3"
              rows={3}
              style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)', color: 'white', '::placeholder': { color: 'rgba(255,255,255,0.3)' } }} />

            {/* Media + Anonymous row */}
            <div className="flex gap-3 mb-4">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-1.5 rounded-[14px] py-2.5 text-xs transition-all"
                  style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
                  <ImagePlus className="w-3.5 h-3.5" />
                  {mediaFile ? mediaFile.name.slice(0, 12) + '…' : 'Add Photo'}
                </div>
                <input type="file" accept="image/*,audio/*" className="hidden" onChange={e => setMediaFile(e.target.files[0])} />
              </label>
              <div className="flex items-center gap-2 rounded-[14px] px-3 py-2.5"
                style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Anon</span>
                <Switch checked={anonymous} onCheckedChange={setAnonymous} />
              </div>
            </div>

            {/* GPS */}
            <div className="flex items-center gap-2 text-xs mb-4 rounded-[14px] px-3 py-2.5"
              style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)' }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: '#4A9EE0' }} />
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
              </span>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit}
              disabled={!selectedType || createMutation.isPending || uploadingMedia}
              className="w-full h-13 rounded-[16px] font-bold text-sm flex items-center justify-center gap-2 text-white mb-6 transition-all disabled:opacity-50 py-4"
              style={{ background: '#4A9EE0', boxShadow: '0 4px 20px rgba(74,158,224,0.35)' }}>
              {createMutation.isPending || uploadingMedia
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : <><Send className="w-4 h-4" /> Submit Report</>}
            </button>

            {/* Feed */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>COMMUNITY FEED</p>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-[18px] p-8 text-center"
                style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No reports yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((r, i) => {
                  const type = INCIDENT_TYPES.find(t => t.id === r.type) || INCIDENT_TYPES[4];
                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-[16px] p-3.5"
                      style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-[12px] flex items-center justify-center text-base shrink-0"
                          style={{ background: type.bg }}>
                          {type.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {r.description || type.label}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              <Clock className="w-3 h-3" /> {timeAgo(r.created_date)}
                            </span>
                            {r.trust_score && (
                              <span className="text-[10px] font-semibold" style={{ color: '#4A9EE0' }}>
                                Trust {r.trust_score}%
                              </span>
                            )}
                            {r.status === 'approved' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>✓</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => upvoteMutation.mutate({ id: r.id, upvotes: r.upvotes || 0 })}
                          className="flex flex-col items-center gap-0.5">
                          <ThumbsUp className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.upvotes || 0}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'news' && (
          <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-4 pt-4 pb-10">
            <LiveNewsSection />
          </motion.div>
        )}

        {activeTab === 'risk' && (
          <motion.div key="risk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-4 pt-4 pb-10">
            <RiskAnalysisSection reports={reports} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}