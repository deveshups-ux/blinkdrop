import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, Send, Files, MessageSquare, Clipboard, Trash2, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Peer } from '../types';
import { formatBytes } from '../utils/helpers';

interface DropZoneProps {
  selectedPeer: Peer | null;
  onSendFiles: (peer: Peer, files: File[]) => void;
  onSendText: (peer: Peer, text: string) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ selectedPeer, onSendFiles, onSendText }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'text'>('files');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [quickText, setQuickText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragOver(true);
    } else if (e.type === 'dragleave') {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendFiles = () => {
    if (selectedPeer && selectedFiles.length > 0) {
      onSendFiles(selectedPeer, selectedFiles);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Text Handlers
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuickText((prev) => (prev ? `${prev}\n${text}` : text));
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleSendText = () => {
    if (selectedPeer && quickText.trim()) {
      onSendText(selectedPeer, quickText.trim());
      setQuickText('');
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full max-w-4xl mx-auto mt-5 sm:mt-6 transition-all">
      {/* Segmented Mode Switcher */}
      <div className="flex items-center justify-center mb-3">
        <div className="flex bg-[#0b1120]/90 p-1 rounded-2xl border border-white/[0.08] shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'files'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Files className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Beam Files</span>
            {selectedFiles.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                {selectedFiles.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Instant Text & Links</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Files Mode */}
      {activeTab === 'files' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />

          {selectedFiles.length === 0 ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-xl ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-2xl shadow-cyan-500/20'
                  : 'border-white/[0.1] hover:border-cyan-500/40 bg-[#0b1120]/60 hover:bg-[#0e1628]/80 shadow-xl'
              }`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-3 shadow-lg shadow-cyan-500/10">
                <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-100 text-center">
                Drag & drop files here, or{' '}
                <span className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/50">
                  browse files
                </span>
              </p>
              <p className="text-xs text-gray-400 text-center mt-1.5 flex flex-wrap items-center justify-center gap-2">
                <span>Zero-RAM Disk Stream</span>
                <span>•</span>
                <span>Unlimited Size</span>
                <span>•</span>
                <span>Bit-Perfect Integrity</span>
              </p>
            </div>
          ) : (
            <div className="bg-[#0b1120]/90 border border-white/[0.1] rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-2xl">
              {/* Header Summary */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Files className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} staged
                    </p>
                    <p className="text-xs text-gray-400 font-mono">Total payload: {formatBytes(totalBytes)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors"
                  >
                    + Add files
                  </button>
                  <button
                    type="button"
                    onClick={clearAllFiles}
                    className="text-xs text-gray-400 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* Files List Preview */}
              <div className="max-h-40 overflow-y-auto py-2.5 space-y-1.5 custom-scrollbar">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#050914]/80 border border-white/[0.06] text-xs hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                      <File className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-gray-200 truncate font-medium">{file.name}</span>
                      <span className="text-gray-500 font-mono text-[11px] shrink-0">
                        ({formatBytes(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Row */}
              <div className="pt-3.5 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Direct peer-to-peer delivery
                </span>

                {selectedPeer ? (
                  <button
                    type="button"
                    onClick={handleSendFiles}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      Beam {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} to {selectedPeer.deviceName}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span>Select a device above on the radar to beam</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Quick Text / Link Mode */}
      {activeTab === 'text' && (
        <div className="bg-[#0b1120]/90 border border-white/[0.1] rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Instant Text & Clipboard Beam</p>
                <p className="text-xs text-gray-400">Beam links, OTPs, snippets, or notes in real-time</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-xs text-cyan-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all font-medium"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paste</span>
              </button>
              {quickText && (
                <button
                  type="button"
                  onClick={() => setQuickText('')}
                  className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="py-3.5">
            <textarea
              rows={4}
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="Paste a URL (https://...), credentials, Wi-Fi keys, or code snippets to beam directly to peer..."
              className="w-full rounded-2xl bg-[#050914]/90 border border-white/[0.08] p-3.5 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 resize-none font-mono"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-gray-500 font-mono">
              {quickText.length} characters
            </span>

            {selectedPeer ? (
              <button
                type="button"
                disabled={!quickText.trim()}
                onClick={handleSendText}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg active:scale-95 ${
                  quickText.trim()
                    ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 cursor-pointer'
                    : 'bg-white/[0.05] text-gray-500 cursor-not-allowed border border-white/[0.05]'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Beam Text to {selectedPeer.deviceName}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span>Select a device above on the radar to beam</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
