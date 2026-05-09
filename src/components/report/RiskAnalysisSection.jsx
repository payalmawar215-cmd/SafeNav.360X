import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Brain, TrendingUp, TrendingDown, Minus, MapPin, AlertTriangle, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const RISK_CONFIG = {
  High:   { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   icon: '🔴', glow: 'rgba(239,68,68,0.3)' },
  Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  icon: '🟡', glow: 'rgba(245,158,11,0.3)' },
  Low:    { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  icon: '🟢', glow: 'rgba(16,185,129,0.3)' },
};

const TREND_ICONS = {
  increasing: { icon: TrendingUp, color: '#EF4444', label: 'Increasing' },
  decreasing: { icon: TrendingDown, color: '#10B981', label: 'Decreasing' },
  stable:     { icon: Minus, color: '#F59E0B', label: 'Stable' },
};

function RiskMeter({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? '#EF4444' : pct >= 40 ? '#F59E0B' : '#10B981';
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] mb-1" style={{ color: '#9CA3AF' }}>
        <span>Low</span><span>Medium</span><span>High</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #10B981, ${color})`,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
      <p className="text-right text-[10px] mt-0.5 font-bold" style={{ color }}>{pct}/100</p>
    </div>
  );
}

function AreaCard({ area }) {
  const [expanded, setExpanded] = useState(false);
  const rc = RISK_CONFIG[area.riskLevel] || RISK_CONFIG.Medium;
  const trend = TREND_ICONS[area.trend] || TREND_ICONS.stable;
  const TrendIcon = trend.icon;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: rc.bg, border: `1px solid ${rc.border}` }}>
      <button className="w-full px-3.5 py-3 flex items-center gap-3 text-left" onClick={() => setExpanded(e => !e)}>
        <span className="text-base shrink-0">{rc.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white">{area.area}</p>
            <TrendIcon className="w-3 h-3 shrink-0" style={{ color: trend.color }} />
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{area.city} · {area.recentIncidents} incidents</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold px-2 py-1 rounded-xl"
            style={{ background: rc.border, color: rc.color }}>{area.riskLevel}</span>
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: '#6B7280' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden px-3.5 pb-3">
            <RiskMeter score={area.riskScore} />
            <p className="text-xs mt-2.5 leading-relaxed" style={{ color: '#9CA3AF' }}>{area.analysis}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(area.factors || []).map((f, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>{f}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RiskAnalysisSection({ reports = [] }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reportSummary = reports.slice(0, 30).map(r => ({
        type: r.type,
        lat: r.lat,
        lng: r.lng,
        status: r.status,
        trust: r.trust_score,
        date: r.created_date,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a safety risk analysis AI for SafeNav360X (India). Analyze the following user-submitted incident reports and generate a comprehensive risk analysis.

Reports data: ${JSON.stringify(reportSummary)}

Generate risk analysis for 8 different areas/neighborhoods in India based on this data and typical urban crime patterns.

Return JSON with:
- overallRiskScore (0-100 number)
- overallRiskLevel (High/Medium/Low)
- summary (2-sentence overall analysis)
- trend (increasing/decreasing/stable)
- areas (array of 8 objects):
  - area (neighborhood/locality name)
  - city (Indian city)
  - riskLevel (High/Medium/Low)
  - riskScore (0-100)
  - trend (increasing/decreasing/stable)
  - recentIncidents (number)
  - analysis (1-sentence area-specific insight)
  - factors (array of 3 short risk factor strings)
- topRisks (array of 3 strings: key risk factors)
- recommendations (array of 3 safety tips)`,
        response_json_schema: {
          type: 'object',
          properties: {
            overallRiskScore: { type: 'number' },
            overallRiskLevel: { type: 'string' },
            summary: { type: 'string' },
            trend: { type: 'string' },
            areas: { type: 'array', items: { type: 'object' } },
            topRisks: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
          }
        }
      });
      setAnalysis(result);
    } catch (e) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [reports]);

  const overallRc = analysis ? (RISK_CONFIG[analysis.overallRiskLevel] || RISK_CONFIG.Medium) : null;

  return (
    <div className="mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.2)' }}>
            <Brain className="w-3.5 h-3.5" style={{ color: '#818CF8' }} />
          </div>
          <p className="text-sm font-bold text-white">AI Risk Analysis</p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)', color: 'white' }}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
          {loading ? 'Analyzing…' : (analysis ? 'Re-Analyze' : 'Run Analysis')}
        </button>
      </div>

      {!analysis && !loading && (
        <div className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Brain className="w-10 h-10" style={{ color: '#4B5563' }} />
          <p className="text-sm font-semibold text-white">AI Risk Engine Ready</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            Analyze {reports.length} community reports + news data to detect high-risk areas
          </p>
          <button onClick={runAnalysis}
            className="px-5 py-2 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #22D3EE)' }}>
            Start Analysis
          </button>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl p-8 flex flex-col items-center gap-3"
          style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.2)' }}>
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4F46E5' }} />
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: '#4F46E5' }} />
          </div>
          <p className="text-sm font-semibold text-white">AI analyzing patterns…</p>
          <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
            Processing incident data · Detecting risk zones · Calculating scores
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl p-3 mb-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-3">
          {/* Overall score */}
          <div className="rounded-2xl p-4"
            style={{ background: overallRc.bg, border: `1px solid ${overallRc.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Overall Risk</p>
                <p className="text-2xl font-black mt-0.5" style={{ color: overallRc.color }}>
                  {analysis.overallRiskLevel}
                </p>
              </div>
              <div className="text-4xl">{overallRc.icon}</div>
            </div>
            <RiskMeter score={analysis.overallRiskScore} />
            <p className="text-xs mt-2.5 leading-relaxed" style={{ color: '#D1D5DB' }}>{analysis.summary}</p>
          </div>

          {/* Top risks */}
          {analysis.topRisks?.length > 0 && (
            <div className="rounded-2xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-danger" /> Top Risk Factors
              </p>
              <div className="space-y-1">
                {analysis.topRisks.map((r, i) => (
                  <p key={i} className="text-xs flex items-start gap-2" style={{ color: '#9CA3AF' }}>
                    <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>{i + 1}</span>
                    {r}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Area-wise breakdown */}
          <div>
            <p className="text-xs font-bold text-white mb-2 px-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" style={{ color: '#22D3EE' }} /> Area-wise Risk Levels
            </p>
            <div className="space-y-2">
              {(analysis.areas || []).map((area, i) => (
                <AreaCard key={i} area={area} />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div className="rounded-2xl p-3.5"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#10B981' }}>💡 Safety Recommendations</p>
              <div className="space-y-1.5">
                {analysis.recommendations.map((rec, i) => (
                  <p key={i} className="text-xs" style={{ color: '#D1FAE5' }}>• {rec}</p>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-center" style={{ color: '#4B5563' }}>
            Powered by AI · Based on {reports.length} reports · Updated {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}