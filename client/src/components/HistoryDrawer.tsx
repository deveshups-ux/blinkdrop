import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, Trash2, History, HardDrive } from 'lucide-react';
import { storageManager, type HistoryItem } from '../utils/storage';
import { formatBytes } from '../utils/helpers';
import { formatHashPreview } from '../utils/crypto';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    const items = await storageManager.getHistory();
    setHistory(items);
    setLoading(false);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your local transfer history?')) {
      await storageManager.clearHistory();
      setHistory([]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md h-full bg-[#0b1120] border-l border-white/[0.1] shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />

          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Transfer History</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    IndexedDB
                  </span>
                </h3>
                <p className="text-xs text-gray-400">Persistent local log on this device</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
            {loading ? (
              <div className="h-40 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                Loading persistent logs...
              </div>
            ) : history.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 select-none">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-500 mb-3">
                  <HardDrive className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-300">No transfers recorded yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Transfers completed over direct WebRTC will automatically be persisted in browser IndexedDB.
                </p>
              </div>
            ) : (
              history.map((item) => {
                const isSent = item.type === 'sent';
                const dateStr = new Date(item.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#050914] border border-white/[0.08] hover:border-cyan-500/30 transition-colors shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSent
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isSent ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate max-w-[200px]" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">
                            {formatBytes(item.size)} • <span className="capitalize">{item.type}</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-gray-500 font-mono shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {dateStr}
                      </span>
                    </div>

                    {/* SHA-256 Badge if present */}
                    {item.hash && (
                      <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 font-mono">
                          SHA: {formatHashPreview(item.hash)}
                        </span>
                        {item.verified && (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Bit-Perfect</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer Status */}
          <div className="p-3.5 border-t border-white/[0.08] bg-[#050914] text-[11px] text-gray-500 flex items-center justify-between">
            <span>{history.length} records in IndexedDB</span>
            <span className="font-mono text-cyan-400">Zero Cloud Storage</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
