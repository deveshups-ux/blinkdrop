# ⚡ BlinkDrop

<div align="center">

  **Universal Zero-Server Peer-to-Peer File Transfer Protocol**  
  *High-speed, end-to-end encrypted direct file sharing between any devices powered by WebRTC SCTP DataChannels, IndexedDB Resumption, and React 19.*

  [![Live Demo](https://img.shields.io/badge/Demo-blinkdrop--p2p.vercel.app-06b6d4?style=for-the-badge&logo=vercel&logoColor=white)](https://blinkdrop-p2p.vercel.app)
  [![WebRTC](https://img.shields.io/badge/Networking-WebRTC%20SCTP-3b82f6?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
  [![IndexedDB](https://img.shields.io/badge/Persistence-IndexedDB-10b981?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

</div>

---

## 🌐 Live Production Deployment

* **Live App**: [https://blinkdrop-p2p.vercel.app](https://blinkdrop-p2p.vercel.app)
* **GitHub Repository**: [https://github.com/deveshups-ux/blinkdrop](https://github.com/deveshups-ux/blinkdrop)

---

## 🚀 Key Architectural Highlights

### 1. 🔄 Resumable Transfers with Chunk ACK & IndexedDB State Engine
* **The Problem**: On standard WebRTC apps, if Wi-Fi flickers or an ICE connection drops at 90% of a 5 GB file, the in-flight buffer is lost and the transfer restarts from 0%.
* **The Solution**: 
  - Integrated browser-native **IndexedDB** (`blinkdrop_db`) with object stores for active sessions and historical records.
  - As 64 KB binary chunks arrive, receiver checkpoints written byte offsets every 1 MB without blocking the main event loop.
  - On reconnection or resume, receiver dispatches a `resume-request` packet with `startOffset`.
  - The sender performs zero-copy delta slicing (`file.slice(offset)`), and receiver invokes Chromium's `FileSystemWritableFileStream.seek(offset)` to append newly arrived chunks seamlessly.
  - Supports live **Manual Pause & Auto-Resume** during active transfers.

### 2. 💾 Zero-RAM Direct-to-Disk Streaming
* Overcomes the browser V8 heap ceiling (~1.5–2 GB) by streaming incoming SCTP chunks straight to NVMe/SSD storage using the **File System Access API** (`showSaveFilePicker` for single files and `showDirectoryPicker` for batch folders).
* Driven by a sequential Promise-chained write queue, keeping heap memory flat (<35 MB RAM) regardless of whether streaming a 500 MB video or a 50 GB archive. Graceful in-memory Blob fallback for browsers without File System Access API.

### 3. 🌊 Adaptive Backpressure & Flow Control
* Monitors `RTCDataChannel.bufferedAmount` against high-water marks (512 KB) and pauses reading streams until the NIC drains the buffer, triggering the `bufferedamountlow` event (64 KB threshold) to prevent buffer bloat and dropped UDP/SCTP packets across fluctuating cellular networks.

### 4. 🛡️ Bit-Perfect Cryptographic Hash Verification (SHA-256)
* Leverages the hardware-accelerated **Web Crypto API** (`crypto.subtle.digest`) to generate incremental SHA-256 cryptographic fingerprints.
* The sender embeds the hash into the file header; upon stream finalization, the receiver recalculates the local byte checksum before closing the file handle to guarantee zero corruption or tampering.

### 5. 📱 PWA & Native OS Web Share Target
* Fully installable Progressive Web App with custom service worker caching, in-app install prompts, and **Web Share Target API** integration (`/?shared=true`), allowing native Android/iOS mobile apps to share files and links directly into BlinkDrop via the OS share sheet.

### 6. ☀️ Screen Wake Lock API
* Binds to the **Screen Wake Lock API** (`navigator.wakeLock`) during active transfers, preventing mobile OS screen sleep, radio chip throttling, and dropped WebRTC connections, with automatic re-acquisition on tab visibility changes.

### 7. 📜 Persistent Transfer History Drawer
* Dedicated slide-over drawer powered by IndexedDB logging every completed transfer (direction, size, timestamp, speed in MB/s, and SHA-256 integrity check status) with zero cloud dependency.

### 8. 🎨 Cyber-Glassmorphic Adaptive UI
* Deep cosmic obsidian design (`#030712`) with frosted glass cards, edge-to-edge desktop header, dynamic viewport height (`100dvh`) for zero mobile address bar clipping, and responsive AirDrop radar view.

---

## 🏗️ System Architecture & Protocol Flow

```
[ Sender Device ]                                      [ Receiver Device ]
       |                                                        |
       | <======== 1. SDP Offer/Answer (Socket.IO) ===========> |
       | <======== 2. ICE Candidate Resolution (STUN/TURN) ====> |
       |                                                        |
       | == 3. Direct WebRTC SCTP DataChannel Established =====> |
       |                                                        |
       | ------- File Header Packet (Meta + SHA-256) ---------> |
       |                                                        | (Checks IndexedDB for session)
       | <------ Resume ACK Request (StartOffset / Chunks) ----- | (If adhoori file found)
       |                                                        |
       | ======= 4. Stream 64KB Binary Chunks =================> | ===> FileSystemWritableStream
       |            (Backpressure: bufferedamountlow)           |      (Direct to Disk / NVMe)
       |                                                        |
       |                                                        | (Periodic 1MB Checkpoint in IndexedDB)
       |                                                        |
       | ------- Complete Packet (Finalize Stream) -----------> | ===> Compute SHA-256 Checksum
       |                                                        | ===> Bit-Perfect Verified ✅
       |                                                        | ===> Save Log to History Store
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion |
| **P2P Networking** | WebRTC (`RTCPeerConnection`, `RTCDataChannel`), STUN (Google), TURN (Metered OpenRelay) |
| **Storage & Persistence** | Browser IndexedDB API (`blinkdrop_db`), File System Access API |
| **Security & Crypto** | Web Crypto API (`crypto.subtle.digest` SHA-256), SCTP CRC32, Sanitization |
| **Device & Hardware APIs**| Screen Wake Lock API, Web Share Target API, Service Workers (PWA) |
| **Signaling Server** | Node.js, Express 5, Socket.IO, TypeScript |
| **Deployment** | Vercel (Frontend Client), Render / Railway (Signaling Node) |

---

## 📁 Repository Structure

```text
.
├── client/                     # React 19 + TypeScript + Vite frontend
│   ├── public/
│   │   ├── favicon.svg         # Custom BlinkDrop electric squircle brand icon
│   │   ├── manifest.json       # PWA manifest with Web Share Target
│   │   └── sw.js               # Service Worker for offline app caching
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx      # Edge-to-edge header with live status & History trigger
│   │   │   ├── Radar.tsx       # Dynamic responsive radar canvas with orbit nodes
│   │   │   ├── DropZone.tsx    # Drag-and-drop file staging & Quick Text beam
│   │   │   ├── HistoryDrawer.tsx # Slide-over IndexedDB persistent transfer history
│   │   │   ├── TransferModal.tsx # Progress modal with Pause/Resume & Delta-Sync badge
│   │   │   ├── QRModal.tsx     # QR pairing dialog with copyable room link
│   │   │   ├── ScannerModal.tsx# In-app camera scanner & manual code entry
│   │   │   ├── IncomingModal.tsx# Transfer prompt with File System picker trigger
│   │   │   └── TextModal.tsx   # P2P instant clipboard / URL receiver
│   │   ├── services/
│   │   │   └── webrtc.ts       # WebRTCManager (SCTP channels, flow control, resumable sync)
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces (Packets, Peers, Meta, Sessions)
│   │   └── utils/
│   │       ├── storage.ts      # IndexedDB engine (sessions store & history store)
│   │       ├── crypto.ts       # Hardware-accelerated SHA-256 checksum utility
│   │       ├── wakeLock.ts     # Screen Wake Lock API manager
│   │       └── helpers.ts      # Chunk sizing, byte formatters, filename sanitizers
│   └── index.html              # HTML5 entry with PWA tags & theme colors
├── server/                     # Node.js + Express + Socket.IO signaling relay
│   └── src/index.ts            # Ephemeral room routing, ICE relay, IP rate-limiting
└── README.md                   # Project documentation & engineering specs
```

---

## 📦 Getting Started (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/deveshups-ux/blinkdrop.git
cd blinkdrop

# Install both backend & frontend
npm --prefix server install
npm --prefix client install
```

### 2. Configure Environment Variables (Optional)
Copy `client/.env.example` to `client/.env` if you want custom endpoints:
```env
# Signaling Server URL (defaults to localhost:5000 in dev)
VITE_SIGNALING_URL=http://localhost:5000

# Optional: Dedicated Metered.ca TURN credentials for strict NAT traversal
# VITE_TURN_SERVER_URL=turn:a.relay.metered.ca:443
# VITE_TURN_USERNAME=your_username
# VITE_TURN_CREDENTIAL=your_password
```

### 3. Run Locally
In two separate terminals:

```bash
# Terminal 1: Signaling Server (Port 5000)
npm run server

# Terminal 2: Vite Client (Port 5173)
npm run client
```

Open `http://localhost:5173` in two browser tabs or scan the QR code from your phone on the same Wi-Fi network!

---

## 🎙️ Engineering Interview Highlights (Cheat Sheet)

If discussing this project in a Software Engineering interview:

1. **Why WebRTC SCTP instead of WebSockets?**  
   WebSockets force data through a central server, causing $O(N)$ infrastructure bandwidth costs and privacy vulnerabilities. WebRTC SCTP DataChannels establish direct peer-to-peer tunnels with zero intermediate storage and line-rate local Wi-Fi speeds.
2. **How did you prevent Out-Of-Memory (OOM) crashes on 10 GB+ files?**  
   Standard browser applications store received chunks in an in-memory `Blob` in the V8 heap, crashing when files exceed ~1.5 GB. BlinkDrop pipes binary chunks directly to the host storage drive via the File System Access API's `FileSystemWritableFileStream` with a sequential Promise queue, maintaining a constant memory footprint under 35 MB.
3. **How does the Resumable Chunk Protocol work?**  
   BlinkDrop maintains sparse chunk checkpoints in browser **IndexedDB**. When a connection drops and re-establishes, the receiver dispatches an ACK packet with its written offset. The sender delta-slices the file (`file.slice(offset)`), and the receiver repositions the write cursor (`stream.seek(offset)`), skipping already transferred data completely.
4. **How do you handle network backpressure?**  
   Sender monitors `dataChannel.bufferedAmount`. If the buffer exceeds 512 KB, chunk reading pauses until the network hardware triggers the `bufferedamountlow` event (64 KB threshold), eliminating packet drops and buffer bloat.

---

## 📄 License

Distributed under the MIT License. Built with ❤️ by [Devesh](https://github.com/deveshups-ux).
