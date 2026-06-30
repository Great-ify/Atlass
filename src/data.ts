import { ActivityEvent, MetricItem, NormieItem, FeatureCard, TimelineItem } from './types';

export const INITIAL_NORMIES: NormieItem[] = [
  {
    id: '8732',
    name: 'Atlas Sentinel #8732',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    owner: '0x4f3a...8a7B',
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
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&auto=format&fit=crop&q=80',
    owner: '0x2c9b...91dF',
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
    imageUrl: 'https://images.unsplash.com/photo-1617791160505-6f006e121980?w=400&auto=format&fit=crop&q=80',
    owner: '0x7bc6...c6d2',
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
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=80',
    owner: '0x9d4e...77f1',
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
  },
  {
    id: '7632',
    name: 'Void Specter #7632',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
    owner: '0x1e3d...44aa',
    level: 64,
    status: 'Burned',
    updatedAt: '2m ago',
    score: 91.2,
    rank: 74,
    traits: [
      { trait_type: 'Background', value: 'Absolute Pitch', rarity: '1.2%' },
      { trait_type: 'Type', value: 'Specter', rarity: '1.9%' },
      { trait_type: 'Mask', value: 'Skull of Ash', rarity: '0.8%' },
    ]
  },
  {
    id: '4032',
    name: 'Shadow Stalker #4032',
    imageUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&auto=format&fit=crop&q=80',
    owner: '0xfa39...11c4',
    level: 37,
    status: 'Active',
    updatedAt: '5m ago',
    score: 79.8,
    rank: 221,
    traits: [
      { trait_type: 'Background', value: 'Void Dusk', rarity: '6.4%' },
      { trait_type: 'Type', value: 'Human', rarity: '42.0%' },
      { trait_type: 'Weapon', value: 'Shadow Dagger', rarity: '3.5%' },
    ]
  },
  {
    id: '2194',
    name: 'Cyberpunk Ronin #2194',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
    owner: '0x8b31...ea23',
    level: 72,
    status: 'Active',
    updatedAt: '10m ago',
    score: 88.6,
    rank: 98,
    traits: [
      { trait_type: 'Background', value: 'Neon Alley', rarity: '4.8%' },
      { trait_type: 'Type', value: 'Synthetic', rarity: '11.2%' },
      { trait_type: 'Weapon', value: 'Energy Katana', rarity: '2.1%' },
    ]
  }
];

export const INITIAL_METRICS: MetricItem[] = [
  {
    id: 'total_normies',
    label: 'Total Normies',
    value: '10,000',
    change: 'All time',
    isPositive: true,
    color: 'info',
    sparklineData: [40, 42, 45, 48, 52, 58, 65, 75, 85, 100]
  },
  {
    id: 'canvas_updates',
    label: 'Canvas Updates',
    value: '24,681',
    change: '+ 12.4%',
    isPositive: true,
    color: 'success',
    sparklineData: [20, 25, 18, 30, 35, 28, 42, 50, 48, 62]
  },
  {
    id: 'zombie_conversions',
    label: 'Zombie Conversions',
    value: '1,243',
    change: '↑ 7.6%',
    isPositive: true,
    color: 'warning',
    sparklineData: [10, 15, 12, 14, 22, 18, 25, 30, 28, 35]
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
    color: 'legendary',
    sparklineData: [5, 6, 8, 7, 9, 11, 10, 13, 14, 16]
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
    normieName: 'Atlas Sentinel',
    normieId: '8732',
    userAddress: '0x4f3a...8a7B',
    timeAgo: '12s ago',
    timestamp: Date.now() - 12000
  },
  {
    type: 'zombie_conversion',
    id: 'act_2',
    title: 'Zombie conversion',
    normieName: 'Zombie Overlord',
    normieId: '5421',
    userAddress: '0x2c9b...91dF',
    timeAgo: '28s ago',
    timestamp: Date.now() - 28000
  },
  {
    type: 'normie_transferred',
    id: 'act_3',
    title: 'Normie transferred',
    normieName: 'Glitch Runner',
    normieId: '1189',
    userAddress: '0x8a21...21e0',
    toAddress: '0x7bc6...c6d2',
    timeAgo: '45s ago',
    timestamp: Date.now() - 45000
  },
  {
    type: 'legendary_acquired',
    id: 'act_4',
    title: 'Legendary acquired',
    normieName: 'Luminis Celestial',
    normieId: '9821',
    userAddress: '0x9d4e...77f1',
    timeAgo: '1m ago',
    timestamp: Date.now() - 60000
  },
  {
    type: 'normie_burned',
    id: 'act_5',
    title: 'Normie burned',
    normieName: 'Void Specter',
    normieId: '7632',
    userAddress: '0x1e3d...44aa',
    timeAgo: '2m ago',
    timestamp: Date.now() - 120000
  }
];

export const FEATURES: FeatureCard[] = [
  {
    title: 'Real-time Analytics',
    description: 'Live metrics and insights about every activity across the Normies ecosystem.',
    iconName: 'Activity'
  },
  {
    title: 'Advanced Discovery',
    description: 'Powerful filters and search to find exactly what you\'re looking for.',
    iconName: 'Compass'
  },
  {
    title: 'Historical Timeline',
    description: 'Explore the complete history of any Normie with detailed timelines.',
    iconName: 'Clock'
  },
  {
    title: 'Wallet Intelligence',
    description: 'Deep insights into wallets, holdings, and behavior patterns.',
    iconName: 'Wallet'
  },
  {
    title: 'Rarity & Rankings',
    description: 'Track rarity rankings, trait popularity, and unique attributes.',
    iconName: 'Shield'
  },
  {
    title: 'Alerts & Watchlists',
    description: 'Stay notified with custom alerts and manage your watchlists.',
    iconName: 'Flame'
  }
];

// Generates a random simulated event to keep the dashboard dynamic and alive
export function generateRandomEvent(): ActivityEvent {
  const eventTypes: ActivityEvent['type'][] = [
    'canvas_updated',
    'zombie_conversion',
    'normie_transferred',
    'legendary_acquired',
    'normie_burned'
  ];
  
  const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const randomId = Math.floor(1000 + Math.random() * 8999).toString();
  
  const normieNames: Record<ActivityEvent['type'], string[]> = {
    canvas_updated: ['Vapor Ranger', 'Cyber Knight', 'Aether Scout', 'Pulse Hacker'],
    zombie_conversion: ['Toxic Ghoul', 'Cursed Walker', 'Decayed Titan', 'Radioactive Seeker'],
    normie_transferred: ['Holo Shadow', 'Neon Drifter', 'Grid Warden', 'Circuit Master'],
    legendary_acquired: ['Solar Aegis', 'Nexus Prime', 'Infinite Echo', 'Void Genesis'],
    normie_burned: ['Cinder Wraith', 'Embers', 'Ash Seeker', 'Scrap Metal']
  };

  const namePool = normieNames[selectedType];
  const selectedName = namePool[Math.floor(Math.random() * namePool.length)];
  
  const addresses = ['0x4f3a...8a7B', '0x2c9b...91dF', '0x7bc6...c6d2', '0x9d4e...77f1', '0x1e3d...44aa', '0x3a92...bc39', '0xfb82...93aa'];
  const userAddress = addresses[Math.floor(Math.random() * addresses.length)];
  const toAddress = selectedType === 'normie_transferred' 
    ? addresses[(addresses.indexOf(userAddress) + 1) % addresses.length] 
    : undefined;

  const titles: Record<ActivityEvent['type'], string> = {
    canvas_updated: 'Canvas updated',
    zombie_conversion: 'Zombie conversion',
    normie_transferred: 'Normie transferred',
    legendary_acquired: 'Legendary acquired',
    normie_burned: 'Normie burned'
  };

  return {
    id: `act_gen_${Date.now()}`,
    type: selectedType,
    title: titles[selectedType],
    normieName: `${selectedName} #${randomId}`,
    normieId: randomId,
    userAddress,
    toAddress,
    timeAgo: 'Just now',
    timestamp: Date.now()
  };
}

// Map activity event ID to a simulated Normie object (creates one on the fly if needed)
export function getNormieById(id: string): NormieItem {
  const existing = INITIAL_NORMIES.find(n => n.id === id);
  if (existing) return existing;
  
  // Create a beautifully populated simulated Normie
  const statuses: NormieItem['status'][] = ['Active', 'Zombie', 'Legendary', 'Burned'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id,
    name: `Ecosystem Normie #${id}`,
    imageUrl: `https://images.unsplash.com/photo-${['1618005182384-a83a8bd57fbe', '1634017839464-5c339ebe3cb4', '1617791160505-6f006e121980', '1635070041078-e363dbe005cb'][Math.floor(Math.random() * 4)]}?w=400&auto=format&fit=crop&q=80`,
    owner: '0x' + Math.random().toString(16).substr(2, 6) + '...' + Math.random().toString(16).substr(2, 4).toUpperCase(),
    level: Math.floor(1 + Math.random() * 100),
    status: randomStatus,
    updatedAt: 'Just now',
    score: parseFloat((60 + Math.random() * 39.9).toFixed(1)),
    rank: Math.floor(10 + Math.random() * 1000),
    traits: [
      { trait_type: 'Background', value: 'Vercel Gray', rarity: '5.2%' },
      { trait_type: 'Type', value: randomStatus, rarity: '2.4%' },
      { trait_type: 'Ecosystem Node', value: 'Atlas Alpha', rarity: '1.2%' }
    ]
  };
}

// Generate complete timeline for a Normie
export function getNormieTimeline(id: string): TimelineItem[] {
  return [
    {
      id: 't1',
      event: 'Metadata updated on-chain',
      date: 'June 28, 2026',
      hash: '0x8f22e...b9a1',
      by: 'Atlas Indexer v2.0'
    },
    {
      id: 't2',
      event: 'Transferred to current vault',
      date: 'June 25, 2026',
      hash: '0x3b1c2...12df',
      by: '0x4f3a...8a7B'
    },
    {
      id: 't3',
      event: 'Acquired Legendary state',
      date: 'June 20, 2026',
      hash: '0xab22c...77fe',
      by: 'Normies Contract'
    },
    {
      id: 't4',
      event: 'Minted on Ethereum Network',
      date: 'June 18, 2026',
      hash: '0x992a1...ff32',
      by: '0x0000...0000'
    }
  ];
}
