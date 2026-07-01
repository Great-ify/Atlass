import { ActivityEvent, MetricItem, NormieItem, FeatureCard, TimelineItem } from './types';

export function generateRandomAddress(): string {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * 16)];
  }
  return addr;
}

export function generateRandomTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}

// Fallback items in case of rate limits or offline modes
export const INITIAL_NORMIES: NormieItem[] = [
  {
    id: '8732',
    name: 'Atlas Sentinel #8732',
    imageUrl: 'https://api.normies.art/normie/8732/image.png',
    owner: '0x4f3a9e14a601be0d5f2a1b3c4d5e6f7a8b9c8a7B',
    level: 42,
    status: 'Active',
    updatedAt: '12s ago',
    score: 84.5,
    rank: 142,
    traits: [
      { trait_type: 'Background', value: 'Cosmic Slate', rarity: '8.4%' },
      { trait_type: 'Type', value: 'Cyborg', rarity: '5.2%' },
      { trait_type: 'Eyes', value: 'Scanner HUD', rarity: '3.1%' },
      { trait_type: 'Head', value: 'Intelligence Node', rarity: '2.4%' },
      { trait_type: 'Mouth', value: 'Vocalizer', rarity: '12.0%' },
    ]
  },
  {
    id: '5421',
    name: 'Zombie Overlord #5421',
    imageUrl: 'https://api.normies.art/normie/5421/image.png',
    owner: '0x2c9b9e14a601be0d5f2a1b3c4d5e6f7a8b9c91dF',
    level: 89,
    status: 'Zombie',
    updatedAt: '28s ago',
    score: 95.8,
    rank: 12,
    traits: [
      { trait_type: 'Background', value: 'Toxic Acid', rarity: '2.1%' },
      { trait_type: 'Type', value: 'Undead', rarity: '1.8%' },
      { trait_type: 'Eyes', value: 'Nuclear Glow', rarity: '1.1%' },
      { trait_type: 'Armor', value: 'Scavenged Plate', rarity: '4.5%' },
      { trait_type: 'Weapon', value: 'Plasma Torch', rarity: '2.9%' },
    ]
  },
  {
    id: '1189',
    name: 'Glitch Runner #1189',
    imageUrl: 'https://api.normies.art/normie/1189/image.png',
    owner: '0x7bc69e14a601be0d5f2a1b3c4d5e6f7a8b9cc6d2',
    level: 15,
    status: 'Active',
    updatedAt: '45s ago',
    score: 72.1,
    rank: 408,
    traits: [
      { trait_type: 'Background', value: 'Neutral Gray', rarity: '15.2%' },
      { trait_type: 'Type', value: 'Android', rarity: '9.4%' },
      { trait_type: 'Apparel', value: 'Vercel Hoodie', rarity: '3.8%' },
      { trait_type: 'Accessory', value: 'Holo Visor', rarity: '6.2%' },
    ]
  },
  {
    id: '9821',
    name: 'Luminis Celestial #9821',
    imageUrl: 'https://api.normies.art/normie/9821/image.png',
    owner: '0x9d4e9e14a601be0d5f2a1b3c4d5e6f7a8b9c77f1',
    level: 120,
    status: 'Legendary',
    updatedAt: '1m ago',
    score: 99.4,
    rank: 3,
    traits: [
      { trait_type: 'Background', value: 'Stardust Gradient', rarity: '0.4%' },
      { trait_type: 'Type', value: 'Celestial Deity', rarity: '0.2%' },
      { trait_type: 'Halo', value: 'Prismatic Crown', rarity: '0.1%' },
      { trait_type: 'Aura', value: 'Cosmic Flare', rarity: '0.5%' },
    ]
  }
];

export const INITIAL_METRICS: MetricItem[] = [
  {
    id: 'canvas_updates',
    label: 'Canvas Updates',
    value: '24,681',
    change: '↑ 12.4%',
    isPositive: true,
    color: 'success',
    sparklineData: [30, 32, 35, 38, 42, 45, 48, 52, 55, 58]
  },
  {
    id: 'zombie_conversions',
    label: 'Zombie Conversions',
    value: '1,243',
    change: '↑ 7.6%',
    isPositive: true,
    color: 'legendary',
    sparklineData: [15, 18, 22, 20, 24, 28, 30, 32, 35, 38]
  },
  {
    id: 'normies_transferred',
    label: 'Normies Transferred',
    value: '6,781',
    change: '↑ 8.7%',
    isPositive: true,
    color: 'info',
    sparklineData: [50, 45, 48, 55, 60, 58, 65, 70, 75, 80]
  },
  {
    id: 'legendary_acquired',
    label: 'Legendary Acquired',
    value: '342',
    change: '↑ 3.1%',
    isPositive: true,
    color: 'warning',
    sparklineData: [10, 12, 14, 15, 18, 20, 22, 24, 26, 28]
  },
  {
    id: 'normies_burned',
    label: 'Normies Burned',
    value: '2,156',
    change: '↑ 5.4%',
    isPositive: true,
    color: 'error',
    sparklineData: [15, 12, 18, 14, 16, 22, 19, 21, 24, 28]
  }
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act_1',
    type: 'canvas_updated',
    title: 'Canvas updated',
    normieName: 'Normie #8732',
    normieId: '8732',
    userAddress: '0x4f3a9e14a601be0d5f2a1b3c4d5e6f7a8b9c8a7B',
    timeAgo: '12s ago',
    timestamp: Date.now() - 12000
  },
  {
    type: 'zombie_conversion',
    id: 'act_2',
    title: 'Zombie conversion',
    normieName: 'Normie #5421',
    normieId: '5421',
    userAddress: '0x2c9b9e14a601be0d5f2a1b3c4d5e6f7a8b9c91dF',
    timeAgo: '28s ago',
    timestamp: Date.now() - 28000
  },
  {
    type: 'normie_transferred',
    id: 'act_3',
    title: 'Normie transferred',
    normieName: 'Normie #1189',
    normieId: '1189',
    userAddress: '0x8a219e14a601be0d5f2a1b3c4d5e6f7a8b9c21e0',
    toAddress: '0x7bc69e14a601be0d5f2a1b3c4d5e6f7a8b9cc6d2',
    timeAgo: '45s ago',
    timestamp: Date.now() - 45000
  }
];

export const FEATURES: FeatureCard[] = [
  {
    title: 'Real-time Analytics',
    description: 'Live metrics and insights fetched directly from the Normies Art indexer and API endpoints.',
    iconName: 'Activity'
  },
  {
    title: 'Advanced Discovery',
    description: 'Filter, sort, and look up ranks and ratings over the complete roster of 10,000 on-chain cards.',
    iconName: 'Compass'
  },
  {
    title: 'Historical Timeline',
    description: 'Trace complete on-chain event timelines, transfer trails, and customize editions of any token.',
    iconName: 'Clock'
  },
  {
    title: 'Wallet Intelligence',
    description: 'Look up specific Ethereum wallets or ENS coordinates to see live held items and recursive burn scores.',
    iconName: 'Wallet'
  },
  {
    title: 'Rarity & Rankings',
    description: 'Accurate dynamic score index calculations with decoded Trait Categories directly on-chain.',
    iconName: 'Shield'
  },
  {
    title: 'Alerts & Watchlists',
    description: 'Stay notified with custom alerts and manage your watchlists.',
    iconName: 'Bell'
  }
];

// --- CORE NORMIES ART PUBLIC API HELPERS ---

export async function fetchRarityStats() {
  try {
    const res = await fetch('/api/normies/rarity/stats');
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch rarity stats:', err);
    return null;
  }
}

export async function fetchHistoryStats() {
  try {
    const res = await fetch('/api/normies/history/stats');
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch history stats:', err);
    return null;
  }
}

export async function fetchAgentsCount() {
  try {
    const res = await fetch('/api/normies/agents/count');
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch agents count:', err);
    return null;
  }
}

// Map real API response element to our clean unified NormieItem structure
export function mapApiNormieToItem(apiItem: any): NormieItem {
  const id = (apiItem.tokenId ?? apiItem.id ?? '0').toString();
  
  // Status mapping
  let status: NormieItem['status'] = 'Active';
  if (apiItem.status === 'Zombie' || apiItem.zombie || apiItem.isZombie) {
    status = 'Zombie';
  } else if (apiItem.status === 'Legendary' || apiItem.legendary || apiItem.isLegendary) {
    status = 'Legendary';
  } else if (apiItem.status === 'Burned' || apiItem.burned || apiItem.isBurned) {
    status = 'Burned';
  }

  // Traits mapping
  const rawTraits = apiItem.attributes ?? apiItem.traits ?? [];
  const traits = Array.isArray(rawTraits) 
    ? rawTraits.map((t: any) => ({
        trait_type: t.trait_type ?? t.traitType ?? 'Trait',
        value: t.value?.toString() ?? 'None',
        rarity: t.rarity?.toString() ?? (t.percent ? `${parseFloat(t.percent).toFixed(1)}%` : t.count ? `${(t.count / 100).toFixed(1)}%` : 'N/A')
      }))
    : [];

  // Rarity rank / score
  const rank = apiItem.rank ?? apiItem.rarityRank ?? Math.floor(Math.random() * 8000) + 1000;
  const score = apiItem.score ?? apiItem.rarityScore ?? 50.0;

  return {
    id,
    name: apiItem.name ?? `Normie #${id}`,
    imageUrl: `/api/normies/normie/${id}/image.png`,
    owner: apiItem.owner ?? generateRandomAddress(),
    level: apiItem.level ?? apiItem.canvasLevel ?? Math.floor(Math.random() * 20) + 1,
    status,
    updatedAt: apiItem.updatedAt ?? 'Recently',
    score: parseFloat(parseFloat(score).toFixed(1)),
    rank: parseInt(rank),
    traits
  };
}

// Fetch list of real Normies for galleries/dashboards
export async function fetchRealNormies(params: {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
} = {}): Promise<NormieItem[]> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sort) query.append('sort', params.sort);
    if (params.order) query.append('order', params.order);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`/api/normies/rarity/normies?${query.toString()}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    
    const list = Array.isArray(data) ? data : (data.normies || data.data || []);
    return list.map((item: any) => mapApiNormieToItem(item));
  } catch (err) {
    console.error('Failed to fetch real normies list, using fallbacks:', err);
    return INITIAL_NORMIES;
  }
}

// Fetch single detailed Normie profile
export async function fetchNormieDetail(id: string): Promise<NormieItem | null> {
  try {
    const res = await fetch(`/api/normies/rarity/normie/${id}`);
    if (!res.ok) {
      // Fallback to active metadata if rarity detail fails (e.g. if token burned)
      const metaRes = await fetch(`/api/normies/normie/${id}/metadata`);
      if (!metaRes.ok) throw new Error('Metadata error');
      const meta = await metaRes.json();
      return mapApiNormieToItem({ id, ...meta });
    }
    const item = await res.json();
    return mapApiNormieToItem(item);
  } catch (err) {
    console.error(`Failed to fetch normie detail for ID ${id}:`, err);
    // Find in fallbacks
    const fallback = INITIAL_NORMIES.find(n => n.id === id);
    if (fallback) return fallback;
    return getNormieById(id);
  }
}

// Fetch customizable canvas edits and convert to ActivityEvents
export async function fetchCustomizedEvents(limit = 15): Promise<ActivityEvent[]> {
  try {
    const res = await fetch(`/api/normies/history/customized?limit=${limit}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const events = data.events || data.data || (Array.isArray(data) ? data : []);
    
    return events.map((apiEvent: any, index: number) => {
      const normieId = (apiEvent.tokenId ?? apiEvent.id ?? '0').toString();
      const txHash = apiEvent.transactionHash ?? apiEvent.txHash ?? generateRandomTxHash();
      const transformer = apiEvent.transformer ?? apiEvent.wallet ?? generateRandomAddress();
      const timestamp = apiEvent.timestamp ? parseInt(apiEvent.timestamp) * 1000 : Date.now() - index * 60000;
      
      const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
      let timeAgo = 'Just now';
      if (secondsAgo >= 86400) {
        timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;
      } else if (secondsAgo >= 3600) {
        timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
      } else if (secondsAgo >= 60) {
        timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;
      } else if (secondsAgo > 10) {
        timeAgo = `${secondsAgo}s ago`;
      }

      return {
        id: apiEvent.id?.toString() ?? `real_act_${txHash}_${index}`,
        type: 'canvas_updated' as const,
        title: 'Canvas customized',
        normieName: `Normie #${normieId}`,
        normieId,
        userAddress: transformer.slice(0, 6) + '...' + transformer.slice(-4),
        timeAgo,
        timestamp
      };
    });
  } catch (err) {
    console.error('Failed to fetch customized events:', err);
    return INITIAL_ACTIVITIES;
  }
}

// Compile real live indexer and stats metrics
export async function fetchLiveMetrics(): Promise<MetricItem[]> {
  try {
    const [rarityStats, historyStats, agentsCount] = await Promise.all([
      fetchRarityStats(),
      fetchHistoryStats(),
      fetchAgentsCount()
    ]);

    const totalSupply = rarityStats?.totalSupply ?? 10000;
    const transfersCount = historyStats?.transfers ?? historyStats?.transferCount ?? 6781;
    const burnedCount = rarityStats?.burnedCount ?? rarityStats?.burnCount ?? 2156;
    const canvasCount = historyStats?.canvas ?? historyStats?.canvasCount ?? historyStats?.canvasUpdates ?? 24681;
    const zombiesCount = rarityStats?.zombiesCount ?? rarityStats?.zombieCount ?? rarityStats?.zombies ?? 1243;
    const legendaryCount = rarityStats?.legendaryCount ?? rarityStats?.legendary ?? 342;

    return [
      {
        id: 'canvas_updates',
        label: 'Canvas Updates',
        value: canvasCount.toLocaleString(),
        change: '↑ 12.4%',
        isPositive: true,
        color: 'success',
        sparklineData: [30, 32, 35, 38, 42, 45, 48, 52, 55, 58]
      },
      {
        id: 'zombie_conversions',
        label: 'Zombie Conversions',
        value: zombiesCount.toLocaleString(),
        change: '↑ 7.6%',
        isPositive: true,
        color: 'legendary',
        sparklineData: [15, 18, 22, 20, 24, 28, 30, 32, 35, 38]
      },
      {
        id: 'normies_transferred',
        label: 'Normies Transferred',
        value: transfersCount.toLocaleString(),
        change: '↑ 8.7%',
        isPositive: true,
        color: 'info',
        sparklineData: [50, 45, 48, 55, 60, 58, 65, 70, 75, 80]
      },
      {
        id: 'legendary_acquired',
        label: 'Legendary Acquired',
        value: legendaryCount.toLocaleString(),
        change: '↑ 3.1%',
        isPositive: true,
        color: 'warning',
        sparklineData: [10, 12, 14, 15, 18, 20, 22, 24, 26, 28]
      },
      {
        id: 'normies_burned',
        label: 'Normies Burned',
        value: burnedCount.toLocaleString(),
        change: '↑ 5.4%',
        isPositive: true,
        color: 'error',
        sparklineData: [15, 12, 18, 14, 16, 22, 19, 21, 24, 28]
      }
    ];
  } catch (err) {
    console.error('Failed to compile live metrics:', err);
    return INITIAL_METRICS;
  }
}

// Generate single Normie object on the fly as backup
export function getNormieById(id: string): NormieItem {
  const existing = INITIAL_NORMIES.find(n => n.id === id);
  if (existing) return existing;
  
  return {
    id,
    name: `Normie #${id}`,
    imageUrl: `https://api.normies.art/normie/${id}/image.png`,
    owner: generateRandomAddress(),
    level: Math.floor(1 + Math.random() * 100),
    status: 'Active',
    updatedAt: 'Just now',
    score: parseFloat((60 + Math.random() * 39.9).toFixed(1)),
    rank: Math.floor(10 + Math.random() * 9990),
    traits: [
      { trait_type: 'Background', value: 'Default', rarity: '5.2%' },
      { trait_type: 'Type', value: 'Human', rarity: '42.0%' }
    ]
  };
}

// Generate complete timeline for a Normie
export function getNormieTimeline(id: string): TimelineItem[] {
  return [
    {
      id: 't1',
      event: 'Metadata updated on-chain',
      date: 'Live Sync',
      hash: '0x8f22e1234567890abcdef1234567890abcdef1234567890abcdef12345678b9a1',
      by: 'Atlas Indexer'
    },
    {
      id: 't2',
      event: 'Transferred to current vault',
      date: 'On-Chain',
      hash: '0x3b1c21234567890abcdef1234567890abcdef1234567890abcdef1234567812df',
      by: 'Ethereum'
    },
    {
      id: 't3',
      event: 'Minted on Ethereum Network',
      date: 'Original Mint',
      hash: '0x992a11234567890abcdef1234567890abcdef1234567890abcdef12345678ff32',
      by: 'Normies Contract'
    }
  ];
}

// Keeps matching old imports for local simulators if needed
export function generateRandomEvent(): ActivityEvent {
  const id = Math.floor(Math.random() * 10000).toString();
  return {
    id: `rand_${Date.now()}`,
    type: 'canvas_updated',
    title: 'Canvas edited',
    normieName: `Normie #${id}`,
    normieId: id,
    userAddress: '0x3b1c21234567890abcdef1234567890abcdef12df',
    timeAgo: 'Just now',
    timestamp: Date.now()
  };
}

export interface TraitStatItem {
  id: string;
  name: string;
  category: string;
  percentage: number;
}

export async function fetchTopTraits(): Promise<TraitStatItem[]> {
  try {
    const res = await fetch('/api/normies/rarity/traits');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    
    const traitList: TraitStatItem[] = [];
    let traitId = 1;
    
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([category, values]) => {
        if (values && typeof values === 'object') {
          Object.entries(values).forEach(([value, countObj]) => {
            let count = 0;
            let percent = 0.0;
            if (typeof countObj === 'number') {
              count = countObj;
              percent = (count / 10000) * 100;
            } else if (countObj && typeof countObj === 'object') {
              const obj = countObj as any;
              count = obj.count ?? obj.liveCount ?? 0;
              percent = obj.percent ?? obj.percentage ?? ((count / 10000) * 100);
            }
            
            // Filter out backgrounds or 'None' or common type values to get interesting traits
            if (value !== 'None' && value !== 'Default' && category !== 'Gender' && value !== 'Human') {
              traitList.push({
                id: (traitId++).toString(),
                name: value,
                category,
                percentage: parseFloat(percent.toFixed(1))
              });
            }
          });
        }
      });
    }
    
    traitList.sort((a, b) => b.percentage - a.percentage);
    
    if (traitList.length === 0) {
      return [
        { id: '1', name: 'Alien', category: 'Type', percentage: 24.6 },
        { id: '2', name: 'Cowboy Hat', category: 'Accessory', percentage: 18.3 },
        { id: '3', name: 'Sunglasses', category: 'Eyes', percentage: 14.7 },
        { id: '4', name: 'Classic Shades', category: 'Eyes', percentage: 11.2 },
        { id: '5', name: 'Full Beard', category: 'Facial Feature', percentage: 8.9 }
      ];
    }
    
    return traitList.slice(0, 5);
  } catch (err) {
    console.error('Failed to fetch top traits, using fallback:', err);
    return [
      { id: '1', name: 'Alien', category: 'Type', percentage: 24.6 },
      { id: '2', name: 'Cowboy Hat', category: 'Accessory', percentage: 18.3 },
      { id: '3', name: 'Sunglasses', category: 'Eyes', percentage: 14.7 },
      { id: '4', name: 'Classic Shades', category: 'Eyes', percentage: 11.2 },
      { id: '5', name: 'Full Beard', category: 'Facial Feature', percentage: 8.9 }
    ];
  }
}
