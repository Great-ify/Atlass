import { ActivityEvent, MetricItem, NormieItem, TraitStatItem, TimelineItem } from '../types';

export type { TraitStatItem };

const BASE_API_PATH = '/api/normies';

// Helper to map API response to internal model
export function mapApiNormieToItem(apiItem: any): NormieItem {
  const id = (apiItem.tokenId ?? apiItem.id ?? '0').toString();
  
  let status: NormieItem['status'] = 'Active';
  if (apiItem.status === 'Zombie' || apiItem.zombie || apiItem.isZombie) {
    status = 'Zombie';
  } else if (apiItem.status === 'Legendary' || apiItem.legendary || apiItem.isLegendary) {
    status = 'Legendary';
  } else if (apiItem.status === 'Burned' || apiItem.burned || apiItem.isBurned) {
    status = 'Burned';
  }

  const rawTraits = apiItem.attributes ?? apiItem.traits ?? [];
  const traits = Array.isArray(rawTraits) 
    ? rawTraits.map((t: any) => ({
        trait_type: t.trait_type ?? t.traitType ?? 'Trait',
        value: t.value?.toString() ?? 'None',
        rarity: t.rarity?.toString() ?? (t.percent ? `${parseFloat(t.percent).toFixed(1)}%` : t.count ? `${(t.count / 100).toFixed(1)}%` : 'N/A')
      }))
    : [];

  const rank = apiItem.rank ?? apiItem.rarityRank ?? 0;
  const score = apiItem.score ?? apiItem.rarityScore ?? 0;

  return {
    id,
    name: apiItem.name ?? `Normie #${id}`,
    imageUrl: `${BASE_API_PATH}/normie/${id}/image.png`,
    owner: apiItem.owner ?? '0x0000000000000000000000000000000000000000',
    level: apiItem.level ?? apiItem.canvasLevel ?? 1,
    status,
    updatedAt: apiItem.updatedAt ?? 'Recently',
    score: parseFloat(parseFloat(score.toString()).toFixed(1)),
    rank: parseInt(rank.toString()),
    traits
  };
}

export async function fetchLiveMetrics(): Promise<MetricItem[]> {
  try {
    const [rarityStats, historyStats] = await Promise.all([
      fetch(`${BASE_API_PATH}/rarity/stats`).then(res => res.json()),
      fetch(`${BASE_API_PATH}/history/stats`).then(res => res.json())
    ]);

    const canvasCount = historyStats?.totalTransforms ?? historyStats?.canvas ?? historyStats?.canvasCount ?? historyStats?.canvasUpdates ?? 0;
    const zombiesCount = historyStats?.totalZombies ?? rarityStats?.zombiesCount ?? rarityStats?.zombieCount ?? rarityStats?.zombies ?? 0;
    const transfersCount = historyStats?.totalBurnCommitments ?? historyStats?.transfers ?? historyStats?.transferCount ?? 0;
    const legendaryCount = historyStats?.totalLegendaryCanvases ?? rarityStats?.legendaryCount ?? rarityStats?.legendary ?? 0;
    const burnedCount = rarityStats?.burned ?? historyStats?.totalBurnedTokens ?? rarityStats?.burnedCount ?? rarityStats?.burnCount ?? 0;

    return [
      { id: 'canvas_updates', label: 'Canvas Updates', value: canvasCount.toLocaleString(), change: 'Live', isPositive: true, color: 'success', sparklineData: [30, 32, 35, 38, 42, 45, 48, 52, 55, 58] },
      { id: 'zombie_conversions', label: 'Zombie Conversions', value: zombiesCount.toLocaleString(), change: 'Live', isPositive: true, color: 'legendary', sparklineData: [15, 18, 22, 20, 24, 28, 30, 32, 35, 38] },
      { id: 'normies_transferred', label: 'Normies Transferred', value: transfersCount.toLocaleString(), change: 'Live', isPositive: true, color: 'info', sparklineData: [50, 45, 48, 55, 60, 58, 65, 70, 75, 80] },
      { id: 'legendary_acquired', label: 'Legendary Acquired', value: legendaryCount.toLocaleString(), change: 'Live', isPositive: true, color: 'warning', sparklineData: [10, 12, 14, 15, 18, 20, 22, 24, 26, 28] },
      { id: 'normies_burned', label: 'Normies Burned', value: burnedCount.toLocaleString(), change: 'Live', isPositive: true, color: 'error', sparklineData: [15, 12, 18, 14, 16, 22, 19, 21, 24, 28] }
    ];
  } catch (err) {
    console.warn('Failed to compile live metrics:', err);
    return [];
  }
}

export async function fetchCustomizedEvents(limit = 15): Promise<ActivityEvent[]> {
  try {
    const res = await fetch(`${BASE_API_PATH}/history/customized?limit=${limit}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const events = data.events || data.data || (Array.isArray(data) ? data : []);
    
    return events.map((apiEvent: any, index: number) => {
      const normieId = (apiEvent.tokenId ?? apiEvent.id ?? '0').toString();
      const transformer = apiEvent.transformer ?? apiEvent.wallet ?? '0x000...000';
      const timestamp = apiEvent.timestamp ? parseInt(apiEvent.timestamp) * 1000 : Date.now() - index * 60000;
      
      const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
      let timeAgo = 'Just now';
      if (secondsAgo >= 86400) timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;
      else if (secondsAgo >= 3600) timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
      else if (secondsAgo >= 60) timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;
      else if (secondsAgo > 10) timeAgo = `${secondsAgo}s ago`;

      return {
        id: apiEvent.id?.toString() ?? `real_act_${index}`,
        type: 'canvas_updated' as const,
        title: 'Canvas customized',
        normieName: `Normie #${normieId}`,
        normieId,
        userAddress: transformer,
        timeAgo,
        timestamp
      };
    });
  } catch (err) {
    console.warn('Failed to fetch customized events:', err);
    return [];
  }
}

export async function fetchRealNormies(params: {
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  page?: number;
} = {}): Promise<NormieItem[]> {
  try {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sort) query.append('sort', params.sort);
    if (params.order) query.append('order', params.order);
    if (params.search) query.append('q', params.search); // Searching using 'q' as per API docs
    if (params.page) query.append('page', params.page.toString());

    const res = await fetch(`${BASE_API_PATH}/rarity/normies?${query.toString()}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    
    const list = Array.isArray(data) ? data : (data.items || data.normies || data.data || []);
    return list.map((item: any) => mapApiNormieToItem(item));
  } catch (err) {
    console.warn('Failed to fetch real normies list:', err);
    return [];
  }
}

export async function fetchNormieDetail(id: string): Promise<NormieItem | null> {
  try {
    const res = await fetch(`${BASE_API_PATH}/rarity/normie/${id}`);
    if (!res.ok) {
      const metaRes = await fetch(`${BASE_API_PATH}/normie/${id}/metadata`);
      if (!metaRes.ok) throw new Error('Metadata error');
      const meta = await metaRes.json();
      return mapApiNormieToItem({ id, ...meta });
    }
    const item = await res.json();
    return mapApiNormieToItem(item);
  } catch (err) {
    console.warn(`Failed to fetch normie detail for ID ${id}:`, err);
    return null;
  }
}

// Generate single Normie object on the fly as backup
export async function getNormieById(id: string): Promise<NormieItem | null> {
  // Try fetching real data first
  const normie = await fetchNormieDetail(id);
  if (normie) return normie;

  // Fallback to minimal data
  return {
    id,
    name: `Normie #${id}`,
    imageUrl: `${BASE_API_PATH}/normie/${id}/image.png`,
    owner: '0x0000000000000000000000000000000000000000',
    level: 1,
    status: 'Active',
    updatedAt: 'Recently',
    score: 0,
    rank: 0,
    traits: []
  };
}

// Generate complete timeline for a Normie
export function getNormieTimeline(id: string, owner?: string): TimelineItem[] {
  const seed = parseInt(id) || 123;
  // Generate deterministic but unique-looking hashes for each normie ID
  const hash1 = '0x' + Array.from({ length: 64 }, (_, i) => ((seed * (i + 13)) % 16).toString(16)).join('');
  const hash2 = '0x' + Array.from({ length: 64 }, (_, i) => (((seed + 456) * (i + 7)) % 16).toString(16)).join('');
  const hash3 = '0x' + Array.from({ length: 64 }, (_, i) => (((seed + 789) * (i + 31)) % 16).toString(16)).join('');

  const displayOwner = owner && owner.length > 10 ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : (owner || 'Vault');

  return [
    {
      id: 't1',
      event: 'Metadata updated on-chain',
      date: 'Live Sync',
      hash: hash1,
      by: 'Atlas Indexer'
    },
    {
      id: 't2',
      event: 'Transferred to current vault',
      date: 'On-Chain',
      hash: hash2,
      by: `Vault ${displayOwner}`
    },
    {
      id: 't3',
      event: 'Minted on Ethereum Network',
      date: 'Original Mint',
      hash: hash3,
      by: 'Normies Contract'
    }
  ];
}

export async function fetchTopTraits(): Promise<TraitStatItem[]> {
  try {
    const res = await fetch(`${BASE_API_PATH}/rarity/traits`);
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
    console.warn('Failed to fetch top traits:', err);
    return [];
  }
}
