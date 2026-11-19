import React, { useState, useEffect } from 'react';
import { Zap, QrCode, Copy, Check, Radio, Camera, Download, History } from 'lucide-react';

interface NavbarProps {
  roomId: string;
  deviceName: string;
  connected: boolean;
  onOpenQR: () => void;
  onOpenScanner: () => void;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  deviceName,
  connected,
  onOpenQR,
  onOpenScanner,
  onOpenHistory,
}) => {
  const [copied, setCopied] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full border-b border-white/[0.08] bg-[#030712]/80 backdrop-blur-2xl sticky top-0 z-40 transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-shadow">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-20 blur group-hover:opacity-40 transition-opacity pointer-events-none" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                BlinkDrop
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                P2P
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <span className="relative flex h-2 w-2">
                {connected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    connected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                  }`}
                />
              </span>
              <span className="truncate max-w-[110px] sm:max-w-xs text-gray-300 font-medium">
                {connected ? deviceName : 'Connecting to Mesh...'}
              </span>
              {connected && (
                <>
                  <span className="hidden md:inline text-gray-600">•</span>
                  <span className="hidden md:inline text-emerald-400/90 text-[11px] font-mono">
                    Discoverable
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Room Pairing & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Transfer History Button (IndexedDB) */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-gray-300 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-sm"
            title="View persistent transfer history"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Install PWA Button (When available) */}
          {installPrompt && !isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-medium transition-all shadow-sm"
              title="Install BlinkDrop as a Native App on your device"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Room ID Badge & Copy Pill */}
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-xs sm:text-sm font-medium text-gray-300 hover:text-white transition-all shadow-sm group"
            title="Click to copy pairing link"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:animate-pulse" />
            <span className="font-mono text-cyan-300 font-semibold">{roomId}</span>
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copied</span>
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors shrink-0" />
            )}
          </button>

          {/* Join with Camera / Code */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-gray-300 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-sm"
            title="Scan QR code or enter room code"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Scan to Join</span>
          </button>

          {/* Share QR Modal Button */}
          <button
            onClick={onOpenQR}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
            title="Display QR code to pair other devices"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Share QR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
