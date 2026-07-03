export interface ActivityEvent {
  id: string;
  type: 'canvas_updated' | 'zombie_conversion' | 'normie_transferred' | 'legendary_acquired' | 'normie_burned' | 'normie_sale' | 'normie_listing' | 'whale_purchase';
  title: string;
  normieName: string;
  normieId: string;
  userAddress: string;
  toAddress?: string;
  timeAgo: string;
  timestamp: number;
}

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  color: 'success' | 'warning' | 'error' | 'info' | 'legendary';
  sparklineData?: number[];
}

export interface TraitItem {
  trait_type: string;
  value: string;
  rarity: string; // e.g. "1.2%"
  ic?: string; // Information Content rarity score contribution
  count?: number; // Count of items with this trait
}

export interface NormieItem {
  id: string;
  name: string;
  imageUrl: string;
  owner: string;
  level: number;
  status: 'Zombie' | 'Legendary' | 'Active' | 'Burned';
  updatedAt: string;
  traits: TraitItem[];
  score: number; // rarity score e.g. 94.2
  rank: number;
}

export interface FeatureCard {
  title: string;
  description: string;
  iconName: string;
}

export interface TimelineItem {
  id: string;
  event: string;
  date: string;
  hash: string;
  by: string;
}

export interface TraitStatItem {
  id: string;
  name: string;
  category: string;
  percentage: number;
}
