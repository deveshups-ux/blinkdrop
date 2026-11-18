import React from 'react';
import { motion } from 'framer-motion';
import { FileDown, Check, X, File, HardDrive } from 'lucide-react';
import type { BatchMeta } from '../types';
import { formatBytes, isFileSystemAccessSupported } from '../utils/helpers';

interface IncomingModalProps {
  request: { senderSocketId: string; batchMeta: BatchMeta } | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingModal: React.FC<IncomingModalProps> = ({ request, onAccept, onDecline }) => {
  if (!request) return null;

  const { batchMeta } = request;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm rounded-3xl bg-[#0b1120] border border-white/[0.1] p-6 shadow-2xl flex flex-col items-center"
      >
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-cyan-500/15 blur-2xl pointer-events-none" />

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
          <FileDown className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">Incoming Transfer Request</h3>
        <p className="text-xs text-gray-400 text-center mt-1 mb-4">
          A nearby peer wants to beam {batchMeta.totalFiles} {batchMeta.totalFiles === 1 ? 'file' : 'files'} directly to your device.
        </p>

        {/* Batch Summary & List Preview */}
        <div className="w-full bg-[#050914] border border-white/[0.08] rounded-2xl p-3.5 mb-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] text-xs font-semibold">
            <span className="text-gray-200">{batchMeta.totalFiles} {batchMeta.totalFiles === 1 ? 'file' : 'files'}</span>
            <span className="text-cyan-400 font-mono">{formatBytes(batchMeta.totalBytes)}</span>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar text-xs">
            {batchMeta.files.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center justify-between text-gray-300 py-0.5">
                <div className="flex items-center gap-2 truncate max-w-[70%]">
                  <File className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="font-mono text-[11px] text-gray-500 shrink-0">
                  {formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Streaming Mode Notice */}
        {isFileSystemAccessSupported() ? (
          <div className="w-full flex items-center gap-2 mb-4 px-3.5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300">
            <HardDrive className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Zero-RAM Disk Stream: You can pick target directory upon accepting.</span>
          </div>
        ) : (
          <div className="w-full flex items-center gap-2 mb-4 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-gray-400">
            <FileDown className="w-4 h-4 shrink-0 text-gray-400" />
            <span>Direct browser download trigger active.</span>
          </div>
        )}

        <div className="w-full flex items-center gap-2.5">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-gray-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <button
            type="button"
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Accept Transfer</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
