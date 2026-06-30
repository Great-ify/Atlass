import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Copy, Check, Shield, Layers, Calendar, User, Zap, Activity, Grid } from 'lucide-react';
import { NormieItem } from '../types';
import { getNormieTimeline } from '../data';

interface NormieDetailDrawerProps {
  normie: NormieItem | null;
  onClose: () => void;
}

export default function NormieDetailDrawer({ normie, onClose }: NormieDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'canvas' | 'traits' | 'activity'>('overview');
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
      <div className="fixed inset-0 z-50 flex justify-end">
        
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Side Drawer Content panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-[#09090B] border-l border-zinc-800 h-full flex flex-col z-10 shadow-2xl"
        >
          {/* Top Panel Header */}
          <div className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-6 shrink-0 bg-[#0c0c0e]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Ecosystem Intelligence Node</span>
            </div>
            
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg border border-transparent hover:border-zinc-800 hover:bg-zinc-900/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body - Split Layout */}
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
            
            {/* Left Side: Editorial Profiler */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0b0b0d] p-6 flex flex-col items-center shrink-0">
              <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-zinc-800 bg-[#111113] group">
                <img 
                  src={normie.imageUrl} 
                  alt={normie.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating tags */}
                <div className="absolute top-2.5 left-2.5 bg-black/85 px-2 py-0.5 rounded text-[8px] font-mono border border-zinc-800 text-zinc-300">
                  RANK #{normie.rank}
                </div>
                <div className={`absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[8px] font-mono border font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {normie.status.toUpperCase()}
                </div>
              </div>

              {/* Rarity and Stats Column */}
              <div className="w-full mt-6 space-y-4">
                <div className="text-center md:text-left">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Decoded Token Identity</h3>
                  <h2 className="text-xl font-bold font-sans text-white mt-1">#{normie.id}</h2>
                  <div className="text-xs text-zinc-400 mt-1">{normie.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-zinc-800/80">
                  <div className="bg-[#111113]/50 border border-zinc-800/60 p-2.5 rounded-lg">
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Level</span>
                    <span className="text-sm font-bold font-mono text-white mt-0.5 block">{normie.level}</span>
                  </div>
                  <div className="bg-[#111113]/50 border border-zinc-800/60 p-2.5 rounded-lg">
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Rarity Score</span>
                    <span className="text-sm font-bold font-mono text-purple-400 mt-0.5 block">{normie.score}</span>
                  </div>
                </div>

                <div className="bg-[#111113]/50 border border-zinc-800/60 p-3 rounded-lg space-y-1.5">
                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Current Owner Vault</span>
                  <div className="flex items-center justify-between text-[11px] font-mono text-white">
                    <span className="truncate max-w-[140px]">{normie.owner}</span>
                    <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-colors ml-1 shrink-0">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <a 
                    href={`https://etherscan.io/address/${normie.owner}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[9px] text-zinc-400 hover:text-white font-mono flex items-center gap-1 mt-2.5 w-fit hover:underline"
                  >
                    <span>Etherscan Verification</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Side: Tabbed Advanced Profiler */}
            <div className="flex-1 flex flex-col p-6 min-w-0 bg-[#08080a]">
              
              {/* Horizontal Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-zinc-800/80 pb-3 shrink-0 overflow-x-auto no-scrollbar">
                {(['overview', 'history', 'canvas', 'traits', 'activity'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold transition-all shrink-0 ${
                      activeTab === tab
                        ? 'bg-zinc-800/80 text-white border border-zinc-700/50'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Dynamic Scrollable Panel Content */}
              <div className="flex-1 overflow-y-auto pt-6 min-h-0 space-y-6">
                
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#111113]/40 border border-zinc-800/80 p-3.5 rounded-lg">
                        <span className="block text-[8px] font-mono text-zinc-500 uppercase">Ecosystem Status</span>
                        <span className="text-xs font-semibold text-emerald-400 mt-1 block flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Alive on-chain</span>
                        </span>
                      </div>
                      <div className="bg-[#111113]/40 border border-zinc-800/80 p-3.5 rounded-lg">
                        <span className="block text-[8px] font-mono text-zinc-500 uppercase">Indexing Node</span>
                        <span className="text-xs font-semibold text-white mt-1 block font-mono">Ponder Node #01</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">About this Entity</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        This Normie metadata package is indexed from ERC-721C contract. The pixel map records represent the history of canvas modifications and transform actions logged across Ponder indexer nodes.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Attributes Decoding</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {normie.traits.map((trait, idx) => (
                          <div key={idx} className="bg-[#111113]/60 border border-zinc-800/80 p-2.5 rounded-lg flex flex-col justify-between">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">{trait.trait_type}</span>
                            <span className="text-xs font-semibold text-white mt-1 truncate">{trait.value}</span>
                            <span className="text-[8px] font-mono text-purple-400 mt-2 block">{trait.rarity} Rarity</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PROVENANCE HISTORY */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Provenance Registry</h4>
                    <div className="relative pl-4 border-l border-zinc-800 space-y-6">
                      {timeline.map((item, idx) => (
                        <div key={item.id} className="relative">
                          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-zinc-800 bg-[#09090B]" />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-sans font-semibold text-white">{item.event}</span>
                            <span className="text-[9px] font-mono text-zinc-500">{item.date}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-1.5">
                            <span>Operator: {item.by}</span>
                            <span className="text-zinc-700">|</span>
                            <span className="text-[9px] text-zinc-500 uppercase truncate">TX: {item.hash.substring(0, 10)}...</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: CANVAS MODIFICATIONS */}
                {activeTab === 'canvas' && (
                  <div className="space-y-6">
                    <div className="bg-[#111113]/40 border border-zinc-800/80 p-4 rounded-lg flex items-center gap-4">
                      <Grid className="w-8 h-8 text-emerald-500" />
                      <div>
                        <h4 className="text-xs font-bold text-white font-sans">Canvas State Map</h4>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">Entity has active canvas overrides registered under 0x6495...869c.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Recent Pixel Transforms</h4>
                      <div className="space-y-2 bg-[#111113]/20 border border-zinc-800/80 rounded-lg p-3 divide-y divide-zinc-800/40">
                        <div className="py-2 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-300">Set Pixel at (14, 28) to #FF00FF</span>
                          <span className="text-zinc-500">2 days ago</span>
                        </div>
                        <div className="py-2 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-300">Overlaid attribute: Cowboy Hat</span>
                          <span className="text-zinc-500">1 week ago</span>
                        </div>
                        <div className="py-2 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-300">Init canvas registration</span>
                          <span className="text-zinc-500">1 month ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: DETAILED TRAITS RARITY */}
                {activeTab === 'traits' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Rarity Breakdown</h4>
                    <div className="space-y-3">
                      {normie.traits.map((trait, idx) => (
                        <div key={idx} className="bg-[#111113]/40 border border-zinc-800/80 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-mono text-zinc-500 uppercase block">{trait.trait_type}</span>
                            <span className="text-xs font-bold text-white mt-1 block">{trait.value}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-purple-400 block">{trait.rarity}</span>
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">rarity index</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: RECENT LOGS */}
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Recent Node Operations</h4>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="bg-[#111113]/30 border border-zinc-800/40 p-2.5 rounded flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-zinc-400">SYNC_OK: Parsed metadata block #20240198</span>
                      </div>
                      <div className="bg-[#111113]/30 border border-zinc-800/40 p-2.5 rounded flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-zinc-400">EVENT_EMIT: Registered level change {normie.level - 2} -&gt; {normie.level}</span>
                      </div>
                      <div className="bg-[#111113]/30 border border-zinc-800/40 p-2.5 rounded flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-zinc-400">INDEXER_UPDATE: Decoded traits checksum verification OK</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom footer */}
              <div className="mt-auto pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[8px] font-mono text-zinc-500 shrink-0">
                <span>INDEXED_RECORD_ACTIVE</span>
                <span>ATLAS CORE V1.0.2</span>
              </div>

            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
