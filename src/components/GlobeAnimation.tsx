import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Shield, Users, Flame, Skull, RefreshCw } from 'lucide-react';

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
    cardX: -160,
    cardY: -110,
    color: '#22C55E',
    borderColor: 'rgba(34, 197, 94, 0.2)',
    icon: RefreshCw,
  },
  {
    id: 'g2',
    type: 'zombie_conversion',
    label: 'Zombie Conversion',
    normieId: '#5421',
    time: '28s ago',
    x: 35,
    y: 65,
    cardX: -150,
    cardY: 40,
    color: '#F59E0B',
    borderColor: 'rgba(245, 158, 11, 0.2)',
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
    cardX: 160,
    cardY: -30,
    color: '#3B82F6',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    icon: Users,
  },
  {
    id: 'g4',
    type: 'legendary_acquired',
    label: 'Legendary Acquired',
    normieId: '#9821',
    time: '1m ago',
    x: 60,
    y: 20,
    cardX: 150,
    cardY: -140,
    color: '#A855F7',
    borderColor: 'rgba(168, 85, 247, 0.2)',
    icon: Shield,
  },
  {
    id: 'g5',
    type: 'normie_burned',
    label: 'Normie Burned',
    normieId: '#7632',
    time: '2m ago',
    x: 58,
    y: 80,
    cardX: 130,
    cardY: 110,
    color: '#EF4444',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    icon: Flame,
  }
];

export default function GlobeAnimation() {
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Periodic visual pulsing/focus shift
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      const nextIdx = Math.floor(Math.random() * (GLOBE_EVENTS.length + 2)); // include periods of no highlight
      if (nextIdx < GLOBE_EVENTS.length) {
        setActiveEvent(GLOBE_EVENTS[nextIdx].id);
      } else {
        setActiveEvent(null);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center select-none overflow-visible">
      
      {/* Dynamic Background Grid and Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,250,250,0.03)_0%,transparent_70%)] rounded-full blur-2xl" />
      
      {/* Core Globe Graphic (Animated SVG) */}
      <div className="relative w-[280px] h-[280px] rounded-full border border-atlas-border/30 bg-[#09090B] flex items-center justify-center shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] overflow-hidden">
        
        {/* Abstract holographic globe grid lines */}
        <svg className="absolute inset-0 w-full h-full text-atlas-border/20" viewBox="0 0 100 100">
          {/* Latitude Lines */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 4" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 4" />
          
          {/* Longitude curved lines */}
          <path d="M 50 0 A 25 50 0 0 0 50 100" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M 50 0 A 25 50 0 0 1 50 100" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M 50 0 A 45 50 0 0 0 50 100" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
          <path d="M 50 0 A 45 50 0 0 1 50 100" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" />

          {/* Faint rotating radar sweep */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(250,250,250,0.05)" strokeWidth="1" />
        </svg>

        {/* Dynamic scanning glow overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent animate-pulse duration-[8s]" />

        {/* Central pulsing core */}
        <div className="w-4 h-4 rounded-full bg-atlas-primary/10 border border-atlas-primary/20 animate-ping absolute duration-[3s]" />
        <div className="w-2 h-2 rounded-full bg-atlas-primary/25 absolute" />

        {/* Pulsing Coordinates Dots (Globe Hotspots) */}
        {GLOBE_EVENTS.map((evt) => {
          const isActive = activeEvent === evt.id;
          return (
            <div
              key={`dot-${evt.id}`}
              className="absolute transition-all duration-500"
              style={{ left: `${evt.x}%`, top: `${evt.y}%` }}
            >
              <div 
                className="w-3 h-3 -ml-1.5 -mt-1.5 rounded-full flex items-center justify-center cursor-pointer"
                onMouseEnter={() => setActiveEvent(evt.id)}
                onMouseLeave={() => setActiveEvent(null)}
              >
                {/* Outward Ring Pulsing */}
                <span 
                  className="absolute w-6 h-6 rounded-full opacity-60 animate-ping duration-[2.5s]" 
                  style={{ backgroundColor: isActive ? evt.color : 'rgba(161, 161, 170, 0.1)' }}
                />
                
                {/* Core Coordinate Dot */}
                <span 
                  className="w-2 h-2 rounded-full transition-all duration-300 shadow-md"
                  style={{ 
                    backgroundColor: evt.color,
                    boxShadow: isActive ? `0 0 12px ${evt.color}` : 'none'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Orbital outer dashed rings */}
      <div className="absolute w-[360px] h-[360px] border border-atlas-border/10 rounded-full pointer-events-none animate-[spin_60s_linear_infinite]" />
      <div className="absolute w-[440px] h-[440px] border border-dashed border-atlas-border/5 rounded-full pointer-events-none animate-[spin_120s_linear_infinite_reverse]" />

      {/* Connection Lines & Floating Activity Cards */}
      {GLOBE_EVENTS.map((evt) => {
        const isActive = activeEvent === evt.id;
        const IconComponent = evt.icon;
        
        // Calculate the absolute position of the card relative to the center
        return (
          <div
            key={`card-holder-${evt.id}`}
            className="absolute z-10 pointer-events-auto"
            style={{
              transform: `translate(${evt.cardX}px, ${evt.cardY}px)`
            }}
          >
            {/* Connecting SVG Path Line from dot on the sphere to card */}
            <svg 
              className="absolute pointer-events-none overflow-visible"
              style={{
                // Let line start at relative origin (0, 0) of the card-holder and connect back to the globe's hotspot coordinates.
                // The globe's center is at translate(0, 0). Hotspot coord is evt.x, evt.y on 280px globe.
                // So hotspot offset from center is (evt.x - 50) * 2.8 and (evt.y - 50) * 2.8.
                // The card is at (evt.cardX, evt.cardY).
                // So line vector from card corner/center back to dot is:
                // dx = (evt.x - 50)*2.8 - evt.cardX
                // dy = (evt.y - 50)*2.8 - evt.cardY
                left: 0,
                top: 0,
                width: 1,
                height: 1
              }}
            >
              {/* Target coordinate on globe */}
              {(() => {
                const targetX = (evt.x - 50) * 2.8 - evt.cardX;
                const targetY = (evt.y - 50) * 2.8 - evt.cardY;
                
                // Let line attach to card side based on if it's left or right
                const startX = evt.cardX < 0 ? 120 : 0; // card width is roughly 150px
                const startY = 24; // approx vertical center of small card
                
                return (
                  <>
                    {/* Glowing static thin backing line */}
                    <path
                      d={`M ${startX} ${startY} Q ${(startX + targetX)/2} ${startY} ${targetX} ${targetY}`}
                      fill="none"
                      stroke={isActive ? evt.color : 'rgba(39, 39, 42, 0.4)'}
                      strokeWidth={isActive ? 1.2 : 0.8}
                      strokeDasharray={isActive ? "none" : "3 3"}
                      className="transition-colors duration-300"
                    />
                    
                    {/* Animated moving pulse dot */}
                    {isActive && (
                      <circle r="2" fill={evt.color}>
                        <animateMotion 
                          path={`M ${startX} ${startY} Q ${(startX + targetX)/2} ${startY} ${targetX} ${targetY}`}
                          dur="1.2s" 
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
              className="w-[170px] bg-atlas-surface/90 backdrop-blur-sm border rounded-lg p-2.5 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer hover:border-atlas-primary/30"
              style={{
                borderColor: isActive ? evt.color : '#27272A',
                boxShadow: isActive ? `0 0 15px rgba(255, 255, 255, 0.01), 0 4px 12px rgba(0,0,0,0.8)` : 'none'
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-2">
                <div 
                  className="p-1 rounded flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${evt.color}15`, color: evt.color }}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-atlas-secondary flex items-center justify-between gap-1">
                    <span className="truncate font-medium">{evt.label}</span>
                    <span className="text-[8px] text-zinc-600 font-mono shrink-0">{evt.time}</span>
                  </div>
                  <div className="text-xs font-mono font-medium text-atlas-primary mt-0.5 truncate flex items-center gap-1">
                    <span>{evt.normieId}</span>
                    {evt.type === 'zombie_conversion' && <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1 rounded">Zombie</span>}
                    {evt.type === 'legendary_acquired' && <span className="text-[9px] bg-purple-500/10 text-purple-500 px-1 rounded font-sans">★ Rare</span>}
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
