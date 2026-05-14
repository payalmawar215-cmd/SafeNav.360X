import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/lib/AppContext.jsx';

// Stealth mode: disguised as a calculator. Enter "911" to trigger SOS silently.
export default function StealthMode({ onClose }) {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const { setSosActive } = useAppContext();

  const handleKey = (val) => {
    const next = input + val;
    setInput(next);
    if (next.includes('911')) {
      setSosActive(true);
      navigate('/sos');
    }
  };

  const buttons = ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+'];

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col">
      {/* Fake calculator header */}
      <div className="px-5 pt-12 pb-4">
        <div className="bg-gray-800 rounded-2xl px-5 py-4 text-right">
          <p className="text-gray-400 text-sm h-5">&nbsp;</p>
          <p className="text-white text-4xl font-light">{input || '0'}</p>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-4 gap-2 px-4 pb-8">
        {buttons.map(b => (
          <button
            key={b}
            onClick={() => ['÷','×','−','+','='].includes(b) ? setInput('') : handleKey(b)}
            className={`rounded-2xl text-xl font-medium h-16 transition-all active:scale-95 ${
              ['÷','×','−','+'].includes(b) ? 'bg-orange-500 text-white' :
              b === '=' ? 'bg-orange-500 text-white' :
              'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {b}
          </button>
        ))}
      </div>
      {/* Hidden exit: tap top-left corner 3 times */}
      <button onClick={onClose} className="absolute top-0 left-0 w-12 h-12 opacity-0" aria-hidden />
      <p className="text-center text-gray-700 text-xs pb-4">Enter 911 to trigger SOS silently</p>
    </div>
  );
}