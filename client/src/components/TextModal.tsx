import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Copy, Check, ExternalLink, X, Clock } from 'lucide-react';

interface TextModalProps {
  data: { text: string; senderName: string; timestamp: number } | null;
  onClose: () => void;
}

export const TextModal: React.FC<TextModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const isUrl = /^https?:\/\/[^\s]+$/i.test(data.text.trim());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy text to clipboard:', err);
    }
  };

  const handleOpenUrl = () => {
    if (isUrl) {
      window.open(data.text.trim(), '_blank', 'noopener,noreferrer');
    }
  };

  const timeString = new Date(data.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          className="relative w-full max-w-md rounded-3xl bg-[#0b1120] border border-white/[0.1] p-6 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-cyan-500/15 blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Instant Text Received</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                  P2P Beam
                </span>
              </h3>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <span>From <strong className="text-gray-200 font-medium">{data.senderName}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  {timeString}
                </span>
              </p>
            </div>
          </div>

          {/* Text Box Content */}
          <div className="w-full rounded-2xl bg-[#050914] border border-white/[0.08] p-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar select-text">
            <p className="text-sm text-gray-200 whitespace-pre-wrap break-words font-mono leading-relaxed">
              {data.text}
            </p>
          </div>

          {/* Actions */}
          <div className="w-full flex items-center gap-2.5">
            {isUrl && (
              <button
                onClick={handleOpenUrl}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/[0.08]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Link</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
