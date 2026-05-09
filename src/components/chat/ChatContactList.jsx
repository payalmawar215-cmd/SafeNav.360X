import { motion } from 'framer-motion';
import { MessageCircle, Users, Shield, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAnonymousId, getDisplayName, timeLabel } from '@/lib/chatUtils';
import { cn } from '@/lib/utils';

export default function ChatContactList({ contacts, recentMessages, onSelectContact, onSelectGroup, sosActive }) {
  const anonId = getAnonymousId();
  const displayName = getDisplayName();

  return (
    <div className="flex flex-col h-full" style={{ background: '#0B0F1A' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-white">Messages</h2>
            <p className="text-[10px] mt-0.5 font-mono" style={{ color: '#6B7280' }}>{anonId}</p>
          </div>
          <div className="flex items-center gap-2">
            {sosActive && (
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-danger" />SOS ACTIVE
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Group Chat Entry */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onSelectGroup}
        className="mx-4 mt-3 mb-2 rounded-2xl p-3.5 flex items-center gap-3 text-left transition-all"
        style={{
          background: sosActive
            ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
            : 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(34,211,238,0.06))',
          border: sosActive ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(79,70,229,0.25)',
        }}
      >
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: sosActive ? 'rgba(239,68,68,0.2)' : 'rgba(79,70,229,0.2)' }}>
          {sosActive ? <Shield className="w-5 h-5 text-danger" /> : <Users className="w-5 h-5" style={{ color: '#818CF8' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{sosActive ? '🚨 Emergency Group' : 'Trusted Contacts Group'}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: '#9CA3AF' }}>
            {contacts.length} members · {sosActive ? 'SOS alert sent' : 'All trusted contacts'}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#6B7280' }} />
      </motion.button>

      {/* Divider */}
      <p className="px-4 text-[10px] font-semibold uppercase tracking-widest mb-2 mt-1" style={{ color: '#6B7280' }}>
        Direct Messages
      </p>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-4">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <MessageCircle className="w-6 h-6" style={{ color: '#6B7280' }} />
            </div>
            <p className="text-sm font-medium text-white">No trusted contacts</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Add contacts in Settings to start chatting</p>
          </div>
        ) : (
          contacts.map(contact => {
            const lastMsg = recentMessages?.[contact.id];
            return (
              <motion.button
                key={contact.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectContact(contact)}
                className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'rgba(79,70,229,0.15)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.2)' }}>
                  {contact.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{contact.name}</p>
                    {lastMsg && (
                      <p className="text-[10px] shrink-0 ml-2" style={{ color: '#6B7280' }}>
                        {timeLabel(lastMsg.created_date)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                    {lastMsg ? (lastMsg.is_emergency ? '🚨 ' + lastMsg.content.slice(0, 30) : lastMsg.content.slice(0, 35)) : contact.phone}
                  </p>
                </div>
                {lastMsg?.is_emergency && (
                  <div className="w-2 h-2 rounded-full bg-danger shrink-0" />
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}