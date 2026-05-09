import { useState } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n.jsx';
import { useAppContext } from '@/lib/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Shield, Phone, Users, Moon, Bell, ChevronRight,
  Plus, Trash2, Camera, Mic, AlertOctagon, PhoneCall, Zap,
  Smartphone, Waves, UserCircle, Lock, Eye, Award
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import FakeCallModal from '@/components/settings/FakeCallModal';

function WhiteCard({ children, className = '', onClick }) {
  return (
    <div onClick={onClick} className={`rounded-[20px] p-4 ${className}`} style={{ background: '#EFF1F5' }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, iconBg = '#0D1B2E' }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-7 h-7 rounded-[10px] flex items-center justify-center" style={{ background: iconBg }}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{title}</p>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { lang, setLanguage } = useLanguage();
  const {
    contacts, addContact, removeContact,
    alertSensitivity, setAlertSensitivity,
    isDark, setIsDark,
    sosCapture, setSosCapture,
    voiceActivation, setVoiceActivation,
    voiceCodeword, setVoiceCodeword,
    voiceMode, setVoiceMode,
    shakeSOSEnabled, setShakeSOSEnabled,
    setStealthMode,
  } = useAppContext();

  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [codewordInput, setCodewordInput] = useState(voiceCodeword || '');

  const handleAddContact = () => {
    if (newName && newPhone) {
      addContact({ name: newName, phone: newPhone, relation: 'Other' });
      setNewName(''); setNewPhone(''); setShowAddContact(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-12 pb-10" style={{ background: '#0D1B2E' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-[16px] flex items-center justify-center" style={{ background: '#EFF1F5' }}>
          <Shield className="w-5 h-5" style={{ color: '#0D1B2E' }} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Settings</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Customize your safety profile</p>
        </div>
      </div>

      {/* Profile Card */}
      <WhiteCard className="mb-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/user-profile')}>
        <div className="w-14 h-14 rounded-[18px] flex items-center justify-center"
          style={{ background: '#0D1B2E' }}>
          <UserCircle className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold" style={{ color: '#0D1B2E' }}>User Profile / ID</p>
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'rgba(13,27,46,0.5)' }}>
            <Award className="w-3 h-3" /> Rank · Badges · Identity
          </p>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,46,0.3)' }} />
      </WhiteCard>

      {/* Language */}
      <div className="mb-5">
        <SectionHeader icon={<Globe className="w-3.5 h-3.5 text-white" />} title="Language" iconBg="#4A9EE0" />
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLanguage(l.code)}
              className="flex items-center gap-2 py-3 px-3.5 rounded-[16px] text-sm font-semibold transition-all"
              style={lang === l.code
                ? { background: '#EFF1F5', color: '#0D1B2E' }
                : { background: '#111E30', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
              <span>{l.flag}</span>
              <span className="text-xs truncate">{l.native}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alert Sensitivity */}
      <div className="mb-5">
        <SectionHeader icon={<Bell className="w-3.5 h-3.5 text-white" />} title="Alert Sensitivity" iconBg="#E07A4A" />
        <div className="flex gap-2">
          {[
            { key: 'low', label: 'Low', color: '#22C55E' },
            { key: 'medium', label: 'Medium', color: '#F59E0B' },
            { key: 'high', label: 'High', color: '#EF4444' },
          ].map(s => (
            <button key={s.key} onClick={() => setAlertSensitivity(s.key)}
              className="flex-1 py-3 rounded-[16px] text-sm font-bold transition-all"
              style={alertSensitivity === s.key
                ? { background: '#EFF1F5', color: s.color }
                : { background: '#111E30', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trusted Contacts */}
      <div className="mb-5">
        <SectionHeader icon={<Users className="w-3.5 h-3.5 text-white" />} title="Trusted Contacts" iconBg="#4ACE9E" />
        <div className="space-y-2">
          {contacts.map(c => (
            <WhiteCard key={c.id} className="!p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-bold text-sm shrink-0"
                style={{ background: '#0D1B2E', color: 'white' }}>
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#0D1B2E' }}>{c.name}</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,46,0.45)' }}>{c.phone}</p>
              </div>
              <button onClick={() => removeContact(c.id)}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.08)' }}>
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </WhiteCard>
          ))}

          <AnimatePresence>
            {showAddContact && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <WhiteCard className="!p-3 space-y-2">
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name"
                    className="w-full rounded-[12px] px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'rgba(13,27,46,0.06)', color: '#0D1B2E' }} />
                  <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone"
                    className="w-full rounded-[12px] px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'rgba(13,27,46,0.06)', color: '#0D1B2E' }} />
                  <div className="flex gap-2">
                    <button onClick={handleAddContact}
                      className="flex-1 py-2.5 rounded-[12px] text-sm font-bold text-white"
                      style={{ background: '#0D1B2E' }}>Save</button>
                    <button onClick={() => setShowAddContact(false)}
                      className="px-4 py-2.5 rounded-[12px] text-sm font-medium"
                      style={{ background: 'rgba(13,27,46,0.08)', color: '#0D1B2E' }}>Cancel</button>
                  </div>
                </WhiteCard>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={() => setShowAddContact(true)}
            className="w-full py-3 rounded-[16px] text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: '#111E30', border: '1px dashed rgba(74,158,224,0.35)', color: '#4A9EE0' }}>
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Dark Mode */}
      <div className="mb-5">
        <SectionHeader icon={<Moon className="w-3.5 h-3.5 text-white" />} title="Appearance" />
        <WhiteCard className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: '#0D1B2E' }}>Dark Mode</span>
          <Switch checked={isDark} onCheckedChange={setIsDark} />
        </WhiteCard>
      </div>

      {/* SOS Triggers */}
      <div className="mb-5">
        <SectionHeader icon={<Waves className="w-3.5 h-3.5 text-white" />} title="SOS Triggers" iconBg="#EF4444" />
        <div className="space-y-2">
          <WhiteCard className="!p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[12px] flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <Smartphone className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0D1B2E' }}>Shake SOS</p>
                  <p className="text-[10px]" style={{ color: 'rgba(13,27,46,0.45)' }}>Shake 2x to trigger</p>
                </div>
              </div>
              <Switch checked={shakeSOSEnabled} onCheckedChange={setShakeSOSEnabled} />
            </div>
          </WhiteCard>

          <WhiteCard className="!p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[12px] flex items-center justify-center"
                  style={{ background: 'rgba(74,158,224,0.1)' }}>
                  <Mic className="w-4 h-4" style={{ color: '#4A9EE0' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0D1B2E' }}>Voice SOS</p>
                  <p className="text-[10px]" style={{ color: 'rgba(13,27,46,0.45)' }}>Say codeword to trigger</p>
                </div>
              </div>
              <Switch checked={voiceActivation} onCheckedChange={setVoiceActivation} />
            </div>
            {voiceActivation && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input value={codewordInput} onChange={e => setCodewordInput(e.target.value)}
                    placeholder='Custom codeword…'
                    className="flex-1 rounded-[12px] px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(13,27,46,0.06)', color: '#0D1B2E' }} />
                  <button onClick={() => setVoiceCodeword(codewordInput)}
                    className="px-3 py-2 rounded-[12px] text-xs font-bold text-white"
                    style={{ background: '#0D1B2E' }}>Save</button>
                </div>
                <div className="flex gap-2">
                  {[{ k: 'safe', l: 'Safe (2x)' }, { k: 'fast', l: 'Fast (1x)' }].map(m => (
                    <button key={m.k} onClick={() => setVoiceMode(m.k)}
                      className="flex-1 py-2 rounded-[12px] text-[11px] font-semibold"
                      style={voiceMode === m.k
                        ? { background: '#0D1B2E', color: 'white' }
                        : { background: 'rgba(13,27,46,0.06)', color: 'rgba(13,27,46,0.45)' }}>
                      {m.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </WhiteCard>
        </div>
      </div>

      {/* Safety Tools */}
      <div className="mb-5">
        <SectionHeader icon={<Shield className="w-3.5 h-3.5 text-white" />} title="Safety Tools" iconBg="#7C4AE0" />
        <div className="space-y-2">
          {[
            { icon: <PhoneCall className="w-4 h-4" style={{ color: '#4A9EE0' }} />, title: 'Fake Call', desc: 'Simulate incoming call', onClick: () => setShowFakeCall(true) },
            { icon: <Eye className="w-4 h-4 text-red-500" />, title: 'Stealth Mode', desc: 'Disguised calculator SOS', onClick: () => setStealthMode(true) },
          ].map((item, i) => (
            <WhiteCard key={i} className="!p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={item.onClick}>
              <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: 'rgba(13,27,46,0.07)' }}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#0D1B2E' }}>{item.title}</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,46,0.45)' }}>{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,46,0.25)' }} />
            </WhiteCard>
          ))}
        </div>
      </div>

      {/* SOS Capture */}
      <div className="mb-5">
        <SectionHeader icon={<Camera className="w-3.5 h-3.5 text-white" />} title="SOS Capture" iconBg="#4A9EE0" />
        <WhiteCard className="!p-3">
          <div className="flex gap-2">
            {[
              { k: 'camera', i: <Camera className="w-3.5 h-3.5" />, l: 'Camera' },
              { k: 'audio', i: <Mic className="w-3.5 h-3.5" />, l: 'Audio' },
              { k: 'both', i: <Zap className="w-3.5 h-3.5" />, l: 'Both' },
            ].map(opt => (
              <button key={opt.k} onClick={() => setSosCapture(opt.k)}
                className="flex-1 py-2.5 rounded-[12px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={sosCapture === opt.k
                  ? { background: '#0D1B2E', color: 'white' }
                  : { background: 'rgba(13,27,46,0.06)', color: 'rgba(13,27,46,0.45)' }}>
                {opt.i}{opt.l}
              </button>
            ))}
          </div>
        </WhiteCard>
      </div>

      {/* Emergency Numbers */}
      <div className="mb-5">
        <SectionHeader icon={<Phone className="w-3.5 h-3.5 text-white" />} title="Emergency Numbers" iconBg="#EF4444" />
        <WhiteCard className="!p-2">
          {[{ n: '112', l: 'India Emergency' }, { n: '181', l: 'Women Helpline' }, { n: '100', l: 'Police' }, { n: '102', l: 'Ambulance' }].map((e, i) => (
            <a key={e.n} href={`tel:${e.n}`}
              className="flex items-center justify-between py-3 px-2 rounded-[12px] transition-all"
              style={{ borderBottom: i < 3 ? '1px solid rgba(13,27,46,0.07)' : 'none' }}>
              <span className="text-sm" style={{ color: 'rgba(13,27,46,0.6)' }}>{e.l}</span>
              <span className="text-sm font-black" style={{ color: '#EF4444' }}>{e.n}</span>
            </a>
          ))}
        </WhiteCard>
      </div>

      {/* Account */}
      <div className="mb-6">
        <SectionHeader icon={<Lock className="w-3.5 h-3.5 text-white" />} title="Account" iconBg="#EF4444" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 rounded-[16px] px-3.5 py-3.5"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="w-8 h-8 rounded-[12px] flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-red-400">Delete Account</p>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>This is permanent and cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive"
                onClick={() => { localStorage.clear(); window.location.href = '/language'; }}>
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>SafeNav360X · v2.0</p>

      {showFakeCall && <FakeCallModal onClose={() => setShowFakeCall(false)} />}
    </div>
  );
}