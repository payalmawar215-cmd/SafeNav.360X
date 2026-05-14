import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/lib/AppContext.jsx';
import { base44 } from '@/api/base44Client';
import {
  X, Send, MapPin, Phone, Users, Navigation,
  AlertTriangle, Loader2, Shield
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const BUDDY_ICON = 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/7297fa166_ChatGPTImageMay1202607_49_23PM.png';

const SYSTEM_PROMPT = `You are "SAFE BUDDY," the core AI safety assistant inside SafeNav360X.

ROLE: Personal Safety Assistant. Emergency-first. Action-focused.
TONE: Calm, direct, protective, fast. No fluff. Max 2-3 sentences per reply unless detailed guidance needed.

EMERGENCY DETECTION: If user says help/bachao/SOS/danger/scared/panic/not safe/trapped/attack/harassment/following me/stalking/unsafe cab/robbery/assault — immediately classify as EMERGENCY and suggest SOS + emergency actions.

NEVER SAY: "Stay calm", "Don't worry", "Everything will be okay"
INSTEAD: Give direct action-based replies like "Move to a crowded area now." or "Do you want me to alert your contacts?"

FEATURES YOU KNOW: SOS Button, Voice SOS, Live Location Sharing, Emergency Contacts, Safe Route Navigation, Fake Call, Area Risk Detection, Night Safety Mode, Incident Reporting.

NAVIGATION: If user asks for route/safe path → tell them to use the Navigate tab or suggest the safest route logic.
INCIDENT REPORT: If user mentions unsafe road/no lighting/harassment → offer to submit a report.
CONTACT ACTION: If user says "call mom" or "alert contacts" → guide them to do it via app.

Respond in the same language the user writes in. Keep replies SHORT and ACTION-focused.`;

function classifyIntent(text) {
  const t = text.toLowerCase();
  const emergency = ['help', 'bachao', 'sos', 'danger', 'save me', 'scared', 'panic', 'not safe',
    'trapped', 'attack', 'harassment', 'following me', 'stalking', 'robbery', 'assault', 'i am in danger',
    'unsafe', 'someone is following', 'driver changed route'];
  const navigation = ['route', 'navigate', 'safest way', 'how to go', 'direction', 'path'];
  const report = ['no light', 'dark road', 'report', 'unsafe street', 'broken', 'harassment', 'suspicious'];
  if (emergency.some(k => t.includes(k))) return 'EMERGENCY';
  if (navigation.some(k => t.includes(k))) return 'NAVIGATION';
  if (report.some(k => t.includes(k))) return 'REPORT';
  return 'NORMAL';
}

const QUICK_ACTIONS = [
  { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: '🚨 SOS', color: '#EF4444', action: 'sos' },
  { icon: <MapPin className="w-3.5 h-3.5" />, label: '📍 Location', color: '#22D3EE', action: 'location' },
  { icon: <Phone className="w-3.5 h-3.5" />, label: '📞 Call 112', color: '#F59E0B', action: 'call112' },
  { icon: <Users className="w-3.5 h-3.5" />, label: '👥 Alert', color: '#10B981', action: 'alert' },
  { icon: <Navigation className="w-3.5 h-3.5" />, label: '🧭 Route', color: '#818CF8', action: 'navigate' },
];

export default function SafeBuddy() {
  const navigate = useNavigate();
  const { userLocation, contacts, triggerSOS, setSosActive } = useAppContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm **Safe Buddy** 🛡️ — your personal safety assistant.\n\nType anything or use the quick actions below. In an emergency, just say **\"help\"** or **\"SOS\"**.",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const addMessage = (role, content, extras = {}) => {
    setMessages(prev => [...prev, { role, content, ...extras }]);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'sos':
        addMessage('user', '🚨 Trigger SOS');
        handleSOS();
        break;
      case 'location': {
        const url = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
        addMessage('user', '📍 Share my location');
        if (navigator.share) navigator.share({ title: 'My Location', url });
        else navigator.clipboard.writeText(url);
        addMessage('assistant', `📍 Location copied: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}\n\nShare this link with your trusted contacts.`);
        break;
      }
      case 'call112':
        addMessage('user', '📞 Call 112');
        window.location.href = 'tel:112';
        break;
      case 'alert':
        addMessage('user', '👥 Alert my contacts');
        addMessage('assistant', contacts.length > 0
          ? `Alerting ${contacts.map(c => c.name).join(', ')}. Go to the SOS page to activate emergency mode.`
          : 'No contacts added yet. Go to **Settings → Trusted Contacts** to add emergency contacts.');
        break;
      case 'navigate':
        addMessage('user', '🧭 Find safe route');
        addMessage('assistant', 'Opening navigation now. Use the **Safest Route** option for maximum safety.');
        setTimeout(() => { setOpen(false); navigate('/navigate'); }, 1200);
        break;
    }
  };

  const handleSOS = () => {
    triggerSOS();
    setSosActive(true);
    addMessage('assistant', '🚨 **Emergency mode activated.**\n\nSharing location and alerting contacts now. Navigating to SOS screen.');
    setTimeout(() => { setOpen(false); navigate('/sos'); }, 1500);
  };

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');
    addMessage('user', text);

    const intent = classifyIntent(text);

    // Emergency fast-path
    if (intent === 'EMERGENCY') {
      addMessage('assistant', `⚠️ **You may be in danger.**\n\nDo you want me to trigger SOS and alert your contacts now?`, { isEmergency: true });
      setLoading(false);
      return;
    }

    if (intent === 'NAVIGATION') {
      addMessage('assistant', 'Opening the safe navigation screen for you now. 🧭');
      setTimeout(() => { setOpen(false); navigate('/navigate'); }, 1200);
      return;
    }

    if (intent === 'REPORT') {
      addMessage('assistant', 'Do you want to submit an incident report? Tap below or go to the **Report** tab.', { isReport: true });
      return;
    }

    setLoading(true);
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 19 || currentHour < 6;
    const contextInfo = `User location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}. Time: ${isNight ? 'Night' : 'Day'}.`;

    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: `[Context: ${contextInfo}] ${text}` });

    const reply = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\n${history.map(m => `${m.role === 'user' ? 'User' : 'SafeBuddy'}: ${m.content}`).join('\n')}\nSafeBuddy:`,
    });

    setLoading(false);
    addMessage('assistant', typeof reply === 'string' ? reply : reply?.text || 'Safety data unavailable. Proceed with caution.');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Draggable bubble */}
      <motion.div
        drag
        dragMomentum={false}
        dragControls={dragControls}
        dragElastic={0.1}
        initial={{ right: 16, bottom: 88 }}
        style={{ position: 'fixed', zIndex: 999, touchAction: 'none' }}
        className="fixed bottom-22 right-4 z-[999]"
        whileTap={{ scale: 0.95 }}
      >
        <motion.button
          onClick={() => setOpen(o => !o)}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            boxShadow: '0 0 0 3px rgba(56,182,255,0.3), 0 0 24px rgba(56,182,255,0.4), 0 4px 16px rgba(0,0,0,0.4)',
            background: 'rgba(13,27,46,0.95)',
          }}
        >
          <img src={BUDDY_ICON} alt="Safe Buddy" className="w-14 h-14 object-contain" />
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
          {/* Badge */}
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.8)' }}>
            <Shield className="w-2.5 h-2.5 text-white" />
          </div>
        </motion.button>
      </motion.div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed z-[1000] flex flex-col"
            style={{
              bottom: 88 + 72,
              right: 12,
              width: 'min(340px, calc(100vw - 24px))',
              height: 'min(520px, calc(100vh - 200px))',
              background: 'rgba(10,14,28,0.97)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(56,182,255,0.2)',
              borderRadius: 24,
              boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,182,255,0.08)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <img src={BUDDY_ICON} alt="Safe Buddy" className="w-9 h-9 object-contain rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Safe Buddy</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] text-emerald-400 font-medium">Always watching, always ready</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    <div
                      className="rounded-2xl px-3 py-2.5 text-sm"
                      style={msg.role === 'user' ? {
                        background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                        color: 'white',
                        borderBottomRightRadius: 6,
                      } : {
                        background: msg.isEmergency
                          ? 'rgba(239,68,68,0.12)'
                          : 'rgba(255,255,255,0.06)',
                        border: msg.isEmergency
                          ? '1px solid rgba(239,68,68,0.3)'
                          : '1px solid rgba(255,255,255,0.07)',
                        color: '#E5E7EB',
                        borderBottomLeftRadius: 6,
                      }}
                    >
                      <ReactMarkdown
                        className="prose prose-invert prose-sm max-w-none text-sm [&>p]:my-0.5 [&>ul]:my-1 [&>ol]:my-1"
                        components={{
                          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Emergency action buttons */}
                    {msg.isEmergency && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button onClick={handleSOS}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: '#EF4444', boxShadow: '0 0 12px rgba(239,68,68,0.4)' }}>
                          <AlertTriangle className="w-3 h-3" /> Trigger SOS
                        </button>
                        <button onClick={() => handleQuickAction('location')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22D3EE' }}>
                          <MapPin className="w-3 h-3" /> Share Location
                        </button>
                        <a href="tel:112"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>
                          <Phone className="w-3 h-3" /> Call 112
                        </a>
                      </div>
                    )}

                    {/* Report action button */}
                    {msg.isReport && (
                      <button
                        onClick={() => { setOpen(false); navigate('/report'); }}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>
                        <AlertTriangle className="w-3 h-3" /> Submit Incident Report
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#22D3EE' }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>Safe Buddy is thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {QUICK_ACTIONS.map(qa => (
                <button key={qa.action} onClick={() => handleQuickAction(qa.action)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap shrink-0 transition-all"
                  style={{
                    background: `${qa.color}18`,
                    border: `1px solid ${qa.color}35`,
                    color: qa.color,
                  }}>
                  {qa.icon}
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 flex items-center gap-2 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Say "help" for emergency…'
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                />
              </div>
              <button onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #22D3EE)' }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}