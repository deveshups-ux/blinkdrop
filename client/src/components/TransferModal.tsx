import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Zap, Files, HardDrive, Sun, ShieldCheck, ShieldAlert, Pause, Play, RefreshCw } from 'lucide-react';
import type { TransferProgress } from '../types';
import { formatBytes } from '../utils/helpers';
import { wakeLockManager } from '../utils/wakeLock';
import { formatHashPreview } from '../utils/crypto';

interface TransferModalProps {
  transfer: TransferProgress | null;
  onClose: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ transfer, onClose, onPause, onResume }) => {
  if (!transfer) return null;

  const isSending = transfer.type === 'sending';
  const isDone = transfer.status === 'completed';
  const isPaused = transfer.status === 'paused';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="relative w-full max-w-md rounded-3xl bg-[#0b1120] border border-white/[0.1] p-6 shadow-2xl overflow-hidden"
        >
          {/* Subtle Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/15 blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isDone
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : isPaused
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : isSending
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isPaused ? (
                  <Pause className="w-5 h-5" />
                ) : isSending ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownLeft className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {isDone
                    ? `Transferred ${transfer.totalFiles} ${transfer.totalFiles === 1 ? 'file' : 'files'}!`
                    : isPaused
                    ? 'Transfer Paused'
                    : isSending
                    ? 'Beaming Files (P2P)...'
                    : 'Receiving Files (P2P)...'}
                </h3>
                <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  {isPaused ? 'Waiting to Resume' : transfer.speed}
                </p>
              </div>
            </div>

            {/* Batch Pill */}
            <div className="flex flex-col items-end">
              <span className="text-lg font-bold font-mono text-cyan-400">
                {transfer.totalBatchProgress}%
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Files className="w-2.5 h-2.5" />
                File {transfer.currentFileIndex} of {transfer.totalFiles}
              </span>
            </div>
          </div>

          {/* Resumable Chunk Recovery Pill */}
          {Boolean(transfer.resumedFromBytes && transfer.resumedFromBytes > 0) && (
            <div className="mb-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300">
              <span className="flex items-center gap-1.5 font-medium">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Delta Sync: Auto-Resumed from {transfer.resumedFromPercent}%</span>
              </span>
              <span className="font-mono text-[10px] text-gray-400">
                ({formatBytes(transfer.resumedFromBytes || 0)} preserved)
              </span>
            </div>
          )}

          {/* Mode Pill for Zero-RAM vs Memory Buffer */}
          {transfer.type === 'receiving' && (
            <div className="mb-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#050914] border border-white/[0.08] text-[11px]">
              <span className="text-gray-400">Streaming Engine</span>
              {transfer.isStreamingToDisk ? (
                <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Direct Disk Stream (0-RAM)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <Files className="w-3.5 h-3.5 text-amber-400" />
                  <span>In-Memory Buffer (Blob)</span>
                </span>
              )}
            </div>
          )}

          {/* Wake Lock Active Indicator */}
          {wakeLockManager.isSupported() && !isDone && (
            <div className="mb-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px]">
              <span className="text-gray-400">Power Lock</span>
              <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Screen Kept Awake</span>
              </span>
            </div>
          )}

          {/* SHA-256 Cryptographic Integrity Badge */}
          {transfer.hash && (
            <div className="mb-3 flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#050914] border border-white/[0.08] text-[11px]">
              <span className="text-gray-400">Integrity Hash</span>
              {transfer.verificationFailed ? (
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Checksum Mismatch!</span>
                </span>
              ) : transfer.isVerified ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium" title={transfer.hash}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SHA-256 Bit-Perfect ({formatHashPreview(transfer.hash)})</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-cyan-300 font-mono text-[10px]">
                  <span>SHA: {formatHashPreview(transfer.hash)}</span>
                </span>
              )}
            </div>
          )}

          {/* Current File Card */}
          <div className="bg-[#050914] rounded-2xl p-3.5 border border-white/[0.08] mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white truncate max-w-[260px]">
                {transfer.fileName}
              </p>
              <span className="text-xs font-mono text-cyan-400 shrink-0">
                {transfer.progress}%
              </span>
            </div>

            {/* Current File Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden my-2.5">
              <motion.div
                className={`h-full rounded-full ${isPaused ? 'bg-amber-400' : 'bg-cyan-400'}`}
                style={{ width: `${transfer.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Current: {formatBytes(transfer.bytesTransferred)} / {formatBytes(transfer.fileSize)}</span>
              <span>Total: {formatBytes(transfer.totalBytesTransferred)} / {formatBytes(transfer.totalBatchBytes)}</span>
            </div>
          </div>

          {/* Total Overall Batch Progress Bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
              <span>Overall Batch Progress</span>
              <span className="font-mono text-cyan-300">{transfer.totalBatchProgress}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all duration-150 ${
                  isDone
                    ? 'bg-emerald-500'
                    : isPaused
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600'
                }`}
                style={{ width: `${transfer.totalBatchProgress}%` }}
              />
            </div>
          </div>

          {/* Action Row */}
          {isDone ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              Completed
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <button
                    onClick={onResume}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Resume Transfer</span>
                  </button>
                ) : (
                  <button
                    onClick={onPause}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Pause className="w-3.5 h-3.5 fill-gray-300" />
                    <span>Pause</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Hide
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 animate-pulse">
                {isPaused
                  ? 'Transfer is paused. Progress is safely saved in IndexedDB.'
                  : 'Beaming directly over local WebRTC pipe. Keep this tab open.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
