import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Copy, Check, Shield, Layers, Calendar, User, Zap, Activity, Grid } from 'lucide-react';
import { NormieItem } from '../types';
import { fetchNormieVersions, fetchNormieCanvasDiff, fetchZombieTokenHistory, NormieVersion, CanvasDiff, ZombieConversion, fetchNormieDetail } from '../data';
import { usePrivy } from '../lib/privy';

interface NormieDetailDrawerProps {
  normie: NormieItem | null;
  onClose: () => void;
}

export default function NormieDetailDrawer({ normie, onClose }: NormieDetailDrawerProps) {
  const { authenticated, user } = usePrivy();
  const walletConnected = authenticated && user;

  const displayAddress = (addr: string) => {
    if (!addr) return 'Guest';
    const userAddr = user?.wallet?.address;
    if (userAddr && addr.toLowerCase() === userAddr.toLowerCase()) {
      return 'You';
    }
    if (addr.length > 10) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return addr;
  };

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'canvas' | 'traits' | 'activity'>('overview');

  const [versions, setVersions] = useState<NormieVersion[]>([]);
  const [canvasDiff, setCanvasDiff] = useState<CanvasDiff | null>(null);
  const [zombieHistory, setZombieHistory] = useState<ZombieConversion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fullNormie, setFullNormie] = useState<NormieItem | null>(null);

  useEffect(() => {
    if (!normie) return;
    let active = true;
    async function loadAll() {
      setLoading(true);
      try {
        const [vData, cData, zData, detailedItem] = await Promise.all([
          fetchNormieVersions(normie.id),
          fetchNormieCanvasDiff(normie.id),
          normie.status === 'Zombie' ? fetchZombieTokenHistory(normie.id) : Promise.resolve([]),
          fetchNormieDetail(normie.id)
        ]);
        if (active) {
          setVersions(vData);
          setCanvasDiff(cData);
          setZombieHistory(zData);
          if (detailedItem) {
            setFullNormie(detailedItem);
          } else {
            setFullNormie(normie);
          }
        }
      } catch (err) {
        console.warn('Error fetching detail drawer active data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAll();
    return () => {
      active = false;
      setFullNormie(null);
    };
  }, [normie?.id, normie?.status]);

  const handleCopy = () => {
    const currentNormie = fullNormie ?? normie;
    if (!currentNormie) return;
    navigator.clipboard.writeText(currentNormie.owner);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ts: any) => {
    if (!ts) return 'Unknown';
    const num = parseInt(ts);
    if (isNaN(num)) return ts.toString();
    const ms = num < 3000000000 ? num * 1000 : num;
    return new Date(ms).toLocaleString();
  };

  const getRelativeTime = (ts: any) => {
    if (!ts) return '—';
    const num = parseInt(ts);
    if (isNaN(num)) return ts.toString();
    const ms = num < 3000000000 ? num * 1000 : num;
    const secondsAgo = Math.floor((Date.now() - ms) / 1000);
    if (secondsAgo < 0) return 'Just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
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

  const currentNormie = fullNormie ?? normie;

  const statusColorMap = {
    Active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500', label: 'Active on-chain' },
    Zombie: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', dot: 'bg-amber-500', label: 'Zombie conversion' },
    Legendary: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20', dot: 'bg-purple-500', label: 'Legendary aura sync' },
    Burned: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', dot: 'bg-red-500', label: 'Ecosystem burned' },
  };

  const statusStyle = statusColorMap[currentNormie.status] || statusColorMap.Active;

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
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Normie Details</span>
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
                  src={currentNormie.imageUrl} 
                  alt={currentNormie.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating tags */}
                <div className="absolute top-2.5 left-2.5 bg-black/85 px-2 py-0.5 rounded text-[8px] font-mono border border-zinc-800 text-zinc-300">
                  RANK #{currentNormie.rank}
                </div>
                <div className={`absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[8px] font-mono border font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {currentNormie.status.toUpperCase()}
                </div>
              </div>

              {/* Rarity and Stats Column */}
              <div className="w-full mt-6 space-y-4">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 text-center md:text-left">Decoded Normie Identity</h3>
                <h2 className="text-xl font-bold font-sans text-white mt-1 text-center md:text-left">#{currentNormie.id}</h2>
                <div className="text-xs text-zinc-400 mt-1 text-center md:text-left">{currentNormie.name}</div>

                <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-zinc-800/80">
                  <div className="bg-[#111113]/50 border border-zinc-800/60 p-2.5 rounded-lg">
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Level</span>
                    <span className="text-sm font-bold font-mono text-white mt-0.5 block">{currentNormie.level}</span>
                  </div>
                  <div className="bg-[#111113]/50 border border-zinc-800/60 p-2.5 rounded-lg">
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Rarity Score</span>
                    <span className="text-sm font-bold font-mono text-purple-400 mt-0.5 block">{currentNormie.score}</span>
                  </div>
                </div>

                <div className="bg-[#111113]/50 border border-zinc-800/60 p-3 rounded-lg space-y-1.5">
                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Current Owner Address</span>
                  <div className="flex items-center justify-between text-[11px] font-mono text-white">
                    <span className="truncate max-w-[140px]" title={currentNormie.owner}>
                      {displayAddress(currentNormie.owner)}
                    </span>
                    <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-colors ml-1 shrink-0">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <a 
                    href={`https://etherscan.io/nft/0x9eb6e2025b64f340691e424b7fe7022ffde12438/${currentNormie.id}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[9px] text-zinc-400 hover:text-white font-mono flex items-center gap-1 mt-2.5 w-fit hover:underline"
                  >
                    <span>On-Chain Verification</span>
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
                    <div className="bg-[#111113]/40 border border-zinc-800/80 p-3.5 rounded-lg">
                      <span className="block text-[8px] font-mono text-zinc-500 uppercase">Normie Status</span>
                      <span className={`text-xs font-semibold ${statusStyle.text} mt-1 block flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} animate-pulse`} />
                        <span>{statusStyle.label}</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">About this Entity</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        This Normie #{currentNormie.id} ({currentNormie.name}) metadata package is indexed from the Ethereum ERC-721 contract. The pixel map records represent the history of canvas modifications, active level {currentNormie.level} states, and dynamic transform actions logged across Ponder indexer nodes.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Attributes Decoding</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {currentNormie.traits.map((trait, idx) => (
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
                    {loading ? (
                      <div className="text-xs font-mono text-zinc-500 animate-pulse">Loading provenance records...</div>
                    ) : versions.length === 0 ? (
                      <div className="text-xs font-mono text-zinc-500">No provenance versions indexed on-chain.</div>
                    ) : (
                      <div className="relative pl-4 border-l border-zinc-800 space-y-6">
                        {versions.map((version, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-zinc-800 bg-[#09090B]" />
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-sans font-semibold text-white">
                                {idx === versions.length - 1 ? 'Original Mint' : `Canvas customized`}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500">{formatTime(version.timestamp)}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-1 flex flex-col gap-0.5">
                              <span>Operator: {displayAddress(version.transformer)}</span>
                              <span className="text-[9px] text-zinc-500 uppercase truncate">TX: {version.transactionHash || '—'}</span>
                              {version.changeCount !== undefined && (
                                <span className="text-[9px] text-zinc-500">Changes: {version.changeCount} pixels</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CANVAS MODIFICATIONS */}
                {activeTab === 'canvas' && (
                  <div className="space-y-6">
                    <div className="bg-[#111113]/40 border border-zinc-800/80 p-4 rounded-lg flex items-center gap-4">
                      <Grid className="w-8 h-8 text-emerald-500" />
                      <div>
                        <h4 className="text-xs font-bold text-white font-sans">Canvas State Map</h4>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">Entity has active canvas overrides registered under {displayAddress(currentNormie.owner)}.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Pixel Transform Stats</h4>
                      {loading ? (
                        <div className="text-xs font-mono text-zinc-500 animate-pulse">Loading canvas stats...</div>
                      ) : canvasDiff ? (
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="bg-[#111113]/50 border border-zinc-800/50 p-3 rounded-lg text-center">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Added</span>
                            <span className="text-sm font-bold font-mono text-emerald-400 mt-1 block">+{canvasDiff.added}</span>
                          </div>
                          <div className="bg-[#111113]/50 border border-zinc-800/50 p-3 rounded-lg text-center">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Removed</span>
                            <span className="text-sm font-bold font-mono text-red-400 mt-1 block">-{canvasDiff.removed}</span>
                          </div>
                          <div className="bg-[#111113]/50 border border-zinc-800/50 p-3 rounded-lg text-center">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Net Change</span>
                            <span className="text-sm font-bold font-mono text-white mt-1 block">
                              {canvasDiff.net > 0 ? `+${canvasDiff.net}` : canvasDiff.net}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-zinc-500">No pixel transform stats available for this token.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: DETAILED TRAITS RARITY */}
                {activeTab === 'traits' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Rarity Breakdown</h4>
                    <div className="space-y-3">
                      {currentNormie.traits.map((trait, idx) => (
                        <div key={idx} className="bg-[#111113]/40 border border-zinc-800/80 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-mono text-zinc-500 uppercase block">{trait.trait_type}</span>
                            <span className="text-xs font-bold text-white mt-1 block">{trait.value}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-purple-400 block">{trait.rarity}</span>
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">
                              {trait.ic !== undefined ? `Index Score: +${trait.ic}` : 'rarity index'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: RECENT LOGS */}
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Recent On-Chain Activity</h4>
                    {loading ? (
                      <div className="text-xs font-mono text-zinc-500 animate-pulse">Loading activity logs...</div>
                    ) : (
                      (() => {
                        const blendedActivities = [
                          ...versions.map(v => ({
                            type: 'canvas_updated',
                            title: 'Canvas Customized',
                            timestamp: typeof v.timestamp === 'string' ? parseInt(v.timestamp) : v.timestamp,
                            address: v.transformer,
                            hash: v.transactionHash,
                            details: v.changeCount !== undefined ? `Modified ${v.changeCount} pixels` : 'Customized canvas'
                          })),
                          ...zombieHistory.map(z => ({
                            type: 'zombie_conversion',
                            title: 'Zombie Conversion',
                            timestamp: typeof z.timestamp === 'string' ? parseInt(z.timestamp) : z.timestamp,
                            address: z.transformer,
                            hash: z.transactionHash,
                            details: 'Infected by the zombie horde'
                          }))
                        ].sort((a, b) => b.timestamp - a.timestamp);

                        if (blendedActivities.length === 0) {
                          return <div className="text-xs font-mono text-zinc-500">No on-chain activity indexed yet for this token.</div>;
                        }

                        return (
                          <div className="space-y-2 font-mono text-[11px]">
                            {blendedActivities.map((act, idx) => (
                              <div key={idx} className="bg-[#111113]/30 border border-zinc-800/40 p-2.5 rounded flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${act.type === 'zombie_conversion' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                    <span className="text-white font-bold">{act.title}</span>
                                  </div>
                                  <span className="text-zinc-500 text-[10px]">{formatTime(act.timestamp)}</span>
                                </div>
                                <span className="text-zinc-400">{act.details}</span>
                                <div className="text-[9px] text-zinc-500 flex flex-wrap gap-x-2">
                                  <span>By: {displayAddress(act.address)}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]" title={act.hash}>TX: {act.hash || '—'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

              </div>

            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
