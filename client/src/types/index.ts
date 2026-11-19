export interface Peer {
  socketId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  roomId: string;
}

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
  hash?: string; // SHA-256 digital fingerprint
}

export interface BatchMeta {
  batchId: string;
  totalFiles: number;
  totalBytes: number;
  files: FileMeta[];
}

export interface TransferProgress {
  batchId: string;
  currentFileIndex: number; // 1-based index (e.g. 1 of 4)
  totalFiles: number;
  fileId: string;
  fileName: string;
  fileSize: number;
  progress: number; // 0 to 100 for current file
  totalBatchProgress: number; // 0 to 100 for whole batch
  bytesTransferred: number;
  totalBytesTransferred: number;
  totalBatchBytes: number;
  speed: string; // e.g. "14.2 MB/s"
  type: 'sending' | 'receiving';
  status: 'pending' | 'transferring' | 'paused' | 'resuming' | 'completed' | 'cancelled' | 'error';
  isStreamingToDisk?: boolean;
  hash?: string;
  isVerified?: boolean;
  verificationFailed?: boolean;
  resumedFromBytes?: number;
  resumedFromPercent?: number;
}

export interface PacketHeader {
  type: 'header';
  batchId: string;
  fileIndex: number;
  totalFiles: number;
  totalBatchBytes: number;
  batchBytesPrior: number;
  meta: FileMeta;
}

export interface PacketResumeRequest {
  type: 'resume-request';
  batchId: string;
  fileId: string;
  startOffset: number;
  lastChunkIndex: number;
}

export interface PacketPause {
  type: 'pause';
  fileId: string;
}

export interface PacketResume {
  type: 'resume';
  fileId: string;
}

export interface PacketChunk {
  type: 'chunk';
  fileId: string;
  chunkIndex: number;
}

export interface PacketComplete {
  type: 'complete';
  batchId: string;
  fileId: string;
  isLastFile: boolean;
}

export interface PacketQuickText {
  type: 'quick-text';
  textId: string;
  text: string;
  senderName: string;
  timestamp: number;
}
