import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Smartphone, Tablet, Send, ShieldCheck, QrCode, Copy, Check, Radio } from 'lucide-react';
import type { Peer } from '../types';

interface RadarProps {
  peers: Peer[];
  localDeviceName: string;
  localDeviceType: 'mobile' | 'desktop' | 'tablet';
  selectedPeer: Peer | null;
  roomId?: string;
  onSelectPeer: (peer: Peer) => void;
  onSendClick: (peer: Peer) => void;
  onOpenQR?: () => void;
}

export const Radar: React.FC<RadarProps> = ({
  peers,
  localDeviceName,
  localDeviceType,
  selectedPeer,
  roomId,
  onSelectPeer,
  onSendClick,
  onOpenQR,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderDeviceIcon = (type: 'mobile' | 'desktop' | 'tablet', className = 'w-5 h-5 sm:w-6 sm:h-6') => {
    switch (type) {
      case 'mobile':
        return <Smartphone className={className} />;
      case 'tablet':
        return <Tablet className={className} />;
      default:
        return <Laptop className={className} />;
    }
  };

  const ringSizes =
    screenSize === 'mobile'
      ? [110, 180, 240]
      : screenSize === 'tablet'
      ? [140, 220, 300]
      : [170, 260, 350];

  const orbitRadius =
    screenSize === 'mobile' ? 82 : screenSize === 'tablet' ? 112 : 140;

  const handleCopyLink = () => {
    const url = roomId
      ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative w-full max-w-4xl h-[280px] xs:h-[320px] sm:h-[380px] md:h-[420px] mx-auto flex items-center justify-center overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0b1120]/80 via-[#070d1a]/90 to-[#030712] shadow-2xl backdrop-blur-2xl transition-all">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-cyan-500/[0.04] blur-3xl pointer-events-none" />
      </div>

      {/* Animated Radar Pulse Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {ringSizes.map((size, idx) => (
          <motion.div
            key={idx}
            className="absolute rounded-full border border-cyan-400/[0.12]"
            style={{ width: size, height: size }}
            animate={{
              scale: [1, 1.04, 1],
              opacity: [0.2, 0.45, 0.2],
            }}
            transition={{
              duration: 3.5 + idx,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: idx * 0.6,
            }}
          />
        ))}

        {/* Ambient Dashed Range Ring */}
        <div
          className="absolute rounded-full border border-dashed border-cyan-500/10 pointer-events-none"
          style={{ width: ringSizes[1], height: ringSizes[1] }}
        />

        {/* Conic Radar Sweep */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: ringSizes[2],
            height: ringSizes[2],
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.16) 0deg, transparent 50deg, transparent 360deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Center Device (You / Host) */}
      <div className="relative z-10 flex flex-col items-center select-none">
        <div className="relative group">
          <div className="w-13 h-13 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 p-[2px] shadow-xl shadow-cyan-500/30 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#050914] rounded-[14px] flex items-center justify-center text-cyan-300">
              {renderDeviceIcon(localDeviceType, 'w-6 h-6 sm:w-7 sm:h-7 text-cyan-300')}
            </div>
          </div>

          {/* Online Security Badge */}
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#050914] flex items-center justify-center shadow-md"
            title="Encrypted Local P2P Node"
          >
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        </div>

        <div className="mt-2 flex flex-col items-center">
          <span className="text-xs sm:text-sm font-semibold text-white text-center max-w-[130px] sm:max-w-[160px] truncate">
            {localDeviceName}{' '}
            <span className="text-cyan-400 text-[11px] font-normal">(You)</span>
          </span>
          <span className="mt-0.5 text-[10px] text-emerald-400/90 font-mono flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Discoverable
          </span>
        </div>
      </div>

      {/* Connected Peers Orbiting */}
      {peers.length === 0 ? (
        <div className="absolute bottom-3 sm:bottom-5 inset-x-4 text-center z-10 select-none flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Scanning for nearby devices...</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 max-w-sm hidden xs:block">
            Open BlinkDrop on another phone, laptop, or tablet on this Wi-Fi to beam files.
          </p>

          {/* Quick Pairing Shortcuts */}
          <div className="mt-2 flex items-center gap-2">
            {onOpenQR && (
              <button
                type="button"
                onClick={onOpenQR}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-cyan-300 hover:text-white transition-all shadow-sm"
              >
                <QrCode className="w-3 h-3" />
                <span>Pair Phone via QR</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-gray-300 hover:text-white transition-all shadow-sm"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          {peers.map((peer, index) => {
            const angle = (index / peers.length) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * orbitRadius;
            const y = Math.sin(angle) * orbitRadius;
            const isSelected = selectedPeer?.socketId === peer.socketId;

            return (
              <motion.div
                key={peer.socketId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x, y }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="absolute z-20 flex flex-col items-center cursor-pointer select-none"
                onClick={() => onSelectPeer(peer)}
              >
                <div
                  className={`relative group flex flex-col items-center p-2 sm:p-2.5 rounded-2xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-xl shadow-cyan-500/40 scale-105'
                      : 'bg-[#0f172a]/90 hover:bg-[#1e293b]/95 border border-white/[0.1] hover:border-cyan-400/60 shadow-lg'
                  }`}
                >
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#050914] flex items-center justify-center text-gray-300 group-hover:text-cyan-300 transition-colors">
                    {renderDeviceIcon(peer.deviceType, 'w-5 h-5 sm:w-6 sm:h-6')}
                  </div>

                  <span className="mt-1 text-[11px] sm:text-xs font-semibold text-gray-200 max-w-[80px] sm:max-w-[105px] truncate text-center">
                    {peer.deviceName}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendClick(peer);
                    }}
                    className="mt-1 flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[10px] font-semibold transition-all shadow-sm"
                  >
                    <Send className="w-2.5 h-2.5" />
                    <span>Beam</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
};
