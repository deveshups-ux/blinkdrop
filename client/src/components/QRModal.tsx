import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, Radio } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const roomUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0b1120] border border-white/[0.1] p-6 shadow-2xl flex flex-col items-center">
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-cyan-500/15 blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">Scan to Pair Device</h3>
        <p className="text-xs text-gray-400 text-center mt-1 mb-5">
          Scan this QR code with your phone camera or tablet to join this direct P2P mesh network.
        </p>

        {/* QR Code Container with High Contrast & Subtle Rim */}
        <div className="p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center border-4 border-white">
          <QRCodeSVG value={roomUrl} size={196} level="M" />
        </div>

        {/* Room Code Pill */}
        <div className="mt-5 w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#050914] border border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-gray-400 font-medium">Room:</span>
            <span className="text-sm font-mono font-bold text-cyan-300">{roomId}</span>
          </div>

          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 text-xs text-gray-200 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors font-medium border border-white/[0.06]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
