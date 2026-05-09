import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2, CheckCircle2, WifiOff, MapPin, Loader2, HardDrive } from 'lucide-react';
import {
  CITY_DATA, detectNearestCity, getDownloadedCities,
  downloadCityMap, deleteCityMap, isCityDownloaded
} from '@/lib/offlineMaps';
import { useAppContext } from '@/lib/AppContext.jsx';

export default function OfflineMapsModal({ onClose }) {
  const { userLocation } = useAppContext();
  const [downloading, setDownloading] = useState(null); // cityId
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(getDownloadedCities());
  const [nearestCity, setNearestCity] = useState(null);

  useEffect(() => {
    if (userLocation?.lat) {
      setNearestCity(detectNearestCity(userLocation.lat, userLocation.lng));
    }
  }, [userLocation]);

  const handleDownload = async (city) => {
    if (downloading) return;
    setDownloading(city.id);
    setProgress(0);
    await downloadCityMap(city, setProgress);
    setDownloading(null);
    setProgress(0);
    setDownloaded(getDownloadedCities());
  };

  const handleDelete = async (cityId) => {
    await deleteCityMap(cityId);
    setDownloaded(getDownloadedCities());
  };

  const isDown = (id) => downloaded.some(c => c.id === id);
  const downloadInfo = (id) => downloaded.find(c => c.id === id);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="w-full max-w-lg flex flex-col"
        style={{
          background: '#0B0F1A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px 28px 0 0',
          maxHeight: '85vh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #22D3EE)' }}>
              <WifiOff className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Offline Maps</h2>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Navigate without internet</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Nearest city highlight */}
        {nearestCity && !isDown(nearestCity.id) && (
          <div className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.3)' }}>
            <MapPin className="w-5 h-5 shrink-0" style={{ color: '#818CF8' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Your city: {nearestCity.name}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>~{nearestCity.sizeMB}MB — recommended download</p>
            </div>
            <button
              onClick={() => handleDownload(nearestCity)}
              disabled={!!downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #22D3EE)' }}>
              <Download className="w-3.5 h-3.5" /> Get
            </button>
          </div>
        )}

        {/* City list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {downloading && (
            <div className="rounded-2xl p-4 mb-2"
              style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#22D3EE' }} />
                  <span className="text-sm font-semibold text-white">
                    Downloading {CITY_DATA.find(c => c.id === downloading)?.name}…
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: '#22D3EE' }}>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4F46E5, #22D3EE)' }} />
              </div>
            </div>
          )}

          {CITY_DATA.map(city => {
            const down = isDown(city.id);
            const info = downloadInfo(city.id);
            const isLoading = downloading === city.id;
            return (
              <div key={city.id}
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{
                  background: down ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${down ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: down ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', color: down ? '#10B981' : '#9CA3AF' }}>
                    {down ? <CheckCircle2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{city.name}</p>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: '#9CA3AF' }}>
                      <HardDrive className="w-3 h-3" />
                      <span>{city.sizeMB}MB</span>
                      {info && <span>· Downloaded {new Date(info.downloadedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                {down ? (
                  <button onClick={() => handleDelete(city.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <Trash2 className="w-3.5 h-3.5 text-danger" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownload(city)}
                    disabled={!!downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40"
                    style={{ background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', color: '#818CF8' }}>
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    {isLoading ? `${progress}%` : 'Download'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-6 pt-2 text-center">
          <p className="text-[10px]" style={{ color: '#4B5563' }}>
            Tiles cached via browser Cache API. Works fully offline once downloaded.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}