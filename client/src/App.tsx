import { useEffect, useRef, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Radar } from './components/Radar';
import { DropZone } from './components/DropZone';
import { TransferModal } from './components/TransferModal';
import { QRModal } from './components/QRModal';
import { ScannerModal } from './components/ScannerModal';
import { IncomingModal } from './components/IncomingModal';
import { TextModal } from './components/TextModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { WebRTCManager } from './services/webrtc';
import type { BatchMeta, Peer, TransferProgress } from './types';
import { generateRoomCode, getDeviceDetails, sanitizeFileName, isFileSystemAccessSupported, isDirectoryPickerSupported } from './utils/helpers';
import { wakeLockManager } from './utils/wakeLock';
import { ShieldCheck, Wifi, Zap, Lock, HardDrive } from 'lucide-react';

function getSignalingUrl(): string {
  if (import.meta.env.VITE_SIGNALING_URL) {
    return import.meta.env.VITE_SIGNALING_URL;
  }
  // Automatically adapt to the host accessing the frontend (localhost or 192.168.x.x)
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname || 'localhost';
  return `${protocol}//${hostname}:5000`;
}

export function App() {
  const [roomId, setRoomId] = useState<string>('');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [connected, setConnected] = useState(false);

  // Modals & Drawers
  const [isQROpen, setIsQROpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Transfer states
  const [activeTransfer, setActiveTransfer] = useState<TransferProgress | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<{ senderSocketId: string; batchMeta: BatchMeta } | null>(null);
  const [incomingText, setIncomingText] = useState<{ text: string; senderName: string; timestamp: number } | null>(null);

  // Device Info
  const [deviceInfo] = useState(getDeviceDetails());

  const webrtcRef = useRef<WebRTCManager | null>(null);
  const pendingBatchRef = useRef<{ peer: Peer; files: File[]; batchMeta: BatchMeta } | null>(null);

  // Setup WebRTC manager callbacks
  const attachManagerCallbacks = useCallback((manager: WebRTCManager) => {
    manager.onPeersUpdate = (updatedPeers) => {
      setPeers(updatedPeers);
      setConnected(true);
    };

    manager.onPeerJoined = (newPeer) => {
      setPeers((prev) => {
        if (prev.some((p) => p.socketId === newPeer.socketId)) return prev;
        return [...prev, newPeer];
      });
    };

    manager.onPeerLeft = (leftSocketId) => {
      setPeers((prev) => prev.filter((p) => p.socketId !== leftSocketId));
      setSelectedPeer((curr) => (curr?.socketId === leftSocketId ? null : curr));
    };

    manager.onProgress = (progress) => {
      setActiveTransfer(progress);
    };

    manager.onFileReceived = (fileName, blob, _fileIndex, _totalFiles, savedToDisk) => {
      if (savedToDisk) {
        console.log(`[Stream Complete] "${fileName}" streamed directly to disk (0-RAM).`);
        return;
      }

      // Graceful Fallback: Automatic download trigger for browsers without File System Access API
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = sanitizeFileName(fileName);
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    manager.onIncomingRequest = (senderSocketId, batchMeta) => {
      setIncomingRequest({ senderSocketId, batchMeta });
    };

    manager.onTextReceived = (textData) => {
      setIncomingText(textData);
    };

    manager.onTransferResponse = async (accepted) => {
      if (accepted && pendingBatchRef.current) {
        const { peer, files, batchMeta } = pendingBatchRef.current;
        try {
          await manager.sendBatch(peer.socketId, files, batchMeta);
        } catch (err) {
          console.error('File send error:', err);
          alert('Failed to send files. Check connection.');
        } finally {
          pendingBatchRef.current = null;
        }
      } else {
        alert('File transfer was declined by the receiver.');
        pendingBatchRef.current = null;
      }
    };
  }, []);

  // Connect to room
  const connectToRoom = useCallback(
    (targetRoom: string) => {
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }

      setPeers([]);
      setSelectedPeer(null);
      setConnected(false);

      const signalingUrl = getSignalingUrl();
      console.log(`Connecting to signaling at ${signalingUrl} for room ${targetRoom}`);

      const manager = new WebRTCManager(signalingUrl);
      webrtcRef.current = manager;
      attachManagerCallbacks(manager);

      manager.joinRoom(targetRoom, deviceInfo.deviceName, deviceInfo.deviceType);
    },
    [attachManagerCallbacks, deviceInfo]
  );

  useEffect(() => {
    // 1. Determine Room ID (from URL parameter or generate fresh)
    const urlParams = new URLSearchParams(window.location.search);
    let currentRoom = urlParams.get('room');

    if (!currentRoom) {
      currentRoom = generateRoomCode();
      const newUrl = `${window.location.pathname}?room=${currentRoom}`;
      window.history.replaceState(null, '', newUrl);
    }

    // Check for Web Share Target content shared from other mobile apps
    if (urlParams.get('shared') === 'true') {
      const sharedContent = urlParams.get('text') || urlParams.get('url') || urlParams.get('title');
      if (sharedContent) {
        console.log('📥 [PWA Web Share Target] Received content:', sharedContent);
        setIncomingText({
          text: sharedContent,
          senderName: 'Shared from Device Sheet',
          timestamp: Date.now(),
        });
      }
    }

    setRoomId(currentRoom);
    connectToRoom(currentRoom);

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }
    };
  }, [connectToRoom]);

  // Manage Screen Wake Lock during active transfers
  useEffect(() => {
    if (activeTransfer && activeTransfer.status === 'transferring') {
      wakeLockManager.acquire();
    } else {
      wakeLockManager.release();
    }

    return () => {
      wakeLockManager.release();
    };
  }, [activeTransfer?.status]);

  // Actions
  const handleSelectPeer = (peer: Peer) => {
    setSelectedPeer((prev) => (prev?.socketId === peer.socketId ? null : peer));
  };

  const handleSendFiles = (peer: Peer, files: File[]) => {
    if (!webrtcRef.current || files.length === 0) return;
    const batchMeta = webrtcRef.current.requestSendBatch(peer.socketId, files);
    pendingBatchRef.current = { peer, files, batchMeta };
  };

  const handleSendText = (peer: Peer, text: string) => {
    if (!webrtcRef.current || !text.trim()) return;
    const success = webrtcRef.current.sendQuickText(peer.socketId, text.trim(), deviceInfo.deviceName);
    if (!success) {
      alert(`Could not send text to ${peer.deviceName}. Direct P2P connection is not ready.`);
    }
  };

  const handleAcceptIncoming = async () => {
    if (!incomingRequest || !webrtcRef.current) return;
    const { senderSocketId, batchMeta } = incomingRequest;

    let destination: { fileHandle?: any; dirHandle?: any } | null = null;

    // Direct-to-Disk Streaming via File System Access API
    if (isFileSystemAccessSupported()) {
      try {
        if (batchMeta.totalFiles === 1) {
          const fileMeta = batchMeta.files[0];
          // Prompt Native Save File Picker
          // @ts-expect-error File System Access API
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: sanitizeFileName(fileMeta.name),
          });
          destination = { fileHandle };
        } else if (isDirectoryPickerSupported()) {
          // Prompt Directory Picker so all files stream cleanly into one folder
          // @ts-expect-error File System Access API
          const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
          });
          destination = { dirHandle };
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('User cancelled folder picker; falling back to memory/download mode.');
        } else {
          console.warn('File system picker error, falling back to memory/download mode:', err);
        }
        // Fallback: destination remains null -> in-memory Blob collection
      }
    }

    webrtcRef.current.setReceiveDestination(destination);
    webrtcRef.current.respondTransfer(senderSocketId, true);
    setIncomingRequest(null);
  };

  const handleDeclineIncoming = () => {
    if (!incomingRequest || !webrtcRef.current) return;
    webrtcRef.current.respondTransfer(incomingRequest.senderSocketId, false);
    setIncomingRequest(null);
  };

  const handleRoomSelect = (newRoom: string) => {
    if (newRoom === roomId) return;
    const newUrl = `${window.location.pathname}?room=${newRoom}`;
    window.history.pushState(null, '', newUrl);
    setRoomId(newRoom);
    connectToRoom(newRoom);
  };

  return (
    <div className="min-h-[100dvh] bg-[#030712] text-gray-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden bg-mesh-grid">
      {/* Ambient Cyber Aurora Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[250px] bg-indigo-600/5 blur-[140px] pointer-events-none" />

      {/* Edge-to-Edge Top Navbar */}
      <Navbar
        roomId={roomId}
        deviceName={deviceInfo.deviceName}
        connected={connected}
        onOpenQR={() => setIsQROpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Command Hub Stage */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Radar View with connected devices */}
        <Radar
          peers={peers}
          localDeviceName={deviceInfo.deviceName}
          localDeviceType={deviceInfo.deviceType}
          selectedPeer={selectedPeer}
          roomId={roomId}
          onSelectPeer={handleSelectPeer}
          onSendClick={(peer) => {
            setSelectedPeer(peer);
          }}
          onOpenQR={() => setIsQROpen(true)}
        />

        {/* Multi-File Drop Zone & Quick Text */}
        <DropZone
          selectedPeer={selectedPeer}
          onSendFiles={handleSendFiles}
          onSendText={handleSendText}
        />

        {/* Feature Trust Bar */}
        <div className="mt-7 w-full max-w-4xl mx-auto px-4 sm:px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl flex flex-wrap items-center justify-around gap-4 text-xs text-gray-400 select-none shadow-lg">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-gray-300">Direct Local Wi-Fi Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-gray-300">End-to-End P2P Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-gray-300">Zero-RAM Disk Stream</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-gray-300">Resumable Chunk Sync</span>
          </div>
        </div>
      </main>

      {/* Sleek Edge-to-Edge Footer */}
      <footer className="w-full border-t border-white/[0.06] bg-[#030712]/80 py-4 px-4 sm:px-8 backdrop-blur-xl select-none z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span className="font-semibold text-gray-300">BlinkDrop</span>
            <span>• Universal Peer-to-Peer Protocol</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>WebRTC SCTP Channels</span>
            <span>•</span>
            <span>Bit-Perfect SHA-256</span>
            <span>•</span>
            <span>IndexedDB Resumption</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <QRModal isOpen={isQROpen} onClose={() => setIsQROpen(false)} roomId={roomId} />
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onRoomSelect={handleRoomSelect}
      />
      <IncomingModal
        request={incomingRequest}
        onAccept={handleAcceptIncoming}
        onDecline={handleDeclineIncoming}
      />
      <TransferModal
        transfer={activeTransfer}
        onClose={() => setActiveTransfer(null)}
        onPause={() => webrtcRef.current?.pauseTransfer()}
        onResume={() => webrtcRef.current?.resumeTransfer()}
      />
      <TextModal
        data={incomingText}
        onClose={() => setIncomingText(null)}
      />
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}

export default App;
