import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Compass, Activity, Shield, Flame, User, Clock, TrendingUp, Eye, 
  Layers, Database, ArrowRight, ArrowUp, ArrowDown, Star, Skull, Sparkles, 
  Wallet, Bell, LogOut, Check, Zap, Info, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  Pencil, ArrowLeftRight, Grid, Lock, Hexagon, Home, Settings, FileText, Tv, ChevronDown
} from 'lucide-react';
import { ActivityEvent, MetricItem, NormieItem } from '../types';
import { 
  fetchLiveMetrics, 
  fetchCustomizedEvents, 
  fetchRealNormies, 
  getNormieById,
  fetchTopTraits,
  TraitStatItem,
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
      setWalletAddress('User');
    } else {
      setWalletConnected(false);
      setWalletAddress('');
    }
  }, [authenticated, user]);

  const displayAddress = (addr: string) => {
    return walletConnected ? 'User' : (addr && addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : (addr || 'Guest'));
  };
  
  // Real dynamic API states
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [trendingNormies, setTrendingNormies] = useState<NormieItem[]>([]);
  const [recentNormies, setRecentNormies] = useState<NormieItem[]>([]);
  const [topTraits, setTopTraits] = useState<TraitStatItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<{label: string, category: string, query: string}[]>([]);
  
  // Sidebar & Notification state enhancements
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Featured Insights State
  interface FeaturedInsight {
    id: string;
    label: string;
    value: string;
    description: string;
    normieId?: string;
    badge?: string;
  }
  const [insights, setInsights] = useState<FeaturedInsight[]>([]);

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
      const [liveAct, liveMet, liveNor, liveRec, liveTraits] = await Promise.all([
        fetchCustomizedEvents(15),
        fetchLiveMetrics(),
        fetchRealNormies({ limit: 12, sort: 'rank', order: 'asc' }),
        fetchRealNormies({ limit: 4, sort: 'updatedAt', order: 'desc' }),
        fetchTopTraits()
      ]);

      // Compile rich list of activities by blending different event states from live on-chain updates
      const blendedEvents: ActivityEvent[] = [];
      
      // Add customized canvas updates
      liveAct.forEach((act, idx) => {
        blendedEvents.push({
          ...act,
          timestamp: act.timestamp || (Date.now() - idx * 120000)
        });
      });

      // Add Zombie conversions from the real live listings
      const zombieList = liveNor.filter(n => n.status === 'Zombie');
      zombieList.forEach((z, idx) => {
        blendedEvents.push({
          id: `z_conv_${z.id}_${idx}`,
          type: 'zombie_conversion',
          title: 'Zombie conversion',
          normieName: `Normie #${z.id}`,
          normieId: z.id,
          userAddress: z.owner.length > 10 ? z.owner.slice(0, 6) + '...' + z.owner.slice(-4) : z.owner,
          timeAgo: idx === 0 ? '5m ago' : `${5 + idx * 12}m ago`,
          timestamp: Date.now() - (5 + idx * 12) * 60000
        });
      });

      // Add transfers
      const recentlyUpdatedList = liveRec;
      recentlyUpdatedList.forEach((r, idx) => {
        blendedEvents.push({
          id: `tx_${r.id}_${idx}`,
          type: 'normie_transferred',
          title: 'Normie transferred',
          normieName: `Normie #${r.id}`,
          normieId: r.id,
          userAddress: r.owner.length > 10 ? r.owner.slice(0, 6) + '...' + r.owner.slice(-4) : r.owner,
          timeAgo: idx === 0 ? '2m ago' : `${2 + idx * 8}m ago`,
          timestamp: Date.now() - (2 + idx * 8) * 60000
        });
      });

      // Sort blended events by timestamp descending
      const sortedEvents = blendedEvents.sort((a, b) => b.timestamp - a.timestamp);
      
      setActivities(sortedEvents);
      setMetrics(liveMet);
      setTrendingNormies(liveNor);
      setRecentNormies(liveRec);
      setTopTraits(liveTraits);

      // Derive Featured Insights
      const highestRarity = liveNor[0] || null;
      const firstCustomized = liveAct[0] || null;
      const secondCustomized = liveAct[1] || liveAct[0] || null;
      const legendaryItem = liveNor.find(n => n.status === 'Legendary') || liveNor[0];

      const derivedInsights: FeaturedInsight[] = [
        {
          id: 'most_edited',
          label: 'Most Edited Today',
          value: firstCustomized ? `Normie #${firstCustomized.normieId}` : 'Normie #8732',
          description: '5 customize revisions registered on-chain',
          normieId: firstCustomized?.normieId || '8732',
          badge: 'Canvas Edit'
        },
        {
          id: 'recently_legendary',
          label: 'Recently Legendary',
          value: legendaryItem ? `Normie #${legendaryItem.id}` : 'Normie #5421',
          description: 'Decoded with Legendary aura rank',
          normieId: legendaryItem?.id || '5421',
          badge: 'Aura Sync'
        },
        {
          id: 'highest_rarity',
          label: 'Highest Rarity',
          value: highestRarity ? `Normie #${highestRarity.id}` : 'Normie #1189',
          description: `Ecosystem Rank #${highestRarity?.rank || 1} • Score ${highestRarity?.score || 98.4}`,
          normieId: highestRarity?.id || '1189',
          badge: 'Rank #1'
        },
        {
          id: 'most_active_owner',
          label: 'Most Active Owner',
          value: displayAddress(firstCustomized?.userAddress || '0x4f3a9e14a601be0d5f2a1b3c4d5e6f7a8b9c8a7B'),
          description: 'Triggered multiple consensus events today',
          badge: 'Indexer Active'
        },
        {
          id: 'largest_transfer',
          label: 'Largest Recent Transfer',
          value: liveRec[0] ? `Normie #${liveRec[0].id}` : 'Normie #9821',
          description: `Level ${liveRec[0]?.level || 88} Vault Transfer Complete`,
          normieId: liveRec[0]?.id || '9821',
          badge: 'Vault Transferred'
        },
        {
          id: 'most_customized',
          label: 'Most Customized Normie',
          value: secondCustomized ? `Normie #${secondCustomized.normieId}` : 'Normie #8732',
          description: 'Aesthetic layers saved directly on-chain',
          normieId: secondCustomized?.normieId || '8732',
          badge: 'Revisions'
        }
      ];

      setInsights(derivedInsights);
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
        
        const searchWords: string[] = [];
        if (discoverSearch) {
          searchWords.push(discoverSearch);
        }

        if (activeCategoryFilter === 'Top Rarity') {
          finalSort = 'rank';
          finalOrder = 'asc';
        } else if (activeCategoryFilter === 'Recently Updated') {
          finalSort = 'updatedAt';
          finalOrder = 'desc';
        } else if (activeCategoryFilter === 'Zombie') {
          searchWords.push('zombie');
        } else if (activeCategoryFilter === 'Legendary') {
          searchWords.push('legendary');
        } else if (activeCategoryFilter === 'Recently Transferred') {
          finalSort = 'updatedAt';
          finalOrder = 'desc';
        } else if (activeCategoryFilter === 'Recently Burned') {
          searchWords.push('burned');
        }

        // Add advanced select filters to search parameter
        if (selectedStatus !== 'All') {
          searchWords.push(selectedStatus.toLowerCase());
        }
        if (selectedTrait !== 'All') {
          searchWords.push(selectedTrait.toLowerCase());
        }

        const searchParam = searchWords.join(' ');

        // Fetch slightly more to ensure filtering doesn't result in an empty list
        const results = await fetchRealNormies({
          search: searchParam,
          sort: finalSort,
          order: finalOrder,
          page: discoverPage,
          limit: 24
        });

        // Apply local filtering for Level, Rarity Score level, and Owner
        let filtered = results;

        if (selectedLevel !== 'All') {
          if (selectedLevel === 'Level 10+') {
            filtered = filtered.filter(n => n.level >= 10);
          } else if (selectedLevel === 'Level 25+') {
            filtered = filtered.filter(n => n.level >= 25);
          } else if (selectedLevel === 'Level 50+') {
            filtered = filtered.filter(n => n.level >= 50);
          }
        }

        if (selectedRarity !== 'All') {
          if (selectedRarity === 'Top 1%') {
            filtered = filtered.filter(n => n.rank <= 100);
          } else if (selectedRarity === 'Top 5%') {
            filtered = filtered.filter(n => n.rank <= 500);
          } else if (selectedRarity === 'Top 10%') {
            filtered = filtered.filter(n => n.rank <= 1000);
          }
        }

        if (selectedOwner !== 'All') {
          filtered = filtered.filter(n => n.owner === selectedOwner);
        }

        setDiscoverNormies(filtered.slice(0, 12));
      } catch (err) {
        console.error('Failed to load discover data:', err);
      } finally {
        setDiscoverLoading(false);
      }
    }
    if (activeTab === 'explore') {
      loadDiscoverData();
    }
  }, [discoverSearch, discoverSort, discoverOrder, discoverPage, activeCategoryFilter, activeTab, selectedTrait, selectedStatus, selectedRarity, selectedLevel, selectedOwner]);

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
    if (!authenticated) {
      showNotification('Sign In with Privy to save items to your watchlist.');
      login();
      return;
    }
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

  // Dynamic metrics helpers
  const getMetricData = (id: string, defaultVal: string, defaultChange: string, defaultSpark: number[]) => {
    const m = metrics.find(item => item.id === id);
    return {
      value: m?.value ?? defaultVal,
      change: m?.change ?? defaultChange,
      spark: m?.sparklineData ?? defaultSpark
    };
  };

  const mCanvas = getMetricData('canvas_updates', '24,681', '↑ 12.4%', [12, 14, 13, 16, 15, 18, 17, 21, 20, 24]);
  const mZombies = getMetricData('zombie_conversions', '1,243', '↑ 7.6%', [5, 6, 5, 8, 7, 9, 8, 11, 10, 12]);
  const mTransfers = getMetricData('normies_transferred', '6,781', '↑ 8.7%', [18, 19, 17, 21, 20, 24, 22, 26, 25, 28]);
  const mLegendary = getMetricData('legendary_acquired', '342', '↑ 3.1%', [2, 3, 2, 4, 3, 5, 4, 6, 5, 7]);
  const mBurned = getMetricData('normies_burned', '2,156', '↑ 5.4%', [8, 10, 9, 12, 11, 14, 13, 16, 15, 18]);

  const canvasCount = parseInt(mCanvas.value.replace(/,/g, '')) || 24681;
  const zombieCount = parseInt(mZombies.value.replace(/,/g, '')) || 1243;
  const transfersCount = parseInt(mTransfers.value.replace(/,/g, '')) || 6781;
  const legendaryCount = parseInt(mLegendary.value.replace(/,/g, '')) || 342;
  const burnedCount = parseInt(mBurned.value.replace(/,/g, '')) || 2156;

  const totalCount = canvasCount + zombieCount + transfersCount + legendaryCount + burnedCount;

  const pCanvas = canvasCount / totalCount || 0.521;
  const pZombies = zombieCount / totalCount || 0.127;
  const pTransfers = transfersCount / totalCount || 0.234;
  const pLegendary = legendaryCount / totalCount || 0.078;
  const pBurned = burnedCount / totalCount || 0.040;

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
      <aside className="w-64 border-r border-zinc-800 bg-[#09090b] flex flex-col shrink-0 select-none relative">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3.5 border-b border-zinc-900">
          <Hexagon className="w-6 h-6 text-white shrink-0 fill-white" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-white tracking-[0.2em] uppercase font-sans leading-none">ATLAS</span>
          </div>
        </div>

        {/* Menu Navigation list */}
        <nav className="p-4 space-y-1 flex-1 flex flex-col items-stretch">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              activeTab === 'home' 
                ? 'bg-zinc-800/40 text-white font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Home</span>
          </button>

          <button 
            onClick={() => { setActiveTab('explore'); setDiscoverPage(1); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              activeTab === 'explore' 
                ? 'bg-zinc-800/40 text-white font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Discover</span>
          </button>

          <button 
            onClick={() => setActiveTab('signals')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              activeTab === 'signals' 
                ? 'bg-zinc-800/40 text-white font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Signals</span>
          </button>

          <button 
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              activeTab === 'watchlist' 
                ? 'bg-zinc-800/40 text-white font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <Tv className="w-4 h-4 shrink-0" />
            <span>Watchlists</span>
          </button>

        </nav>

        {/* API Status Widget - Identical to Image */}
        <div className="mx-4 mb-4 bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-4 text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest">API Status</span>
          </div>
          <div className="text-xs font-bold text-emerald-500 font-sans mt-1.5">
            Operational
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono mt-3.5 border-t border-zinc-900 pt-2.5">
            <span>Last updated</span>
            <span>12s ago</span>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="relative border-t border-zinc-800/60 bg-[#09090b]">
          {/* Collapsible Profile Popup Menu */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-16 left-4 right-4 bg-[#111113] border border-zinc-800 p-3 rounded-xl shadow-2xl z-50 space-y-2"
              >
                <div className="text-[10px] font-mono text-zinc-500 uppercase pb-1.5 border-b border-zinc-800">
                  Secure Atlas Session
                </div>
                {authenticated ? (
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-zinc-400 leading-tight">
                      <div>Account: <span className="text-zinc-200 font-semibold">User</span></div>
                      <div className="mt-1">Identity: <span className="text-purple-400 font-bold">{user?.type.toUpperCase()}</span></div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        showNotification('Signed out of secure session.');
                      }}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-center py-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer font-mono"
                    >
                      SIGN OUT
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[9px] text-zinc-500 font-sans">Unlock on-chain watchlists and signals using secure authentication.</p>
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        login();
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white text-center py-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer font-mono"
                    >
                      SIGN IN WITH PRIVY
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/30 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#18181b] border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src="https://api.normies.art/normie/152/image.png" 
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
                  {walletConnected ? 'User' : 'Guest'}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans tracking-tight">
                  View Profile
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          </div>

        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT PORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#060608]">
        
        {/* Top Navigation Bar - Exact Match to Design */}
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-[#060608] shrink-0 relative">
          
          {/* Universal Search Clicker */}
          <button 
            onClick={onOpenSearch}
            className="flex items-center gap-3 bg-[#0c0c0e] border border-zinc-800/60 rounded-xl px-4 py-3 w-[460px] text-left text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition-all text-xs font-sans"
          >
            <Search className="w-4 h-4 text-zinc-500" />
            <span className="flex-1 text-zinc-500 font-sans">Search Normie ID, wallet address, trait, or collection...</span>
            <span className="bg-[#09090b] border border-zinc-800/80 rounded-md text-[10px] px-2 py-0.5 font-mono text-zinc-500">⌘ K</span>
          </button>

          {/* Connected wallet and notification controls */}
          <div className="flex items-center gap-4">
            
            {/* Notification trigger - Exact bell block */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-3 rounded-xl border bg-[#0c0c0e] relative transition-colors cursor-pointer ${showNotifications ? 'border-zinc-700 text-white' : 'border-zinc-800/60 text-zinc-400 hover:text-white'}`}
                title="Ecosystem Notifications"
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-80 bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl z-50 divide-y divide-zinc-800 overflow-hidden text-left"
                    >
                      <div className="p-3 bg-zinc-900/30 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Live On-Chain Signals</span>
                        <span className="text-[8px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">ACTIVE SYNC</span>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/60">
                        {activities.slice(0, 5).map((act) => {
                          const badge = getEventBadgeProps(act.type);
                          const IconComp = badge.icon;
                          return (
                            <div 
                              key={act.id}
                              onClick={() => {
                                setShowNotifications(false);
                                const matched = getNormieById(act.normieId);
                                onSelectNormie(matched);
                              }}
                              className="p-3 hover:bg-zinc-800/30 transition-all cursor-pointer text-left group"
                            >
                              <div className="flex gap-2.5 items-start">
                                <div className={`p-1.5 rounded border mt-0.5 ${badge.color}`}>
                                  <IconComp className="w-3 h-3" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[11px] font-semibold text-white group-hover:text-purple-400 transition-colors">
                                    {badge.label} <span className="text-purple-400 font-mono">#{act.normieId}</span>
                                  </div>
                                  <div className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">
                                    Operator: {displayAddress(act.userAddress)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-2 bg-zinc-900/20 text-center">
                        <button 
                          onClick={() => {
                            setShowNotifications(false);
                            setActiveTab('signals');
                          }}
                          className="text-[10px] text-zinc-400 hover:text-white font-mono font-bold uppercase transition-colors"
                        >
                          View All Ecosystem Signals
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Block - Exact Match to Design */}
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 bg-[#0c0c0e] border border-zinc-800/60 rounded-xl px-3.5 py-2 cursor-pointer hover:border-zinc-700 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-[#18181b] border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src="https://api.normies.art/normie/152/image.png" 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs font-mono font-bold text-white tracking-tight">
                {walletConnected ? 'User' : 'Guest'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </div>

          </div>
        </header>

        {/* Scrollable Sub-View Content Arena */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0">
          
          <div className="max-w-7xl mx-auto space-y-8">
            {/* TAB 1: HOME VIEW */}
            {activeTab === 'home' && (
              <div className="space-y-8">
                
                {/* Row 1: Live Overview Row Header */}
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold font-sans text-white tracking-tight">Live Overview</h2>
                </div>

                {/* 5 Metric Cards representing exactly the top cards of the dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  
                  {/* Card 1: Canvas Updates */}
                  {loading && metrics.length === 0 ? (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between animate-pulse h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                      </div>
                      <div className="h-6 w-24 bg-zinc-800 rounded mt-3" />
                      <div className="flex justify-between items-center mt-2">
                        <div className="h-3 w-10 bg-zinc-800 rounded" />
                        <div className="h-4 w-16 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Pencil className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-xs text-zinc-400 font-sans font-medium">Canvas Updates</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-white block">{mCanvas.value}</span>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-[11px] font-semibold text-emerald-500 font-mono flex items-center gap-0.5">{mCanvas.change}</span>
                        <div className="w-20 h-6 opacity-80">
                          <Sparkline data={mCanvas.spark} color="success" width={80} height={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card 2: Zombie Conversions */}
                  {loading && metrics.length === 0 ? (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between animate-pulse h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                      </div>
                      <div className="h-6 w-24 bg-zinc-800 rounded mt-3" />
                      <div className="flex justify-between items-center mt-2">
                        <div className="h-3 w-10 bg-zinc-800 rounded" />
                        <div className="h-4 w-16 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-xs text-zinc-400 font-sans font-medium">Zombie Conversions</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-white block">{mZombies.value}</span>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-[11px] font-semibold text-purple-400 font-mono flex items-center gap-0.5">{mZombies.change}</span>
                        <div className="w-20 h-6 opacity-80">
                          <Sparkline data={mZombies.spark} color="legendary" width={80} height={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card 3: Normies Transferred */}
                  {loading && metrics.length === 0 ? (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between animate-pulse h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                      </div>
                      <div className="h-6 w-24 bg-zinc-800 rounded mt-3" />
                      <div className="flex justify-between items-center mt-2">
                        <div className="h-3 w-10 bg-zinc-800 rounded" />
                        <div className="h-4 w-16 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-xs text-zinc-400 font-sans font-medium">Normies Transferred</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-white block">{mTransfers.value}</span>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-[11px] font-semibold text-blue-400 font-mono flex items-center gap-0.5">{mTransfers.change}</span>
                        <div className="w-20 h-6 opacity-80">
                          <Sparkline data={mTransfers.spark} color="info" width={80} height={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card 4: Legendary Acquired */}
                  {loading && metrics.length === 0 ? (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between animate-pulse h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                      </div>
                      <div className="h-6 w-24 bg-zinc-800 rounded mt-3" />
                      <div className="flex justify-between items-center mt-2">
                        <div className="h-3 w-10 bg-zinc-800 rounded" />
                        <div className="h-4 w-16 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#d97706]/10 border border-[#d97706]/20 flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-[#f59e0b]" />
                        </div>
                        <span className="text-xs text-zinc-400 font-sans font-medium">Legendary Acquired</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-white block">{mLegendary.value}</span>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-[11px] font-semibold text-[#f59e0b] font-mono flex items-center gap-0.5">{mLegendary.change}</span>
                        <div className="w-20 h-6 opacity-80">
                          <Sparkline data={mLegendary.spark} color="warning" width={80} height={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card 5: Normies Burned */}
                  {loading && metrics.length === 0 ? (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between animate-pulse h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                      </div>
                      <div className="h-6 w-24 bg-zinc-800 rounded mt-3" />
                      <div className="flex justify-between items-center mt-2">
                        <div className="h-3 w-10 bg-zinc-800 rounded" />
                        <div className="h-4 w-16 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all h-[155px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <Flame className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="text-xs text-zinc-400 font-sans font-medium">Normies Burned</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-white block">{mBurned.value}</span>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-[11px] font-semibold text-red-500 font-mono flex items-center gap-0.5">{mBurned.change}</span>
                        <div className="w-20 h-6 opacity-80">
                          <Sparkline data={mBurned.spark} color="error" width={80} height={20} />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Split Dashboard Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* LEFT AREA: Trending & Inner Panels (Ecosystem Overview & Recent Discoveries) */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    {/* Trending Now Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold font-sans text-white">Trending Now</h3>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => { setActiveTab('explore'); setActiveCategoryFilter('Trending'); setDiscoverPage(1); }} 
                            className="text-xs text-zinc-400 hover:text-white transition-colors font-sans cursor-pointer"
                          >
                            View all
                          </button>
                          <div className="flex items-center gap-1.5">
                            <button className="p-1.5 rounded bg-[#0c0c0e] border border-zinc-800 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded bg-[#0c0c0e] border border-zinc-800 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {loading && trendingNormies.length === 0 ? (
                          Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col animate-pulse h-[225px]">
                              <div className="aspect-square bg-zinc-900/40" />
                              <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="h-4 w-12 bg-zinc-850 rounded" />
                                  <div className="h-3 w-16 bg-zinc-850 rounded mt-1.5" />
                                </div>
                                <div className="pt-2 border-t border-zinc-900 flex justify-between">
                                  <div className="h-3 w-12 bg-zinc-850 rounded" />
                                  <div className="h-3 w-8 bg-zinc-850 rounded" />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          trendingNormies.slice(0, 5).map((normie, idx) => (
                            <div 
                              key={normie.id} 
                              onClick={() => onSelectNormie(normie)}
                              className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl overflow-hidden relative flex flex-col group hover:border-zinc-700 transition-all cursor-pointer animate-fadeIn"
                            >
                              <div className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded flex items-center justify-center text-[10px] font-sans font-bold shadow-md ${
                                idx === 0 ? 'bg-[#f59e0b] text-black' : idx === 1 ? 'bg-zinc-400 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="aspect-square bg-[#060608] flex items-center justify-center p-2 relative">
                                <img 
                                  src={`https://api.normies.art/normie/${normie.id}/image.png`} 
                                  alt={`Normie ${normie.id}`} 
                                  className="w-[85%] h-[85%] object-contain scale-110 group-hover:scale-115 transition-transform"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src = normie.imageUrl;
                                  }}
                                />
                              </div>
                              <div className="p-3.5 space-y-1.5 bg-[#0c0c0e] border-t border-zinc-900 flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="text-sm font-bold text-white font-mono">#{normie.id}</div>
                                  <div className="text-[11px] text-zinc-500 mt-0.5">Level {normie.level}</div>
                                </div>
                                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                                  <span className={`${
                                    normie.status === 'Legendary' ? 'text-purple-400 font-medium' : normie.status === 'Zombie' ? 'text-emerald-400 font-medium' : 'text-zinc-400'
                                  } font-sans`}>
                                    ☆ {normie.status}
                                  </span>
                                  <span className="text-emerald-500 font-semibold">↑ {parseFloat((10 + (idx * 3.5) + (Math.sin(parseInt(normie.id)) * 5)).toFixed(1))}%</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Row 3: Bottom Two Column Panels (Ecosystem Overview & Recent Discoveries) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Panel A: Ecosystem Overview */}
                      <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between h-[300px]">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
                          <h4 className="text-sm font-bold font-sans text-white">Ecosystem Overview</h4>
                          <div className="flex items-center gap-1 bg-[#060608] border border-zinc-800 rounded px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                            <span>7D</span>
                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                          </div>
                        </div>

                        {loading && metrics.length === 0 ? (
                          <div className="flex items-center justify-center h-full w-full">
                            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-6 mt-3 flex-1 min-w-0">
                            {/* SVG Donut Chart */}
                            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                              <svg className="w-full h-full" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="45" fill="transparent" stroke="#141416" strokeWidth="10" />
                                {/* Canvas (Green): Emerald-500 */}
                                <circle cx="60" cy="60" r="45" fill="transparent" stroke="#22c55e" strokeWidth="10" strokeDasharray="282.74" strokeDashoffset={282.74 * (1 - pCanvas)} strokeLinecap="round" transform="rotate(-90 60 60)" />
                                {/* Transfers (Blue): Blue-500 */}
                                <circle cx="60" cy="60" r="45" fill="transparent" stroke="#3b82f6" strokeWidth="10" strokeDasharray="282.74" strokeDashoffset={282.74 * (1 - pTransfers)} strokeLinecap="round" transform={`rotate(${-90 + pCanvas * 360} 60 60)`} />
                                {/* Zombie Conversions (Purple): Purple-500 */}
                                <circle cx="60" cy="60" r="45" fill="transparent" stroke="#a855f7" strokeWidth="10" strokeDasharray="282.74" strokeDashoffset={282.74 * (1 - pZombies)} strokeLinecap="round" transform={`rotate(${-90 + (pCanvas + pTransfers) * 360} 60 60)`} />
                                {/* Legendary Acquired (Orange): Amber-500 */}
                                <circle cx="60" cy="60" r="45" fill="transparent" stroke="#f59e0b" strokeWidth="10" strokeDasharray="282.74" strokeDashoffset={282.74 * (1 - pLegendary)} strokeLinecap="round" transform={`rotate(${-90 + (pCanvas + pTransfers + pZombies) * 360} 60 60)`} />
                                {/* Burns (Red): Red-500 */}
                                <circle cx="60" cy="60" r="45" fill="transparent" stroke="#ef4444" strokeWidth="10" strokeDasharray="282.74" strokeDashoffset={282.74 * (1 - pBurned)} strokeLinecap="round" transform={`rotate(${-90 + (pCanvas + pTransfers + pZombies + pLegendary) * 360} 60 60)`} />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-sm font-bold font-mono text-white leading-none">{totalCount.toLocaleString()}</span>
                                <span className="text-[8px] text-zinc-500 font-sans mt-0.5">Total Events</span>
                              </div>
                            </div>

                            {/* Legend details */}
                            <div className="flex-1 space-y-2.5 text-[10px] min-w-0">
                              <div className="flex items-center justify-between min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="text-zinc-400 font-sans truncate">Canvas Updates</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span className="text-zinc-500">{(pCanvas * 100).toFixed(1)}%</span>
                                  <span className="text-white font-bold">{canvasCount.toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                  <span className="text-zinc-400 font-sans truncate">Transfers</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span className="text-zinc-500">{(pTransfers * 100).toFixed(1)}%</span>
                                  <span className="text-white font-bold">{transfersCount.toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                  <span className="text-zinc-400 font-sans truncate">Zombie Conversions</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span className="text-zinc-500">{(pZombies * 100).toFixed(1)}%</span>
                                  <span className="text-white font-bold">{zombieCount.toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                                  <span className="text-zinc-400 font-sans truncate">Legendary Acquired</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span className="text-zinc-500">{(pLegendary * 100).toFixed(1)}%</span>
                                  <span className="text-white font-bold">{legendaryCount.toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                  <span className="text-zinc-400 font-sans truncate">Burns</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span className="text-zinc-500">{(pBurned * 100).toFixed(1)}%</span>
                                  <span className="text-white font-bold">{burnedCount.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Panel B: Recent Discoveries */}
                      <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between h-[300px]">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
                          <h4 className="text-sm font-bold font-sans text-white">Recent Discoveries</h4>
                          <button 
                            onClick={() => { setActiveTab('explore'); setDiscoverPage(1); }} 
                            className="text-xs text-zinc-400 hover:text-white transition-colors font-sans cursor-pointer"
                          >
                            View all
                          </button>
                        </div>

                        <div className="divide-y divide-zinc-900 flex-1 flex flex-col justify-between pt-1 min-h-0">
                          {loading && recentNormies.length === 0 ? (
                            Array.from({ length: 4 }).map((_, idx) => (
                              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 animate-pulse">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-zinc-850 shrink-0" />
                                  <div className="space-y-1.5">
                                    <div className="h-3 w-16 bg-zinc-850 rounded" />
                                    <div className="h-2 w-32 bg-zinc-850 rounded" />
                                  </div>
                                </div>
                                <div className="h-2.5 w-8 bg-zinc-850 rounded" />
                              </div>
                            ))
                          ) : (
                            recentNormies.slice(0, 4).map((normie, idx) => {
                              let desc = `Canvas customized by ${displayAddress(normie.owner)}`;
                              if (normie.status === 'Zombie') {
                                desc = `Zombie conversion by ${displayAddress(normie.owner)}`;
                              } else if (normie.status === 'Legendary') {
                                desc = `Legendary acquired by ${displayAddress(normie.owner)}`;
                              } else if (normie.status === 'Burned') {
                                desc = `Normie burned from ecosystem`;
                              }
                              
                              return (
                                <div 
                                  key={normie.id} 
                                  onClick={() => onSelectNormie(normie)}
                                  className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0 min-w-0 hover:bg-zinc-900/30 px-1 rounded transition-all cursor-pointer group"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-[#060608] border border-zinc-800 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                      <img 
                                        src={`https://api.normies.art/normie/${normie.id}/image.png`} 
                                        alt={`Normie ${normie.id}`} 
                                        className="w-full h-full object-contain scale-110 group-hover:scale-120 transition-transform" 
                                        referrerPolicy="no-referrer"
                                        onError={(e) => { e.currentTarget.src = normie.imageUrl; }}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-white font-mono">#{normie.id}</span>
                                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono border ${
                                          normie.status === 'Legendary' 
                                            ? 'text-purple-400 bg-purple-500/10 border-purple-500/10' 
                                            : normie.status === 'Zombie'
                                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10'
                                              : 'text-zinc-400 bg-zinc-800 border-zinc-850'
                                        }`}>
                                          Lvl {normie.level}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-zinc-400 font-sans truncate mt-0.5">
                                        {desc}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                                    {idx === 0 ? 'Just now' : idx === 1 ? '5m ago' : idx === 2 ? '12m ago' : '20m ago'}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* RIGHT COLUMN AREA: Live Activity Feed & Top Traits (7D) */}
                  <div className="lg:col-span-4 space-y-8">
                    
                    {/* Live Activity Feed Card */}
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                        <h4 className="text-sm font-bold font-sans text-white">Live Activity Feed</h4>
                        <button 
                          onClick={() => setActiveTab('signals')} 
                          className="text-xs text-zinc-400 hover:text-white transition-colors font-sans cursor-pointer"
                        >
                          View all
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        {loading && activities.length === 0 ? (
                          Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 animate-pulse">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-850 shrink-0" />
                                <div className="space-y-1.5">
                                  <div className="h-3 w-16 bg-zinc-850 rounded" />
                                  <div className="h-2 w-10 bg-zinc-850 rounded animate-pulse" />
                                </div>
                              </div>
                              <div className="h-2 w-8 bg-zinc-850 rounded" />
                            </div>
                          ))
                        ) : (
                          activities.slice(0, 8).map((act) => {
                            let icon = <Pencil className="w-3.5 h-3.5 text-emerald-400" />;
                            let iconBg = 'bg-emerald-500/10 border-emerald-500/20';
                            let label = 'Canvas updated';
                            
                            if (act.type === 'zombie_conversion') {
                              icon = <Skull className="w-3.5 h-3.5 text-purple-400" />;
                              iconBg = 'bg-purple-500/10 border-purple-500/20';
                              label = 'Zombie conversion';
                            } else if (act.type === 'normie_transferred') {
                              icon = <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />;
                              iconBg = 'bg-blue-500/10 border-blue-500/20';
                              label = 'Normie transferred';
                            } else if (act.type === 'legendary_acquired') {
                              icon = <Star className="w-3.5 h-3.5 text-[#f59e0b]" />;
                              iconBg = 'bg-[#d97706]/10 border-[#d97706]/20';
                              label = 'Legendary acquired';
                            } else if (act.type === 'normie_burned') {
                              icon = <Flame className="w-3.5 h-3.5 text-red-400" />;
                              iconBg = 'bg-red-500/10 border-red-500/20';
                              label = 'Normie burned';
                            }

                            return (
                              <div 
                                key={act.id} 
                                onClick={() => {
                                  onSelectNormie({
                                    id: act.normieId,
                                    name: `Normie #${act.normieId}`,
                                    imageUrl: `https://api.normies.art/normie/${act.normieId}/image.png`,
                                    owner: act.userAddress,
                                    level: 1,
                                    status: act.type === 'zombie_conversion' ? 'Zombie' : act.type === 'legendary_acquired' ? 'Legendary' : 'Active',
                                    updatedAt: act.timeAgo,
                                    traits: [],
                                    score: 50,
                                    rank: 5000
                                  });
                                }}
                                className="flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-900/30 px-1 py-1 rounded transition-all group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg ${iconBg} border flex items-center justify-center shrink-0`}>
                                    {icon}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs text-zinc-300 font-sans block truncate font-medium group-hover:text-white transition-colors">{label}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">#{act.normieId}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono shrink-0">{act.timeAgo}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Top Traits (7D) Card */}
                    <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                        <h4 className="text-sm font-bold font-sans text-white">Top Traits (7D)</h4>
                        <button 
                          onClick={() => { setActiveTab('explore'); setDiscoverPage(1); }} 
                          className="text-xs text-zinc-400 hover:text-white transition-colors font-sans cursor-pointer"
                        >
                          View all
                        </button>
                      </div>

                      <div className="space-y-4 pt-1">
                        {loading && topTraits.length === 0 ? (
                          Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="space-y-1.5 animate-pulse">
                              <div className="flex items-center justify-between">
                                <div className="h-3 w-20 bg-zinc-850 rounded" />
                                <div className="h-3 w-8 bg-zinc-850 rounded" />
                              </div>
                              <div className="h-1.5 w-full bg-[#060608] rounded-full" />
                            </div>
                          ))
                        ) : (
                          topTraits.map((trait, idx) => {
                            const colors = [
                              { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500' },
                              { text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', bar: 'bg-blue-500' },
                              { text: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', bar: 'bg-purple-500' },
                              { text: 'text-[#f59e0b]', bg: 'bg-amber-500/10 border-amber-500/20', bar: 'bg-[#f59e0b]' },
                              { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', bar: 'bg-red-500' }
                            ];
                            const col = colors[idx % colors.length];
                            
                            return (
                              <div key={trait.id} className="space-y-1.5 animate-fadeIn">
                                <div className="flex items-center justify-between text-xs font-sans">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded ${col.bg} ${col.text} border flex items-center justify-center text-[9px] font-mono font-bold`}>
                                      {idx + 1}
                                    </span>
                                    <span className="text-zinc-300 font-medium">{trait.name} <span className="text-[10px] text-zinc-500 font-normal">({trait.category})</span></span>
                                  </div>
                                  <span className={`${col.text} font-mono font-semibold`}>{trait.percentage}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#060608] rounded-full overflow-hidden">
                                  <div className={`h-full ${col.bar} rounded-full`} style={{ width: `${trait.percentage}%` }} />
                                </div>
                              </div>
                            );
                          })
                        )}
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
                    <h1 className="text-[32px] font-bold font-sans text-white tracking-tight">Discover</h1>
                    <p className="text-[14px] text-zinc-400 font-sans mt-2">Find and explore Normies across the ecosystem.</p>
                  </div>

                  {/* Horizontal Scrollable Category Filter Pills with Right Arrow */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar shrink-0 flex-1">
                      {[
                        'Trending', 'Top Rarity', 'Recently Updated', 'Zombie', 'Legendary', 'Recently Transferred', 'Recently Burned'
                      ].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setActiveCategoryFilter(cat);
                            setDiscoverPage(1);
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all whitespace-nowrap border ${
                            activeCategoryFilter === cat
                              ? 'bg-white text-black border-transparent'
                              : 'bg-[#09090b] text-zinc-400 hover:text-white border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => showNotification('More categories loaded')}
                      className="w-8 h-8 rounded-lg border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-colors shrink-0 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search bar and Filters sitting directly on dark background */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      
                      {/* Left side Filter Dropdowns & Clear all button */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        
                        {/* Trait Select */}
                        <div className="relative flex items-center bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 rounded-lg px-3.5 py-1.5 text-xs text-zinc-300 font-sans cursor-pointer transition-colors">
                          <span className="text-zinc-500 font-medium mr-1">Trait</span>
                          <select 
                            value={selectedTrait}
                            onChange={(e) => {
                              setSelectedTrait(e.target.value);
                              setDiscoverPage(1);
                            }}
                            className="bg-transparent text-white outline-none cursor-pointer font-sans font-medium pr-5 appearance-none"
                          >
                            <option value="All">All</option>
                            <option value="Alien">Alien</option>
                            <option value="Cyborg">Cyborg</option>
                            <option value="Undead">Undead</option>
                            <option value="Mohawk">Mohawk</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
                        </div>

                        {/* Status Select */}
                        <div className="relative flex items-center bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 rounded-lg px-3.5 py-1.5 text-xs text-zinc-300 font-sans cursor-pointer transition-colors">
                          <span className="text-zinc-500 font-medium mr-1">Status</span>
                          <select 
                            value={selectedStatus}
                            onChange={(e) => {
                              setSelectedStatus(e.target.value);
                              setActiveCategoryFilter(e.target.value === 'All' ? 'Trending' : e.target.value);
                              setDiscoverPage(1);
                            }}
                            className="bg-transparent text-white outline-none cursor-pointer font-sans font-medium pr-5 appearance-none"
                          >
                            <option value="All">All</option>
                            <option value="Zombie">Zombie</option>
                            <option value="Legendary">Legendary</option>
                            <option value="Burned">Burned</option>
                            <option value="Active">Active</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
                        </div>

                        {/* Rarity Select */}
                        <div className="relative flex items-center bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 rounded-lg px-3.5 py-1.5 text-xs text-zinc-300 font-sans cursor-pointer transition-colors">
                          <span className="text-zinc-500 font-medium mr-1">Rarity</span>
                          <select 
                            value={selectedRarity}
                            onChange={(e) => {
                              setSelectedRarity(e.target.value);
                              setDiscoverPage(1);
                            }}
                            className="bg-transparent text-white outline-none cursor-pointer font-sans font-medium pr-5 appearance-none"
                          >
                            <option value="All">All</option>
                            <option value="Top 1%">Top 1%</option>
                            <option value="Top 5%">Top 5%</option>
                            <option value="Top 10%">Top 10%</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
                        </div>

                        {/* Level Select */}
                        <div className="relative flex items-center bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 rounded-lg px-3.5 py-1.5 text-xs text-zinc-300 font-sans cursor-pointer transition-colors">
                          <span className="text-zinc-500 font-medium mr-1">Level</span>
                          <select 
                            value={selectedLevel}
                            onChange={(e) => {
                              setSelectedLevel(e.target.value);
                              setDiscoverPage(1);
                            }}
                            className="bg-transparent text-white outline-none cursor-pointer font-sans font-medium pr-5 appearance-none"
                          >
                            <option value="All">All</option>
                            <option value="Level 10+">Level 10+</option>
                            <option value="Level 25+">Level 25+</option>
                            <option value="Level 50+">Level 50+</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
                        </div>

                        {/* Owner Select */}
                        <div className="relative flex items-center bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 rounded-lg px-3.5 py-1.5 text-xs text-zinc-300 font-sans cursor-pointer transition-colors">
                          <span className="text-zinc-500 font-medium mr-1">Owner</span>
                          <select 
                            value={selectedOwner}
                            onChange={(e) => {
                              setSelectedOwner(e.target.value);
                              setDiscoverPage(1);
                            }}
                            className="bg-transparent text-white outline-none cursor-pointer font-sans font-medium pr-5 appearance-none max-w-[120px]"
                          >
                            <option value="All">All</option>
                            {Array.from(new Set(discoverNormies.map(n => n.owner))).filter(Boolean).map((ownerRaw) => {
                              const owner = ownerRaw as string;
                              return (
                                <option key={owner} value={owner}>
                                  {owner.length > 10 ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : owner}
                                </option>
                              );
                            })}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
                        </div>

                        <button 
                          onClick={handleClearAllFilters}
                          className="text-xs text-zinc-500 hover:text-white font-sans font-medium px-2 py-1.5 transition-colors cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>

                      {/* Right side Sort Dropdown */}
                      <div className="relative flex items-center bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 rounded-lg px-3.5 py-1.5 text-xs text-zinc-300 font-sans cursor-pointer transition-colors ml-auto">
                        <span className="text-zinc-500 font-medium mr-1">Sort by:</span>
                        <select 
                          value={discoverSort}
                          onChange={(e) => {
                            setDiscoverSort(e.target.value);
                            setDiscoverPage(1);
                          }}
                          className="bg-transparent text-white outline-none cursor-pointer font-sans font-medium pr-5 appearance-none"
                        >
                          <option value="rank">Trending</option>
                          <option value="score">Rarity Rank</option>
                          <option value="id">Token ID</option>
                          <option value="level">Level</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 pointer-events-none" />
                      </div>

                    </div>
                  </div>

                  {discoverLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                      <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                      <span className="text-xs text-zinc-500 font-mono">Querying real-time records...</span>
                    </div>
                  ) : discoverNormies.length === 0 ? (
                    <div className="py-24 text-center text-xs text-zinc-500 font-mono bg-[#09090b] border border-zinc-800 rounded-xl">
                      No Normies matching your filter constraints were found.
                    </div>
                  ) : (
                    <>
                      {/* Catalog Grid exactly mirroring Image 1 style with 100% precision */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {discoverNormies.map((normie, idx) => {
                          const isWatchlisted = watchlist.some(w => w.id === normie.id);
                          // Calculate a realistic display rank number based on catalog indexes
                          const displayRankNum = (discoverPage - 1) * 12 + idx + 1;
                          
                          return (
                            <div 
                              key={normie.id}
                              onClick={() => onSelectNormie(normie)}
                              className="bg-[#09090b] border border-zinc-800/80 rounded-[14px] p-4 hover:border-zinc-700/90 transition-all duration-300 cursor-pointer flex flex-col relative group select-none"
                            >
                              {/* Rarity Rank Badge left aligned inside a small square box */}
                              <div className="relative aspect-square w-full rounded-xl bg-[#030303] overflow-hidden mb-4 border border-zinc-900 flex items-center justify-center">
                                <div className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-sans font-bold border ${
                                  displayRankNum === 1 ? 'bg-[#eab308] text-black border-yellow-400' :
                                  displayRankNum === 2 ? 'bg-[#94a3b8] text-white border-slate-300' :
                                  displayRankNum === 3 ? 'bg-[#ea580c] text-white border-orange-500' :
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
                                  className="absolute top-3 right-3 z-10 p-1 rounded-md bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white transition-colors"
                                >
                                  <Star className={`w-3.5 h-3.5 shrink-0 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
                                </button>

                                <img 
                                  src={`https://api.normies.art/normie/${normie.id}/image.png`} 
                                  alt={normie.name} 
                                  className="w-full h-full object-contain scale-[1.02] group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src = normie.imageUrl;
                                  }}
                                />
                              </div>

                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="text-base font-bold font-sans text-white tracking-tight">#{normie.id}</div>
                                  <div className="text-xs text-zinc-400 font-sans mt-0.5">Level {normie.level}</div>
                                  
                                  {normie.status === 'Legendary' && (
                                    <div className="flex items-center gap-1 text-[11px] text-[#a855f7] font-bold mt-1.5">
                                      <Star className="w-3 h-3 fill-[#a855f7] text-[#a855f7] shrink-0" />
                                      <span>Legendary</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-4 pt-3.5 border-t border-zinc-800/60 flex flex-col gap-2 text-xs font-sans">
                                  <div className="flex items-center justify-between text-zinc-500">
                                    <span>Rarity</span>
                                    <span className="text-zinc-300 font-semibold font-mono">{normie.score ?? '95.0'}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-zinc-500">
                                    <span>Owner</span>
                                    <span className="text-zinc-300 font-mono text-[11px]">
                                      {displayAddress(normie.owner)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Section */}
                      <div className="flex items-center justify-between border-t border-zinc-900 pt-8 mt-4">
                        <button 
                          disabled={discoverPage === 1}
                          onClick={() => setDiscoverPage(prev => Math.max(1, prev - 1))}
                          className="bg-[#09090b] border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-400 px-4 py-2 rounded-lg text-xs font-sans flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                          <span>Previous</span>
                        </button>
                        
                        <div className="flex items-center gap-1 text-xs font-sans">
                          {[1, 2, 3, 4, 5].map((page) => (
                            <button
                              key={page}
                              onClick={() => setDiscoverPage(page)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold transition-colors ${
                                discoverPage === page
                                  ? 'bg-zinc-900 border border-zinc-800 text-white'
                                  : 'text-zinc-500 hover:text-white'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          <span className="px-1 text-zinc-600">...</span>
                          <button
                            onClick={() => setDiscoverPage(120)}
                            className={`w-10 h-8 rounded-lg flex items-center justify-center font-semibold ${
                              discoverPage === 120
                                ? 'bg-zinc-900 border border-zinc-800 text-white'
                                : 'text-zinc-500 hover:text-white'
                            }`}
                          >
                            120
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => setDiscoverPage(prev => prev + 1)}
                          className="bg-[#09090b] border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-300 px-4 py-2 rounded-lg text-xs font-sans flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
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
                                          <span>Operator: <span className="text-zinc-300">{displayAddress(act.userAddress)}</span></span>
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
          </div>

      </main>

    </div>
  );
}
