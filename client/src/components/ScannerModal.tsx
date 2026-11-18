import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, AlertCircle } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomSelect: (roomId: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onRoomSelect }) => {
  const [manualCode, setManualCode] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen || !useCamera) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
      return;
    }

    const scannerId = 'blinkdrop-qr-reader';
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' }, // Back camera preferred on phones
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          try {
            const url = new URL(decodedText);
            const roomParam = url.searchParams.get('room');
            if (roomParam) {
              handleSuccess(roomParam);
              return;
            }
          } catch {
            // Not a valid URL, could be raw code like BLINK-XXXX
          }

          if (
            decodedText.startsWith('BLINK-') ||
            decodedText.length >= 4
          ) {
            handleSuccess(decodedText.trim().toUpperCase());
          }
        },
        () => {
          // Ignore transient frame scan errors
        }
      )
      .catch((err) => {
        console.warn('Camera access error:', err);
        setScannerError('Camera access unavailable. Enter the pairing code manually.');
        setUseCamera(false);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, useCamera]);

  const handleSuccess = (roomId: string) => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    onRoomSelect(roomId);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      let code = manualCode.trim().toUpperCase();
      if (!code.startsWith('BLINK-') && code.length === 4) {
        code = `BLINK-${code}`;
      }
      handleSuccess(code);
    }
  };

  if (!isOpen) return null;

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
          <Camera className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">Join P2P Mesh Room</h3>
        <p className="text-xs text-gray-400 text-center mt-1 mb-4">
          Scan the host QR code or enter a 4-letter room code to connect.
        </p>

        {/* Tab switch */}
        <div className="w-full flex bg-[#050914] p-1 rounded-2xl border border-white/[0.08] mb-4">
          <button
            type="button"
            onClick={() => setUseCamera(true)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              useCamera
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setUseCamera(false)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              !useCamera
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Enter Code</span>
          </button>
        </div>

        {/* Scanner Viewport */}
        {useCamera ? (
          <div className="w-full flex flex-col items-center">
            <div className="w-[240px] h-[240px] rounded-2xl overflow-hidden bg-black border border-white/[0.1] relative shadow-inner">
              <div id="blinkdrop-qr-reader" className="w-full h-full" />
            </div>
            {scannerError && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{scannerError}</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="w-full space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Room Code (e.g. BLINK-A1B2 or A1B2)
              </label>
              <input
                type="text"
                autoFocus
                placeholder="BLINK-XXXX"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="w-full rounded-2xl bg-[#050914] border border-white/[0.08] px-4 py-3 text-sm text-white font-mono text-center tracking-widest placeholder-gray-600 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg active:scale-95 ${
                manualCode.trim()
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 cursor-pointer'
                  : 'bg-white/[0.05] text-gray-500 cursor-not-allowed border border-white/[0.05]'
              }`}
            >
              Connect to Room
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
