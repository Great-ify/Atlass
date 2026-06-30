import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Copy, Check, Shield, Layers, Calendar, User, Zap } from 'lucide-react';
import { NormieItem } from '../types';
import { getNormieTimeline } from '../data';

interface NormieDetailsModalProps {
  normie: NormieItem | null;
  onClose: () => void;
}

export default function NormieDetailsModal({ normie, onClose }: NormieDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const timeline = normie ? getNormieTimeline(normie.id) : [];

  const handleCopy = () => {
    if (!normie) return;
    navigator.clipboard.writeText(normie.owner);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!normie) return null;

  const statusColorMap = {
    Active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    Zombie: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
    Legendary: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
    Burned: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  };

  const statusStyle = statusColorMap[normie.status] || statusColorMap.Active;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#111113] border border-atlas-border rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row h-full max-h-[85vh] md:h-auto"
        >
          {/* Close trigger */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-atlas-secondary hover:text-atlas-primary transition-colors p-1.5 rounded-lg border border-transparent hover:border-atlas-border bg-atlas-surface z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Side Column - Aesthetic Avatar Portrait */}
          <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-atlas-border bg-atlas-bg/40 p-6 flex flex-col items-center justify-center relative">
            <div className="relative aspect-square w-full max-w-[260px] rounded-lg overflow-hidden border border-atlas-border bg-atlas-surface group">
              <img 
                src={normie.imageUrl} 
                alt={normie.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Rarity Rank Floating Pill */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono font-medium text-atlas-primary">
                RANK #{normie.rank}
              </div>

              {/* Status floating badge */}
              <div className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-md border text-[10px] font-mono font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                {normie.status.toUpperCase()}
              </div>
            </div>

            {/* Quick Stats Grid under Image */}
            <div className="w-full max-w-[260px] mt-6 grid grid-cols-2 gap-3">
              <div className="bg-atlas-surface p-2.5 rounded-lg border border-atlas-border">
                <div className="text-[10px] text-atlas-secondary font-mono">LEVEL</div>
                <div className="text-sm font-mono font-semibold text-atlas-primary mt-0.5">{normie.level}</div>
              </div>
              <div className="bg-atlas-surface p-2.5 rounded-lg border border-atlas-border">
                <div className="text-[10px] text-atlas-secondary font-mono">INTELLIGENCE SCORE</div>
                <div className="text-sm font-mono font-semibold text-atlas-primary mt-0.5 flex items-center gap-1">
                  <span>{normie.score}%</span>
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Column - Comprehensive Metadata Profiles */}
          <div className="w-full md:w-3/5 p-6 flex flex-col overflow-y-auto">
            
            {/* Header Identity */}
            <div className="border-b border-atlas-border/50 pb-5">
              <div className="text-xs font-mono text-atlas-secondary flex items-center gap-1.5 uppercase tracking-wider">
                <span>Normies Intelligence Node</span>
                <span className="w-1 h-1 rounded-full bg-atlas-border" />
                <span className="text-[10px] text-atlas-secondary/70">ID: {normie.id}</span>
              </div>
              <h2 className="text-2xl font-bold font-sans text-atlas-primary mt-1 tracking-tight">
                {normie.name}
              </h2>

              {/* Owner Vault */}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono text-atlas-secondary">
                <div className="flex items-center gap-2 bg-atlas-surface border border-atlas-border px-3 py-1.5 rounded-lg">
                  <User className="w-3.5 h-3.5 text-atlas-secondary" />
                  <span className="text-[11px] text-atlas-primary">{normie.owner}</span>
                  <button 
                    onClick={handleCopy}
                    className="hover:text-atlas-primary transition-colors pl-1.5 border-l border-atlas-border/60"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center gap-1 text-zinc-500 hover:text-atlas-primary cursor-pointer transition-colors text-[11px] border border-transparent hover:border-atlas-border px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-atlas-surface">
                  <span>Etherscan</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Traits Grid */}
            <div className="mt-6">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-atlas-primary uppercase tracking-wider mb-3">
                <Layers className="w-4 h-4 text-atlas-secondary" />
                <span>On-Chain Attributes & Traits</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {normie.traits.map((trait, idx) => (
                  <div 
                    key={`trait-${idx}`} 
                    className="bg-atlas-surface/60 border border-atlas-border/60 rounded-lg p-2.5 flex flex-col justify-between transition-colors hover:bg-atlas-surface hover:border-atlas-border"
                  >
                    <span className="text-[9px] text-atlas-secondary uppercase font-mono tracking-wide">{trait.trait_type}</span>
                    <span className="text-xs font-sans font-semibold text-atlas-primary mt-1 truncate">{trait.value}</span>
                    <span className="text-[9px] font-mono text-zinc-500 mt-2 flex items-center justify-between">
                      <span>Rarity</span>
                      <span className="text-atlas-primary font-medium">{trait.rarity}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Activity Timeline */}
            <div className="mt-6 border-t border-atlas-border/50 pt-6 pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-atlas-primary uppercase tracking-wider mb-4">
                <Calendar className="w-4 h-4 text-atlas-secondary" />
                <span>On-Chain Provenance Timeline</span>
              </div>
              <div className="relative pl-4 border-l border-atlas-border/60 space-y-5">
                {timeline.map((item, idx) => (
                  <div key={item.id} className="relative">
                    {/* Event bullet point node */}
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-atlas-border bg-atlas-surface" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="text-xs font-sans font-semibold text-atlas-primary">{item.event}</div>
                      <div className="text-[10px] text-zinc-500 font-mono shrink-0">{item.date}</div>
                    </div>
                    <div className="text-[10px] text-atlas-secondary font-mono mt-0.5 flex items-center gap-1.5">
                      <span>By: {item.by}</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-[9px] text-zinc-600 font-mono uppercase bg-atlas-bg px-1 py-0.5 rounded border border-atlas-border/30">TX: {item.hash}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom sticky footer reminder inside modal */}
            <div className="mt-auto pt-4 border-t border-atlas-border/30 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
              <span>INTELLIGENCE ACTIVE</span>
              <span>ATLAS INDEXER V2.0.4</span>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
