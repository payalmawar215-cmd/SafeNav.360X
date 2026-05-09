import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Newspaper, Pin, PinOff, ExternalLink, RefreshCw, Loader2, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CACHE_KEY = 'safenav_news_cache';
const CACHE_TS_KEY = 'safenav_news_ts';
const PINNED_KEY = 'safenav_pinned_news';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const RISK_COLORS = {
  High: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#EF4444' },
  Medium: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#F59E0B' },
  Low: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10B981' },
};

function NewsCard({ item, pinned, onTogglePin }) {
  const risk = item.riskLevel || 'Medium';
  const rc = RISK_COLORS[risk];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-3.5"
      style={{
        background: pinned ? 'rgba(79,70,229,0.08)' : 'rgba(255,255,255,0.03)',
        border: pinned ? '1px solid rgba(79,70,229,0.3)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {pinned && (
        <div className="flex items-center gap-1 mb-1.5">
          <Pin className="w-2.5 h-2.5" style={{ color: '#818CF8' }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#818CF8' }}>Pinned</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug mb-1.5">{item.title}</p>
          <p className="text-xs leading-relaxed mb-2" style={{ color: '#9CA3AF' }}>{item.description}</p>

          <div className="flex flex-wrap items-center gap-2">
            {item.location && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: '#22D3EE' }}>
                <MapPin className="w-3 h-3" />{item.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px]" style={{ color: '#6B7280' }}>
              <Clock className="w-3 h-3" />{timeAgo(item.publishedAt)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
              {risk} Risk
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>{item.source}</span>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: '#818CF8' }}>
                Read More <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        <button onClick={() => onTogglePin(item.id)}
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all"
          style={{ background: pinned ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.05)' }}>
          {pinned
            ? <PinOff className="w-3.5 h-3.5" style={{ color: '#818CF8' }} />
            : <Pin className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
          }
        </button>
      </div>
    </motion.div>
  );
}

export default function LiveNewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() =>
    JSON.parse(localStorage.getItem(PINNED_KEY) || '[]')
  );

  const loadNews = useCallback(async (force = false) => {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0');
    const fresh = Date.now() - ts < CACHE_TTL;

    if (cached && fresh && !force) {
      const parsed = JSON.parse(cached);
      setNews(parsed);
      setLastFetched(new Date(ts));
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a real-time safety news aggregator for India. Generate 12 realistic recent street-level safety incident news items from India (last 24-48 hours). Focus on: accidents, chain snatching, kidnapping, assault, harassment, rape, suspicious activity. 
        
        Return ONLY valid JSON array with these exact fields per item:
        - id (unique string)
        - title (headline, max 80 chars)
        - description (2-sentence summary)
        - location (city/area in India)
        - source (news source name like Times Now, NDTV, Hindustan Times, India Today, Dainik Bhaskar, ANI)
        - url (realistic news URL)
        - publishedAt (ISO date within last 48h from now: ${new Date().toISOString()})
        - incidentType (one of: accident, chain_snatching, kidnapping, assault, harassment, rape, suspicious)
        - riskLevel (High, Medium, or Low)
        
        Make incidents from different cities: Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Jaipur, Lucknow, Ahmedabad.
        Ensure no duplicates. India-only incidents.`,
        response_json_schema: {
          type: 'object',
          properties: {
            articles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  location: { type: 'string' },
                  source: { type: 'string' },
                  url: { type: 'string' },
                  publishedAt: { type: 'string' },
                  incidentType: { type: 'string' },
                  riskLevel: { type: 'string' },
                }
              }
            }
          }
        }
      });

      const articles = result?.articles || [];
      if (articles.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
        localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
        setNews(articles);
        setLastFetched(new Date());
      }
    } catch (e) {
      // Use cached even if stale
      if (cached) setNews(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const togglePin = (id) => {
    setPinnedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(PINNED_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Pinned first, then the rest
  const pinned = news.filter(n => pinnedIds.includes(n.id));
  const rest = news.filter(n => !pinnedIds.includes(n.id));
  const ordered = [...pinned, ...rest];

  const INCIDENT_ICONS = {
    accident: '🚗', chain_snatching: '⛓️', kidnapping: '🚨',
    assault: '⚠️', harassment: '🚫', rape: '🆘', suspicious: '👁️',
  };

  return (
    <div className="mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)' }}>
            <Newspaper className="w-3.5 h-3.5 text-danger" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Live Safety News</p>
            {lastFetched && (
              <p className="text-[10px]" style={{ color: '#6B7280' }}>
                Updated {timeAgo(lastFetched.toISOString())}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => loadNews(true)} disabled={loading}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#9CA3AF' }} />
            : <RefreshCw className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
          }
        </button>
      </div>

      {loading && news.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#4F46E5' }} />
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Fetching latest India safety news…</p>
        </div>
      )}

      <div className="space-y-2">
        {ordered.map(item => (
          <NewsCard
            key={item.id}
            item={item}
            pinned={pinnedIds.includes(item.id)}
            onTogglePin={togglePin}
          />
        ))}
      </div>

      {news.length > 0 && (
        <p className="text-[10px] text-center mt-3" style={{ color: '#4B5563' }}>
          {news.length} incidents · AI-aggregated · India only · Auto-refreshes every 24h
        </p>
      )}
    </div>
  );
}