import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppContext } from '@/lib/AppContext.jsx';
import { getAnonymousId, getOfflineQueue, clearOfflineQueue } from '@/lib/chatUtils';
import ChatContactList from '@/components/chat/ChatContactList';
import ChatWindow from '@/components/chat/ChatWindow';
import { AnimatePresence, motion } from 'framer-motion';

export default function Chat() {
  const { contacts, userLocation, sosActive, isOnline } = useAppContext();
  const queryClient = useQueryClient();
  const anonId = getAnonymousId();

  const [view, setView] = useState('list'); // 'list' | 'dm' | 'group'
  const [selectedContact, setSelectedContact] = useState(null);

  // Fetch all recent messages for contact list previews
  const { data: allMessages = [] } = useQuery({
    queryKey: ['chat', 'all'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date', 100),
    refetchInterval: 5000,
  });

  // Build recent message map per contact
  const recentMessages = {};
  allMessages.forEach(msg => {
    const cid = msg.sender_id === anonId ? msg.recipient_id : msg.sender_id;
    if (!recentMessages[cid] || new Date(msg.created_date) > new Date(recentMessages[cid].created_date)) {
      recentMessages[cid] = msg;
    }
  });

  // Flush offline queue on reconnect
  useEffect(() => {
    if (!isOnline) return;
    const queue = getOfflineQueue();
    if (!queue.length) return;
    const flush = async () => {
      for (const item of queue) {
        try { await base44.entities.ChatMessage.create(item); } catch {}
      }
      clearOfflineQueue();
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    };
    flush();
  }, [isOnline]);

  // Real-time subscription on all messages
  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    });
    return unsub;
  }, []);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setView('dm');
  };

  const handleSelectGroup = () => {
    setView('group');
  };

  const handleBack = () => {
    setSelectedContact(null);
    setView('list');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden" style={{ background: '#0B0F1A' }}>
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div key="list" className="h-full"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ChatContactList
              contacts={contacts}
              recentMessages={recentMessages}
              onSelectContact={handleSelectContact}
              onSelectGroup={handleSelectGroup}
              sosActive={sosActive}
            />
          </motion.div>
        )}

        {view === 'dm' && selectedContact && (
          <motion.div key="dm" className="h-full"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <ChatWindow
              contact={selectedContact}
              isGroup={false}
              groupContacts={[]}
              onBack={handleBack}
              sosActive={sosActive}
            />
          </motion.div>
        )}

        {view === 'group' && (
          <motion.div key="group" className="h-full"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <ChatWindow
              contact={null}
              isGroup={true}
              groupContacts={contacts}
              onBack={handleBack}
              sosActive={sosActive}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}