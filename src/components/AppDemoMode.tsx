import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Compass, Activity, Shield, Flame, User, Clock, TrendingUp, Eye, 
  Layers, Database, ArrowRight, ArrowUp, ArrowDown, Star, Skull, Sparkles, 
  Wallet, Bell, LogOut, Check, Zap, Info, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  Pencil, ArrowLeftRight, Grid, Lock
} from 'lucide-react';
import { ActivityEvent, MetricItem, NormieItem } from '../types';
import { 
  fetchLiveMetrics, 
  fetchCustomizedEvents, 
  fetchRealNormies, 
  getNormieById,
  INITIAL_NORMIES,
  INITIAL_METRICS,
  INITIAL_ACTIVITIES
} from '../data';
import Sparkline from './Sparkline';
import { usePrivy } from '../lib/privy';

interface AppDemoModeProps {
  onClose: () => void;
  onOpenSearch: () => void;
  onSelectNormie: (normie: NormieItem) => void;
  initialTab?: 'home' | 'explore' | 'signals' | 'watchlist';
}

export default function AppDemoMode({ onClose, onOpenSearch, onSelectNormie, initialTab }: AppDemoModeProps) {
  const { authenticated, user, login, logout } = usePrivy();

  // Connected Wallet State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Sync with Privy authentication state
  useEffect(() => {
    if (authenticated && user) {
      setWalletConnected(true);
      setWalletAddress(user.wallet?.address || user.google?.email || user.x?.username || '0x4F...8a7B');
    } else {
      setWalletConnected(false);
      setWalletAddress('');
    }
  }, [authenticated, user]);
  
  // Real dynamic API states
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [trendingNormies, setTrendingNormies] = useState<NormieItem[]>([]);
  const [recentNormies, setRecentNormies] = useState<NormieItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<{label: string, category: string, query: string}[]>([]);
  
  // Active Navigation Tab: 'home' | 'explore' | 'signals' | 'watchlist'
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'signals' | 'watchlist'>(initialTab || 'home');

  // Watch for external updates to initialTab
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Notification State
  const [notification, setNotification] = useState<string | null>(null);

  // Explore tab filters and states
  const [discoverNormies, setDiscoverNormies] = useState<NormieItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState('');
  
  // Active filter category (Trending, Top Rarity, Zombie, Legendary etc.)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Trending');
  
  // Advanced dropdown states (for custom filtration UI)
  const [selectedTrait, setSelectedTrait] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedOwner, setSelectedOwner] = useState<string>('All');

  const [discoverSort, setDiscoverSort] = useState('rank');
  const [discoverOrder, setDiscoverOrder] = useState<'asc' | 'desc'>('asc');
  const [discoverPage, setDiscoverPage] = useState(1);

  // Signals Filter state: 'All' | 'Canvas' | 'Zombie' | 'Legendary' | 'Transfers' | 'Burns'
  const [signalsFilter, setSignalsFilter] = useState<string>('All');

  // Watchlist filter tab: 'All' | 'Normies' | 'Wallets' | 'Searches'
  const [watchlistFilter, setWatchlistFilter] = useState<string>('All');

  // Watchlist state
  const [watchlist, setWatchlist] = useState<NormieItem[]>([]);

  // Current block tracker
  const [currentBlock, setCurrentBlock] = useState(20240154);

  // Load main dashboard metrics and feeds
  const loadDashboardData = async () => {
    try {
      const [liveAct, liveMet, liveNor, liveRec] = await Promise.all([
        fetchCustomizedEvents(15),
        fetchLiveMetrics(),
        fetchRealNormies({ limit: 5, sort: 'rank', order: 'asc' }),
        fetchRealNormies({ limit: 3, sort: 'updatedAt', order: 'desc' })
      ]);
      setActivities(liveAct);
      setMetrics(liveMet);
      setTrendingNormies(liveNor);
      setRecentNormies(liveRec);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Connect/Disconnect Wallet Action
  const handleConnectWallet = () => {
    if (authenticated) {
      logout();
      showNotification('Wallet disconnected.');
    } else {
      login();
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Load Dashboard Data on Mount
  useEffect(() => {
    loadDashboardData();

    // Polling indexes for live metrics/customizations
    const interval = setInterval(() => {
      loadDashboardData();
      setCurrentBlock(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Discover Tab Normies list on criteria changes
  useEffect(() => {
    async function loadDiscoverData() {
      setDiscoverLoading(true);
      try {
        // Map category filter to query params
        let finalSort = discoverSort;
        let finalOrder = discoverOrder;
        let searchParam = discoverSearch;

        if (activeCategoryFilter === 'Top Rarity') {
          finalSort = 'rank';
          finalOrder = 'asc';
        } else if (activeCategoryFilter === 'Recently Updated') {
          finalSort = 'updatedAt';
          finalOrder = 'desc';
        } else if (activeCategoryFilter === 'Zombie') {
          searchParam = searchParam ? `${searchParam} zombie` : 'zombie';
        } else if (activeCategoryFilter === 'Legendary') {
          searchParam = searchParam ? `${searchParam} legendary` : 'legendary';
        } else if (activeCategoryFilter === 'Recently Transferred') {
          finalSort = 'updatedAt';
          finalOrder = 'desc';
        } else if (activeCategoryFilter === 'Recently Burned') {
          searchParam = searchParam ? `${searchParam} burned` : 'burned';
        }

        const results = await fetchRealNormies({
          search: searchParam,
          sort: finalSort,
          order: finalOrder,
          page: discoverPage,
          limit: 12
        });
        setDiscoverNormies(results);
      } catch (err) {
        console.error('Failed to load discover data:', err);
      } finally {
        setDiscoverLoading(false);
      }
    }
    if (activeTab === 'explore') {
      loadDiscoverData();
    }
  }, [discoverSearch, discoverSort, discoverOrder, discoverPage, activeCategoryFilter, activeTab]);

  // Load Watchlist and Saved Searches
  const loadWatchlistAndSearches = () => {
    const listStr = localStorage.getItem('atlas_watchlist');
    if (listStr) {
      try {
        setWatchlist(JSON.parse(listStr));
      } catch (err) {
        console.error(err);
      }
    } else {
      setWatchlist([]);
    }

    const savedStr = localStorage.getItem('atlas_saved_searches');
    if (savedStr) {
      try {
        setSavedSearches(JSON.parse(savedStr));
      } catch (err) {
        console.error(err);
      }
    } else {
      setSavedSearches([]);
    }
  };

  useEffect(() => {
    loadWatchlistAndSearches();
  }, [activeTab]);

  const handleToggleWatchlist = (item: NormieItem) => {
    const isWatchlisted = watchlist.some(w => w.id === item.id);
    let updatedList;
    if (isWatchlisted) {
      updatedList = watchlist.filter(w => w.id !== item.id);
      showNotification(`Removed Normie #${item.id} from watchlist.`);
    } else {
      updatedList = [...watchlist, item];
      showNotification(`Added Normie #${item.id} to watchlist.`);
    }
    setWatchlist(updatedList);
    localStorage.setItem('atlas_watchlist', JSON.stringify(updatedList));
  };

  // Clear all advanced filters helper
  const handleClearAllFilters = () => {
    setSelectedTrait('All');
    setSelectedStatus('All');
    setSelectedRarity('All');
    setSelectedLevel('All');
    setSelectedOwner('All');
    setActiveCategoryFilter('Trending');
    setDiscoverSearch('');
    showNotification('All filters cleared.');
  };

  // Helper to map event type to icon and styling
  const getEventBadgeProps = (type: string) => {
    switch (type) {
      case 'canvas_updated':
        return { icon: Pencil, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'Canvas updated' };
      case 'zombie_conversion':
        return { icon: Skull, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Zombie conversion' };
      case 'normie_transferred':
        return { icon: ArrowLeftRight, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Normie transferred' };
      case 'legendary_acquired':
        return { icon: Star, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Legendary acquired' };
      case 'normie_burned':
        return { icon: Flame, color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Normie burned' };
      default:
        return { icon: Activity, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', label: 'On-chain log' };
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#060608] flex overflow-hidden font-sans text-white">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111113] border border-zinc-800/80 text-xs text-white px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-2xl font-sans"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse shrink-0" />
            <span className="font-mono font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. PERSISTENT SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-zinc-800/80 bg-[#0c0c0e] flex flex-col shrink-0 select-none">
        
        {/* Brand Header */}
        <div className="h-16 border-b border-zinc-800/60 flex items-center px-6 gap-3">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center border border-white/20 shrink-0">
            <span className="text-[10px] font-bold text-black font-mono">A</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-white tracking-widest uppercase font-sans leading-none">ATLAS</span>
            <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase mt-1">Ecosystem Node</span>
          </div>
          
          <div className="ml-auto flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-mono border border-emerald-500/10">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLINE</span>
          </div>
        </div>

        {/* Menu Navigation list */}
        <nav className="p-4 space-y-1.5 flex-1">
          <button 
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all font-semibold border ${
              activeTab === 'home' 
                ? 'bg-zinc-800/40 text-white border-zinc-700/50' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Home</span>
          </button>

          <button 
            onClick={() => { setActiveTab('explore'); setDiscoverPage(1); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all font-semibold border ${
              activeTab === 'explore' 
                ? 'bg-zinc-800/40 text-white border-zinc-700/50' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border-transparent'
            }`}
          >
            <Compass className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Discover</span>
          </button>

          <button 
            onClick={() => setActiveTab('signals')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all font-semibold border ${
              activeTab === 'signals' 
                ? 'bg-zinc-800/40 text-white border-zinc-700/50' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Signals</span>
          </button>

          <button 
            onClick={() => setActiveTab('watchlist')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all font-semibold border ${
              activeTab === 'watchlist' 
                ? 'bg-zinc-800/40 text-white border-zinc-700/50' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border-transparent'
            }`}
          >
            <Star className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Watchlist</span>
          </button>
        </nav>



        {/* User Profile Footer */}
        <div className="p-4 border-t border-zinc-800/60 bg-[#0c0c0e] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#18181b] border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src={authenticated && user?.avatarUrl ? user.avatarUrl : "https://api.normies.art/normie/152/image.png"} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover scale-110"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-mono font-bold text-white tracking-tight truncate">
                {walletConnected ? walletAddress : 'Not Connected'}
              </span>
              <span className="text-[8px] text-zinc-500 font-mono tracking-wider">
                {authenticated ? `${user?.type.toUpperCase()} ACCOUNT` : 'PORTAL ACCOUNT'}
              </span>
            </div>
          </div>
          <button 
            onClick={authenticated ? () => { logout(); showNotification('Signed out of Atlas secure session.'); } : onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded hover:bg-zinc-800/40"
            title={authenticated ? "Sign Out of Privy" : "Exit Application Workspace"}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT PORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#060608]">
        
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-8 bg-[#09090b] shrink-0">
          
          {/* Universal Search Clicker (Cmd+K layout trigger) */}
          <button 
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 bg-[#060608] border border-zinc-800/80 rounded-lg px-3 py-2 w-80 text-left text-zinc-500 hover:text-zinc-400 hover:border-zinc-700 transition-all text-xs"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span className="flex-1 text-zinc-500">Search ID, wallet, traits, keywords...</span>
            <span className="bg-[#111113] border border-zinc-800 rounded text-[9px] px-1 font-mono text-zinc-500">⌘K</span>
          </button>

          {/* Connected wallet and notification controls */}
          <div className="flex items-center gap-4">
            
            <div className="hidden lg:flex items-center gap-2 text-[9px] font-mono text-zinc-500 bg-[#111113] px-2.5 py-1.5 rounded-md border border-zinc-800/50">
              <Info className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Real-time On-chain Logs</span>
            </div>

            {/* Notification triggers */}
            <button 
              onClick={() => showNotification('No unread ecosystem signals. Feeds fully operational.')}
              className="p-2 rounded-lg border border-zinc-800/80 text-zinc-400 hover:text-white bg-[#111113] relative transition-colors"
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>

            {/* Wallet Connector Button */}
            <button 
              onClick={handleConnectWallet}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                walletConnected 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-white text-black hover:bg-zinc-200 border-transparent'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span>{walletConnected ? '0x4F...8a7B' : 'Connect Wallet'}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Sub-View Content Arena */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0">
          
          {loading && activeTab === 'home' ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
              <span className="text-xs text-zinc-400 font-mono">Loading real-time indexes...</span>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* TAB 1: HOME VIEW */}
              {activeTab === 'home' && (
                <div className="space-y-8">
                  
                  {/* Hero welcoming panel */}
                  <div className="bg-radial from-zinc-900/40 to-transparent border border-zinc-800/60 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none" />
                    
                    <div className="space-y-2.5 max-w-xl z-10">
                      <div className="inline-flex items-center gap-1.5 bg-[#111113] border border-zinc-800 px-2 py-0.5 rounded-md text-[9px] font-mono text-purple-400 font-bold uppercase">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>Intelligence Node Active</span>
                      </div>
                      <h1 className="text-xl md:text-2xl font-bold font-sans text-white tracking-tight">
                        Atlas Ecosystem Intelligence
                      </h1>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Search, discover, monitor and explore everything happening across the Normies ecosystem using the official Normies APIs.
                      </p>
                      
                      {/* Search & Actions block */}
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button 
                          onClick={() => { setActiveTab('explore'); setDiscoverPage(1); }}
                          className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Compass className="w-3.5 h-3.5 shrink-0" />
                          <span>Launch Explorer</span>
                        </button>
                        
                        <button 
                          onClick={() => setActiveTab('signals')}
                          className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>Monitor Live Feed</span>
                        </button>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-zinc-800/10 border border-zinc-700/20 flex items-center justify-center animate-pulse">
                        <Database className="w-8 h-8 text-zinc-500" />
                      </div>
                    </div>
                  </div>

                  {/* 1.1 Live Overview metrics list */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">Ecosystem State</h3>
                      <span className="text-[9px] text-zinc-600 font-mono">Live Sync</span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {metrics.map((item) => (
                        <div 
                          key={item.id} 
                          className="bg-[#111113] border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700/50 transition-all group"
                        >
                          <div>
                            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">{item.label}</span>
                            <span className="text-lg font-bold font-mono text-white mt-1.5 block group-hover:text-purple-400 transition-colors">{item.value}</span>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between gap-2 shrink-0">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                              item.color === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                              item.color === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                              item.color === 'error' ? 'bg-red-500/10 text-red-400' :
                              item.color === 'legendary' ? 'bg-purple-500/10 text-purple-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {item.change}
                            </span>
                            
                            <div className="h-5 w-16 opacity-70 group-hover:opacity-100 transition-opacity">
                              <Sparkline data={item.sparklineData} color={item.color} width={64} height={18} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1.2 Split Section Layout: Activities / Trending and Stats breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT PANEL: Trending & Discoveries */}
                    <div className="lg:col-span-8 space-y-8">
                      
                      {/* Trending Now Subsection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">Trending Now</h3>
                          <button 
                            onClick={() => { setActiveTab('explore'); setActiveCategoryFilter('Trending'); setDiscoverPage(1); }} 
                            className="text-[10px] text-zinc-400 hover:text-white transition-colors font-mono uppercase flex items-center gap-1"
                          >
                            <span>View all</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Horizontal scrolling row of cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {trendingNormies.slice(0, 5).map((normie, idx) => (
                            <div 
                              key={normie.id}
                              onClick={() => onSelectNormie(normie)}
                              className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-700 transition-all group flex flex-col relative"
                            >
                              {/* Rarity Ranking numeric circle badge */}
                              <div className={`absolute top-2 left-2 z-10 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold border ${
                                idx === 0 ? 'bg-amber-400 text-black border-amber-300' :
                                idx === 1 ? 'bg-zinc-400 text-black border-zinc-300' :
                                idx === 2 ? 'bg-amber-700 text-white border-amber-600' :
                                'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}>
                                {idx + 1}
                              </div>

                              <div className="aspect-square bg-[#0b0b0d] overflow-hidden relative">
                                <img 
                                  src={normie.imageUrl} 
                                  alt={normie.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="p-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="text-[10px] text-zinc-400 font-bold truncate">#{normie.id}</div>
                                  <div className="text-[9px] text-zinc-500 font-mono">Level {normie.level}</div>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[8px] font-mono text-zinc-400">
                                  <span className="text-purple-400 font-bold">★ Legendary</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Discoveries Subsection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">Recent Discoveries</h3>
                          <span className="text-[9px] text-zinc-600 font-mono">Ecosystem Logs</span>
                        </div>

                        {/* Large editorial cards in vertical layout */}
                        <div className="space-y-3">
                          {recentNormies.length === 0 ? (
                            <div className="py-8 text-center text-xs text-zinc-500 font-mono bg-[#111113] border border-zinc-800/40 rounded-xl">
                              Loading real-time indexes...
                            </div>
                          ) : (
                            recentNormies.map((item) => (
                              <div 
                                key={item.id}
                                onClick={() => onSelectNormie(item)}
                                className="bg-[#111113] border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-4">
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-12 h-12 rounded-lg object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">#{item.id} — {item.name}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-2">
                                      <span>Rarity Rank #{item.rank}</span>
                                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                      <span>Level {item.level}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right hidden sm:block">
                                    <span className="block text-[8px] font-mono text-zinc-500 uppercase">INDEXED</span>
                                    <span className="text-[9px] text-zinc-400 font-mono">{item.updatedAt}</span>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Live Signals Preview */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">Live Feed Preview</h3>
                          <button 
                            onClick={() => setActiveTab('signals')}
                            className="text-[10px] text-zinc-400 hover:text-white transition-colors font-mono uppercase flex items-center gap-1"
                          >
                            <span>Inspect full feed</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl divide-y divide-zinc-800/60 overflow-hidden">
                          {activities.slice(0, 4).map((act) => {
                            const badge = getEventBadgeProps(act.type);
                            const IconComp = badge.icon;
                            return (
                              <div 
                                key={act.id}
                                onClick={() => {
                                  const matched = getNormieById(act.normieId);
                                  onSelectNormie(matched);
                                }}
                                className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className={`p-2 rounded shrink-0 border ${badge.color}`}>
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                      <span>{badge.label}</span>
                                      <span className="text-purple-400 font-mono">#{act.normieId}</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                                      <span>Operator: <span className="text-zinc-300">{act.userAddress}</span></span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono shrink-0">{act.timeAgo}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: Distribution and Metrics */}
                    <div className="lg:col-span-4 space-y-8">
                      
                      {/* Ecosystem Events Distribution Chart (Donut visual) */}
                      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">Total Events Breakdown</h4>
                          <span className="text-[8px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded font-mono">7D</span>
                        </div>

                        {/* Beautiful dynamic Donut chart inline SVG */}
                        <div className="flex flex-col items-center justify-center py-6 relative">
                          <svg className="w-36 h-36 transform -rotate-90">
                            {/* Outer backing circle */}
                            <circle cx="72" cy="72" r="54" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="12" />
                            
                            {/* Segment 1: Canvas Updates (52.1%) */}
                            <circle 
                              cx="72" cy="72" r="54" fill="transparent" 
                              stroke="#22C55E" strokeWidth="12" 
                              strokeDasharray={`${2 * Math.PI * 54 * 0.521} ${2 * Math.PI * 54 * (1 - 0.521)}`} 
                              strokeDashoffset="0"
                            />
                            {/* Segment 2: Transfers (23.4%) */}
                            <circle 
                              cx="72" cy="72" r="54" fill="transparent" 
                              stroke="#3B82F6" strokeWidth="12" 
                              strokeDasharray={`${2 * Math.PI * 54 * 0.234} ${2 * Math.PI * 54 * (1 - 0.234)}`} 
                              strokeDashoffset={`-${2 * Math.PI * 54 * 0.521}`}
                            />
                            {/* Segment 3: Zombie Conversions (12.7%) */}
                            <circle 
                              cx="72" cy="72" r="54" fill="transparent" 
                              stroke="#A855F7" strokeWidth="12" 
                              strokeDasharray={`${2 * Math.PI * 54 * 0.127} ${2 * Math.PI * 54 * (1 - 0.127)}`} 
                              strokeDashoffset={`-${2 * Math.PI * 54 * (0.521 + 0.234)}`}
                            />
                            {/* Segment 4: Legendary Acquired (7.8%) */}
                            <circle 
                              cx="72" cy="72" r="54" fill="transparent" 
                              stroke="#F59E0B" strokeWidth="12" 
                              strokeDasharray={`${2 * Math.PI * 54 * 0.078} ${2 * Math.PI * 54 * (1 - 0.078)}`} 
                              strokeDashoffset={`-${2 * Math.PI * 54 * (0.521 + 0.234 + 0.127)}`}
                            />
                            {/* Segment 5: Burns (4.0%) */}
                            <circle 
                              cx="72" cy="72" r="54" fill="transparent" 
                              stroke="#EF4444" strokeWidth="12" 
                              strokeDasharray={`${2 * Math.PI * 54 * 0.040} ${2 * Math.PI * 54 * (1 - 0.040)}`} 
                              strokeDashoffset={`-${2 * Math.PI * 54 * (0.521 + 0.234 + 0.127 + 0.078)}`}
                            />
                          </svg>

                          {/* Center Text Labels */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                            <span className="text-base font-extrabold font-mono tracking-tight text-white">24,681</span>
                            <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Total Logs</span>
                          </div>
                        </div>

                        {/* Chart Legend List */}
                        <div className="space-y-2.5 pt-2 text-[10px] font-mono">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>Canvas Updates</span>
                            </div>
                            <span className="text-white font-bold">52.1%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                              <span>Transfers</span>
                            </div>
                            <span className="text-white font-bold">23.4%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                              <span>Zombie Conversions</span>
                            </div>
                            <span className="text-white font-bold">12.7%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                              <span>Legendary Acquired</span>
                            </div>
                            <span className="text-white font-bold">7.8%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                              <span>Burns</span>
                            </div>
                            <span className="text-white font-bold">4.0%</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Traits (7D) Progress indicators */}
                      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">Top Traits (7D)</h4>
                          <span className="text-[9px] text-zinc-500 font-mono">Decoded</span>
                        </div>

                        <div className="space-y-4">
                          {[
                            { label: 'Alien', pct: 24.6, color: 'bg-emerald-500' },
                            { label: 'Cowboy Hat', pct: 18.3, color: 'bg-blue-500' },
                            { label: 'Sunglasses', pct: 14.7, color: 'bg-purple-500' },
                            { label: 'Headphones', pct: 11.2, color: 'bg-amber-500' },
                            { label: 'Mohawk', pct: 8.9, color: 'bg-red-500' },
                          ].map((trait, idx) => (
                            <div key={idx} className="space-y-1.5 text-xs">
                              <div className="flex justify-between font-mono text-[11px]">
                                <span className="text-zinc-400 font-semibold">{idx + 1}. {trait.label}</span>
                                <span className="text-white font-bold">{trait.pct}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full ${trait.color}`} style={{ width: `${trait.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: EXPLORE (DISCOVER) VIEW */}
              {activeTab === 'explore' && (
                <div className="space-y-6">
                  
                  {/* Page Title & Header */}
                  <div>
                    <h1 className="text-xl font-bold font-sans text-white tracking-tight">Discover</h1>
                    <p className="text-xs text-zinc-400 font-sans mt-1">Find and explore Normies across the ecosystem.</p>
                  </div>

                  {/* Horizontal Scrollable Category Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar shrink-0">
                    {[
                      'Trending', 'Top Rarity', 'Recently Updated', 'Zombie', 'Legendary', 'Recently Transferred', 'Recently Burned'
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategoryFilter(cat);
                          setDiscoverPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                          activeCategoryFilter === cat
                            ? 'bg-white text-black border-transparent'
                            : 'bg-[#111113] text-zinc-400 hover:text-white border-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search and Advanced Select Filters box */}
                  <div className="bg-[#111113] border border-zinc-800 p-4 rounded-xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      
                      {/* Search Input bar */}
                      <div className="relative w-full sm:w-96 flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                          <input 
                            type="text" 
                            placeholder="Search token ID, traits, keywords..." 
                            value={discoverSearch}
                            onChange={(e) => {
                              setDiscoverSearch(e.target.value);
                              setDiscoverPage(1);
                            }}
                            className="bg-[#060608] border border-zinc-800 text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none placeholder:text-zinc-500 w-full text-white focus:border-zinc-700 transition-colors"
                          />
                        </div>
                        {(discoverSearch || activeCategoryFilter !== 'Trending') && (
                          <button
                            onClick={() => {
                              const label = discoverSearch 
                                ? `Search: "${discoverSearch}" (${activeCategoryFilter})`
                                : `Filter: ${activeCategoryFilter}`;
                              
                              const isExist = savedSearches.some(s => s.label === label);
                              if (!isExist) {
                                const updated = [...savedSearches, { label, category: activeCategoryFilter, query: discoverSearch }];
                                setSavedSearches(updated);
                                localStorage.setItem('atlas_saved_searches', JSON.stringify(updated));
                                showNotification(`Pinned query "${label}" to Watchlist!`);
                              } else {
                                showNotification(`"${label}" is already pinned.`);
                              }
                            }}
                            className="px-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-400 hover:text-purple-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                            title="Pin current query to saved searches"
                          >
                            <Star className="w-3.5 h-3.5 fill-purple-400/20 shrink-0" />
                            <span className="hidden md:inline">Pin</span>
                          </button>
                        )}
                      </div>

                      {/* Dropdown selectors for Trait, Status, Rarity etc */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        
                        <div className="flex items-center gap-1.5 bg-[#060608] border border-zinc-800 rounded-lg px-2.5 py-1.5">
                          <span className="text-[10px] text-zinc-500 font-mono">Trait:</span>
                          <select 
                            value={selectedTrait}
                            onChange={(e) => setSelectedTrait(e.target.value)}
                            className="bg-transparent text-[11px] text-zinc-300 outline-none cursor-pointer font-sans font-medium"
                          >
                            <option value="All">All</option>
                            <option value="Alien">Alien</option>
                            <option value="Cyborg">Cyborg</option>
                            <option value="Undead">Undead</option>
                            <option value="Mohawk">Mohawk</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#060608] border border-zinc-800 rounded-lg px-2.5 py-1.5">
                          <span className="text-[10px] text-zinc-500 font-mono">Status:</span>
                          <select 
                            value={selectedStatus}
                            onChange={(e) => {
                              setSelectedStatus(e.target.value);
                              setActiveCategoryFilter(e.target.value === 'All' ? 'Trending' : e.target.value);
                              setDiscoverPage(1);
                            }}
                            className="bg-transparent text-[11px] text-zinc-300 outline-none cursor-pointer font-sans font-medium"
                          >
                            <option value="All">All</option>
                            <option value="Zombie">Zombie</option>
                            <option value="Legendary">Legendary</option>
                            <option value="Burned">Burned</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#060608] border border-zinc-800 rounded-lg px-2.5 py-1.5">
                          <span className="text-[10px] text-zinc-500 font-mono">Rarity:</span>
                          <select 
                            value={selectedRarity}
                            onChange={(e) => setSelectedRarity(e.target.value)}
                            className="bg-transparent text-[11px] text-zinc-300 outline-none cursor-pointer font-sans font-medium"
                          >
                            <option value="All">All</option>
                            <option value="Top 1%">Top 1%</option>
                            <option value="Top 5%">Top 5%</option>
                            <option value="Top 10%">Top 10%</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#060608] border border-zinc-800 rounded-lg px-2.5 py-1.5">
                          <span className="text-[10px] text-zinc-500 font-mono">Level:</span>
                          <select 
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="bg-transparent text-[11px] text-zinc-300 outline-none cursor-pointer font-sans font-medium"
                          >
                            <option value="All">All</option>
                            <option value="Level 10+">Level 10+</option>
                            <option value="Level 25+">Level 25+</option>
                            <option value="Level 50+">Level 50+</option>
                          </select>
                        </div>

                        <button 
                          onClick={handleClearAllFilters}
                          className="text-[10px] text-zinc-500 hover:text-white font-mono uppercase px-2.5 py-1.5 hover:underline"
                        >
                          Clear all
                        </button>

                      </div>

                      {/* Sort Selection */}
                      <div className="flex items-center gap-1.5 bg-[#060608] border border-zinc-800 rounded-lg px-2.5 py-1.5 ml-auto">
                        <span className="text-[10px] text-zinc-500 font-mono">Sort by:</span>
                        <select 
                          value={discoverSort}
                          onChange={(e) => {
                            setDiscoverSort(e.target.value);
                            setDiscoverPage(1);
                          }}
                          className="bg-transparent text-[11px] text-zinc-300 outline-none cursor-pointer font-sans font-semibold"
                        >
                          <option value="rank">Trending</option>
                          <option value="score">Rarity Rank</option>
                          <option value="id">Token ID</option>
                          <option value="level">Level</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {discoverLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                      <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                      <span className="text-xs text-zinc-500 font-mono">Querying real-time records...</span>
                    </div>
                  ) : discoverNormies.length === 0 ? (
                    <div className="py-24 text-center text-xs text-zinc-500 font-mono bg-[#111113] border border-zinc-800 rounded-xl">
                      No Normies matching your filter constraints were found.
                    </div>
                  ) : (
                    <>
                      {/* Catalog Grid exactly mirroring Image 1 style */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {discoverNormies.map((normie, idx) => {
                          const isWatchlisted = watchlist.some(w => w.id === normie.id);
                          // Calculate a realistic display rank number based on catalog indexes
                          const displayRankNum = (discoverPage - 1) * 12 + idx + 1;
                          
                          return (
                            <div 
                              key={normie.id}
                              onClick={() => onSelectNormie(normie)}
                              className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-700/80 transition-all group flex flex-col relative"
                            >
                              {/* Rarity Rank Badge left aligned */}
                              <div className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold border ${
                                displayRankNum === 1 ? 'bg-amber-400 text-black border-amber-300' :
                                displayRankNum === 2 ? 'bg-zinc-400 text-black border-zinc-300' :
                                displayRankNum === 3 ? 'bg-amber-700 text-white border-amber-600' :
                                'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}>
                                {displayRankNum}
                              </div>

                              {/* Watchlist toggle star icon right aligned */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleWatchlist(normie);
                                }}
                                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border border-zinc-800/60 transition-all shrink-0"
                              >
                                <Star className={`w-3.5 h-3.5 shrink-0 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>

                              <div className="relative aspect-square bg-[#0b0b0d] overflow-hidden flex-1">
                                <img 
                                  src={normie.imageUrl} 
                                  alt={normie.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="p-4 flex-none flex flex-col justify-between border-t border-zinc-800/60">
                                <div>
                                  <div className="text-xs font-bold text-white truncate">#{normie.id}</div>
                                  <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center justify-between">
                                    <span>Level {normie.level}</span>
                                    <span className="text-[9px] text-purple-400 font-bold">★ Legendary</span>
                                  </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                  <span>Rarity: {normie.score}</span>
                                  <span className="text-zinc-300 truncate max-w-[80px]">{normie.owner}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination matching Image 1 pagination layout */}
                      <div className="flex items-center justify-between border-t border-zinc-800/50 pt-6">
                        <button 
                          disabled={discoverPage === 1}
                          onClick={() => setDiscoverPage(prev => Math.max(1, prev - 1))}
                          className="bg-[#111113] border border-zinc-800 hover:border-zinc-700 text-white hover:bg-zinc-800/20 px-3.5 py-2 rounded-lg text-xs font-mono flex items-center gap-1 disabled:opacity-40 shrink-0 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 shrink-0" />
                          <span>Previous</span>
                        </button>
                        
                        <div className="flex items-center gap-1 text-xs font-mono">
                          {[1, 2, 3, 4, 5].map((page) => (
                            <button
                              key={page}
                              onClick={() => setDiscoverPage(page)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border transition-colors ${
                                discoverPage === page
                                  ? 'bg-zinc-800 border-zinc-700 text-white'
                                  : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          <span className="px-1 text-zinc-600">...</span>
                          <button
                            onClick={() => setDiscoverPage(120)}
                            className={`w-10 h-8 rounded-lg flex items-center justify-center font-bold border ${
                              discoverPage === 120
                                ? 'bg-zinc-800 border-zinc-700 text-white'
                                : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            120
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => setDiscoverPage(prev => prev + 1)}
                          className="bg-[#111113] border border-zinc-800 hover:border-zinc-700 text-white hover:bg-zinc-800/20 px-3.5 py-2 rounded-lg text-xs font-mono flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: SIGNALS VIEW (CHRONOLOGICAL ECOSYSTEM LOGS) */}
              {activeTab === 'signals' && (
                <div className="space-y-6">
                  
                  {/* Page header */}
                  <div>
                    <h1 className="text-xl font-bold font-sans text-white tracking-tight">Signals</h1>
                    <p className="text-xs text-zinc-400 font-sans mt-1">Real-time activity across the Normies ecosystem.</p>
                  </div>

                  {/* Filter Pills for event types */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
                    {['All', 'Canvas', 'Zombie', 'Legendary', 'Transfers', 'Burns'].map((item) => (
                      <button
                        key={item}
                        onClick={() => setSignalsFilter(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition-all border ${
                          signalsFilter === item
                            ? 'bg-white text-black border-transparent'
                            : 'bg-[#111113] text-zinc-400 hover:text-white border-zinc-800'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  {/* Signals List grouped by chronological categories */}
                  <div className="space-y-6">
                    {activities.length === 0 ? (
                      <div className="py-24 text-center text-xs text-zinc-500 font-mono bg-[#111113] border border-zinc-800 rounded-xl">
                        No live signals matching your criteria have been indexed yet.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        
                        {/* Group: Live Index Feed */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Live Index Feed</h4>
                          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl divide-y divide-zinc-800/50 overflow-hidden">
                            {activities
                              .filter(act => {
                                if (signalsFilter === 'All') return true;
                                if (signalsFilter === 'Canvas') return act.type === 'canvas_updated';
                                if (signalsFilter === 'Zombie') return act.type === 'zombie_conversion';
                                if (signalsFilter === 'Legendary') return act.type === 'legendary_acquired';
                                if (signalsFilter === 'Transfers') return act.type === 'normie_transferred';
                                if (signalsFilter === 'Burns') return act.type === 'normie_burned';
                                return true;
                              })
                              .map((act) => {
                                const badge = getEventBadgeProps(act.type);
                                const IconComp = badge.icon;
                                const matched = getNormieById(act.normieId);
                                return (
                                  <div 
                                    key={act.id}
                                    onClick={() => onSelectNormie(matched)}
                                    className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-all cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <div className={`p-2 rounded shrink-0 border ${badge.color}`}>
                                        <IconComp className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                          <span>{badge.label}</span>
                                          <span className="text-purple-400 font-mono">#{act.normieId}</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                                          <span>Operator: <span className="text-zinc-300">{act.userAddress}</span></span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-[10px] text-zinc-500 font-mono">{act.timeAgo}</span>
                                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: WATCHLIST VIEW */}
              {activeTab === 'watchlist' && (
                !authenticated ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white tracking-tight font-sans">Ecosystem Watchlist is Locked</h2>
                      <p className="text-[11px] text-zinc-400 mt-2.5 leading-relaxed font-sans">
                        You must authenticate your session using your Web3 Wallet, Google, or X account via Privy to create, modify, and sync custom watchlists.
                      </p>
                    </div>
                    <button
                      onClick={login}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-semibold transition-all cursor-pointer shadow-[0_4px_12px_rgba(147,51,234,0.3)] hover:scale-105"
                    >
                      Sign In with Privy
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* Page header */}
                    <div>
                      <h1 className="text-xl font-bold font-sans text-white tracking-tight">Watchlist</h1>
                    <p className="text-xs text-zinc-400 font-sans mt-1">Your saved Normies, wallets, and searches.</p>
                  </div>

                  {/* Filters / Tab pills */}
                  <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    {['All', 'Normies', 'Wallets', 'Searches'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setWatchlistFilter(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition-all border ${
                          watchlistFilter === tab
                            ? 'bg-[#111113] text-white border-zinc-700/80'
                            : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Saved Items lists */}
                  {watchlistFilter === 'All' || watchlistFilter === 'Normies' ? (
                    <div className="space-y-4">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-bold">Pinned Normies</h3>
                      
                      {watchlist.length === 0 ? (
                        <div className="py-12 text-center text-xs text-zinc-500 font-mono bg-[#111113] border border-zinc-800 rounded-xl space-y-3">
                          <Star className="w-6 h-6 text-zinc-600 mx-auto" />
                          <div>No pinned Normies.</div>
                          <div className="text-[10px] text-zinc-600">Star any Normie in the discover directory to follow them!</div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {watchlist.map((normie) => (
                            <div 
                              key={normie.id}
                              className="bg-[#111113] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-700 transition-all group flex flex-col relative"
                            >
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleWatchlist(normie);
                                }}
                                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 text-amber-400 border border-zinc-800/60 shrink-0"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
                              </button>

                              <div 
                                onClick={() => onSelectNormie(normie)}
                                className="relative aspect-square bg-[#0b0b0d] overflow-hidden flex-1"
                              >
                                <img 
                                  src={normie.imageUrl} 
                                  alt={normie.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div 
                                onClick={() => onSelectNormie(normie)}
                                className="p-4 flex-none border-t border-zinc-800/60"
                              >
                                <div className="text-xs font-bold text-white truncate">#{normie.id}</div>
                                <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center justify-between">
                                  <span>Level {normie.level}</span>
                                  <span className="text-purple-400 font-bold">★ Legendary</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Wallets or Searches Custom lists to match screenshot layout */}
                  {(watchlistFilter === 'All' || watchlistFilter === 'Wallets') && (
                    <div className="space-y-4 pt-4">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-bold">Saved Wallets</h3>
                      <div className="bg-[#111113] border border-zinc-800 rounded-xl divide-y divide-zinc-800/50 overflow-hidden">
                        {walletConnected ? (
                          <div className="p-4 flex items-center justify-between hover:bg-[#18181b]/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                                <Wallet className="w-4 h-4 shrink-0" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white font-mono">{walletAddress}</div>
                                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Currently Connected Wallet</div>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active Session Syncing</span>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                            No saved wallets. Connect your Web3 wallet coordinates to monitor indexes.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(watchlistFilter === 'All' || watchlistFilter === 'Searches') && (
                    <div className="space-y-4 pt-4">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-bold">Saved Searches</h3>
                      <div className="bg-[#111113] border border-zinc-800 rounded-xl divide-y divide-zinc-800/50 overflow-hidden">
                        {savedSearches.length === 0 ? (
                          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                            No saved searches. Use the search or dropdown filters in the discover directory to pin queries.
                          </div>
                        ) : (
                          savedSearches.map((saved, idx) => (
                            <div 
                              key={idx}
                              onClick={() => {
                                setActiveTab('explore');
                                if (saved.category !== 'All' && saved.category !== 'Trending') {
                                  setActiveCategoryFilter(saved.category);
                                } else {
                                  setActiveCategoryFilter('Trending');
                                }
                                setDiscoverSearch(saved.query || '');
                                setDiscoverPage(1);
                                showNotification(`Loaded query: ${saved.label}`);
                              }}
                              className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                                  <Search className="w-4 h-4 shrink-0" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">{saved.label}</div>
                                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Dynamic query filter</div>
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono group-hover:text-white transition-colors">Launch Search</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))}

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
