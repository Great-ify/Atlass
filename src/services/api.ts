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

  let owner = apiItem.owner ?? 'Unknown';
  if (owner === '0x0000000000000000000000000000000000000000') {
    owner = 'Unknown';
  }

  return {
    id,
    name: apiItem.name ?? `Normie #${id}`,
    imageUrl: `${BASE_API_PATH}/normie/${id}/image.png`,
    owner,
    level: apiItem.level ?? apiItem.canvasLevel ?? 1,
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
      added: data.added ?? data.addedCount ?? 0,
      removed: data.removed ?? data.removedCount ?? 0,
      net: data.net ?? data.netChange ?? 0
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
      return [];
    }
    
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
      const transformer = apiEvent.transformer ?? apiEvent.wallet ?? 'Unknown';
      const timestamp = apiEvent.timestamp ? parseInt(apiEvent.timestamp) * 1000 : Date.now() - index * 120000;
      
      const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
      let timeAgo = 'Just now';
      if (secondsAgo >= 86400) timeAgo = `${Math.floor(secondsAgo / 86400)}d ago`;
      else if (secondsAgo >= 3600) timeAgo = `${Math.floor(secondsAgo / 3600)}h ago`;
      else if (secondsAgo >= 60) timeAgo = `${Math.floor(secondsAgo / 60)}m ago`;
      else if (secondsAgo > 10) timeAgo = `${secondsAgo}s ago`;

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
