import { useState, useEffect, useRef } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ChevronLeft, AlertTriangle, Shield, WifiOff } from 'lucide-react';
import { getAnonymousId, buildLocationMessage, buildSOSMessage, queueOfflineMessage, formatTime } from '@/lib/chatUtils';
import { useAppContext } from '@/lib/AppContext.jsx';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { cn } from '@/lib/utils';

function fetchMessages(contactId, userId) {
  return base44.entities.ChatMessage.filter(
    { $or: [
      { sender_id: userId, recipient_id: String(contactId) },
      { sender_id: String(contactId), recipient_id: userId },
    ]},
    'created_date', 60
  ).catch(() =>
    // Fallback: get messages by contact_phone or any direction
    base44.entities.ChatMessage.list('created_date', 60)
      .then(all => all.filter(m =>
        (m.sender_id === userId && m.recipient_id === String(contactId)) ||
        (m.recipient_id === userId && m.sender_id === String(contactId)) ||
        m.contact_phone === contactId
      ))
  );
}

export default function ChatWindow({ contact, isGroup, groupContacts, onBack, sosActive }) {
  const { userLocation, isOnline } = useAppContext();
  const queryClient = useQueryClient();
  const anonId = getAnonymousId();
  const bottomRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);

  const qKey = isGroup ? ['chat', 'group'] : ['chat', contact?.id];

  const { data: messages = [] } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      if (isGroup) {
        // Fetch all messages among group members
        const all = await base44.entities.ChatMessage.list('-created_date', 80);
        const groupIds = groupContacts.map(c => String(c.id));
        return all.filter(m =>
          groupIds.includes(m.recipient_id) || m.is_emergency
        ).reverse();
      }
      return fetchMessages(contact.id, anonId);
    },
    refetchInterval: 4000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: qKey });
    });
    return unsub;
  }, [contact?.id, isGroup]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => {
      if (!isOnline) {
        queueOfflineMessage({ entity: 'ChatMessage', data });
        return Promise.resolve({ ...data, _pending: true, id: Date.now() });
      }
      return base44.entities.ChatMessage.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const sendMessage = (content) => {
    const targets = isGroup ? groupContacts : [contact];
    targets.forEach(c => {
      sendMutation.mutate({
        sender_id: anonId,
        sender_name: anonId,
        recipient_id: String(c.id),
        contact_phone: c.phone,
        content,
        messageType: 'text',
        is_emergency: false,
        status: isOnline ? 'sent' : 'pending',
      });
    });
  };

  const shareLocation = () => {
    setIsLocating(true);
    const send = (lat, lng) => {
      const locMsg = buildLocationMessage({ lat, lng }, anonId);
      const targets = isGroup ? groupContacts : [contact];
      targets.forEach(c => {
        sendMutation.mutate({
          sender_id: anonId,
          sender_name: anonId,
          recipient_id: String(c.id),
          contact_phone: c.phone,
          ...locMsg,
          status: isOnline ? 'sent' : 'pending',
        });
      });
      setIsLocating(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => send(pos.coords.latitude, pos.coords.longitude),
        () => send(userLocation.lat, userLocation.lng),
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      send(userLocation.lat, userLocation.lng);
    }
  };

  const title = isGroup ? 'Trusted Contacts Group' : contact?.name;
  const subtitle = isGroup
    ? `${groupContacts.length} members`
    : contact?.phone;

  // Pin emergency messages to top
  const pinned = messages.filter(m => m.is_emergency);
  const normal = messages.filter(m => !m.is_emergency);
  const ordered = [...pinned, ...normal];

  return (
    <div className="flex flex-col h-full" style={{ background: '#0B0F1A' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3"
        style={{
          background: sosActive ? 'rgba(239,68,68,0.08)' : 'rgba(11,15,26,0.95)',
          borderBottom: sosActive ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
        }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: isGroup
              ? (sosActive ? 'rgba(239,68,68,0.2)' : 'rgba(79,70,229,0.2)')
              : 'rgba(79,70,229,0.15)',
            color: isGroup ? (sosActive ? '#EF4444' : '#818CF8') : '#818CF8',
          }}>
          {isGroup ? (sosActive ? '🚨' : '👥') : title?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{title}</p>
          <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
              <WifiOff className="w-3 h-3" /> Offline
            </div>
          )}
          {!isGroup && contact?.phone && (
            <a href={`tel:${contact.phone}`}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Phone className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
            </a>
          )}
        </div>
      </div>

      {/* SOS Banner */}
      <AnimatePresence>
        {sosActive && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="px-4 py-2 flex items-center gap-2 overflow-hidden"
            style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
            <p className="text-xs font-semibold text-danger">SOS active — emergency alerts sent to all contacts</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {ordered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <p className="text-xs" style={{ color: '#6B7280' }}>No messages yet. Say hello!</p>
          </div>
        )}
        {ordered.map((msg, i) => (
          <MessageBubble
            key={msg.id || i}
            msg={msg}
            isMe={msg.sender_id === anonId}
            anonId={anonId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onLocationShare={shareLocation}
        isSending={sendMutation.isPending}
        isLocating={isLocating}
      />
    </div>
  );
}