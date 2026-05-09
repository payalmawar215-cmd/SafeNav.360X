import { useState, useRef } from 'react';
import { Send, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ChatInput({ onSend, onLocationShare, isSending, isLocating, disabled }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!text.trim() || isSending) return;
    onSend(text.trim());
    setText('');
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(11,15,26,0.95)' }}>
      <div className="flex items-end gap-2">
        {/* Location button — MANDATORY */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onLocationShare}
          disabled={isLocating || disabled}
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all"
          style={{
            background: isLocating ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.3)',
          }}
          title="Share Location (one tap)"
        >
          {isLocating
            ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#22D3EE' }} />
            : <MapPin className="w-4 h-4" style={{ color: '#22D3EE' }} />
          }
        </motion.button>

        {/* Text input */}
        <div className="flex-1 flex items-end rounded-2xl px-3 py-2.5 gap-2"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            minHeight: 44,
          }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none resize-none text-sm text-white placeholder:text-gray-600 leading-snug max-h-24"
            style={{ scrollbarWidth: 'none' }}
          />
        </div>

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSend}
          disabled={!text.trim() || isSending || disabled}
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all"
          style={{
            background: text.trim() ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : 'rgba(255,255,255,0.04)',
            border: text.trim() ? 'none' : '1px solid rgba(255,255,255,0.08)',
            opacity: (!text.trim() || isSending) ? 0.5 : 1,
            boxShadow: text.trim() ? '0 2px 12px rgba(79,70,229,0.4)' : 'none',
          }}
        >
          {isSending
            ? <Loader2 className="w-4 h-4 animate-spin text-white" />
            : <Send className="w-4 h-4 text-white" />
          }
        </motion.button>
      </div>
    </div>
  );
}