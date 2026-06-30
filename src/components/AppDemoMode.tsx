import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Compass, Activity, Shield, Flame, User, Clock, TrendingUp, Eye, 
  Layers, Database, ArrowRight, ArrowUp, ArrowDown, Star, Skull, Sparkles, 
  GitBranch, Wallet, Bell, Settings, LogOut, Check, Zap, Info
} from 'lucide-react';
import { ActivityEvent, MetricItem, NormieItem } from '../types';
import { INITIAL_NORMIES, INITIAL_ACTIVITIES, INITIAL_METRICS, generateRandomEvent, getNormieById } from '../data';
import Sparkline from './Sparkline';

interface AppDemoModeProps {
  onClose: () => void;
  onOpenSearch: () => void;
  onSelectNormie: (normie: NormieItem) => void;
}

export default function AppDemoMode({ onClose, onOpenSearch, onSelectNormie }: AppDemoModeProps) {
  // Connected Wallet State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Simulated dynamic data states
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [metrics, setMetrics] = useState<MetricItem[]>(INITIAL_METRICS);
  const [normies, setNormies] = useState<NormieItem[]>(INITIAL_NORMIES);
  
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'discover' | 'signals' | 'watchlist' | 'settings'>('dashboard');
  
  // Simulator Notifications state
  const [notification, setNotification] = useState<string | null>(null);

  // Connect Wallet Action
  const handleConnectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress('');
      showNotification('Wallet disconnected');
    } else {
      setWalletConnected(true);
      setWalletAddress('0x4f3a...8a7B');
      showNotification('Wallet connected to Atlas Protocol: 0x4f3a...8a7B');
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Trigger simulated events from the interactive "Atlas Node Simulator" control panel
  const triggerSimulatedEvent = (forcedType?: ActivityEvent['type']) => {
    const rawEvent = generateRandomEvent();
    const newEvent: ActivityEvent = forcedType 
      ? { ...rawEvent, type: forcedType, title: forcedType.replace('_', ' ') }
      : rawEvent;

    // Prepend new event
    setActivities(prev => [newEvent, ...prev.slice(0, 9)]);
    showNotification(`New transaction confirmed: ${newEvent.title}`);

    // Dynamically update metrics counts and bump sparklines
    setMetrics(prev => prev.map(m => {
      if (
        (newEvent.type === 'canvas_updated' && m.id === 'canvas_updates') ||
        (newEvent.type === 'zombie_conversion' && m.id === 'zombie_conversions') ||
        (newEvent.type === 'normie_transferred' && m.id === 'normies_transferred') ||
        (newEvent.type === 'legendary_acquired' && m.id === 'legendary_acquired') ||
        (newEvent.type === 'normie_burned' && m.id === 'normies_burned')
      ) {
        // Parse and increment
        const valNum = parseInt(m.value.replace(/,/g, '')) + 1;
        const newSparkData = [...m.sparklineData.slice(1), m.sparklineData[m.sparklineData.length - 1] + Math.floor(Math.random() * 8) - 3];
        return {
          ...m,
          value: valNum.toLocaleString(),
          sparklineData: newSparkData
        };
      }
      return m;
    }));

    // If zombie or legendary, let's update corresponding Normie items if we match IDs
    if (newEvent.type === 'zombie_conversion' || newEvent.type === 'legendary_acquired') {
      setNormies(prev => prev.map(n => {
        if (n.id === newEvent.normieId) {
          return {
            ...n,
            status: newEvent.type === 'zombie_conversion' ? 'Zombie' : 'Legendary',
            updatedAt: 'Just now'
          };
        }
        return n;
      }));
    }
  };

  // Periodic automatic events to make screen feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      // 30% chance of random event every 6 seconds
      if (Math.random() < 0.3) {
        triggerSimulatedEvent();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-atlas-bg flex overflow-hidden font-sans">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#18181B] border border-atlas-border text-xs text-atlas-primary px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-2xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
            <span className="font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SIDEBAR NAVIGATION PANEL */}
      <aside className="w-64 border-r border-atlas-border bg-atlas-surface/80 flex flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="h-16 border-b border-atlas-border flex items-center px-6 gap-3 select-none">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-atlas-primary via-zinc-400 to-zinc-950 flex items-center justify-center border border-white/20">
            <span className="text-[10px] font-bold text-black font-mono">A</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-atlas-primary tracking-wider uppercase font-mono">ATLAS</span>
            <span className="text-[9px] text-zinc-600 font-mono tracking-wide uppercase">Intelligence L1</span>
          </div>
          
          <div className="ml-auto flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-mono border border-emerald-500/10">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Menu Navigation list */}
        <nav className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-colors font-medium ${
              activeTab === 'dashboard' ? 'bg-atlas-bg text-atlas-primary border border-atlas-border' : 'text-atlas-secondary hover:text-atlas-primary hover:bg-atlas-bg/40 border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 text-zinc-500" />
            <span>Overview Live</span>
          </button>

          <button 
            onClick={() => setActiveTab('discover')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-colors font-medium ${
              activeTab === 'discover' ? 'bg-atlas-bg text-atlas-primary border border-atlas-border' : 'text-atlas-secondary hover:text-atlas-primary hover:bg-atlas-bg/40 border border-transparent'
            }`}
          >
            <Compass className="w-4 h-4 text-zinc-500" />
            <span>Discover Normies</span>
          </button>

          <button 
            onClick={() => setActiveTab('signals')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-colors font-medium ${
              activeTab === 'signals' ? 'bg-atlas-bg text-atlas-primary border border-atlas-border' : 'text-atlas-secondary hover:text-atlas-primary hover:bg-atlas-bg/40 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-zinc-500" />
            <span>Signals & Intel</span>
          </button>

          <button 
            onClick={() => setActiveTab('watchlist')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-colors font-medium ${
              activeTab === 'watchlist' ? 'bg-atlas-bg text-atlas-primary border border-atlas-border' : 'text-atlas-secondary hover:text-atlas-primary hover:bg-atlas-bg/40 border border-transparent'
            }`}
          >
            <Star className="w-4 h-4 text-zinc-500" />
            <span>Ecosystem Watchlist</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-colors font-medium ${
              activeTab === 'settings' ? 'bg-atlas-bg text-atlas-primary border border-atlas-border' : 'text-atlas-secondary hover:text-atlas-primary hover:bg-atlas-bg/40 border border-transparent'
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-500" />
            <span>Node Settings</span>
          </button>
        </nav>

        {/* Simulator Tools Section inside Sidebar */}
        <div className="mt-auto p-4 border-t border-atlas-border bg-atlas-bg/40">
          <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold mb-2 tracking-wide flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Protocol Simulator</span>
          </div>
          <div className="space-y-1.5">
            <button 
              onClick={() => triggerSimulatedEvent('canvas_updated')}
              className="w-full bg-[#18181B] border border-atlas-border hover:border-atlas-primary/25 text-left p-1.5 rounded-lg text-[10px] text-atlas-secondary hover:text-atlas-primary transition-all font-mono flex items-center justify-between"
            >
              <span>+ Canvas Update</span>
              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
            </button>
            <button 
              onClick={() => triggerSimulatedEvent('zombie_conversion')}
              className="w-full bg-[#18181B] border border-atlas-border hover:border-atlas-primary/25 text-left p-1.5 rounded-lg text-[10px] text-atlas-secondary hover:text-atlas-primary transition-all font-mono flex items-center justify-between"
            >
              <span>+ Zombie Infect</span>
              <Skull className="w-2.5 h-2.5 text-amber-500" />
            </button>
            <button 
              onClick={() => triggerSimulatedEvent('legendary_acquired')}
              className="w-full bg-[#18181B] border border-atlas-border hover:border-atlas-primary/25 text-left p-1.5 rounded-lg text-[10px] text-atlas-secondary hover:text-atlas-primary transition-all font-mono flex items-center justify-between"
            >
              <span>+ Forge Legendary</span>
              <Shield className="w-2.5 h-2.5 text-purple-500" />
            </button>
          </div>
          <div className="text-[8px] text-zinc-600 font-mono mt-3 text-center">
            Click to fire instant simulated contract events.
          </div>
        </div>

        {/* Exit back to Landing */}
        <div className="p-4 border-t border-atlas-border bg-atlas-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-atlas-secondary font-mono">Sandbox Active</span>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-atlas-primary transition-colors p-1 rounded hover:bg-atlas-bg"
            title="Exit Simulator"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090B]">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-atlas-border flex items-center justify-between px-8 bg-[#111113]">
          
          {/* Universal Search bar clicker */}
          <button 
            onClick={onOpenSearch}
            className="flex items-center gap-3 bg-[#09090B] border border-atlas-border rounded-lg px-3 py-1.5 w-80 text-left text-zinc-500 hover:text-zinc-400 hover:border-zinc-700 transition-all text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1">Search any Normie, wallet, or trait...</span>
            <span className="bg-atlas-surface border border-atlas-border rounded text-[9px] px-1 font-mono text-zinc-500">⌘K</span>
          </button>

          {/* Connected wallet and controls */}
          <div className="flex items-center gap-4">
            
            {/* Simulation Info Note */}
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-atlas-surface/50 px-2.5 py-1.5 rounded-md border border-atlas-border">
              <Info className="w-3 h-3 text-blue-500" />
              <span>Full dashboard mock interface</span>
            </div>

            {/* Simulated Notifications bell */}
            <button 
              onClick={() => showNotification('Notifications up to date. No pending alert events.')}
              className="p-2 rounded-lg border border-atlas-border text-atlas-secondary hover:text-atlas-primary bg-atlas-surface relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </button>

            {/* Connected wallet button */}
            <button 
              onClick={handleConnectWallet}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-300 border ${
                walletConnected 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-atlas-primary text-black hover:bg-opacity-90 border-transparent'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{walletConnected ? '0x4f3a...8a7B' : 'Connect Wallet'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic page contents depending on tabs */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* Dynamic Metrics Panel with Sparklines */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-atlas-secondary font-bold">Ecosystem State Analytics</h3>
                  <span className="text-[10px] text-zinc-600 font-mono">Real-time indicators updated on-chain</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  {metrics.map((item) => (
                    <div key={item.id} className="bg-[#111113] border border-atlas-border rounded-lg p-3.5 flex flex-col justify-between hover:border-atlas-primary/20 transition-all select-none">
                      <div>
                        <div className="text-[10px] text-atlas-secondary font-mono truncate">{item.label}</div>
                        <div className="text-lg font-mono font-bold text-atlas-primary mt-1.5">{item.value}</div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                          item.color === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                          item.color === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                          item.color === 'error' ? 'bg-red-500/10 text-red-500' :
                          item.color === 'legendary' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {item.change}
                        </span>
                        
                        {/* Sparkline canvas graph */}
                        <div className="h-6 w-16 opacity-80 hover:opacity-100 transition-opacity">
                          <Sparkline data={item.sparklineData} color={item.color} width={64} height={20} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Home Landing: Search feed and live details row split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Live Activity Feed */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-atlas-secondary font-bold">Live Activity Feed</h3>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                    <button 
                      onClick={() => triggerSimulatedEvent()}
                      className="text-[10px] text-zinc-500 hover:text-atlas-primary font-mono transition-colors"
                    >
                      Trigger Test Event
                    </button>
                  </div>

                  {/* Feed container */}
                  <div className="bg-[#111113] border border-atlas-border rounded-lg divide-y divide-atlas-border/50 max-h-[460px] overflow-y-auto">
                    {activities.map((act) => {
                      const matchedNormie = getNormieById(act.normieId);
                      return (
                        <div 
                          key={act.id} 
                          onClick={() => onSelectNormie(matchedNormie)}
                          className="p-4 flex items-center justify-between hover:bg-[#18181B] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Color coded icon indicators */}
                            <div className={`p-2 rounded shrink-0 ${
                              act.type === 'canvas_updated' ? 'bg-emerald-500/10 text-emerald-500' :
                              act.type === 'zombie_conversion' ? 'bg-amber-500/10 text-amber-500' :
                              act.type === 'normie_transferred' ? 'bg-blue-500/10 text-blue-500' :
                              act.type === 'legendary_acquired' ? 'bg-purple-500/10 text-purple-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {act.type === 'zombie_conversion' && <Skull className="w-4 h-4" />}
                              {act.type === 'canvas_updated' && <Activity className="w-4 h-4" />}
                              {act.type === 'normie_transferred' && <GitBranch className="w-4 h-4" />}
                              {act.type === 'legendary_acquired' && <Shield className="w-4 h-4" />}
                              {act.type === 'normie_burned' && <Flame className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-atlas-primary flex items-center gap-1.5">
                                <span>{act.normieName}</span>
                                <span className="text-[10px] font-mono text-zinc-500">#{act.normieId}</span>
                              </div>
                              <div className="text-[10px] text-atlas-secondary font-mono mt-0.5 truncate flex items-center gap-1">
                                {act.type === 'normie_transferred' ? (
                                  <span>Transfer: {act.userAddress} → {act.toAddress}</span>
                                ) : (
                                  <span>By: {act.userAddress} • {act.title}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] text-zinc-500 font-mono">{act.timeAgo}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-atlas-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Trending Normies Card Lists */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-atlas-secondary font-bold">Trending Ecosystem Normies</h3>
                    <span className="text-[10px] text-zinc-600 font-mono">Sorted by score</span>
                  </div>

                  <div className="space-y-3">
                    {normies.slice(0, 4).map((normie) => (
                      <div 
                        key={normie.id}
                        onClick={() => onSelectNormie(normie)}
                        className="bg-[#111113] border border-atlas-border rounded-lg p-3.5 hover:border-atlas-primary/20 transition-all cursor-pointer flex items-center gap-3 group"
                      >
                        <img 
                          src={normie.imageUrl} 
                          alt={normie.name} 
                          className="w-12 h-12 rounded object-cover border border-atlas-border group-hover:scale-[1.03] transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-atlas-primary truncate group-hover:text-white">{normie.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1.5">
                            <span>Level {normie.level}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>Rank #{normie.rank}</span>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end">
                          <span className="text-xs font-mono font-bold text-atlas-primary">{normie.score}</span>
                          <span className="text-[8px] text-zinc-600 font-mono">INTEL RATE</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sandbox statistics banner */}
                  <div className="bg-[#18181B] border border-atlas-border p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-atlas-primary">Ready to connect?</div>
                      <div className="text-[10px] text-atlas-secondary font-mono mt-1">Simulate early governance proposals.</div>
                    </div>
                    <button 
                      onClick={() => showNotification('Early voting open for whitelisted wallets only.')}
                      className="bg-atlas-surface hover:bg-atlas-bg border border-atlas-border text-[10px] text-atlas-primary px-2.5 py-1 rounded font-mono transition-colors"
                    >
                      VOTE
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DISCOVER */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-atlas-primary font-sans">Discover Normies Ecosystem</h3>
                <p className="text-xs text-atlas-secondary font-sans mt-1">Filter, sort, and search traits across the entire index of 10,000 items.</p>
              </div>

              {/* Grid with Search filters */}
              <div className="bg-[#111113] border border-atlas-border rounded-lg p-4 flex flex-wrap gap-3">
                <input 
                  type="text" 
                  placeholder="Search traits or level..." 
                  className="bg-[#09090B] border border-atlas-border text-xs rounded px-3 py-1.5 outline-none placeholder:text-zinc-600 w-64 text-atlas-primary"
                />
                <select className="bg-[#09090B] border border-atlas-border text-xs rounded px-3 py-1.5 outline-none text-atlas-secondary">
                  <option>All Types</option>
                  <option>Zombie</option>
                  <option>Legendary</option>
                  <option>Active</option>
                </select>
                <select className="bg-[#09090B] border border-atlas-border text-xs rounded px-3 py-1.5 outline-none text-atlas-secondary">
                  <option>Sort by Rarity</option>
                  <option>Sort by Level</option>
                  <option>Recently Updated</option>
                </select>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {normies.map((normie) => (
                  <div 
                    key={normie.id}
                    onClick={() => onSelectNormie(normie)}
                    className="bg-[#111113] border border-atlas-border rounded-lg overflow-hidden cursor-pointer hover:border-atlas-primary/25 transition-all group flex flex-col"
                  >
                    <div className="relative aspect-square bg-[#18181B] overflow-hidden">
                      <img 
                        src={normie.imageUrl} 
                        alt={normie.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 text-[8px] bg-black/75 px-1.5 py-0.5 rounded font-mono border border-white/5">
                        #{normie.id}
                      </span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-atlas-primary truncate mt-0.5">{normie.name}</div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-1">Level {normie.level}</div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-atlas-border/50 flex items-center justify-between text-[9px] font-mono text-atlas-secondary">
                        <span>Score: {normie.score}</span>
                        <span className={`text-[8px] px-1 rounded ${
                          normie.status === 'Zombie' ? 'bg-amber-500/10 text-amber-500' :
                          normie.status === 'Legendary' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {normie.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SIGNALS & INTEL */}
          {activeTab === 'signals' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-atlas-primary font-sans">Real-time Signals Hub</h3>
                <p className="text-xs text-atlas-secondary font-sans mt-1">Advanced on-chain filters that detect significant action triggers automatically.</p>
              </div>

              <div className="bg-[#111113] border border-atlas-border p-6 rounded-lg text-center space-y-4">
                <Database className="w-10 h-10 text-purple-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-atlas-primary">L1 Smart-Filters Enabled</h4>
                <p className="text-xs text-atlas-secondary max-w-md mx-auto leading-relaxed">
                  Atlas reads directly from on-chain event sequences to surface zombie conversions, wallet sweeps, legendary mints, and custom canvas edits instantly.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => triggerSimulatedEvent('zombie_conversion')}
                    className="bg-atlas-primary text-black text-xs font-mono px-4 py-2 rounded font-medium hover:bg-opacity-90"
                  >
                    Simulate Live Event Signal Trigger
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OTHER TABS FALLBACK */}
          {(activeTab === 'watchlist' || activeTab === 'settings') && (
            <div className="py-20 text-center space-y-4">
              <Settings className="w-12 h-12 text-zinc-600 mx-auto animate-spin duration-[10s]" />
              <div className="text-sm font-semibold text-atlas-primary uppercase tracking-wide">Interface Mode Locked</div>
              <p className="text-xs text-atlas-secondary max-w-sm mx-auto leading-relaxed">
                You are in preview sandbox mode. This tab will sync with your web3 wallet once full deployment is finished.
              </p>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
