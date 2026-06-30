import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Flame, Skull, Pencil, Star, ArrowLeftRight } from 'lucide-react';

interface GlobeEvent {
  id: string;
  type: string;
  label: string;
  normieId: string;
  time: string;
  x: number; // dot connection X in percent
  y: number; // dot connection Y in percent
  cardX: number; // offset relative to center
  cardY: number;
  color: string;
  borderColor: string;
  icon: any;
}

const GLOBE_EVENTS: GlobeEvent[] = [
  {
    id: 'g1',
    type: 'canvas_updated',
    label: 'Canvas Updated',
    normieId: '#8732',
    time: '12s ago',
    x: 42,
    y: 35,
    cardX: -170,
    cardY: -105,
    color: '#22C55E',
    borderColor: 'rgba(34, 197, 94, 0.2)',
    icon: Pencil,
  },
  {
    id: 'g2',
    type: 'zombie_conversion',
    label: 'Zombie Conversion',
    normieId: '#5421',
    time: '28s ago',
    x: 35,
    y: 65,
    cardX: -160,
    cardY: 45,
    color: '#A855F7',
    borderColor: 'rgba(168, 85, 247, 0.2)',
    icon: Skull,
  },
  {
    id: 'g3',
    type: 'normie_transferred',
    label: 'Normie Transferred',
    normieId: '#1189',
    time: '45s ago',
    x: 68,
    y: 52,
    cardX: 165,
    cardY: -20,
    color: '#3B82F6',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    icon: ArrowLeftRight,
  },
  {
    id: 'g4',
    type: 'legendary_acquired',
    label: 'Legendary Acquired',
    normieId: '#9821',
    time: '1m ago',
    x: 60,
    y: 20,
    cardX: 160,
    cardY: -135,
    color: '#F59E0B',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    icon: Star,
  },
  {
    id: 'g5',
    type: 'normie_burned',
    label: 'Normie Burned',
    normieId: '#7632',
    time: '2m ago',
    x: 58,
    y: 80,
    cardX: 140,
    cardY: 105,
    color: '#EF4444',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    icon: Flame,
  }
];

export default function GlobeAnimation() {
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<GlobeEvent[]>(GLOBE_EVENTS);
  const [liveStats, setLiveStats] = useState<{ total: string; transferred: string; burned: string } | null>(null);

  // Periodic on-chain data fetching for the sphere hotspot elements
  useEffect(() => {
    async function fetchSphereLiveData() {
      try {
        // Fetch customized events
        const customRes = await fetch('/api/normies/history/customized?limit=3');
        let customEvents: any[] = [];
        if (customRes.ok) {
          const customData = await customRes.json();
          customEvents = customData.events || customData.data || (Array.isArray(customData) ? customData : []);
        }

        // Fetch recent/rare normies
        const normiesRes = await fetch('/api/normies/rarity/normies?limit=3');
        let recentNormies: any[] = [];
        if (normiesRes.ok) {
          const normiesData = await normiesRes.json();
          recentNormies = Array.isArray(normiesData) ? normiesData : (normiesData.normies || normiesData.data || []);
        }

        // Fetch general stats for the central HUD
        const statsRes = await fetch('/api/normies/rarity/stats');
        const histStatsRes = await fetch('/api/normies/history/stats');
        let total = '10,000';
        let transferred = '6,781';
        let burned = '2,156';

        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (stats.totalSupply) total = stats.totalSupply.toLocaleString();
          if (stats.burnedCount !== undefined) burned = stats.burnedCount.toLocaleString();
          else if (stats.burnCount !== undefined) burned = stats.burnCount.toLocaleString();
        }

        if (histStatsRes.ok) {
          const hStats = await histStatsRes.json();
          const transfersCount = hStats.transfers ?? hStats.transferCount ?? 6781;
          transferred = transfersCount.toLocaleString();
        }

        setLiveStats({ total, transferred, burned });

        // Merge with our pre-positioned hotspots to keep the 3D graphics in sync
        setEvents(prev => {
          return prev.map((item, index) => {
            if (index === 0 && customEvents[0]) {
              const ev = customEvents[0];
              const normieId = (ev.tokenId ?? ev.id ?? '8732').toString();
              const timestamp = ev.timestamp ? parseInt(ev.timestamp) * 1000 : Date.now() - 12000;
              const secondsAgo = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
              const time = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`;
              return { ...item, normieId: `#${normieId}`, time };
            }
            if (index === 1 && recentNormies[0]) {
              const normie = recentNormies[0];
              const normieId = (normie.tokenId ?? normie.id ?? '5421').toString();
              const isZombie = normie.status === 'Zombie' || normie.zombie || normie.isZombie;
              return { 
                ...item, 
                normieId: `#${normieId}`, 
                label: isZombie ? 'Zombie Conversion' : 'Active Normie',
                time: 'Just synced'
              };
            }
            if (index === 2 && recentNormies[1]) {
              const normie = recentNormies[1];
              const normieId = (normie.tokenId ?? normie.id ?? '1189').toString();
              return { ...item, normieId: `#${normieId}`, time: 'Live on-chain' };
            }
            if (index === 3 && recentNormies[2]) {
              const normie = recentNormies[2];
              const normieId = (normie.tokenId ?? normie.id ?? '9821').toString();
              const isLegendary = normie.status === 'Legendary' || normie.legendary || normie.isLegendary;
              return { 
                ...item, 
                normieId: `#${normieId}`, 
                label: isLegendary ? 'Legendary Acquired' : 'Normie Indexed',
                time: 'Verified'
              };
            }
            if (index === 4 && customEvents[1]) {
              const ev = customEvents[1];
              const normieId = (ev.tokenId ?? ev.id ?? '7632').toString();
              const timestamp = ev.timestamp ? parseInt(ev.timestamp) * 1000 : Date.now() - 120000;
              const secondsAgo = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
              const time = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`;
              return { ...item, normieId: `#${normieId}`, time };
            }
            return item;
          });
        });
      } catch (err) {
        console.error('Failed to load dynamic sphere live details:', err);
      }
    }

    fetchSphereLiveData();
    const statsInterval = setInterval(fetchSphereLiveData, 15000);
    return () => clearInterval(statsInterval);
  }, []);

  // Periodic visual pulsing/focus shift
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      const nextIdx = Math.floor(Math.random() * (events.length + 2)); // include periods of no highlight
      if (nextIdx < events.length) {
        setActiveEvent(events[nextIdx].id);
      } else {
        setActiveEvent(null);
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [events]);

  return (
    <div className="relative w-full aspect-square max-w-[540px] mx-auto flex items-center justify-center select-none overflow-visible">
      
      {/* 3D Orbit Keyframe Animations */}
      <style>{`
        @keyframes orbit-rotate-1 {
          0% { transform: rotateX(68deg) rotateY(-18deg) rotateZ(0deg); }
          100% { transform: rotateX(68deg) rotateY(-18deg) rotateZ(360deg); }
        }
        @keyframes orbit-rotate-2 {
          0% { transform: rotateX(-50deg) rotateY(20deg) rotateZ(360deg); }
          100% { transform: rotateX(-50deg) rotateY(20deg) rotateZ(0deg); }
        }
        @keyframes orbit-rotate-3 {
          0% { transform: rotateX(75deg) rotateY(45deg) rotateZ(0deg); }
          100% { transform: rotateX(75deg) rotateY(45deg) rotateZ(360deg); }
        }
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }
      `}</style>

      {/* Atmospheric planetary back-glow halo */}
      <div className="absolute w-[310px] h-[310px] rounded-full bg-gradient-to-tr from-zinc-500/10 via-zinc-400/5 to-white/5 blur-3xl opacity-85 pointer-events-none" />

      {/* 3D Revolving Orbits (Revolves around its position) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-0">
        
        {/* Orbit Ring 1 */}
        <div 
          className="absolute w-[350px] h-[350px] border border-zinc-800/40 rounded-full"
          style={{
            animation: 'orbit-rotate-1 28s linear infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Satellite dot crawling along the orbit */}
          <div className="absolute top-0 left-1/2 -ml-1 -mt-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>

        {/* Orbit Ring 2 */}
        <div 
          className="absolute w-[440px] h-[440px] border border-dashed border-zinc-700/20 rounded-full"
          style={{
            animation: 'orbit-rotate-2 42s linear infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Satellite dot crawling */}
          <div className="absolute bottom-0 left-1/3 -ml-1 -mb-1 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
        </div>

        {/* Orbit Ring 3 */}
        <div 
          className="absolute w-[500px] h-[500px] border border-zinc-800/10 rounded-full"
          style={{
            animation: 'orbit-rotate-3 65s linear infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="absolute top-1/4 right-0 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
        </div>

      </div>

      {/* Core Globe Graphic (Styled with a gorgeous crescent lighting and grid) */}
      <div 
        className="relative w-[280px] h-[280px] rounded-full border border-zinc-800/60 bg-[#040406] flex items-center justify-center overflow-hidden z-10"
        style={{
          boxShadow: 'inset -16px 16px 36px -8px rgba(255, 255, 255, 0.16), inset 2px -2px 12px rgba(255, 255, 255, 0.05), inset 45px -45px 90px rgba(0, 0, 0, 0.98), 0 0 40px rgba(255, 255, 255, 0.03)',
          animation: 'subtle-float 6s ease-in-out infinite'
        }}
      >
        
        {/* Abstract holographic globe grid lines */}
        <svg className="absolute inset-0 w-full h-full text-zinc-500/15" viewBox="0 0 100 100">
          {/* Latitude Lines */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 3" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1 4" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1 4" />
          
          {/* Longitude curved lines */}
          <path d="M 50 0 A 25 50 0 0 0 50 100" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <path d="M 50 0 A 25 50 0 0 1 50 100" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <path d="M 50 0 A 45 50 0 0 0 50 100" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 2" />
          <path d="M 50 0 A 45 50 0 0 1 50 100" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 2" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.4" />

          {/* Glowing atmosphere boundaries */}
          <circle cx="50" cy="50" r="48.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        </svg>

        {/* Dynamic scanning glow overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.015] to-transparent pointer-events-none" />

        {/* Dynamic Holographic HUD inside the Sphere */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none text-center">
          <div className="text-[7px] font-mono tracking-[0.25em] text-zinc-500 uppercase mt-4 mb-1">Atlas Sphere</div>
          {liveStats ? (
            <div className="space-y-0.5 opacity-90 transition-all duration-500">
              <div className="text-white font-extrabold text-sm tracking-tight leading-none">
                {liveStats.total}
              </div>
              <div className="text-[7px] font-mono text-zinc-400 uppercase tracking-widest">
                Supply
              </div>
              
              <div className="flex items-center justify-center gap-2 pt-1.5 mt-1 border-t border-zinc-800/40 text-[7px] font-mono text-zinc-500">
                <div>
                  <span className="text-zinc-300 font-bold">{liveStats.transferred}</span>
                  <span className="block text-[5px] text-zinc-500 uppercase font-medium">Tx</span>
                </div>
                <div className="w-px h-3.5 bg-zinc-800" />
                <div>
                  <span className="text-red-400 font-bold">{liveStats.burned}</span>
                  <span className="block text-[5px] text-zinc-500 uppercase font-medium">Burn</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
              <span>SYNCING...</span>
            </div>
          )}
        </div>

        {/* Central pulsing core backing elements */}
        <div className="w-4 h-4 rounded-full bg-zinc-400/5 border border-zinc-500/10 animate-ping absolute duration-[4s] pointer-events-none opacity-30" />

        {/* Pulsing Coordinates Dots (Globe Hotspots) */}
        {events.map((evt) => {
          const isActive = activeEvent === evt.id;
          return (
            <div
              key={`dot-${evt.id}`}
              className="absolute transition-all duration-500 z-20"
              style={{ left: `${evt.x}%`, top: `${evt.y}%` }}
            >
              <div 
                className="w-3.5 h-3.5 -ml-1.75 -mt-1.75 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto"
                onMouseEnter={() => setActiveEvent(evt.id)}
                onMouseLeave={() => setActiveEvent(null)}
              >
                {/* Outward Ring Pulsing */}
                <span 
                  className="absolute w-5 h-5 rounded-full opacity-50 animate-ping duration-[3s]" 
                  style={{ backgroundColor: isActive ? evt.color : 'rgba(255, 255, 255, 0.03)' }}
                />
                
                {/* Core Coordinate Dot */}
                <span 
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-lg"
                  style={{ 
                    backgroundColor: evt.color,
                    boxShadow: isActive ? `0 0 10px ${evt.color}` : 'none'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Lines & Floating Activity Cards */}
      {events.map((evt) => {
        const isActive = activeEvent === evt.id;
        const IconComponent = evt.icon;
        
        return (
          <div
            key={`card-holder-${evt.id}`}
            className="absolute z-20 pointer-events-auto"
            style={{
              transform: `translate(${evt.cardX}px, ${evt.cardY}px)`
            }}
          >
            {/* Connecting SVG Path Line from dot on the sphere to card */}
            <svg 
              className="absolute pointer-events-none overflow-visible"
              style={{
                left: 0,
                top: 0,
                width: 1,
                height: 1
              }}
            >
              {(() => {
                const targetX = (evt.x - 50) * 2.8 - evt.cardX;
                const targetY = (evt.y - 50) * 2.8 - evt.cardY;
                
                // Card dimensions reference: w-44 (176px), h-12 (48px)
                // Attach line left or right
                const startX = evt.cardX < 0 ? 164 : 0; 
                const startY = 22; // vertical center of card
                
                return (
                  <>
                    {/* Thin backing connector path */}
                    <path
                      d={`M ${startX} ${startY} Q ${(startX + targetX)/2} ${startY} ${targetX} ${targetY}`}
                      fill="none"
                      stroke={isActive ? evt.color : 'rgba(63, 63, 70, 0.25)'}
                      strokeWidth={isActive ? 1 : 0.6}
                      strokeDasharray={isActive ? "none" : "2 2"}
                      className="transition-colors duration-300"
                    />
                    
                    {/* Animated laser pulse */}
                    {isActive && (
                      <circle r="1.5" fill={evt.color}>
                        <animateMotion 
                          path={`M ${startX} ${startY} Q ${(startX + targetX)/2} ${startY} ${targetX} ${targetY}`}
                          dur="1.4s" 
                          repeatCount="indefinite" 
                        />
                      </circle>
                    )}
                  </>
                );
              })()}
            </svg>

            {/* Floating Event Card Container */}
            <motion.div
              onMouseEnter={() => setActiveEvent(evt.id)}
              onMouseLeave={() => setActiveEvent(null)}
              className="w-[164px] bg-[#0c0c0e]/90 backdrop-blur-md border border-zinc-800/70 rounded-lg p-2.5 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.8)] cursor-pointer hover:border-zinc-700/80"
              style={{
                borderColor: isActive ? `${evt.color}60` : 'rgba(39, 39, 42, 0.4)',
                boxShadow: isActive ? `0 0 12px ${evt.color}15, 0 4px 12px rgba(0,0,0,0.9)` : 'none'
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                {/* Compact icon holder */}
                <div 
                  className="p-1 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${evt.color}12`, color: evt.color }}
                >
                  <IconComponent className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                
                {/* Information text details */}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-zinc-200 font-bold truncate tracking-tight">{evt.label}</div>
                  <div className="flex items-center justify-between gap-1 text-[8px] font-mono text-zinc-500 mt-0.5">
                    <span className="font-semibold text-zinc-400">{evt.normieId}</span>
                    <span>{evt.time}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
