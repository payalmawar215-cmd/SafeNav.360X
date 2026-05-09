import { useNavigate } from 'react-router-dom';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n.jsx';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function LanguageSelect() {
  const navigate = useNavigate();
  const { lang, setLanguage } = useLanguage();
  const [selected, setSelected] = useState(lang || 'en');

  const handleConfirm = () => {
    setLanguage(selected);
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f4c81] to-[#1a6eb5] px-6 pt-12 pb-8 flex flex-col items-center">
        <img
          src="https://media.base44.com/images/public/69e449b5017790d72143e6e1/d2ca05de1_logosafenav.jpeg"
          alt="SafeNav360X" className="w-16 h-16 rounded-2xl shadow-xl border-2 border-white/30 object-cover mb-4"
        />
        <h1 className="text-2xl font-black text-white">SafeNav<span className="text-[#a3f7ef]">360X</span></h1>
        <p className="text-white/70 text-sm mt-1">Select your language / भाषा चुनें</p>
      </div>

      {/* Language grid */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          {SUPPORTED_LANGUAGES.map((lang, i) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(lang.code)}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                selected === lang.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{lang.native}</p>
                <p className="text-[10px] text-muted-foreground">{lang.label}</p>
              </div>
              {selected === lang.code && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8">
        <Button onClick={handleConfirm} className="w-full h-12 rounded-2xl font-bold text-base">
          Continue →
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">You can change this anytime in Settings</p>
      </div>
    </div>
  );
}