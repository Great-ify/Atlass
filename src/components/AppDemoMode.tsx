import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Compass, Activity, Shield, Flame, User, Clock, TrendingUp, Eye, 
  Layers, Database, ArrowRight, ArrowUp, ArrowDown, Star, Skull, Sparkles, 
  Wallet, Bell, LogOut, Check, Zap, Info, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  Pencil, ArrowLeftRight, Grid, Lock, Hexagon, Home, Settings, FileText, Tv, ChevronDown, ArrowLeft,
  Menu, X, SlidersHorizontal, AlertTriangle
} from 'lucide-react';
import { ActivityEvent, MetricItem, NormieItem } from '../types';
import { 
  fetchLiveMetrics, 
  fetchCustomizedEvents, 
  fetchRealNormies, 
  getNormieById,
  fetchTopTraits,
  TraitStatItem,
  mapApiNormieToItem
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

  const getFallbackAddress = (id: string) => {
    const seed = parseInt(id) || 12345;
    return '0x' + Array.from({ length: 40 }, (_, i) => ((seed * (i + 17) + 5) % 16).toString(16)).join('');
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const selectTab = (tab: 'home' | 'explore' | 'signals' | 'watchlist') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

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
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoverTotalItems, setDiscoverTotalItems] = useState(1200);
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
          timeAgo: idx === 0 ? '45s ago' : `${1 + idx * 4}m ago`,
          timestamp: Date.now() - (45 + idx * 240) * 1000
        });
      });

      // Add Legendary acquired events
      const legendaryList = liveNor.filter(n => n.status === 'Legendary' || n.rank < 100);
      legendaryList.forEach((leg, idx) => {
        blendedEvents.push({
          id: `leg_${leg.id}_${idx}`,
          type: 'legendary_acquired',
          title: 'Legendary acquired',
          normieName: `Normie #${leg.id}`,
          normieId: leg.id,
          userAddress: leg.owner.length > 10 ? leg.owner.slice(0, 6) + '...' + leg.owner.slice(-4) : leg.owner,
          timeAgo: idx === 0 ? '1m ago' : `${1 + idx * 5}m ago`,
          timestamp: Date.now() - (1 + idx * 5) * 60000
        });
      });

      // Add Burned events
      const burnedList = liveNor.filter(n => n.status === 'Burned');
      // If there are none from liveNor, make sure we create at least some from live metrics/dummy
      if (burnedList.length === 0) {
        // Generate deterministic burned events based on some of the loaded normies to keep it dynamic and tied to API data
        const candidates = liveRec.slice(0, 3);
        candidates.forEach((cand, idx) => {
          // Change ID slightly to simulate on-chain burned normie
          const burnId = (parseInt(cand.id) + 1).toString();
          blendedEvents.push({
            id: `burn_${burnId}_${idx}`,
            type: 'normie_burned',
            title: 'Normie burned',
            normieName: `Normie #${burnId}`,
            normieId: burnId,
            userAddress: cand.owner.length > 10 ? cand.owner.slice(0, 6) + '...' + cand.owner.slice(-4) : cand.owner,
            timeAgo: idx === 0 ? '2m ago' : `${2 + idx * 5}m ago`,
            timestamp: Date.now() - (2 + idx * 5) * 60000
          });
        });
      } else {
        burnedList.forEach((burn, idx) => {
          blendedEvents.push({
            id: `burn_${burn.id}_${idx}`,
            type: 'normie_burned',
            title: 'Normie burned',
            normieName: `Normie #${burn.id}`,
            normieId: burn.id,
            userAddress: burn.owner.length > 10 ? burn.owner.slice(0, 6) + '...' + burn.owner.slice(-4) : burn.owner,
            timeAgo: `${2 + idx * 5}m ago`,
            timestamp: Date.now() - (2 + idx * 5) * 60000
          });
        });
      }

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
          value: displayAddress(firstCustomized?.userAddress || getFallbackAddress(firstCustomized?.normieId || '1189')),
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
      console.warn('Failed to load dashboard:', err);
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
      setDiscoverError(null);
      try {
        const hasFilters = 
          discoverSearch.trim() !== '' ||
          activeCategoryFilter !== 'Trending' ||
          selectedTrait !== 'All' ||
          selectedStatus !== 'All' ||
          selectedRarity !== 'All' ||
          selectedLevel !== 'All' ||
          selectedOwner !== 'All';

        if (hasFilters) {
          // If search query is a specific numeric ID, we can retrieve that ID directly!
          const cleanQuery = discoverSearch.trim().replace('#', '');
          const isNumeric = /^\d+$/.test(cleanQuery);
          
          if (isNumeric && discoverSearch.trim() !== '') {
            const exactItem = await getNormieById(cleanQuery);
            if (exactItem && exactItem.rank > 0) {
              setDiscoverNormies([exactItem]);
              setDiscoverTotalItems(1);
              setDiscoverLoading(false);
              return;
            } else {
              setDiscoverNormies([]);
              setDiscoverTotalItems(0);
              setDiscoverLoading(false);
              return;
            }
          }

          // Fetch a solid set (100 items limit) from the API for high-fidelity client-side search/filtering
          let finalSort = discoverSort;
          let finalOrder = discoverOrder;
          
          if (activeCategoryFilter === 'Top Rarity') {
            finalSort = 'rank';
            finalOrder = 'asc';
          } else if (activeCategoryFilter === 'Recently Updated') {
            finalSort = 'updatedAt';
            finalOrder = 'desc';
          } else if (activeCategoryFilter === 'Recently Transferred') {
            finalSort = 'updatedAt';
            finalOrder = 'desc';
          }

          const results = await fetchRealNormies({
            sort: finalSort,
            order: finalOrder,
            limit: 100, // Maximum items for reliable local filtering
            page: 1
          });

          if (!results || results.length === 0) {
            setDiscoverNormies([]);
            setDiscoverTotalItems(0);
            setDiscoverLoading(false);
            return;
          }

          let filtered = [...results];

          // 1. Search Query Filter (text based)
          if (discoverSearch.trim() !== '') {
            const q = discoverSearch.toLowerCase().trim();
            filtered = filtered.filter(n => 
              n.name.toLowerCase().includes(q) ||
              n.id.toString() === q ||
              n.owner.toLowerCase().includes(q) ||
              n.status.toLowerCase().includes(q) ||
              n.traits.some(t => t.value.toLowerCase().includes(q) || t.trait_type.toLowerCase().includes(q))
            );
          }

          // 2. Active Category Filter
          if (activeCategoryFilter === 'Zombie') {
            filtered = filtered.filter(n => n.status === 'Zombie');
          } else if (activeCategoryFilter === 'Legendary') {
            filtered = filtered.filter(n => n.status === 'Legendary');
          } else if (activeCategoryFilter === 'Recently Burned') {
            filtered = filtered.filter(n => n.status === 'Burned');
          }

          // 3. Status Select
          if (selectedStatus !== 'All') {
            filtered = filtered.filter(n => n.status === selectedStatus);
          }

          // 4. Trait Select
          if (selectedTrait !== 'All') {
            const lowerTrait = selectedTrait.toLowerCase();
            filtered = filtered.filter(n => 
              n.traits.some(t => t.value.toLowerCase().includes(lowerTrait) || t.trait_type.toLowerCase().includes(lowerTrait))
            );
          }

          // 5. Level Select
          if (selectedLevel !== 'All') {
            if (selectedLevel === 'Level 10+') {
              filtered = filtered.filter(n => n.level >= 10);
            } else if (selectedLevel === 'Level 25+') {
              filtered = filtered.filter(n => n.level >= 25);
            } else if (selectedLevel === 'Level 50+') {
              filtered = filtered.filter(n => n.level >= 50);
            }
          }

          // 6. Rarity Select
          if (selectedRarity !== 'All') {
            if (selectedRarity === 'Top 1%') {
              filtered = filtered.filter(n => n.rank <= 100);
            } else if (selectedRarity === 'Top 5%') {
              filtered = filtered.filter(n => n.rank <= 500);
            } else if (selectedRarity === 'Top 10%') {
              filtered = filtered.filter(n => n.rank <= 1000);
            }
          }

          // 7. Owner Select
          if (selectedOwner !== 'All') {
            filtered = filtered.filter(n => n.owner === selectedOwner);
          }

          setDiscoverTotalItems(filtered.length);

          // Paginate filtered results client-side (10 items per page)
          const startIndex = (discoverPage - 1) * 10;
          setDiscoverNormies(filtered.slice(startIndex, startIndex + 10));
        } else {
          // Unfiltered search: Server-Side paging with limit 10
          const query = new URLSearchParams();
          query.append('limit', '10');
          query.append('sort', discoverSort);
          query.append('order', discoverOrder);
          query.append('page', discoverPage.toString());

          const res = await fetch(`/api/normies/rarity/normies?${query.toString()}`);
          if (!res.ok) throw new Error('Failed to fetch normies from API');
          const data = await res.json();
          
          const list = Array.isArray(data) ? data : (data.items || data.normies || data.data || []);
          const mapped = list.map((item: any) => mapApiNormieToItem(item));
          
          setDiscoverNormies(mapped);
          setDiscoverTotalItems(data.total || 10000);
        }
      } catch (err) {
        console.warn('Failed to load discover data:', err);
        setDiscoverError(err instanceof Error ? err.message : 'Failed to synchronize with Normies contract indices');
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
        console.warn('Failed to parse watchlist:', err);
      }
    } else {
      setWatchlist([]);
    }

    const savedStr = localStorage.getItem('atlas_saved_searches');
    if (savedStr) {
      try {
        setSavedSearches(JSON.parse(savedStr));
      } catch (err) {
        console.warn('Failed to parse saved searches:', err);
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

  // Helper to format metric value
  const formatMetricValue = (val: string) => {
    return (val === '0' || val === '0,000' || val === '') ? '--' : val;
  };

  // Dynamic metrics helpers
  const getMetricData = (id: string, defaultVal: string, defaultChange: string, defaultSpark: number[]) => {
    const m = metrics?.find(item => item.id === id);
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

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        />
      )}

      {/* 1. PERSISTENT/COLLAPSIBLE SIDEBAR NAVIGATION */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 md:flex flex-col border-r border-zinc-800 bg-[#09090b] select-none transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        }`}
      >
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-900 justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <Hexagon className="w-6 h-6 text-white shrink-0 fill-white" />
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black text-white tracking-[0.2em] uppercase font-sans leading-none">ATLAS</span>
              </div>
            )}
          </div>
          {/* Collapse toggle button for desktop */}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg border border-zinc-850 bg-[#0c0c0e] text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex md:hidden p-1.5 rounded-lg border border-zinc-850 bg-[#0c0c0e] text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Navigation list */}
        <nav className="p-4 space-y-1.5 flex-1 flex flex-col items-stretch">
          <button 
            onClick={() => {
              onClose();
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/40 ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-3'
            }`}
            title={sidebarCollapsed ? "Back to Landing" : undefined}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Back to Landing</span>}
          </button>

          <button 
            onClick={() => selectTab('home')}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-3'
            } ${
              activeTab === 'home' 
                ? 'bg-zinc-800/40 text-white font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
            title={sidebarCollapsed ? "Home" : undefined}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Home</span>}
          </button>

          <button 
            onClick={() => { selectTab('explore'); setDiscoverPage(1); }}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-3'
            } ${
              activeTab === 'explore' 
                ? 'bg-zinc-800/40 text-white font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
            title={sidebarCollapsed ? "Discover" : undefined}
          >
            <Compass className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Discover</span>}
          </button>

          <button 
            onClick={() => selectTab('signals')}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-3'
            } ${
              activeTab === 'signals' 
                ? 'bg-zinc-800/40 text-white font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
            title={sidebarCollapsed ? "Signals" : undefined}
          >
            <Activity className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Signals</span>}
          </button>

          <button 
            onClick={() => selectTab('watchlist')}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-3'
            } ${
              activeTab === 'watchlist' 
                ? 'bg-zinc-800/40 text-white font-bold' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
            title={sidebarCollapsed ? "Watchlists" : undefined}
          >
            <Tv className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Watchlists</span>}
          </button>

        </nav>

        {/* API Status Widget - Identical to Image */}
        {!sidebarCollapsed ? (
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
        ) : (
          <div className="mx-auto mb-4 flex items-center justify-center relative group cursor-pointer" title="API Status: Operational">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          </div>
        )}

        {/* User Profile Footer */}
        <div className="relative border-t border-zinc-800/60 bg-[#09090b]">
          {/* Collapsible Profile Popup Menu */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute bottom-16 bg-[#111113] border border-zinc-800 p-3 rounded-xl shadow-2xl z-50 space-y-2 ${
                  sidebarCollapsed ? 'left-20 w-52' : 'left-4 right-4'
                }`}
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
            className={`p-4 flex items-center cursor-pointer hover:bg-zinc-900/30 transition-colors ${
              sidebarCollapsed ? 'justify-center' : 'justify-between'
            }`}
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
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-mono font-bold text-white tracking-tight truncate">
                    {walletConnected ? 'User' : 'Guest'}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-sans tracking-tight">
                    View Profile
                  </span>
                </div>
              )}
            </div>
            {!sidebarCollapsed && <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
          </div>

        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT PORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#060608]">
        
        {/* Top Navigation Bar - Exact Match to Design */}
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-4 md:px-8 bg-[#060608] shrink-0 relative gap-3 md:gap-4">
          
          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2.5 rounded-xl border border-zinc-800/60 bg-[#0c0c0e] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer shrink-0"
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Universal Search Clicker */}
          <button 
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 bg-[#0c0c0e] border border-zinc-800/60 rounded-xl px-4 py-3 flex-1 md:w-[460px] md:flex-none text-left text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition-all text-xs font-sans min-w-0"
          >
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="flex-1 text-zinc-500 font-sans truncate">
              <span className="hidden xs:inline">Search Normie ID, wallet, trait...</span>
              <span className="inline xs:hidden">Search...</span>
            </span>
            <span className="hidden sm:inline-block bg-[#09090b] border border-zinc-800/80 rounded-md text-[10px] px-2 py-0.5 font-mono text-zinc-500 shrink-0">⌘ K</span>
          </button>

          {/* Connected wallet and notification controls */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            
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
                      className="absolute right-0 mt-2.5 w-72 xs:w-80 bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl z-50 divide-y divide-zinc-800 overflow-hidden text-left"
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
                                (async () => {
                                  const matched = await getNormieById(act.normieId);
                                  if (matched) onSelectNormie(matched);
                                })();
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
              className="flex items-center gap-2 bg-[#0c0c0e] border border-zinc-800/60 rounded-xl px-2.5 py-2 md:px-3.5 md:py-2 cursor-pointer hover:border-zinc-700 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-[#18181b] border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src="https://api.normies.art/normie/152/image.png" 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="hidden sm:inline text-xs font-mono font-bold text-white tracking-tight">
                {walletConnected ? 'User' : 'Guest'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
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
                        <span className="text-2xl font-bold font-mono text-white block">{formatMetricValue(mCanvas.value)}</span>
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
                        <span className="text-2xl font-bold font-mono text-white block">{formatMetricValue(mZombies.value)}</span>
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
                        <span className="text-2xl font-bold font-mono text-white block">{formatMetricValue(mTransfers.value)}</span>
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
                        <span className="text-2xl font-bold font-mono text-white block">{formatMetricValue(mLegendary.value)}</span>
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
                        <span className="text-2xl font-bold font-mono text-white block">{formatMetricValue(mBurned.value)}</span>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                      
                      {/* Real-time Search Input */}
                      <div className="relative flex-1 max-w-md w-full">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={discoverSearch}
                          onChange={(e) => {
                            setDiscoverSearch(e.target.value);
                            setDiscoverPage(1);
                          }}
                          placeholder="Search by ID, Trait, Status, or Owner Address..."
                          className="w-full bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500 rounded-lg pl-10 pr-10 py-2.5 text-xs font-sans outline-none transition-all"
                        />
                        {discoverSearch && (
                          <button
                            onClick={() => {
                              setDiscoverSearch('');
                              setDiscoverPage(1);
                            }}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
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
                            {Array.from(new Set([...trendingNormies, ...recentNormies, ...discoverNormies].map(n => n.owner))).filter(Boolean).map((ownerRaw) => {
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
                  ) : discoverError ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-[#09090b]/85 border border-red-900/30 rounded-xl space-y-4 max-w-lg mx-auto text-center animate-fadeIn">
                      <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white font-sans">Ecosystem Index Sync Failed</h3>
                        <p className="text-xs text-zinc-400 font-mono leading-relaxed">{discoverError}</p>
                      </div>
                      <button 
                        onClick={handleClearAllFilters}
                        className="px-4 py-2 bg-red-950/60 border border-red-500/30 text-red-200 rounded-lg text-xs font-mono hover:bg-red-900/40 transition-all cursor-pointer"
                      >
                        Reset Index Constraints
                      </button>
                    </div>
                  ) : discoverNormies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-[#09090b]/80 border border-zinc-800 rounded-xl space-y-4 max-w-lg mx-auto text-center animate-fadeIn">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white font-sans">No Matches Found</h3>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">No Normies match your current search queries or advanced filter selections.</p>
                      </div>
                      <button 
                        onClick={handleClearAllFilters}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-sans transition-all cursor-pointer"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Catalog Grid exactly mirroring Image 1 style with 100% precision */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {discoverNormies.map((normie) => {
                          const isWatchlisted = watchlist.some(w => w.id === normie.id);
                          return (
                            <div 
                              key={normie.id}
                              onClick={() => onSelectNormie(normie)}
                              className="bg-[#0c0c0e]/60 border border-zinc-900/85 hover:border-zinc-800/90 rounded-[14px] p-4 transition-all duration-300 cursor-pointer flex flex-col relative group select-none"
                            >
                              {/* Rarity Rank Badge left aligned inside a small square box */}
                              <div className="relative aspect-square w-full rounded-xl bg-[#0f0f12] overflow-hidden mb-4 border border-zinc-900/60 flex items-center justify-center">
                                <div className={`absolute top-3 left-3 z-10 px-1.5 h-5 rounded-md flex items-center justify-center text-[10px] font-sans font-bold border ${
                                  normie.rank === 1 ? 'bg-[#eab308] text-black border-transparent' :
                                  normie.rank <= 10 ? 'bg-purple-900/60 text-purple-200 border-purple-500/30' :
                                  normie.rank <= 100 ? 'bg-indigo-900/60 text-indigo-200 border-indigo-500/30' :
                                  'bg-zinc-900/60 text-zinc-400 border-zinc-800/80'
                                }`}>
                                  Rank #{normie.rank || normie.id}
                                </div>

                                {/* Watchlist toggle star icon right aligned */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleWatchlist(normie);
                                  }}
                                  className="absolute top-3 right-3 z-10 p-1 text-zinc-500 hover:text-white transition-colors"
                                >
                                  <Star className={`w-4 h-4 shrink-0 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
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
                                  <div className="text-lg font-bold font-sans text-white tracking-tight">#{normie.id}</div>
                                  <div className="text-xs text-zinc-400 font-sans mt-0.5">Level {normie.level}</div>
                                  
                                  {normie.status === 'Legendary' && (
                                    <div className="flex items-center gap-1 text-[11px] text-[#a855f7] font-semibold font-sans mt-1">
                                      <Star className="w-3 h-3 fill-[#a855f7] text-[#a855f7] shrink-0" />
                                      <span>Legendary</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-4 pt-3.5 border-t border-zinc-900 flex flex-col gap-2 text-xs font-sans">
                                  <div className="flex items-center justify-between text-zinc-500">
                                    <span>Rarity</span>
                                    <span className="text-zinc-300 font-semibold font-mono">{normie.score ? normie.score.toFixed(1) : '95.0'}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-zinc-500">
                                    <span>Owner</span>
                                    <span className="text-zinc-300 font-semibold font-mono text-[11px]">
                                      {normie.owner && normie.owner.length > 10 
                                        ? `${normie.owner.slice(0, 4)}...${normie.owner.slice(-4)}`
                                        : normie.owner || '0x00...0000'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Section */}
                      <div className="flex items-center justify-between border-t border-zinc-900 pt-8 mt-4 animate-fadeIn">
                        <button 
                          disabled={discoverPage === 1}
                          onClick={() => {
                            setDiscoverPage(prev => Math.max(1, prev - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-[#0c0c0e]/80 border border-zinc-900 hover:border-zinc-700 hover:text-white text-zinc-400 px-4 py-2 rounded-lg text-xs font-sans flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                          <span>Previous</span>
                        </button>
                        
                        <div className="flex items-center gap-1 text-xs font-sans">
                          {(() => {
                            const total = Math.ceil(discoverTotalItems / 10);
                            const getPageNumbers = () => {
                              if (total <= 6) {
                                return Array.from({ length: total }, (_, i) => i + 1);
                              }
                              if (discoverPage <= 3) {
                                return [1, 2, 3, 4, 5];
                              } else if (discoverPage >= total - 2) {
                                return [total - 4, total - 3, total - 2, total - 1, total];
                              } else {
                                return [discoverPage - 2, discoverPage - 1, discoverPage, discoverPage + 1, discoverPage + 2];
                              }
                            };
                            return (
                              <>
                                {getPageNumbers().map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => {
                                      setDiscoverPage(page);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold transition-colors ${
                                      discoverPage === page
                                        ? 'bg-[#1e1e24] text-white border border-zinc-800'
                                        : 'text-zinc-500 hover:text-white'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                                {total > 5 && discoverPage < total - 2 && (
                                  <>
                                    <span className="px-1 text-zinc-600">...</span>
                                    <button
                                      onClick={() => {
                                        setDiscoverPage(total);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className={`w-10 h-8 rounded-lg flex items-center justify-center font-semibold ${
                                        discoverPage === total
                                          ? 'bg-[#1e1e24] text-white border border-zinc-800'
                                          : 'text-zinc-500 hover:text-white'
                                      }`}
                                    >
                                      {total}
                                    </button>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        <button 
                          disabled={discoverPage >= Math.ceil(discoverTotalItems / 10)}
                          onClick={() => {
                            setDiscoverPage(prev => prev + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-[#0c0c0e]/80 border border-zinc-900 hover:border-zinc-700 hover:text-white text-zinc-300 px-4 py-2 rounded-lg text-xs font-sans flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
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
                    <h1 className="text-3xl font-bold font-sans text-white tracking-tight">Signals</h1>
                    <p className="text-sm text-zinc-400 font-sans mt-1">Real-time activity across the Normies ecosystem.</p>
                  </div>

                  {/* Filter Pills for event types exactly matching the image */}
                  <div className="flex items-center gap-2 shrink-0 justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 mr-2">
                      {['All', 'Canvas', 'Zombie', 'Legendary', 'Transfers', 'Burns'].map((item) => (
                        <button
                          key={item}
                          onClick={() => setSignalsFilter(item)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all border ${
                            signalsFilter === item
                              ? 'bg-white text-black border-transparent'
                              : 'bg-[#0c0c0e]/80 text-zinc-400 hover:text-white border-zinc-900 hover:border-zinc-700'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <button className="p-2 bg-[#0c0c0e]/80 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Signals List - individual cards spaced out with gap */}
                  <div className="space-y-3">
                    {activities.length === 0 ? (
                      <div className="py-24 text-center text-xs text-zinc-500 font-mono bg-[#0c0c0e]/40 border border-zinc-900 rounded-xl">
                        No live signals matching your criteria have been indexed yet.
                      </div>
                    ) : (
                      activities
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
                          
                          // Determine the operator or from/to addresses based on action type
                          let displayAddr = '';
                          if (act.type === 'normie_transferred') {
                            const hash1 = (parseInt(act.normieId || '0') * 17 + 1024) % 10000;
                            const hash2 = (parseInt(act.normieId || '0') * 43 + 2048) % 10000;
                            const sender = `0x8a${hash1.toString(16).padEnd(4, 'a')}...21e0`;
                            const receiver = act.userAddress ? (act.userAddress.length > 10 ? act.userAddress.slice(0, 4) + '...' + act.userAddress.slice(-4) : act.userAddress) : `0x7b${hash2.toString(16).padEnd(4, 'c')}...c6d2`;
                            displayAddr = `from ${sender} to ${receiver}`;
                          } else {
                            const addr = act.userAddress || getFallbackAddress(act.normieId || '1189');
                            const formatted = displayAddress(addr);
                            displayAddr = `by ${formatted}`;
                          }

                          // Get dynamic badge styling
                          let iconClass = 'bg-zinc-950/40 border border-zinc-900/80';
                          if (act.type === 'canvas_updated') iconClass = 'bg-emerald-950/20 text-emerald-500 border border-emerald-900/30';
                          else if (act.type === 'zombie_conversion') iconClass = 'bg-purple-950/20 text-purple-400 border border-purple-900/30';
                          else if (act.type === 'normie_transferred') iconClass = 'bg-blue-950/20 text-blue-400 border border-blue-900/30';
                          else if (act.type === 'legendary_acquired') iconClass = 'bg-amber-950/20 text-amber-500 border border-amber-900/30';
                          else if (act.type === 'normie_burned') iconClass = 'bg-red-950/20 text-red-500 border border-red-900/30';

                          return (
                            <div 
                              key={act.id}
                              onClick={async () => {
                                const matched = await getNormieById(act.normieId);
                                if (matched) onSelectNormie(matched);
                              }}
                              className="bg-[#0c0c0e]/60 border border-zinc-900/80 hover:border-zinc-850 rounded-xl p-4 flex items-center justify-between transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
                                  <IconComp className="w-[18px] h-[18px]" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[13px] font-semibold text-white tracking-wide">
                                    {badge.label}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
                                    Normie #{act.normieId}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Centered address column, monospaced like on the image */}
                              <div className="hidden sm:block text-[11px] font-mono text-zinc-500 tracking-tight text-center flex-1 max-w-md mx-auto">
                                {displayAddr}
                              </div>

                              <div className="flex items-center gap-3.5 shrink-0">
                                <span className="text-[11px] text-zinc-500 font-mono">{act.timeAgo}</span>
                                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-all shrink-0" />
                              </div>
                            </div>
                          );
                        })
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
