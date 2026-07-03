import { ActivityEvent, MetricItem, NormieItem, TraitStatItem, TimelineItem, MarketStats } from '../types';

export type { TraitStatItem };

const BASE_API_PATH = '/api/normies';

// Helper to map API response to internal model
export function mapApiNormieToItem(apiItem: any): NormieItem {
  const id = (apiItem.tokenId ?? apiItem.id ?? '0').toString();
  
  const rawTraits = apiItem.attributes ?? apiItem.traits ?? [];
  const breakdown = apiItem.traitBreakdown ?? [];
  
  const traits = Array.isArray(rawTraits) 
    ? rawTraits.map((t: any) => {
        const type = t.trait_type ?? t.traitType ?? 'Trait';
        const val = t.value?.toString() ?? 'None';
        
        // Find matching trait in breakdown for exact percentage
        const matched = Array.isArray(breakdown)
          ? breakdown.find((b: any) => b.trait_type === type && b.value?.toString() === val)
          : null;
        
        let rarityStr = 'N/A';
        if (matched) {
          if (matched.frequency !== undefined) {
            rarityStr = `${parseFloat(matched.frequency.toString()).toFixed(2)}%`;
          } else if (matched.count !== undefined) {
            rarityStr = `${((matched.count / 10000) * 100).toFixed(2)}%`;
          }
        } else if (t.percent !== undefined) {
          rarityStr = `${parseFloat(t.percent).toFixed(2)}%`;
        } else if (t.frequency !== undefined) {
          rarityStr = `${parseFloat(t.frequency).toFixed(2)}%`;
        } else if (t.count !== undefined) {
          rarityStr = `${((t.count / 10000) * 100).toFixed(2)}%`;
        } else if (t.rarity !== undefined) {
          rarityStr = t.rarity.toString();
        }
        
        return {
          trait_type: type,
          value: val,
          rarity: rarityStr,
          ic: matched?.ic !== undefined ? parseFloat(matched.ic.toString()).toFixed(2) : undefined,
          count: matched?.count !== undefined ? parseInt(matched.count.toString()) : undefined
        };
      })
    : [];

  let status: NormieItem['status'] = 'Active';
  if (apiItem.status === 'Zombie' || apiItem.zombie || apiItem.isZombie || traits.some(t => t.trait_type === 'Type' && t.value === 'Zombie')) {
    status = 'Zombie';
  } else if (apiItem.status === 'Legendary' || apiItem.legendary || apiItem.isLegendary || traits.some(t => t.trait_type === 'Legendary Canvas')) {
    status = 'Legendary';
  } else if (apiItem.status === 'Burned' || apiItem.burned || apiItem.isBurned) {
    status = 'Burned';
  }

  let rank = apiItem.rank ?? apiItem.rarityRank;
  if (rank === undefined || rank === null) {
    rank = 0;
  }
  
  let score = apiItem.score ?? apiItem.rarityScore;
  if (score === undefined || score === null) {
    score = 0;
  }

  let owner = apiItem.owner ?? 'Unknown';
  if (owner === '0x0000000000000000000000000000000000000000') {
    owner = 'Unknown';
  }

  // Look for Level inside the attributes list if not specified on the top level
  let level = apiItem.level ?? apiItem.canvasLevel;
  if (level === undefined || level === null) {
    const lvlTrait = traits.find(t => t.trait_type === 'Level');
    if (lvlTrait) {
      const parsed = parseInt(lvlTrait.value);
      if (!isNaN(parsed)) {
        level = parsed;
      }
    }
  }
  if (level === undefined || level === null) {
    level = 1;
  }

  return {
    id,
    name: apiItem.name ?? `Normie #${id}`,
    imageUrl: `${BASE_API_PATH}/normie/${id}/image.png`,
    owner,
    level: parseInt(level.toString()),
    status,
    updatedAt: apiItem.updatedAt ?? 'Recently',
    score: parseFloat(parseFloat(score.toString()).toFixed(1)),
    rank: parseInt(rank.toString()),
    traits
  };
}

export async function fetchLiveMetrics(): Promise<MetricItem[]> {
  let rarityStats: any = null;
  let historyStats: any = null;

  try {
    const res = await fetch(`${BASE_API_PATH}/rarity/stats`);
    if (res.ok) {
      rarityStats = await res.json();
    } else {
      console.warn(`[API] /rarity/stats returned status: ${res.status}`);
    }
  } catch (err) {
    console.warn('Failed to fetch /rarity/stats:', err);
  }

  try {
    const res = await fetch(`${BASE_API_PATH}/history/stats`);
    if (res.ok) {
      historyStats = await res.json();
    } else {
      console.warn(`[API] /history/stats returned status: ${res.status}`);
    }
  } catch (err) {
    console.warn('Failed to fetch /history/stats:', err);
  }

  const supplyCount = rarityStats?.supply ?? 0;
  const canvasCount = historyStats?.totalTransforms ?? 0;
  const zombiesCount = historyStats?.totalZombies ?? 0;
  const transfersCount = historyStats?.totalBurnCommitments ?? 0;
  const legendaryCount = historyStats?.totalLegendaryCanvases ?? 0;
  const burnedCount = rarityStats?.burned ?? historyStats?.totalBurnedTokens ?? 0;

  return [
    { id: 'total_normies', label: 'Total Normies', value: supplyCount > 0 ? supplyCount.toLocaleString() : '0', color: 'legendary' },
    { id: 'canvas_updates', label: 'Canvas Updates', value: canvasCount > 0 ? canvasCount.toLocaleString() : '0', color: 'success' },
    { id: 'zombie_conversions', label: 'Zombie Conversions', value: zombiesCount > 0 ? zombiesCount.toLocaleString() : '0', color: 'legendary' },
    { id: 'normies_transferred', label: 'Normies Transferred', value: transfersCount > 0 ? transfersCount.toLocaleString() : '0', color: 'info' },
    { id: 'legendary_acquired', label: 'Legendary Acquired', value: legendaryCount > 0 ? legendaryCount.toLocaleString() : '0', color: 'warning' },
    { id: 'normies_burned', label: 'Normies Burned', value: burnedCount > 0 ? burnedCount.toLocaleString() : '0', color: 'error' }
  ];
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
  const tryFetch = async (sortVal?: string): Promise<NormieItem[]> => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit.toString());
    if (sortVal) query.append('sort', sortVal);
    if (params.order) query.append('order', params.order);
    if (params.search) query.append('q', params.search); // Searching using 'q' as per API docs
    if (params.page) query.append('page', params.page.toString());

    const res = await fetch(`${BASE_API_PATH}/rarity/normies?${query.toString()}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    
    const list = Array.isArray(data) ? data : (data.items || data.normies || data.data || []);
    return list.map((item: any) => mapApiNormieToItem(item));
  };

  try {
    return await tryFetch(params.sort);
  } catch (err) {
    console.warn(`Failed to fetch real normies with sort: ${params.sort}, retrying with rank fallback:`, err);
    try {
      return await tryFetch('rank');
    } catch (retryErr) {
      console.warn('Fallback fetch also failed:', retryErr);
      return [];
    }
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

export async function getNormieById(id: string): Promise<NormieItem> {
  const normie = await fetchNormieDetail(id);
  if (!normie) {
    throw new Error(`Normie #${id} not found on-chain.`);
  }
  return normie;
}

export interface NormieVersion {
  transformer: string;
  timestamp: string | number;
  transactionHash: string;
  changeCount?: number;
}

export interface CanvasDiff {
  added: number;
  removed: number;
  net: number;
}

export interface ZombieConversion {
  timestamp: string | number;
  transformer: string;
  transactionHash: string;
}

export async function fetchNormieVersions(id: string): Promise<NormieVersion[]> {
  try {
    const res = await fetch(`${BASE_API_PATH}/history/normie/${id}/versions`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.versions || data.data || []);
  } catch (err) {
    console.warn(`Failed to fetch versions for normie #${id}:`, err);
    return [];
  }
}

export async function fetchNormieCanvasDiff(id: string): Promise<CanvasDiff | null> {
  try {
    const res = await fetch(`${BASE_API_PATH}/normie/${id}/canvas/diff`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return {
      added: Array.isArray(data.added) ? data.added.length : (data.addedCount ?? 0),
      removed: Array.isArray(data.removed) ? data.removed.length : (data.removedCount ?? 0),
      net: data.netChange ?? data.net ?? 0
    };
  } catch (err) {
    console.warn(`Failed to fetch canvas diff for normie #${id}:`, err);
    return null;
  }
}

export async function fetchZombieTokenHistory(id: string): Promise<ZombieConversion[]> {
  try {
    const res = await fetch(`${BASE_API_PATH}/zombies/token/${id}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.conversions || data.history || data.data ? (data.data || []) : []);
  } catch (err) {
    console.warn(`Failed to fetch zombie history for token #${id}:`, err);
    return [];
  }
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
        if (Array.isArray(values)) {
          values.forEach((item: any) => {
            if (item && typeof item === 'object' && item.value !== undefined) {
              const value = item.value?.toString();
              const count = item.count ?? item.liveCount ?? 0;
              const percent = (count / 10000) * 100;
              
              // Filter out common or empty-like trait values to highlight interesting traits
              if (
                value &&
                value !== 'None' &&
                value !== 'Default' &&
                value !== 'Human' &&
                value !== 'No Glasses' &&
                value !== 'No Hair' &&
                value !== 'No Facial Hair' &&
                value !== 'No Mouth Accessory' &&
                value !== '0' &&
                value !== 'No' &&
                value !== 'Yes' &&
                category !== 'Gender'
              ) {
                traitList.push({
                  id: (traitId++).toString(),
                  name: value,
                  category,
                  percentage: parseFloat(percent.toFixed(2))
                });
              }
            }
          });
        }
      });
    }
    
    traitList.sort((a, b) => b.percentage - a.percentage);
    
    return traitList.slice(0, 5);
  } catch (err) {
    console.warn('Failed to fetch top traits:', err);
    return [];
  }
}

export async function fetchZombieConversions(limit = 15): Promise<ActivityEvent[]> {
  try {
    const res = await fetch(`${BASE_API_PATH}/zombies/conversions?limit=${limit}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.conversions || data.data || []);
    return list.map((apiEvent: any, index: number) => {
      const normieId = (apiEvent.tokenId ?? apiEvent.id ?? '0').toString();
      const transformer = apiEvent.committer ?? apiEvent.committedOwner ?? apiEvent.qualifyingWallet ?? apiEvent.transformer ?? apiEvent.wallet ?? 'Unknown';
      const timestamp = apiEvent.timestamp ? parseInt(apiEvent.timestamp) * 1000 : Date.now() - index * 120000;
      
      const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
      let timeAgo = 'Just now';
      if (secondsAgo >= 86400) timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;
      else if (secondsAgo >= 3600) timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
      else if (secondsAgo >= 60) timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;

      return {
        id: apiEvent.id?.toString() ?? `zombie_act_${index}`,
        type: 'zombie_conversion' as const,
        title: 'Zombie conversion',
        normieName: `Normie #${normieId}`,
        normieId,
        userAddress: transformer,
        timeAgo,
        timestamp
      };
    });
  } catch (err) {
    console.warn('Failed to fetch zombie conversions:', err);
    return [];
  }
}

export async function fetchMarketStats(): Promise<MarketStats> {
  try {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const localKey = window.localStorage.getItem('opensea_api_key');
      if (localKey) {
        headers['x-opensea-api-key'] = localKey;
      }
    }
    const res = await fetch('/api/market/stats', { headers });
    if (!res.ok) throw new Error(`Market stats API error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch market stats from API, returning realistic fallbacks:', err);
    return {
      floorPrice: 0.18,
      volume24h: 0.45,
      listedCount: 350,
      ownerCount: 3250,
      lastSalePrice: 0.18,
      lastSaleTokenId: "512",
      lastSaleImage: "https://api.normies.art/normie/512/image.png"
    };
  }
}

export async function fetchMarketEvents(limit = 20): Promise<ActivityEvent[]> {
  try {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const localKey = window.localStorage.getItem('opensea_api_key');
      if (localKey) {
        headers['x-opensea-api-key'] = localKey;
      }
    }
    const res = await fetch(`/api/market/events?limit=${limit}`, { headers });
    if (!res.ok) throw new Error(`Market events API error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch market events from API:', err);
    return [];
  }
}

