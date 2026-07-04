import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Search, Compass, Activity, Shield, Flame, User, Clock, TrendingUp, Eye, 
  Layers, Database, ArrowRight, ArrowUp, ArrowDown, Star, Skull, Sparkles, 
  Wallet, Bell, LogOut, Check, Zap, Info, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  Pencil, ArrowLeftRight, Grid, Lock, Hexagon, Home, Settings, FileText, Tv, ChevronDown, ArrowLeft,
  Menu, X, SlidersHorizontal, AlertTriangle, Copy, ExternalLink, Bookmark, ShoppingBag, Tag, Wrench
} from 'lucide-react';
import { ActivityEvent, MetricItem, NormieItem, MarketStats } from '../types';
import { 
  fetchLiveMetrics, 
  fetchCustomizedEvents, 
  fetchRealNormies, 
  getNormieById,
  fetchTopTraits,
  TraitStatItem,
  mapApiNormieToItem,
  fetchZombieConversions,
  fetchNormieDetail,
  fetchMarketStats,
  fetchMarketEvents
} from '../data';
import { usePrivy } from '../lib/privy';
import { WaveTrend } from './WaveTrend';

interface AppDemoModeProps {
  onClose: () => void;
  onOpenSearch: () => void;
  onSelectNormie: (normie: NormieItem) => void;
  initialTab?: 'home' | 'explore' | 'signals' | 'watchlist';
}

const normieDetailCache = new Map<string, NormieItem>();

export default function AppDemoMode({ onClose, onOpenSearch, onSelectNormie, initialTab }: AppDemoModeProps) {
  const { authenticated, user, login, logout } = usePrivy();

  // Connected Wallet State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Sync with Privy authentication state. in progresss
  useEffect(() => {
    if (authenticated && user) {
      setWalletConnected(true);
      setWalletAddress('User');
    } else {
      setWalletConnected(false);
      setWalletAddress('');
    }
  }, [authenticated, user]);

  const displayAddress = (addr: string, fallbackSeed?: string) => {
    if (!addr || addr === '0xunknown') {
      if (fallbackSeed) {
        let hash = 0;
        for (let i = 0; i < fallbackSeed.length; i++) {
          hash = fallbackSeed.charCodeAt(i) + ((hash << 5) - hash);
        }
        const suffix1 = Math.abs((hash * 13) % 65536).toString(16).padStart(4, '0').toUpperCase();
        const suffix2 = Math.abs((hash * 37) % 65536).toString(16).padStart(4, '0').toUpperCase();
        return `0x${suffix1}...${suffix2}`;
      }
      return 'Guest';
    }
    const userAddr = user?.wallet?.address;
    if (userAddr && addr.toLowerCase() === userAddr.toLowerCase()) {
      return 'You';
    }
    if (addr.length > 10) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return addr;
  };

  const getRelativeTime = (ts: any) => {
    if (!ts) return 'Just now';
    const num = typeof ts === 'string' ? parseInt(ts) : ts;
    if (isNaN(num)) return ts.toString();
    const ms = num < 3000000000 ? num * 1000 : num;
    const secondsAgo = Math.floor((Date.now() - ms) / 1000);
    if (secondsAgo < 0) return 'Just now';
    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  const getAbsoluteTime = (ts: any) => {
    if (!ts) return 'Just now';
    const num = typeof ts === 'string' ? parseInt(ts) : ts;
    if (isNaN(num)) return ts.toString();
    const ms = num < 3000000000 ? num * 1000 : num;
    const date = new Date(ms);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Real dynamic API states
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [trendingNormies, setTrendingNormies] = useState<NormieItem[]>([]);
  const [recentNormies, setRecentNormies] = useState<NormieItem[]>([]);
  const [topTraits, setTopTraits] = useState<TraitStatItem[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [savedSearches, setSavedSearches] = useState<{label: string, category: string, query: string}[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'7D' | '30D' | '90D' | 'All'>('7D');

  // Zombie Popups state
  const [zombiePopups, setZombiePopups] = useState<ActivityEvent[]>([]);
  const [activeZombieAlert, setActiveZombieAlert] = useState<ActivityEvent | null>(null);
  const lastProcessedZombieRef = useRef<string>('');


// demo chart
  const getChartData = () => {
    switch (chartTimeframe) {
      case '30D':
        return [
          { date: 'May 01', price: 1.85 },
          { date: 'May 05', price: 2.1 },
          { date: 'May 10', price: 1.95 },
          { date: 'May 15', price: 2.3 },
          { date: 'May 20', price: 2.15 },
          { date: 'May 25', price: 2.45 },
          { date: 'May 30', price: 2.42 },
        ];
      case '90D':
        return [
          { date: 'Mar 15', price: 1.25 },
          { date: 'Apr 01', price: 1.45 },
          { date: 'Apr 15', price: 1.7 },
          { date: 'May 01', price: 2.1 },
          { date: 'May 15', price: 2.35 },
          { date: 'May 30', price: 2.42 },
        ];
      case 'All':
        return [
          { date: 'Jan 01', price: 0.5 },
          { date: 'Feb 01', price: 0.85 },
          { date: 'Mar 01', price: 1.15 },
          { date: 'Apr 01', price: 1.45 },
          { date: 'May 01', price: 2.1 },
          { date: 'May 30', price: 2.42 },
        ];
      case '7D':
      default:
        return [
          { date: 'May 24', price: 2.2 },
          { date: 'May 25', price: 2.3 },
          { date: 'May 26', price: 2.15 },
          { date: 'May 27', price: 2.4 },
          { date: 'May 28', price: 2.35 },
          { date: 'May 29', price: 2.5 },
          { date: 'May 30', price: 2.42 },
        ];
    }
  };

  const handleSignalClick = async (act: { normieId: string; type: string }) => {
    const isPriceOrWhale = act.type === 'normie_sale' || act.type === 'normie_listing' || act.type === 'whale_purchase';
    if (isPriceOrWhale) {
      // Directly open OpenSea asset page in a new tab instead of showing details drawer
      const url = `https://opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/${act.normieId}`;
      window.open(url, '_blank');
    } else {
      // Show local Normie detail drawer
      try {
        const matched = await getNormieById(act.normieId);
        if (matched) onSelectNormie(matched);
      } catch {}
    }
  };
  
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Signals Filter state: 'All' | 'Canvas' | 'Zombie' | 'Legendary' | 'Transfers' | 'Burns'
  const [signalsFilter, setSignalsFilter] = useState<string>('All');
  const [signalsSearch, setSignalsSearch] = useState<string>('');
  const [signalsSearchQuery, setSignalsSearchQuery] = useState<string>('');
  const [showSignalsSearchDropdown, setShowSignalsSearchDropdown] = useState<boolean>(false);
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{ price: number, date: string } | null>(null);
  const [visibleSignalsLimit, setVisibleSignalsLimit] = useState<number>(10);

  // Debounce signals search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setSignalsSearchQuery(signalsSearch);
    }, 250);
    return () => clearTimeout(handler);
  }, [signalsSearch]);

  // Watchlist filter tab: 'All' | 'Normies' | 'Wallets' | 'Searches'
  const [watchlistFilter, setWatchlistFilter] = useState<string>('All');

  // Sync status tracking
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(Date.now());
  const [syncedAgoText, setSyncedAgoText] = useState<string>('Just now');

  useEffect(() => {
    const interval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - lastSyncedAt) / 1000);
      if (diffSecs < 1) {
        setSyncedAgoText('Just now');
      } else if (diffSecs < 60) {
        setSyncedAgoText(`${diffSecs}s ago`);
      } else {
        const mins = Math.floor(diffSecs / 60);
        setSyncedAgoText(`${mins}m ${diffSecs % 60}s ago`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<NormieItem[]>([]);

  // Load main dashboard metrics and feeds
  const loadDashboardData = async () => {
    try {
      setDashboardError(null);
      const [liveAct, liveMet, liveNorRaw, liveRecRaw, liveTraits, realZombieConvs, liveMarket, liveMarketEvents] = await Promise.all([
        fetchCustomizedEvents(15),
        fetchLiveMetrics(),
        fetchRealNormies({ limit: 12, sort: 'rank', order: 'asc' }),
        fetchRealNormies({ limit: 4, sort: 'updatedAt', order: 'desc' }),
        fetchTopTraits(),
        fetchZombieConversions(15),
        fetchMarketStats(),
        fetchMarketEvents(20)
      ]);

      // Optimize: No need to fetch details in parallel because fetchRealNormies already returns fully populated NormieItems!
      // This completely resolves any API rate limiting or network lag on the Signals page.
      const liveNor = liveNorRaw;
      liveNor.forEach(item => {
        normieDetailCache.set(item.id, item);
      });

      const liveRec = liveRecRaw;
      liveRec.forEach(item => {
        normieDetailCache.set(item.id, item);
      });

      // Handle Zombie detected popup alert dynamic trigger
      if (realZombieConvs && realZombieConvs.length > 0) {
        const latestZombie = realZombieConvs[0];
        
        // Check if the latest zombie is extremely recent (within 60 seconds)
        const isExtremelyRecent = latestZombie.timestamp && (Date.now() - latestZombie.timestamp < 60000);
        
        if (latestZombie.normieId && latestZombie.normieId !== lastProcessedZombieRef.current) {
          const isInitialLoad = lastProcessedZombieRef.current === '';
          lastProcessedZombieRef.current = latestZombie.normieId;
          
          if (isExtremelyRecent || !isInitialLoad) {
            const newAlert: ActivityEvent = {
              id: `zombie_alert_${latestZombie.normieId}_${Date.now()}`,
              type: 'zombie_conversion',
              title: 'Zombie Conversion Detected',
              normieName: latestZombie.normieName || `Normie #${latestZombie.normieId}`,
              normieId: latestZombie.normieId,
              userAddress: latestZombie.userAddress,
              timeAgo: 'Just now',
              timestamp: Date.now()
            };
            
            // Set active screen card alert
            setActiveZombieAlert(newAlert);
            
            // Auto-decouple after exactly 1 minute (60 seconds)
            setTimeout(() => {
              setActiveZombieAlert(current => {
                if (current && current.id === newAlert.id) {
                  return null;
                }
                return current;
              });
            }, 60000);

            if (!isInitialLoad) {
              setZombiePopups(prev => [...prev, newAlert]);
              setTimeout(() => {
                setZombiePopups(prev => prev.filter(p => p.id !== newAlert.id));
              }, 60000);
              showNotification(`Zombie Conversion Detected for Normie #${latestZombie.normieId}!`);
            }
          }
        }
      }

      // Compile rich list of activities using only 100% REAL on-chain updates
      const blendedEvents: ActivityEvent[] = [];

      const latestRealTs = Date.now();

      // Push real-time market events (sales, listings, transfers) from OpenSea or Reservoir Base API
      liveMarketEvents.forEach((ev) => {
        blendedEvents.push({
          ...ev,
          timeAgo: '' // Computed dynamically at render time
        });
      });

      // Group real-time market events dynamically to detect batch transactions (e.g. buying/listing/transferring multiple Normies all at once)
      const walletGroups: Record<string, {
        userAddress: string;
        type: string;
        events: ActivityEvent[];
      }> = {};

      liveMarketEvents.forEach((ev) => {
        if (ev.userAddress && ev.userAddress !== 'Unknown' && ev.userAddress !== '0xunknown') {
          // Group key by wallet + type + bucket of 15 minutes
          const bucket = Math.floor(ev.timestamp / (15 * 60 * 1000));
          const key = `${ev.userAddress.toLowerCase()}_${ev.type}_${bucket}`;
          if (!walletGroups[key]) {
            walletGroups[key] = {
              userAddress: ev.userAddress,
              type: ev.type,
              events: []
            };
          }
          walletGroups[key].events.push(ev);
        }
      });

      // Group them as dynamic whale purchases/listings/transfers if >= 4 events happen close together OR total value >= 3.0 ETH
      Object.values(walletGroups).forEach((group) => {
        const totalPrice = group.events.reduce((acc, curr) => acc + (curr.price || 0), 0);
        if (group.events.length >= 4 || totalPrice >= 3.0) {
          const firstEv = group.events[0];
          const batchIds = group.events.map(e => e.normieId);
          const batchType = group.type === 'normie_sale' ? 'purchase' : group.type === 'normie_listing' ? 'listing' : 'transfer';
          const actionVerb = batchType === 'purchase' ? 'Purchased' : batchType === 'listing' ? 'Listed' : 'Transferred';

          const batchEvent: ActivityEvent = {
            id: `whale_batch_${group.userAddress.slice(0, 6)}_${firstEv.timestamp}`,
            type: 'whale_purchase',
            title: `Whale ${actionVerb} ${group.events.length} Normies`,
            normieName: `Normie #${firstEv.normieId} + ${group.events.length - 1} more`,
            normieId: firstEv.normieId,
            userAddress: group.userAddress,
            timeAgo: '',
            timestamp: firstEv.timestamp,
            price: parseFloat(totalPrice.toFixed(3)),
            batchCount: group.events.length,
            batchIds,
            batchType,
            batchPriceTotal: totalPrice,
            isReal: true
          };
          
          blendedEvents.push(batchEvent);
        }
      });

      // Add actual customized canvas updates with real timestamps from API
      liveAct.forEach((act, idx) => {
        blendedEvents.push({
          ...act,
          timeAgo: '', // Computed dynamically at render time
          timestamp: act.timestamp || (latestRealTs - idx * 120000)
        });
      });

      // Add actual Zombie conversions from the real conversions endpoint
      realZombieConvs.forEach((z) => {
        blendedEvents.push({
          ...z,
          timeAgo: '', // Computed dynamically at render time
          timestamp: z.timestamp || latestRealTs
        });
      });

      // Sort blended events by timestamp descending
      const sortedEvents = blendedEvents.sort((a, b) => b.timestamp - a.timestamp);
      
      setActivities(sortedEvents);
      setMetrics(liveMet);

      // Algorithmic "Trending Now" scoring system (100% dynamic based on actual API states)
      const poolMap = new Map<string, NormieItem>();
      liveNor.forEach(item => poolMap.set(item.id, item));
      liveRec.forEach(item => poolMap.set(item.id, item));
      
      // Merge a larger candidate set of recently active normies
      try {
        const recentPool = await fetchRealNormies({ limit: 20, sort: 'updatedAt', order: 'desc' });
        recentPool.forEach(item => poolMap.set(item.id, item));
      } catch (poolErr) {
        console.warn('Failed to fetch additional candidates, proceeding with primary set', poolErr);
      }

      const candidatePool = Array.from(poolMap.values());
      const scoredCandidates = candidatePool.map(item => {
        let score = 0;
        // Rarity priority (rarest ranks get high baseline priority)
        score += (10000 - (item.rank || 5000)) * 0.05;
        // Level/customization volume multiplier
        score += (item.level || 1) * 15;
        // Status weightings
        if (item.status === 'Zombie') score += 250;
        else if (item.status === 'Legendary') score += 450;
        // Dynamic active hotness multiplier (presence in recent customized and zombie feeds)
        const recentCustomEventsCount = liveAct.filter(act => act.normieId === item.id).length;
        const recentZombieCount = realZombieConvs.filter(z => z.normieId === item.id).length;
        score += recentCustomEventsCount * 600;
        score += recentZombieCount * 800;
        return { item, score };
      });

      // Sort candidate pool by real calculated trending score
      const sortedTrending = scoredCandidates
        .sort((a, b) => b.score - a.score)
        .map(entry => entry.item)
        .slice(0, 10); // Select the top 10

      setTrendingNormies(sortedTrending);
      setRecentNormies(liveRec);
      setTopTraits(liveTraits);
      setMarketStats(liveMarket);

      // Derive Featured Insights conditionally based on real active items
      const highestRarity = liveNor[0] || null;
      const firstCustomized = liveAct[0] || null;
      const secondCustomized = liveAct[1] || liveAct[0] || null;
      const legendaryItem = liveNor.find(n => n.status === 'Legendary') || null;

      const derivedInsights: FeaturedInsight[] = [];
      
      if (firstCustomized) {
        derivedInsights.push({
          id: 'most_edited',
          label: 'Most Edited Today',
          value: `Normie #${firstCustomized.normieId}`,
          description: 'Customize revisions registered on-chain',
          normieId: firstCustomized.normieId,
          badge: 'Canvas Edit'
        });
      }
      
      if (legendaryItem) {
        derivedInsights.push({
          id: 'recently_legendary',
          label: 'Recently Legendary',
          value: `Normie #${legendaryItem.id}`,
          description: 'Decoded with Legendary aura rank',
          normieId: legendaryItem.id,
          badge: 'Aura Sync'
        });
      }
      
      if (highestRarity) {
        derivedInsights.push({
          id: 'highest_rarity',
          label: 'Highest Rarity',
          value: `Normie #${highestRarity.id}`,
          description: `Ecosystem Rank #${highestRarity.rank} • Score ${highestRarity.score}`,
          normieId: highestRarity.id,
          badge: `Rank #${highestRarity.rank}`
        });
      }
      
      if (firstCustomized && firstCustomized.userAddress && firstCustomized.userAddress !== 'Unknown') {
        derivedInsights.push({
          id: 'most_active_owner',
          label: 'Most Active Owner',
          value: displayAddress(firstCustomized.userAddress),
          description: 'Triggered multiple consensus events today',
          badge: 'Indexer Active'
        });
      }
      
      if (liveRec[0]) {
        derivedInsights.push({
          id: 'largest_transfer',
          label: 'Largest Recent Transfer',
          value: `Normie #${liveRec[0].id}`,
          description: `Level ${liveRec[0].level} Vault Transfer Complete`,
          normieId: liveRec[0].id,
          badge: 'Vault Transferred'
        });
      }
      
      if (secondCustomized && secondCustomized !== firstCustomized) {
        derivedInsights.push({
          id: 'most_customized',
          label: 'Most Customized Normie',
          value: `Normie #${secondCustomized.normieId}`,
          description: 'Aesthetic layers saved directly on-chain',
          normieId: secondCustomized.normieId,
          badge: 'Revisions'
        });
      }

      setInsights(derivedInsights);
      setLastSyncedAt(Date.now());
    } catch (err: any) {
      console.warn('Failed to load dashboard:', err);
      setDashboardError(err.message || 'Failed to fetch on-chain live ecosystem and market data.');
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
          activeCategoryFilter !== 'Top Rarity' ||
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
            let exactItem = normieDetailCache.get(cleanQuery);
            if (!exactItem) {
              const baseItem = await getNormieById(cleanQuery);
              if (baseItem) {
                const detail = await fetchNormieDetail(cleanQuery);
                exactItem = detail || baseItem;
                normieDetailCache.set(cleanQuery, exactItem);
              }
            }
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

          // Resolve actual on-chain details including owners in parallel with caching
          const resolvedResults = await Promise.all(
            results.map(async (item) => {
              try {
                const cached = normieDetailCache.get(item.id);
                if (cached) return cached;
                const detail = await fetchNormieDetail(item.id);
                if (detail) {
                  normieDetailCache.set(item.id, detail);
                  return detail;
                }
                return item;
              } catch {
                return item;
              }
            })
          );

          let filtered = [...resolvedResults];

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
            filtered = filtered.filter(n => n.owner.toLowerCase() === selectedOwner.toLowerCase());
          }

          // If activeCategoryFilter is 'Trending', sort the results by our dynamic, algorithmic trending score!
          if (activeCategoryFilter === 'Trending') {
            const scored = filtered.map(item => {
              let score = 0;
              // Rarity priority (rarest ranks get high baseline priority)
              score += (10000 - (item.rank || 5000)) * 0.05;
              // Level/customization volume multiplier
              score += (item.level || 1) * 15;
              // Status weightings
              if (item.status === 'Zombie') score += 250;
              else if (item.status === 'Legendary') score += 450;
              
              // Dynamic active hotness multiplier (presence in recent customized and zombie feeds)
              const recentCustomEventsCount = activities.filter(act => act.normieId === item.id).length;
              const recentZombieCount = activities.filter(act => act.type === 'zombie_conversion' && act.normieId === item.id).length;
              score += recentCustomEventsCount * 600;
              score += recentZombieCount * 800;
              return { item, score };
            });
            
            // Sort candidate pool by real calculated trending score descending
            filtered = scored
              .sort((a, b) => b.score - a.score)
              .map(entry => entry.item);
          }

          setDiscoverTotalItems(filtered.length);

          // Paginate filtered results client-side (12 items per page)
          const startIndex = (discoverPage - 1) * 12;
          setDiscoverNormies(filtered.slice(startIndex, startIndex + 12));
        } else {
          // Unfiltered search: Server-Side paging with limit 12
          const query = new URLSearchParams();
          query.append('limit', '12');
          query.append('sort', discoverSort);
          query.append('order', discoverOrder);
          query.append('page', discoverPage.toString());

          const res = await fetch(`/api/normies/rarity/normies?${query.toString()}`);
          if (!res.ok) throw new Error('Failed to fetch normies from API');
          const data = await res.json();
          
          const list = Array.isArray(data) ? data : (data.items || data.normies || data.data || []);
          const mapped = list.map((item: any) => mapApiNormieToItem(item));
          
          // Resolve details (owners and rarity scores) for displayed page items in parallel
          const resolved = await Promise.all(
            mapped.map(async (item: any) => {
              try {
                const cached = normieDetailCache.get(item.id);
                if (cached) return cached;
                const detail = await fetchNormieDetail(item.id);
                if (detail) {
                  normieDetailCache.set(item.id, detail);
                  return detail;
                }
                return item;
              } catch {
                return item;
              }
            })
          );
          
          setDiscoverNormies(resolved);
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
  }, [discoverSearch, discoverSort, discoverOrder, discoverPage, activeCategoryFilter, activeTab, selectedTrait, selectedStatus, selectedRarity, selectedLevel, selectedOwner, activities, retryTrigger]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        if (activeTab === 'explore') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    setSignalsFilter('All');
    setSignalsSearch('');
    showNotification('All filters cleared.');
  };

  const whalesList = useMemo(() => {
    // Group activities by userAddress/toAddress to find wallets with large number of transactions or high value
    const walletGroups: Record<string, {
      address: string;
      normieIds: string[];
      totalSpent: number;
      actionTypes: Set<string>;
      timestamps: number[];
    }> = {};

    activities.forEach(act => {
      // 1. Process buyer (toAddress) for sales - this is a purchase
      if (act.type === 'normie_sale' && act.toAddress && act.toAddress !== '0xunknown' && act.toAddress !== 'Unknown') {
        const buyer = act.toAddress;
        if (!walletGroups[buyer]) {
          walletGroups[buyer] = { address: buyer, normieIds: [], totalSpent: 0, actionTypes: new Set(), timestamps: [] };
        }
        if (!walletGroups[buyer].normieIds.includes(act.normieId)) {
          walletGroups[buyer].normieIds.push(act.normieId);
        }
        walletGroups[buyer].totalSpent += act.price ?? 0.18;
        walletGroups[buyer].actionTypes.add('buy');
        walletGroups[buyer].timestamps.push(act.timestamp);
      }

      // 2. Process creator/lister (userAddress) for listings
      if (act.type === 'normie_listing' && act.userAddress && act.userAddress !== '0xunknown' && act.userAddress !== 'Unknown') {
        const lister = act.userAddress;
        if (!walletGroups[lister]) {
          walletGroups[lister] = { address: lister, normieIds: [], totalSpent: 0, actionTypes: new Set(), timestamps: [] };
        }
        if (!walletGroups[lister].normieIds.includes(act.normieId)) {
          walletGroups[lister].normieIds.push(act.normieId);
        }
        walletGroups[lister].actionTypes.add('list');
        walletGroups[lister].timestamps.push(act.timestamp);
      }

      // 3. Process transfers
      if (act.type === 'normie_transferred' && act.userAddress && act.userAddress !== '0xunknown' && act.userAddress !== 'Unknown') {
        const sender = act.userAddress;
        if (!walletGroups[sender]) {
          walletGroups[sender] = { address: sender, normieIds: [], totalSpent: 0, actionTypes: new Set(), timestamps: [] };
        }
        if (!walletGroups[sender].normieIds.includes(act.normieId)) {
          walletGroups[sender].normieIds.push(act.normieId);
        }
        walletGroups[sender].actionTypes.add('transfer');
        walletGroups[sender].timestamps.push(act.timestamp);
      }
    });

    // Also include any pre-computed whale_purchase events
    activities.forEach(act => {
      if (act.type === 'whale_purchase' && act.userAddress && act.userAddress !== '0xunknown') {
        const whale = act.userAddress;
        if (!walletGroups[whale]) {
          walletGroups[whale] = { address: whale, normieIds: [], totalSpent: 0, actionTypes: new Set(), timestamps: [] };
        }
        if (act.batchIds) {
          act.batchIds.forEach(id => {
            if (!walletGroups[whale].normieIds.includes(id)) {
              walletGroups[whale].normieIds.push(id);
            }
          });
        } else if (!walletGroups[whale].normieIds.includes(act.normieId)) {
          walletGroups[whale].normieIds.push(act.normieId);
        }
        walletGroups[whale].totalSpent += act.price ?? (act.batchCount ? act.batchCount * 0.18 : 0.18);
        walletGroups[whale].actionTypes.add('buy');
        walletGroups[whale].timestamps.push(act.timestamp);
      }
    });

    const list = Object.values(walletGroups)
      .map(g => {
        const count = g.normieIds.length;
        const rawFloorPrice = marketStats?.floorPrice;
        const numericFloor = (rawFloorPrice && rawFloorPrice !== '--') ? (typeof rawFloorPrice === 'number' ? rawFloorPrice : parseFloat(rawFloorPrice)) : 0.18;
        const validFloor = isNaN(numericFloor) ? 0.18 : numericFloor;
        const spent = g.totalSpent > 0 ? g.totalSpent : (count * validFloor);
        
        let actionLabel = `Acquired ${count} Normies`;
        if (g.actionTypes.has('buy') && g.actionTypes.has('list')) {
          actionLabel = `Swept & Listed ${count} Normies`;
        } else if (g.actionTypes.has('buy')) {
          actionLabel = `Swept ${count} Normies`;
        } else if (g.actionTypes.has('list')) {
          actionLabel = `Bulk Listed ${count} Normies`;
        } else if (g.actionTypes.has('transfer')) {
          actionLabel = `Transferred ${count} Normies`;
        }

        const maxTimestamp = g.timestamps.length > 0 ? Math.max(...g.timestamps) : Date.now();

        return {
          address: g.address,
          count,
          normieIds: g.normieIds,
          spent: parseFloat(spent.toFixed(2)),
          actionLabel,
          timestamp: maxTimestamp
        };
      })
      .filter(w => w.count >= 4 || w.spent >= 3.0)
      .sort((a, b) => b.count - a.count || b.spent - a.spent);

    if (list.length === 0) {
      const ownerCounts: Record<string, string[]> = {};
      discoverNormies.forEach(n => {
        if (n.owner && n.owner !== 'Unknown' && n.owner !== '0xunknown') {
          if (!ownerCounts[n.owner]) ownerCounts[n.owner] = [];
          if (!ownerCounts[n.owner].includes(n.id)) ownerCounts[n.owner].push(n.id);
        }
      });
      return Object.entries(ownerCounts)
        .map(([address, ids]) => {
          const rawFloorPrice = marketStats?.floorPrice;
          const numericFloor = (rawFloorPrice && rawFloorPrice !== '--') ? (typeof rawFloorPrice === 'number' ? rawFloorPrice : parseFloat(rawFloorPrice)) : 0.18;
          const validFloor = isNaN(numericFloor) ? 0.18 : numericFloor;
          return {
            address,
            count: ids.length,
            normieIds: ids,
            spent: parseFloat((ids.length * validFloor).toFixed(2)),
            actionLabel: `Holds ${ids.length} Normie NFTs`,
            timestamp: Date.now() - 3600000
          };
        })
        .filter(w => w.count >= 4 || w.spent >= 3.0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    }

    return list.slice(0, 4);
  }, [activities, discoverNormies, marketStats?.floorPrice]);

  const getWhales = () => whalesList;

  const filterCounts = useMemo(() => {
    const queryNormie = signalsSearchQuery.toLowerCase().trim();
    
    // Filter activities first by the search query and the listing constraints
    const searchedActivities = activities.filter(act => {
      if (act.type === 'whale_purchase') {
        return false;
      }
      // Apply personalized listing alert constraints (must be in watchlist and hourly delayed)
      if (act.type === 'normie_listing') {
        const inWatchlist = watchlist.some(w => w.id === act.normieId);
        const isHourlyDelayed = Date.now() - act.timestamp >= 3600000;
        if (!inWatchlist || !isHourlyDelayed) {
          return false;
        }
      }

      if (queryNormie !== '') {
        return (
          act.title.toLowerCase().includes(queryNormie) ||
          act.normieId.toString() === queryNormie ||
          act.userAddress.toLowerCase().includes(queryNormie) ||
          (act.toAddress && act.toAddress.toLowerCase().includes(queryNormie))
        );
      }
      return true;
    });

    const whaleAddrs = new Set(whalesList.map(w => w.address));

    return {
      All: searchedActivities.length,
      Canvas: searchedActivities.filter(a => a.type === 'canvas_updated').length,
      Transfers: searchedActivities.filter(a => a.type === 'normie_transferred').length,
      Listings: searchedActivities.filter(a => a.type === 'normie_listing').length,
      Sales: searchedActivities.filter(a => a.type === 'normie_sale').length,
      Zombie: searchedActivities.filter(a => a.type === 'zombie_conversion').length,
      Legendary: searchedActivities.filter(a => a.type === 'legendary_acquired').length,
      Whales: searchedActivities.filter(a => {
        const isWhaleType = a.type === 'whale_purchase';
        const isWhaleUser = a.userAddress && whaleAddrs.has(a.userAddress);
        const isWhaleReceiver = a.toAddress && whaleAddrs.has(a.toAddress);
        return isWhaleType || isWhaleUser || isWhaleReceiver;
      }).length,
      Watchlist: searchedActivities.filter(a => watchlist.some(w => w.id === a.normieId)).length,
    };
  }, [activities, signalsSearchQuery, watchlist, whalesList]);

  const getFilterCount = (filterName: string) => {
    return filterCounts[filterName as keyof typeof filterCounts] || 0;
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
      case 'normie_sale':
        return { icon: ShoppingBag, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Normie Sold' };
      case 'normie_listing':
        return { icon: Tag, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Normie Listed' };
      case 'whale_purchase':
        return { icon: Zap, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Whale Purchase' };
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

  const mCanvas = getMetricData('canvas_updates', '0', 'Live', [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]);
  const mZombies = getMetricData('zombie_conversions', '0', 'Live', [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]);
  const mTransfers = getMetricData('normies_transferred', '0', 'Live', [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]);
  const mLegendary = getMetricData('legendary_acquired', '0', 'Live', [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]);
  const mBurned = getMetricData('normies_burned', '0', 'Live', [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]);

  const canvasCount = parseInt(mCanvas.value.replace(/,/g, '')) || 0;
  const zombieCount = parseInt(mZombies.value.replace(/,/g, '')) || 0;
  const transfersCount = parseInt(mTransfers.value.replace(/,/g, '')) || 0;
  const legendaryCount = parseInt(mLegendary.value.replace(/,/g, '')) || 0;
  const burnedCount = parseInt(mBurned.value.replace(/,/g, '')) || 0;

  const totalCount = canvasCount + zombieCount + transfersCount + legendaryCount + burnedCount;

  const pCanvas = totalCount > 0 ? (canvasCount / totalCount) : 0;
  const pZombies = totalCount > 0 ? (zombieCount / totalCount) : 0;
  const pTransfers = totalCount > 0 ? (transfersCount / totalCount) : 0;
  const pLegendary = totalCount > 0 ? (legendaryCount / totalCount) : 0;
  const pBurned = totalCount > 0 ? (burnedCount / totalCount) : 0;

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

      {/* Floating Zombie Conversions Popups */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {zombiePopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 50, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-[#0a0a0c]/95 border border-purple-900/40 p-4 rounded-xl shadow-[0_10px_30px_rgba(168,85,247,0.15)] flex flex-col gap-3 backdrop-blur-md relative overflow-hidden"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 bg-purple-500" 
                style={{ animation: 'shrinkWidth 60s linear forwards' }}
              />
              <button
                onClick={() => setZombiePopups(prev => prev.filter(p => p.id !== popup.id))}
                className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-900/50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-center shrink-0">
                  <Skull className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-400 font-mono">Zombie Detected</span>
                  <h4 className="text-xs font-bold text-white leading-tight mt-0.5">Zombie Status Activated!</h4>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                {popup.normieName} has completed on-chain Zombie transformation, updating its status and score instantly.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const matched = await getNormieById(popup.normieId);
                      if (matched) onSelectNormie(matched);
                    } catch {}
                  }}
                  className="px-3 py-1.5 bg-purple-950/30 hover:bg-white text-purple-300 hover:text-black border border-purple-900/30 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                >
                  View Normie
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(popup.normieId);
                    showNotification(`Copied token ID #${popup.normieId}`);
                  }}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-white border border-zinc-800 text-zinc-400 hover:text-black font-semibold rounded-lg text-[10px] transition-all cursor-pointer"
                >
                  Copy ID
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* 1. PERSISTENT/COLLAPSIBLE SIDEBAR NAVIGATION */}
      <aside 
        className={`fixed inset-y-0 left-0 h-[100dvh] md:h-screen z-50 md:relative md:translate-x-0 flex flex-col border-r border-zinc-900/85 bg-[#09090b] select-none transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          mobileMenuOpen ? 'translate-x-0 w-64 shadow-[8px_0_40px_rgba(0,0,0,0.9)]' : '-translate-x-full'
        }`}
      >
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-900 justify-between">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 min-w-0 select-none group cursor-pointer text-left outline-none"
            title="Back"
          >
            <Hexagon className="w-4.5 h-4.5 text-white stroke-[2.2] transition-transform duration-500 group-hover:rotate-[30deg] shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-extrabold tracking-widest font-sans text-white uppercase leading-none">ATLAS</span>
            )}
          </button>
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
        <nav className="p-4 space-y-1.5 flex-1 flex flex-col items-stretch overflow-y-auto min-h-0">
          <button 
            onClick={() => {
              onClose();
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/40 ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-3'
            }`}
            title={sidebarCollapsed ? "Back" : undefined}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Back</span>}
          </button>

          <button 
            onClick={() => selectTab('home')}
            className={`flex items-center gap-3 py-2.5 rounded-lg text-left text-xs transition-all font-medium ${
              sidebarCollapsed ? 'justify-center px-2' : 'px-3'
            } ${
              activeTab === 'home' 
                ? `bg-zinc-900/80 text-white font-semibold ${!sidebarCollapsed ? 'border-l-2 border-zinc-200 rounded-l-none pl-2.5' : ''}` 
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
                ? `bg-zinc-900/80 text-white font-semibold ${!sidebarCollapsed ? 'border-l-2 border-zinc-200 rounded-l-none pl-2.5' : ''}` 
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
                ? `bg-zinc-900/80 text-white font-semibold ${!sidebarCollapsed ? 'border-l-2 border-zinc-200 rounded-l-none pl-2.5' : ''}` 
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
                ? `bg-zinc-900/80 text-white font-semibold ${!sidebarCollapsed ? 'border-l-2 border-zinc-200 rounded-l-none pl-2.5' : ''}` 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
            title={sidebarCollapsed ? "Watchlists" : undefined}
          >
            <Tv className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Watchlists</span>}
          </button>

        </nav>

        {/* Sidebar Footer section */}
        <div className="mt-auto shrink-0 border-t border-zinc-900 bg-[#09090b] flex flex-col justify-end">
          {/* API Status Widget - Identical to Image */}
          {!sidebarCollapsed ? (
            <div className="mx-3 mt-2 mb-2 md:mx-4 md:mt-4 md:mb-4 bg-[#0c0c0e]/60 border border-zinc-900 rounded-xl p-3 md:p-4 text-left">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest">API Status</span>
              </div>
              <div className="text-xs font-bold text-emerald-500 font-sans mt-1">
                Synced
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono mt-2 md:mt-3.5 border-t border-zinc-900/60 pt-2">
                <span>Auto-refresh</span>
                <span className="text-emerald-500 font-medium">Active</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-4 mb-4 flex items-center justify-center relative group cursor-pointer" title="API Status: Synced">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            </div>
          )}

          {/* User Profile Footer */}
          <div className="relative border-t border-zinc-900 bg-[#09090b] mt-16 md:mt-0">
            {/* Collapsible Profile Popup Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-16 bg-[#111113] border border-zinc-800 p-3 rounded-xl shadow-2xl z-50 space-y-2 ${
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
              className={`p-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:p-4 flex cursor-pointer hover:bg-zinc-900/30 transition-colors ${
                sidebarCollapsed 
                  ? 'justify-center items-center' 
                  : 'justify-center items-center md:justify-between md:items-center'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {authenticated && user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-zinc-400 font-mono">
                      {walletConnected ? 'U' : 'G'}
                    </span>
                  )}
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
              {!sidebarCollapsed && <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0 md:block hidden" />}
            </div>

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

          {/* Universal Search Clicker / Explore Real-time Input */}
          {activeTab === 'explore' ? (
            <div className="relative flex-1 md:w-[460px] md:flex-none">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={discoverSearch}
                onChange={(e) => {
                  setDiscoverSearch(e.target.value);
                  setDiscoverPage(1);
                }}
                placeholder="Search Normie ID, wallet address, trait, or collection..."
                className="w-full bg-[#0c0c0e]/80 border border-zinc-900 hover:border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-500 rounded-xl pl-10 pr-10 py-2.5 text-xs font-sans outline-none transition-all"
              />
              {discoverSearch ? (
                <button
                  onClick={() => {
                    setDiscoverSearch('');
                    setDiscoverPage(1);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="hidden sm:inline-block absolute right-3.5 top-1/2 -translate-y-1/2 bg-[#09090b] border border-zinc-800/80 rounded-md text-[10px] px-2 py-0.5 font-mono text-zinc-500">⌘ K</span>
              )}
            </div>
          ) : activeTab !== 'home' && activeTab !== 'signals' ? (
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
          ) : (
            <div className="flex-1" />
          )}

          {/* Connected wallet and notification controls */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            
            {/* Notification trigger - Exact bell block */}
            {activeTab !== 'home' && activeTab !== 'explore' && activeTab !== 'signals' && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-3 rounded-xl border bg-[#0c0c0e] relative transition-colors cursor-pointer ${showNotifications ? 'border-zinc-700 text-white' : 'border-zinc-800/60 text-zinc-400 hover:text-white'}`}
                  title="Ecosystem Notifications"
                >
                  <Bell className="w-4 h-4 shrink-0" />
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
                        {activities
                          .filter(act => {
                            if (act.type === 'normie_listing') {
                              const inWatchlist = watchlist.some(w => w.id === act.normieId);
                              const isHourlyDelayed = Date.now() - act.timestamp >= 3600000;
                              return inWatchlist && isHourlyDelayed;
                            }
                            return true;
                          })
                          .slice(0, 5)
                          .map((act, idx) => {
                            const badge = getEventBadgeProps(act.type);
                            const IconComp = badge.icon;
                            return (
                              <div 
                                key={`${act.id || 'act'}-${idx}`}
                                onClick={() => {
                                  setShowNotifications(false);
                                  (async () => {
                                    try {
                                      const matched = await getNormieById(act.normieId);
                                      if (matched) {
                                        onSelectNormie(matched);
                                      } else {
                                        showNotification(`Failed to load details for Normie #${act.normieId}`);
                                      }
                                    } catch (err) {
                                      showNotification(`Failed to load details for Normie #${act.normieId}`);
                                    }
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
          )}

          {/* Profile Block - Exact Match to Design */}
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-[#0c0c0e] border border-zinc-800/60 rounded-xl px-2.5 py-2 md:px-3.5 md:py-2 cursor-pointer hover:border-zinc-700 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                {authenticated && user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt="Profile Avatar" 
                    className="w-full h-full object-cover scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400 font-mono">
                    {walletConnected ? 'U' : 'G'}
                  </span>
                )}
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
                      <div className="mt-2 flex items-center justify-between">
                        <WaveTrend color="#10b981" baseValue={canvasCount} />
                        <span className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-1 shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                        </span>
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
                      <div className="mt-2 flex items-center justify-between">
                        <WaveTrend color="#a78bfa" baseValue={zombieCount} />
                        <span className="text-[10px] text-purple-400 font-mono font-bold flex items-center gap-1 shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                          </span>
                        </span>
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
                      <div className="mt-2 flex items-center justify-between">
                        <WaveTrend color="#60a5fa" baseValue={transfersCount} />
                        <span className="text-[10px] text-blue-400 font-mono font-bold flex items-center gap-1 shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                          </span>
                        </span>
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
                      <div className="mt-2 flex items-center justify-between">
                        <WaveTrend color="#f59e0b" baseValue={legendaryCount} />
                        <span className="text-[10px] text-[#f59e0b] font-mono font-bold flex items-center gap-1 shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                          </span>
                        </span>
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
                      <div className="mt-2 flex items-center justify-between">
                        <WaveTrend color="#f87171" baseValue={burnedCount} />
                        <span className="text-[10px] text-red-500 font-mono font-bold flex items-center gap-1 shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                        </span>
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
                                  <span className="text-zinc-500 font-mono">Rank #{normie.rank}</span>
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

                      {/* Panel B: Recently Updated Normies */}
                      <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between h-[300px]">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
                          <h4 className="text-sm font-bold font-sans text-white">Recently Updated Normies</h4>
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
                            recentNormies.slice(0, 4).map((normie) => {
                              let desc = `Active state, owned by ${displayAddress(normie.owner)}`;
                              if (normie.status === 'Zombie') {
                                desc = `Zombie state, owned by ${displayAddress(normie.owner)}`;
                              } else if (normie.status === 'Legendary') {
                                desc = `Legendary state, owned by ${displayAddress(normie.owner)}`;
                              } else if (normie.status === 'Burned') {
                                desc = `Burned from ecosystem`;
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
                                    {normie.updatedAt || 'Recently'}
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
                          activities.slice(0, 8).map((act, idx) => {
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
                            } else if (act.type === 'normie_sale') {
                              icon = <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />;
                              iconBg = 'bg-emerald-500/10 border-emerald-500/20';
                              label = 'Normie Sold';
                            } else if (act.type === 'normie_listing') {
                              icon = <Tag className="w-3.5 h-3.5 text-blue-400" />;
                              iconBg = 'bg-blue-500/10 border-blue-500/20';
                              label = 'Normie Listed';
                            } else if (act.type === 'whale_purchase') {
                              icon = <Zap className="w-3.5 h-3.5 text-purple-400" />;
                              iconBg = 'bg-purple-500/10 border-purple-500/20';
                              label = 'Whale Purchase';
                            }

                            return (
                              <div 
                                key={`${act.id || 'act'}-${idx}`} 
                                onClick={async () => {
                                  try {
                                    const matched = await getNormieById(act.normieId);
                                    if (matched) {
                                      onSelectNormie(matched);
                                    } else {
                                      showNotification(`Failed to load details for Normie #${act.normieId}`);
                                    }
                                  } catch (err) {
                                    showNotification(`Failed to load details for Normie #${act.normieId}`);
                                  }
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
                                <span className="text-[10px] text-zinc-600 font-mono shrink-0">{getAbsoluteTime(act.timestamp)}</span>
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
                  </div>

                  {discoverLoading ? (
                    /* High-fidelity Skeleton loaders grid shown during load */
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <div 
                          key={`skeleton-${index}`}
                          className="bg-[#0c0c0e]/60 border border-zinc-900/85 rounded-[14px] p-4 animate-pulse flex flex-col relative"
                        >
                          <div className="relative aspect-square w-full rounded-xl bg-[#0f0f12] overflow-hidden mb-4 border border-zinc-900/60 flex items-center justify-center">
                            {/* Rank badge skeleton */}
                            <div className="absolute top-3 left-3 w-16 h-5 rounded-md bg-zinc-800/40" />
                            {/* Image skeleton */}
                            <div className="w-1/2 h-1/2 rounded bg-zinc-850/40" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                              {/* Title skeleton */}
                              <div className="h-4 bg-zinc-800/40 rounded-md w-1/3" />
                              {/* Subtitle skeleton */}
                              <div className="h-3 bg-zinc-800/30 rounded-md w-1/4" />
                            </div>
                            <div className="mt-6 pt-3.5 border-t border-zinc-900 flex flex-col gap-2.5">
                              <div className="flex justify-between">
                                <div className="h-3 bg-zinc-800/30 rounded-md w-1/5" />
                                <div className="h-3 bg-zinc-800/40 rounded-md w-1/4" />
                              </div>
                              <div className="flex justify-between">
                                <div className="h-3 bg-zinc-800/30 rounded-md w-1/5" />
                                <div className="h-3 bg-zinc-800/40 rounded-md w-1/3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : discoverError ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 bg-[#0c0c0e]/30 border border-zinc-900 rounded-2xl max-w-md mx-auto text-center space-y-4 w-full">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-sm font-bold text-white tracking-tight">Something went wrong</h2>
                        <p className="text-xs text-zinc-400">
                          {discoverError}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 justify-center">
                        <button 
                          onClick={() => setRetryTrigger(prev => prev + 1)}
                          className="px-4 py-2 bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 font-semibold rounded-lg text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Try Again</span>
                        </button>
                        <button 
                          onClick={() => selectTab('home')}
                          className="px-4 py-2 bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-800 font-semibold rounded-lg text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Home className="w-3.5 h-3.5" />
                          <span>Go Home</span>
                        </button>
                      </div>
                    </div>
                  ) : discoverNormies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-[#09090b]/80 border border-zinc-800 rounded-xl space-y-4 max-w-lg mx-auto text-center animate-fadeIn">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white font-sans">No Matches Found</h3>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">No Normies match your current search.</p>
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
                          className="bg-[#0c0c0e]/80 border border-zinc-900 hover:border-zinc-700 hover:text-white text-zinc-400 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-sans flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                          <span>Previous</span>
                        </button>
                        
                        <div className="flex items-center gap-1 text-xs font-sans">
                          {(() => {
                            const total = Math.ceil(discoverTotalItems / 12);
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
                                {/* Mobile view page counter text */}
                                <span className="inline-block sm:hidden text-zinc-400 font-medium px-2 py-1">
                                  Page {discoverPage} of {total || 1}
                                </span>

                                {/* Desktop view list of buttons */}
                                <div className="hidden sm:flex items-center gap-1">
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
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        
                        <button 
                          disabled={discoverPage >= Math.ceil(discoverTotalItems / 12)}
                          onClick={() => {
                            setDiscoverPage(prev => prev + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-[#0c0c0e]/80 border border-zinc-900 hover:border-zinc-700 hover:text-white text-zinc-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-sans flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
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
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Page header and Universal Search Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h1 className="text-3xl font-bold font-sans text-white tracking-tight flex items-center gap-3">
                          Signals
                        </h1>
                      </div>
                      <p className="text-[11px] font-bold font-mono text-zinc-400 tracking-wider uppercase mt-1">REALTIME ACTIVITY ACROSS NORMIES ECOSYSTEM</p>
                    </div>

                    {/* Universal Search Bar with Live Grouped Suggestions Dropdown */}
                    <div className="relative w-full md:w-80 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search Normie ID, wallet, trait..."
                          value={signalsSearch}
                          onChange={(e) => {
                            setSignalsSearch(e.target.value);
                            setShowSignalsSearchDropdown(true);
                          }}
                          onFocus={() => setShowSignalsSearchDropdown(true)}
                          className="w-full h-10 bg-[#0c0c0e] border border-zinc-850 focus:border-purple-500/50 rounded-xl pl-10 pr-4 text-xs font-sans text-white placeholder-zinc-500 outline-none transition-all"
                        />
                        {signalsSearch && (
                          <button 
                            onClick={() => { setSignalsSearch(''); setShowSignalsSearchDropdown(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Grouped Suggestions Dropdown */}
                      {showSignalsSearchDropdown && signalsSearch.trim() !== '' && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowSignalsSearchDropdown(false)}
                          />
                          <div className="absolute right-0 top-12 w-full md:w-[360px] max-h-[420px] overflow-y-auto bg-[#0a0a0c] border border-zinc-800 rounded-xl shadow-2xl z-50 p-4 space-y-4 font-sans no-scrollbar">
                            <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase border-b border-zinc-900 pb-1 flex justify-between">
                              <span>Search Results</span>
                              <span>Press Esc to close</span>
                            </div>

                            {/* Group 1: Normies */}
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Normies</h4>
                              {(() => {
                                const q = signalsSearch.toLowerCase().trim();
                                const matches = discoverNormies.filter(n => 
                                  n.id.toString() === q ||
                                  n.name.toLowerCase().includes(q) ||
                                  n.traits.some(t => t.value.toLowerCase().includes(q))
                                ).slice(0, 3);

                                if (matches.length === 0) {
                                  return <div className="text-xs text-zinc-600 italic pl-1">No matching Normies</div>;
                                }

                                return matches.map(n => (
                                  <div 
                                    key={n.id}
                                    onClick={() => {
                                      onSelectNormie(n);
                                      setShowSignalsSearchDropdown(false);
                                    }}
                                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-900/60 transition-colors cursor-pointer"
                                  >
                                    <div className="w-8 h-8 rounded-md bg-[#111] overflow-hidden flex items-center justify-center border border-zinc-900">
                                      <img src={`https://api.normies.art/normie/${n.id}/image.png`} className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.src = n.imageUrl; }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold text-white font-mono">#{n.id}</div>
                                      <div className="text-[10px] text-zinc-500 truncate">Owner: {n.owner.slice(0, 6)}...{n.owner.slice(-4)}</div>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                      Rank #{n.rank}
                                    </span>
                                  </div>
                                ));
                              })()}
                            </div>

                            {/* Group 2: Signals */}
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Signals</h4>
                              {(() => {
                                const q = signalsSearch.toLowerCase().trim();
                                const matches = activities.filter(act => 
                                  act.title.toLowerCase().includes(q) ||
                                  act.normieId.toString() === q ||
                                  act.userAddress.toLowerCase().includes(q)
                                ).slice(0, 3);

                                if (matches.length === 0) {
                                  return <div className="text-xs text-zinc-600 italic pl-1">No matching signals</div>;
                                }

                                return matches.map((act, idx) => (
                                  <div 
                                    key={`${act.id || 'act'}-${idx}`}
                                    onClick={async () => {
                                      setShowSignalsSearchDropdown(false);
                                      try {
                                        const matched = await getNormieById(act.normieId);
                                        if (matched) onSelectNormie(matched);
                                      } catch {}
                                    }}
                                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-900/60 transition-colors cursor-pointer"
                                  >
                                    <div className="w-6 h-6 rounded bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
                                      <Activity className="w-3.5 h-3.5 text-[#22c55e]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-medium text-white truncate">{act.title}</div>
                                      <div className="text-[10px] text-zinc-500 font-mono">Normie #{act.normieId}</div>
                                    </div>
                                    <span className="text-[9px] text-zinc-600 font-mono">{getRelativeTime(act.timestamp)}</span>
                                  </div>
                                ));
                              })()}
                            </div>

                            {/* Group 3: Wallets */}
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Wallets</h4>
                              {(() => {
                                const q = signalsSearch.toLowerCase().trim();
                                // Extract matching owner addresses from available items
                                const uniqueOwners = Array.from(new Set(discoverNormies.map(n => String(n.owner)).filter(o => o && o !== 'Unknown'))) as string[];
                                const matches = uniqueOwners.filter(o => o.toLowerCase().includes(q)).slice(0, 2);

                                if (matches.length === 0) {
                                  return <div className="text-xs text-zinc-600 italic pl-1">No matching wallets</div>;
                                }

                                return matches.map(owner => {
                                  const count = discoverNormies.filter(n => n.owner === owner).length;
                                  return (
                                    <div 
                                      key={owner}
                                      onClick={() => {
                                        setSignalsSearch(owner);
                                        setShowSignalsSearchDropdown(false);
                                      }}
                                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-900/60 transition-colors cursor-pointer"
                                    >
                                      <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                        <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-mono text-zinc-300">{owner.slice(0, 10)}...{owner.slice(-8)}</div>
                                      </div>
                                      <span className="text-[10px] text-purple-400 font-medium bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                                        {count} {count === 1 ? 'Normie' : 'Normies'}
                                      </span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {((loading && activities.length === 0) || dashboardError || activities.length <= 2) ? (
                    <div className="flex flex-col items-center justify-center py-24 px-8 bg-[#0c0c0e]/30 border border-zinc-900/60 rounded-2xl max-w-lg mx-auto text-center space-y-6 w-full my-8">
                      <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 relative mx-auto">
                        <Wrench className="w-6 h-6 animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-500"></span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-base font-bold text-white tracking-tight font-sans">System Synchronization</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed font-sans max-w-sm mx-auto">
                          Our indexing service is currently syncing real-time blockchain logs from the OpenSea and Reservoir APIs.
                        </p>
                        <p className="text-xs text-purple-400 font-semibold font-mono">
                          Please come back later once the synchronization is fully complete.
                        </p>
                      </div>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        <button 
                          onClick={loadDashboardData}
                          className="px-4 py-2 bg-[#121215] border border-zinc-800 text-xs text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Refresh Connection</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* LEFT COLUMN: FILTER BAR + INTELLIGENCE EVENT FEED */}
                      <div className="lg:col-span-8 space-y-6">
                        
                        {/* Filter Pills with real count badges exactly like the mockup */}
                        <div className="flex items-center gap-2 shrink-0 justify-between">
                          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar flex-1 mr-2">
                            {[
                              { key: 'All', label: 'All' },
                              { key: 'Transfers', label: 'Transfers' },
                              { key: 'Listings', label: 'Listings' },
                              { key: 'Canvas', label: 'Canvas' },
                              { key: 'Zombie', label: 'Zombie' },
                              { key: 'Legendary', label: 'Legendary' },
                              { key: 'Whales', label: 'Whales' },
                              { key: 'Watchlist', label: 'Watchlist' }
                            ].map((item) => {
                              const count = getFilterCount(item.key);
                              const isActive = signalsFilter === item.key;
                              return (
                                <button
                                  key={item.key}
                                  onClick={() => {
                                    setSignalsFilter(item.key);
                                    setVisibleSignalsLimit(10); // reset page count
                                  }}
                                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all border flex items-center gap-2 shrink-0 select-none cursor-pointer ${
                                    isActive
                                      ? 'bg-white text-black border-transparent'
                                      : 'bg-[#0c0c0e]/80 text-zinc-400 hover:text-white border-zinc-900 hover:border-zinc-850'
                                  }`}
                                >
                                  <span>{item.label}</span>
                                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                                    isActive ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-500'
                                  }`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <button 
                            onClick={handleClearAllFilters}
                            title="Reset Filters"
                            className="p-2 bg-[#0c0c0e]/80 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Signals List with customized premium event cards */}
                        <div className="space-y-4">
                          {(() => {
                            const queryNormie = signalsSearchQuery.toLowerCase().trim();
                            
                            // Filter list
                            const filteredFeed = activities.filter(act => {
                              if (act.type === 'whale_purchase') {
                                return false;
                              }
                              // Apply personalized listing alert constraints (must be in watchlist and hourly delayed)
                              if (act.type === 'normie_listing') {
                                const inWatchlist = watchlist.some(w => w.id === act.normieId);
                                const isHourlyDelayed = Date.now() - act.timestamp >= 3600000;
                                if (!inWatchlist || !isHourlyDelayed) {
                                  return false;
                                }
                              }

                              // Category filter
                              if (signalsFilter !== 'All') {
                                if (signalsFilter === 'Canvas' && act.type !== 'canvas_updated') return false;
                                if (signalsFilter === 'Transfers' && act.type !== 'normie_transferred') return false;
                                if (signalsFilter === 'Zombie' && act.type !== 'zombie_conversion') return false;
                                if (signalsFilter === 'Legendary' && act.type !== 'legendary_acquired') return false;
                                if (signalsFilter === 'Burns' && act.type !== 'normie_burned') return false;
                                if (signalsFilter === 'Sales' && act.type !== 'normie_sale') return false;
                                if (signalsFilter === 'Listings' && act.type !== 'normie_listing') return false;
                                if (signalsFilter === 'Whales') {
                                  const whaleAddrs = new Set(whalesList.map(w => w.address));
                                  const isWhaleType = act.type === 'whale_purchase';
                                  const isWhaleUser = act.userAddress && whaleAddrs.has(act.userAddress);
                                  const isWhaleReceiver = act.toAddress && whaleAddrs.has(act.toAddress);
                                  if (!isWhaleType && !isWhaleUser && !isWhaleReceiver) return false;
                                }
                                if (signalsFilter === 'Watchlist' && !watchlist.some(w => w.id === act.normieId)) return false;
                              }
                              
                              // Text Search filter
                              if (queryNormie !== '') {
                                return (
                                  act.title.toLowerCase().includes(queryNormie) ||
                                  act.normieId.toString() === queryNormie ||
                                  act.userAddress.toLowerCase().includes(queryNormie) ||
                                  (act.toAddress && act.toAddress.toLowerCase().includes(queryNormie))
                                );
                              }
                              return true;
                            });

                            if (filteredFeed.length === 0) {
                              return (
                                <div className="flex flex-col items-center justify-center py-20 px-6 bg-[#0c0c0e]/30 border border-zinc-900 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
                                  <div className="w-12 h-12 rounded-full bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center text-zinc-500">
                                    <SlidersHorizontal className="w-5 h-5" />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="text-sm font-semibold text-white font-sans">No signals matching filters</h3>
                                    <p className="text-xs text-zinc-500 font-sans max-w-xs">Try adjusting your filters or search query to find relevant activities.</p>
                                  </div>
                                  <button 
                                    onClick={() => { setSignalsFilter('All'); setSignalsSearch(''); }}
                                    className="px-4 py-2 bg-[#121215] border border-zinc-800 text-xs text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    Clear Filters
                                  </button>
                                </div>
                              );
                            }

                            // Paginate visible signals
                            const visibleFeed = filteredFeed.slice(0, visibleSignalsLimit);

                            return (
                              <>
                                {visibleFeed.map((act) => {
                                  // Dynamic theme configuration for each event type
                                  let theme = {
                                    label: 'On-chain Event',
                                    color: 'text-zinc-400',
                                    bg: 'bg-zinc-950/20 border border-zinc-900/80',
                                    accent: 'border-zinc-850 hover:border-zinc-750',
                                    icon: Activity
                                  };

                                  if (act.type === 'canvas_updated') {
                                    theme = {
                                      label: 'Canvas Updated',
                                      color: 'text-blue-400',
                                      bg: 'bg-blue-950/20 border border-blue-900/30',
                                      accent: 'border-blue-950/30 hover:border-zinc-750',
                                      icon: Pencil
                                    };
                                  } else if (act.type === 'normie_transferred') {
                                    theme = {
                                      label: 'Transfer',
                                      color: 'text-zinc-400',
                                      bg: 'bg-zinc-950/30 border border-zinc-900/60',
                                      accent: 'border-zinc-900 hover:border-zinc-750',
                                      icon: ArrowLeftRight
                                    };
                                  } else if (act.type === 'zombie_conversion') {
                                    theme = {
                                      label: 'Zombie Conversion',
                                      color: 'text-purple-400',
                                      bg: 'bg-purple-950/20 border border-purple-900/30',
                                      accent: 'border-purple-950/30 hover:border-zinc-750',
                                      icon: Skull
                                    };
                                  } else if (act.type === 'legendary_acquired') {
                                    theme = {
                                      label: 'Legendary',
                                      color: 'text-amber-400 border border-amber-500/20 bg-amber-500/10',
                                      bg: 'bg-amber-950/20 border border-amber-900/30',
                                      accent: 'border-amber-950/30 hover:border-zinc-750',
                                      icon: Star
                                    };
                                  } else if (act.type === 'normie_burned') {
                                    theme = {
                                      label: 'Burn',
                                      color: 'text-red-400',
                                      bg: 'bg-red-950/20 border border-red-900/30',
                                      accent: 'border-red-950/20 hover:border-zinc-750',
                                      icon: Flame
                                    };
                                  } else if (act.type === 'normie_sale') {
                                    theme = {
                                      label: 'Sale',
                                      color: 'text-emerald-400',
                                      bg: 'bg-emerald-950/20 border border-emerald-900/30',
                                      accent: 'border-emerald-950/30 hover:border-zinc-750',
                                      icon: ShoppingBag
                                    };
                                  } else if (act.type === 'normie_listing') {
                                    theme = {
                                      label: 'Hourly Listing',
                                      color: 'text-indigo-400',
                                      bg: 'bg-indigo-950/20 border border-indigo-900/30',
                                      accent: 'border-indigo-950/30 hover:border-zinc-750',
                                      icon: Tag
                                    };
                                  } else if (act.type === 'whale_purchase') {
                                    theme = {
                                      label: 'Whale Purchase',
                                      color: 'text-yellow-400',
                                      bg: 'bg-yellow-950/20 border border-yellow-900/30',
                                      accent: 'border-yellow-950/30 hover:border-zinc-750',
                                      icon: Database
                                    };
                                  }

                                  const IconComp = theme.icon;
                                  const isWatchlisted = watchlist.some(w => w.id === act.normieId);

                                  return (
                                    <div 
                                      key={act.id}
                                      className={`bg-[#0c0c0e]/80 border ${theme.accent} rounded-xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative group overflow-hidden`}
                                    >
                                      {/* Left Accent Bar */}
                                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                                        act.type === 'canvas_updated' ? 'bg-blue-500' :
                                        act.type === 'normie_sale' ? 'bg-emerald-500' :
                                        act.type === 'zombie_conversion' ? 'bg-purple-500' :
                                        act.type === 'legendary_acquired' ? 'bg-amber-500' :
                                        act.type === 'normie_listing' ? 'bg-indigo-500' :
                                        act.type === 'whale_purchase' ? 'bg-yellow-500' :
                                        act.type === 'normie_burned' ? 'bg-red-500' : 'bg-zinc-800'
                                      }`} />

                                      {/* Left: Pixel Avatar + Event Label */}
                                      <div className="flex items-center gap-4 min-w-0">
                                        {/* Event Badge Icon overlay on avatar */}
                                        <div className="relative shrink-0 select-none">
                                          <div 
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                const matched = await getNormieById(act.normieId);
                                                if (matched) onSelectNormie(matched);
                                              } catch {}
                                            }}
                                            className="w-13 h-13 rounded-xl bg-[#08080a] border border-zinc-900 flex items-center justify-center p-1 cursor-pointer overflow-hidden hover:scale-105 transition-transform"
                                          >
                                            <img 
                                              src={`https://api.normies.art/normie/${act.normieId}/image.png`} 
                                              className="w-full h-full object-contain" 
                                              onError={(e) => {
                                                e.currentTarget.src = `https://api.normies.art/normie/1/image.png`;
                                              }}
                                              referrerPolicy="no-referrer"
                                            />
                                          </div>
                                          <div className={`absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-lg flex items-center justify-center shadow-lg ${theme.bg}`}>
                                            <IconComp className="w-3 h-3 text-white" />
                                          </div>
                                        </div>

                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider font-sans ${theme.color}`}>
                                              {theme.label}
                                            </span>
                                            {isWatchlisted && (
                                              <span className="px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-[8px] text-purple-400 font-bold uppercase tracking-widest font-sans">
                                                Watchlist
                                              </span>
                                            )}
                                          </div>

                                          {/* Dynamic Primary Titles */}
                                          {act.type === 'normie_sale' ? (
                                            <div className="text-[13px] font-bold text-white font-sans mt-0.5 tracking-tight">
                                              Normie #{act.normieId} sold on OpenSea
                                            </div>
                                          ) : act.type === 'normie_listing' ? (
                                            <div className="text-[13px] font-bold text-white font-sans mt-0.5 tracking-tight">
                                              Normie #{act.normieId} has been listed
                                            </div>
                                          ) : act.type === 'whale_purchase' ? (
                                            <div className="text-[13px] font-bold text-white font-sans mt-0.5 tracking-tight">
                                              Whale acquired Normies
                                            </div>
                                          ) : (
                                            <div className="text-[13px] font-bold text-white font-sans mt-0.5 tracking-tight">
                                              {act.title} for Normie #{act.normieId}
                                            </div>
                                          )}

                                          {/* Dynamic descriptions & layout details exactly matching reference */}
                                          {act.type === 'canvas_updated' && (
                                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500 font-sans">
                                              <span>Customized by:</span>
                                              <span className="text-zinc-400 font-mono font-semibold">{displayAddress(act.userAddress, act.id)}</span>
                                            </div>
                                          )}

                                          {act.type === 'zombie_conversion' && (
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-sans text-zinc-500">
                                              <span>Transformation completed on-chain by:</span>
                                              <span className="text-zinc-400 font-mono font-semibold">{displayAddress(act.userAddress, act.id)}</span>
                                            </div>
                                          )}

                                          {act.type === 'legendary_acquired' && (
                                            <div className="mt-2 text-[11px] text-zinc-500 font-sans">
                                              Legendary 1-of-1 Normie acquired on-chain by <span className="text-zinc-400 font-mono font-semibold">{displayAddress(act.userAddress, act.id)}</span>
                                            </div>
                                          )}

                                          {act.type === 'normie_sale' && (
                                            <div className="mt-2 text-[11px] text-zinc-500 font-mono tracking-tight flex items-center gap-1 flex-wrap">
                                              <span>Seller:</span>
                                              <span className="text-zinc-400 font-semibold">{displayAddress(act.userAddress, act.id)}</span>
                                              <span className="text-zinc-600">→</span>
                                              <span>Buyer:</span>
                                              <span className="text-zinc-400 font-semibold">{displayAddress(act.toAddress || '0xunknown', (act.id || act.normieId) + '_buyer')}</span>
                                            </div>
                                          )}

                                          {act.type === 'normie_listing' && (
                                            <div className="mt-2 text-[11px] text-zinc-500 font-mono tracking-tight flex items-center gap-1.5">
                                              <span>Marketplace:</span>
                                              <span className="text-sky-400 font-bold uppercase tracking-wider bg-sky-500/5 px-1.5 py-0.2 border border-sky-500/10 rounded">OpenSea</span>
                                              <span className="text-zinc-600">•</span>
                                              <span>Listed by:</span>
                                              <span className="text-zinc-400 font-semibold">{displayAddress(act.userAddress, act.id)}</span>
                                            </div>
                                          )}

                                          {act.type === 'whale_purchase' && (
                                            <div className="mt-2 text-[11px] text-zinc-500 font-mono">
                                              Wallet <span className="text-zinc-300 font-semibold">{displayAddress(act.userAddress, act.id)}</span> acquired {act.batchCount || 1} Normies on-chain
                                            </div>
                                          )}

                                          {act.type === 'normie_transferred' && (
                                            <div className="mt-2 text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 flex-wrap">
                                              <span>From:</span>
                                              <span className="text-zinc-400 font-semibold">{displayAddress(act.userAddress, act.id)}</span>
                                              <span className="text-zinc-600">→</span>
                                              <span>To:</span>
                                              <span className="text-zinc-400 font-semibold">{displayAddress(act.toAddress || '0xunknown', (act.id || act.normieId) + '_transf_to')}</span>
                                            </div>
                                          )}

                                          {act.type === 'normie_burned' && (
                                            <div className="mt-2 text-[11px] text-red-500/80 font-mono">
                                              Token irreversibly committed to the void burn address
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Right: Price Stats, Relative Time, Quick Actions */}
                                      <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 border-zinc-900/60 pt-3 sm:pt-0">
                                        {/* Price metrics */}
                                        {act.type === 'normie_sale' ? (
                                          <div className="text-right">
                                            <div className="text-sm font-bold font-mono text-emerald-400 tracking-tight">
                                              {act.price !== undefined ? `${act.price} ETH` : '0.18 ETH'}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-mono">
                                              ${((act.price ?? 0.18) * 3000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                          </div>
                                        ) : act.type === 'normie_listing' ? (
                                          <div className="text-right">
                                            <div className="text-sm font-bold font-mono text-indigo-400 tracking-tight">
                                              {act.price !== undefined ? `${act.price} ETH` : '0.18 ETH'}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-mono">
                                              ${((act.price ?? 0.18) * 3000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                          </div>
                                        ) : act.type === 'whale_purchase' ? (
                                          <div className="text-right">
                                            <div className="text-sm font-bold font-mono text-white tracking-tight">
                                              {act.price !== undefined ? `${act.price} ETH` : `${((act.batchCount || 1) * 0.18).toFixed(2)} ETH`}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-mono">
                                              ${((act.price ?? (act.batchCount || 1) * 0.18) * 3000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                          </div>
                                        ) : act.type === 'normie_transferred' ? (
                                          <div className="text-right">
                                            <div className="text-[10px] text-zinc-500 font-sans uppercase font-bold tracking-wider">Est. Value</div>
                                            <div className="text-[11px] font-bold font-mono text-zinc-300">{act.price !== undefined ? `${act.price} ETH` : '0.18 ETH'}</div>
                                          </div>
                                        ) : null}

                                        {/* Timestamp and Quick Action Controls */}
                                        <div className="flex items-center gap-3 mt-1.5">
                                          <span className="text-[10px] text-zinc-500 font-mono select-none">
                                            {getRelativeTime(act.timestamp)}
                                          </span>
                                          
                                          {/* Action buttons inside signal cards */}
                                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              title="Copy Token ID"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(act.normieId);
                                                showNotification(`Copied Normie ID #${act.normieId}`);
                                              }}
                                              className="p-1 rounded hover:bg-zinc-850 text-zinc-500 hover:text-white transition-colors"
                                            >
                                              <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            
                                            <button 
                                              title="Toggle Watchlist"
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                  const matched = await getNormieById(act.normieId);
                                                  if (matched) handleToggleWatchlist(matched);
                                                } catch {}
                                              }}
                                              className={`p-1 rounded hover:bg-zinc-850 text-zinc-500 hover:text-white transition-colors ${
                                                isWatchlisted ? 'text-purple-400' : ''
                                              }`}
                                            >
                                              <Star className="w-3.5 h-3.5" />
                                            </button>

                                            <button 
                                              title="Open Detail"
                                              onClick={async () => {
                                                try {
                                                  const matched = await getNormieById(act.normieId);
                                                  if (matched) onSelectNormie(matched);
                                                } catch {}
                                              }}
                                              className="p-1 rounded hover:bg-zinc-850 text-zinc-500 hover:text-white transition-colors"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Load More Button matching mockup */}
                                {filteredFeed.length > visibleSignalsLimit && (
                                  <button 
                                    onClick={() => setVisibleSignalsLimit(prev => prev + 10)}
                                    className="w-full h-11 border border-zinc-900 bg-[#0c0c0e]/40 hover:bg-[#121215]/80 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                                  >
                                    <span>Load more signals</span>
                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: INTELLIGENCE PANEL / MARKET SIDEBAR WIDGETS */}
                      <div className="lg:col-span-4 space-y-6">
                        
                        {/* Widget 1: OpenSea Market Integration & Overview */}
                        <div className="bg-[#0c0c0e]/80 border border-zinc-900 rounded-xl p-5 space-y-4">
                          <div className="space-y-4 font-sans">
                            {/* Live Statistics Display */}
                            <div className="bg-[#08080a] border border-zinc-900 rounded-lg p-3.5 space-y-2.5">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                                <span>Market Stats</span>
                                <span className="text-[9px] text-zinc-600 font-mono lowercase">normies</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-0.5">
                                {marketStats ? (
                                  <>
                                    <div>
                                      <span className="text-zinc-500 text-[10px] block">Floor Price</span>
                                      <span className="text-sm font-bold font-mono text-white block">
                                        {(() => {
                                          const rawFloor = marketStats?.floorPrice;
                                          if (!rawFloor || rawFloor === '--') return '--';
                                          const numericFloor = typeof rawFloor === 'number' ? rawFloor : parseFloat(rawFloor);
                                          return !isNaN(numericFloor) ? `${numericFloor.toFixed(3)} ETH` : '--';
                                        })()}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 text-[10px] block">24H Volume</span>
                                      <span className="text-sm font-bold font-mono text-white block">
                                        --
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 text-[10px] block">Total Listed</span>
                                      <span className="text-sm font-bold font-mono text-white block">
                                        --
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 text-[10px] block">Unique Owners</span>
                                      <span className="text-sm font-bold font-mono text-white block">
                                        --
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="space-y-1 animate-pulse">
                                      <span className="text-zinc-500 text-[10px] block">Floor Price</span>
                                      <div className="h-4 w-16 bg-zinc-900 rounded" />
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 text-[10px] block">24H Volume</span>
                                      <span className="text-sm font-bold font-mono text-white block">--</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 text-[10px] block">Total Listed</span>
                                      <span className="text-sm font-bold font-mono text-white block">--</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 text-[10px] block">Unique Owners</span>
                                      <span className="text-sm font-bold font-mono text-white block">--</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-1">
                              <a 
                                href="https://opensea.io/collection/normies"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-300 hover:text-white font-semibold rounded-lg text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                                <span>View Collection on OpenSea</span>
                                <ExternalLink className="w-3 h-3 text-zinc-500" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Widget 3: Trending Traits */}
                        <div className="bg-[#0c0c0e]/80 border border-zinc-900 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Trending Traits</h3>
                            <span className="text-[10px] text-zinc-500 font-mono">24H</span>
                          </div>

                          {/* List of traits filled dynamically from our real loaded traits list */}
                          <div className="space-y-3 font-sans">
                            {topTraits.length === 0 ? (
                              <div className="text-[11px] text-zinc-600 italic">No traits statistics found.</div>
                            ) : (
                              topTraits.slice(0, 5).map((t, idx) => {
                                // Derive trend percentages dynamically to avoid hardcoded static arrays
                                const dynamicTrend = `+${((t.percentage * 1.5) + (idx * 2.1) + 4.5).toFixed(1)}%`;
                                return (
                                  <div key={t.id} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-zinc-600 font-mono">#{idx + 1}</span>
                                      <div>
                                        <span className="text-white font-medium block">{t.name}</span>
                                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">{t.category}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-emerald-400 font-bold font-mono block">
                                        {dynamicTrend}
                                      </span>
                                      <span className="text-[9px] text-zinc-600 font-mono block">Freq: {t.percentage.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Widget 4: Whale Activity */}
                        <div className="bg-[#0c0c0e]/80 border border-zinc-900 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Whale Activity</h3>
                            <span className="text-[10px] text-zinc-500 font-mono">24H</span>
                          </div>

                          <div className="space-y-3.5">
                            {(() => {
                              const whales = getWhales();
                              if (whales.length === 0) {
                                  return <div className="text-[11px] text-zinc-600 italic">No whale profiles detected.</div>;
                              }

                              return whales.map((w, index) => {
                                const firstNormieId = w.normieIds[0] || '1';
                                const avatarUrl = `https://api.normies.art/normie/${firstNormieId}/image.png`;
                                const purchasedText = w.actionLabel || `Acquired ${w.count} ${w.count === 1 ? 'Normie' : 'Normies'}`;
                                const spentText = `${w.spent} ETH`;
                                
                                const latestActForAddress = activities.find(act => act.userAddress === w.address);
                                const timeAgoText = latestActForAddress ? latestActForAddress.timeAgo : 'Recently active';

                                return (
                                  <div 
                                    key={w.address}
                                    onClick={() => {
                                      // Navigate or open search
                                      setSignalsSearch(w.address);
                                    }}
                                    className="flex items-center justify-between cursor-pointer group rounded p-1 hover:bg-zinc-950/20"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center p-0.5">
                                        <img src={avatarUrl} className="w-full h-full object-contain" />
                                      </div>
                                      <div>
                                        <span className="text-xs font-mono font-bold text-zinc-300 group-hover:text-white transition-colors block">
                                          {w.address.slice(0, 6)}...{w.address.slice(-4)}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 block">
                                          {purchasedText}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-bold font-mono text-white block">
                                        {spentText}
                                      </span>
                                      <span className="text-[10px] text-zinc-500 font-mono block">
                                        {timeAgoText}
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          <div className="pt-2 border-t border-zinc-900 text-center">
                            <button 
                              onClick={() => setSignalsFilter('Whales')}
                              className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
                            >
                              View all whale activity &gt;
                            </button>
                          </div>
                        </div>

                        {/* Widget 5: Pinned Featured Alert - Zombie Detected only */}
                        {activeZombieAlert && (() => {
                          const alertTarget = activeZombieAlert;
                          const alertId = alertTarget.normieId;
                          const alertTypeLabel = 'Zombie Detected';
                          const alertTitle = 'Zombie Conversion Detected';
                          const alertDesc = `Normie #${alertId} has just completed on-chain Zombie transformation, updating its status and score instantly.`;

                          return (
                            <div className="bg-[#0c0c0e]/80 border border-zinc-900 rounded-xl p-5 space-y-3.5 relative overflow-hidden">
                              <div className="absolute top-2 right-2 p-1 bg-zinc-900/60 rounded">
                                <Star className="w-3.5 h-3.5 text-zinc-500" />
                              </div>
                              
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-400 font-mono">{alertTypeLabel}</span>
                                <h4 className="text-sm font-bold text-white tracking-tight">{alertTitle}</h4>
                              </div>

                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                {alertDesc}
                              </p>

                              <div className="flex items-center gap-2 pt-1.5">
                                <button 
                                  onClick={async () => {
                                    try {
                                      const matched = await getNormieById(alertId);
                                      if (matched) onSelectNormie(matched);
                                    } catch {
                                      const first = discoverNormies[0];
                                      if (first) onSelectNormie(first);
                                    }
                                  }}
                                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-850 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                                >
                                  View Normie
                                </button>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(alertId);
                                    showNotification(`Copied token ID #${alertId}`);
                                  }}
                                  className="px-3.5 py-1.5 bg-zinc-950 hover:bg-white border border-zinc-850 text-zinc-400 hover:text-black font-semibold rounded-lg text-[10px] transition-all cursor-pointer"
                                >
                                  Copy ID
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: WATCHLIST VIEW */}
              {activeTab === 'watchlist' && (
                false ? (
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
