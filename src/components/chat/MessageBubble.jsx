import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, CheckCheck, Check, Clock } from 'lucide-react';
import { formatTime } from '@/lib/chatUtils';
import { cn } from '@/lib/utils';

function StatusIcon({ status }) {
  if (status === 'seen') return <CheckCheck className="w-3 h-3" style={{ color: '#22D3EE' }} />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3" style={{ color: '#6B7280' }} />;
  if (status === 'pending') return <Clock className="w-3 h-3" style={{ color: '#6B7280' }} />;
  return <Check className="w-3 h-3" style={{ color: '#6B7280' }} />;
}

export default function MessageBubble({ msg, isMe, anonId }) {
  const isEmergency = msg.is_emergency || msg.messageType === 'alert';
  const isLocation = msg.messageType === 'location' || msg.location_shared;
  const mapLink = msg.mapLink || (msg.lat && msg.lng ? `https://maps.google.com/?q=${msg.lat},${msg.lng}` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[82%]", isMe ? "items-end" : "items-start", "flex flex-col gap-0.5")}>
        {/* Sender label (not me) */}
        {!isMe && (
          <p className="text-[10px] font-mono px-1 mb-0.5" style={{ color: '#6B7280' }}>
            {msg.sender_name || anonId}
          </p>
        )}

        <div
          className={cn("rounded-2xl px-3.5 py-2.5 relative", isMe ? "rounded-br-sm" : "rounded-bl-sm")}
          style={
            isEmergency
              ? {
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.85))',
                  border: '1px solid rgba(239,68,68,0.6)',
                  boxShadow: '0 0 16px rgba(239,68,68,0.3)',
                }
              : isLocation
              ? {
                  background: isMe
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(79,70,229,0.2))'
                    : 'rgba(255,255,255,0.05)',
                  border: isMe ? '1px solid rgba(34,211,238,0.35)' : '1px solid rgba(255,255,255,0.08)',
                }
              : isMe
              ? {
                  background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                  boxShadow: '0 2px 12px rgba(79,70,229,0.3)',
                }
              : {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }
          }
        >
          {/* Emergency badge */}
          {isEmergency && (
            <div className="flex items-center gap-1.5 mb-1.5 pb-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-black text-white tracking-wide">EMERGENCY ALERT</span>
            </div>
          )}

          {/* Location preview */}
          {isLocation && mapLink && (
            <a href={mapLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 mb-2 pb-2 group"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(34,211,238,0.2)' }}>
                <MapPin className="w-4 h-4" style={{ color: '#22D3EE' }} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">View on Google Maps</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {msg.lat?.toFixed(4)}, {msg.lng?.toFixed(4)}
                </p>
              </div>
            </a>
          )}

          {/* Message text */}
          <p className="text-sm leading-snug whitespace-pre-line text-white">{msg.content}</p>

          {/* Footer: time + status */}
          <div className="flex items-center gap-1 justify-end mt-1.5">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {formatTime(msg.created_date)}
            </p>
            {isMe && <StatusIcon status={msg.status || 'sent'} />}
            {msg._pending && <span className="text-[9px]" style={{ color: '#F59E0B' }}>pending</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}