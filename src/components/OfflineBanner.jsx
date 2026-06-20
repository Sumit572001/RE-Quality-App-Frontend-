import React, { useEffect, useState } from 'react';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { countPendingAudits } from '../utils/offlineDB';

/**
 * OfflineBanner — shows offline status + pending sync count
 * Appears at the top of the page when offline or when there are pending syncs
 */
const OfflineBanner = ({ onSyncComplete }) => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [showOnlineMsg, setShowOnlineMsg] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  const refreshCount = async () => {
    const count = await countPendingAudits();
    setPendingCount(count);
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // When transitioning from offline → online
    if (!prevOnline && isOnline) {
      setShowOnlineMsg(true);
      setTimeout(() => setShowOnlineMsg(false), 3000);
      if (onSyncComplete) onSyncComplete();
    }
    setPrevOnline(isOnline);
  }, [isOnline]);

  // Nothing to show when online and no pending
  if (isOnline && pendingCount === 0 && !showOnlineMsg) return null;

  if (showOnlineMsg) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto">
        <div className="mx-3 mt-2 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg bg-green-500 text-white animate-slide-up">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wide">Back Online!</p>
            <p className="text-[10px] text-white/80">Syncing your pending audits...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto">
        <div className="mx-3 mt-2 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg bg-gray-800 text-white animate-slide-up">
          {/* Offline icon */}
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3 3l18 18" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wide">You're Offline</p>
            <p className="text-[10px] text-white/70">
              {pendingCount > 0
                ? `${pendingCount} audit${pendingCount > 1 ? 's' : ''} will sync when connected`
                : 'Audits will be saved locally'}
            </p>
          </div>
          {/* Pulsing dot */}
          <div className="flex-shrink-0">
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Online but has pending audits to sync
  if (isOnline && pendingCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto">
        <div className="mx-3 mt-2 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg bg-brand-orange text-white animate-slide-up">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-spin-slow">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wide">Syncing Audits</p>
            <p className="text-[10px] text-white/80">
              {pendingCount} pending audit{pendingCount > 1 ? 's' : ''} uploading...
            </p>
          </div>
          {/* Spinner */}
          <div className="flex-shrink-0 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineBanner;
