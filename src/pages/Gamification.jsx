import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Star, Zap, Award, MapPin, Flag, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Premium badge images from uploaded assets
const BADGE_IMAGES = {
  first_report: 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/7788e3345_WhatsAppImage2026-05-07at92508AM.jpeg',
  safe_traveler: 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/7788e3345_WhatsAppImage2026-05-07at92508AM.jpeg',
  guardian: 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/7788e3345_WhatsAppImage2026-05-07at92508AM.jpeg',
  sos_hero: 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/6b25d05e7_WhatsAppImage2026-05-07at92501AM.jpeg',
  community: 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/7788e3345_WhatsAppImage2026-05-07at92508AM.jpeg',
  streak_7: 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/cf42f4320_WhatsAppImage2026-05-07at92507AM.jpeg',
};

const BADGES = [
  { id: 'first_report', label: 'First Report', desc: 'Submitted first incident', points: 50 },
  { id: 'safe_traveler', label: 'Safe Traveler', desc: 'Completed 5 safe trips', points: 100 },
  { id: 'guardian', label: 'Guardian', desc: 'Submitted 10 reports', points: 200 },
  { id: 'sos_hero', label: 'SOS Hero', desc: 'Used SOS and resolved safely', points: 150 },
  { id: 'community', label: 'Community Pillar', desc: '25 upvotes on reports', points: 300 },
  { id: 'streak_7', label: '7-Day Streak', desc: 'Active for 7 days in a row', points: 175 },
];

// Rank images
const RANK_IMAGE = 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/f0d5f410e_WhatsAppImage2026-05-07at92507AM1.jpeg';
const PHOENIX_IMAGE = 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/6b25d05e7_WhatsAppImage2026-05-07at92501AM.jpeg';
const HYPER_IMAGE = 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/9cc3bcd38_WhatsAppImage2026-05-07at92506AM.jpg';

function getLevelInfo(points) {
  if (points < 100) return { level: 1, label: 'Newcomer', next: 100, rankImg: null };
  if (points < 300) return { level: 2, label: 'Observer', next: 300, rankImg: null };
  if (points < 600) return { level: 3, label: 'Protector', next: 600, rankImg: PHOENIX_IMAGE };
  if (points < 1000) return { level: 4, label: 'Guardian', next: 1000, rankImg: RANK_IMAGE };
  return { level: 5, label: 'Grandmaster I', next: null, rankImg: RANK_IMAGE };
}

export default function Gamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['safety-score', user?.id],
    queryFn: () => base44.entities.SafetyScore.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const score = scores[0];
  const points = score?.total_points || 0;
  const badges = score?.badges || [];
  const levelInfo = getLevelInfo(points);
  const progressPct = levelInfo.next ? Math.min(100, (points / levelInfo.next) * 100) : 100;

  const createMutation = useMutation({
    mutationFn: () => base44.entities.SafetyScore.create({
      user_id: user?.id,
      total_points: 50,
      safe_trips: 0,
      reports_submitted: 0,
      check_ins: 0,
      badges: ['first_report'],
      streak_days: 1,
      last_activity: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety-score'] }),
  });

  const checkInMutation = useMutation({
    mutationFn: () => base44.entities.SafetyScore.update(score.id, {
      total_points: points + 10,
      check_ins: (score?.check_ins || 0) + 1,
      last_activity: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety-score'] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4A9EE0' }} />
    </div>
  );

  return (
    <div className="flex flex-col min-h-full pb-10" style={{ background: '#0D1B2E' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center" style={{ background: '#EFF1F5' }}>
              <Award className="w-5 h-5" style={{ color: '#0D1B2E' }} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Safety Score</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Earn ranks & badges</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(74,158,224,0.15)', border: '1px solid rgba(74,158,224,0.3)' }}>
            <Star className="w-3.5 h-3.5" style={{ color: '#4A9EE0' }} />
            <span className="text-sm font-bold" style={{ color: '#4A9EE0' }}>{points} pts</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {!score ? (
          <div className="rounded-[20px] p-8 text-center"
            style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Shield className="w-14 h-14 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-base font-bold text-white mb-1">Start your safety journey</p>
            <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Earn points by staying safe, reporting incidents, and checking in.
            </p>
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="px-6 py-3 rounded-[14px] text-sm font-bold text-white"
              style={{ background: '#4A9EE0', boxShadow: '0 4px 20px rgba(74,158,224,0.35)' }}>
              Get Started — Earn 50 pts
            </button>
          </div>
        ) : (
          <>
            {/* Rank Card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-[22px] p-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #111E30 0%, #0D1B2E 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
                boxShadow: '0 4px 32px rgba(255,215,0,0.08)',
              }}>
              {/* Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

              <div className="flex items-center gap-4">
                {levelInfo.rankImg ? (
                  <img src={levelInfo.rankImg} alt="Rank" className="w-20 h-20 object-contain" style={{ filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.4))' }} />
                ) : (
                  <div className="w-20 h-20 rounded-[18px] flex items-center justify-center"
                    style={{ background: 'rgba(74,158,224,0.1)', border: '1px solid rgba(74,158,224,0.2)' }}>
                    <Shield className="w-10 h-10" style={{ color: '#4A9EE0' }} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    LEVEL {levelInfo.level}
                  </p>
                  <p className="text-2xl font-black text-white">{levelInfo.label}</p>
                  {levelInfo.label === 'Grandmaster I' && (
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#FFC857' }}>ELITE MASTER</p>
                  )}
                </div>
              </div>

              {levelInfo.next && (
                <div className="mt-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>PROGRESS</span>
                    <span className="text-[10px] font-bold" style={{ color: '#4A9EE0' }}>{points} / {levelInfo.next} pts</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #4A9EE0, #7EC8F8)' }} />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Milestone card — Hyper Pulse */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-[20px] p-4 flex items-center gap-4"
              style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)' }}>
              <img src={HYPER_IMAGE} alt="Milestone" className="w-16 h-16 object-contain rounded-[14px]" />
              <div className="flex-1">
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>MILESTONE PROGRESS</p>
                <p className="text-base font-black text-white">50 DAYS: HYPER</p>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>[HIGH ENERGY]</p>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full w-4/5" style={{ background: 'linear-gradient(90deg, #4A9EE0, #7EC8F8)' }} />
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <MapPin className="w-4 h-4" />, label: 'Safe Trips', value: score.safe_trips || 0, color: '#00E5A8' },
                { icon: <Flag className="w-4 h-4" />, label: 'Reports', value: score.reports_submitted || 0, color: '#FFC857' },
                { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Check-ins', value: score.check_ins || 0, color: '#4A9EE0' },
              ].map((s, i) => (
                <div key={i} className="rounded-[18px] p-3.5 text-center"
                  style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex justify-center mb-1.5" style={{ color: s.color }}>{s.icon}</div>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Daily check-in */}
            <div className="rounded-[18px] p-4 flex items-center justify-between"
              style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4" style={{ color: '#FFC857' }} /> Daily Check-in
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Streak: {score.streak_days || 0} days 🔥</p>
              </div>
              <button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending}
                className="px-4 py-2 rounded-[12px] text-xs font-bold text-white"
                style={{ background: '#4A9EE0', boxShadow: '0 2px 12px rgba(74,158,224,0.3)' }}>
                +10 pts
              </button>
            </div>

            {/* Badges */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                <Award className="w-3.5 h-3.5" /> Badges
              </p>
              <div className="grid grid-cols-3 gap-3">
                {BADGES.map((badge, i) => {
                  const earned = badges.includes(badge.id);
                  return (
                    <motion.div key={badge.id}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-[18px] p-3 text-center relative overflow-hidden"
                      style={{
                        background: earned ? 'rgba(74,158,224,0.08)' : '#111E30',
                        border: earned ? '1px solid rgba(74,158,224,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        filter: earned ? 'none' : 'grayscale(1)',
                        opacity: earned ? 1 : 0.5,
                      }}>
                      <div className="w-14 h-14 mx-auto mb-2 rounded-[12px] overflow-hidden"
                        style={{ boxShadow: earned ? '0 0 16px rgba(74,158,224,0.3)' : 'none' }}>
                        <img src={BADGE_IMAGES[badge.id]} alt={badge.label}
                          className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] font-bold text-white leading-tight">{badge.label}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>+{badge.points} pts</p>
                      {earned && (
                        <div className="mt-1 text-[9px] font-bold" style={{ color: '#00E5A8' }}>✓ Earned</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}