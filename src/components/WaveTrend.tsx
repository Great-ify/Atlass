import React, { useEffect, useState } from 'react';

interface WaveTrendProps {
  color: string;
  baseValue: number;
}

export const WaveTrend: React.FC<WaveTrendProps> = ({ color, baseValue }) => {
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    // Generate initial realistic random-walk points around a normalized height (50)
    const initialPoints: number[] = [];
    let current = 50;
    for (let i = 0; i < 15; i++) {
      const change = (Math.random() - 0.5) * 15; // +/- 7.5
      current = Math.max(10, Math.min(90, current + change));
      initialPoints.push(current);
    }
    setPoints(initialPoints);

    // Fluctuate the wave over time to show live activity
    const interval = setInterval(() => {
      setPoints(prev => {
        const next = [...prev];
        if (next.length === 0) return prev;
        next.shift();
        const last = next[next.length - 1];
        // Drift back towards center (50) slightly, plus some randomness
        const gravity = (50 - last) * 0.1;
        const noise = (Math.random() - 0.5) * 12;
        const newPoint = Math.max(10, Math.min(90, last + gravity + noise));
        next.push(newPoint);
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [baseValue]);

  if (points.length === 0) return null;

  // Calculate SVG dimensions
  const width = 80;
  const height = 18;
  const padding = 2;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;

  // Map points to SVG coordinates
  const coords = points.map((p, index) => {
    const x = (index / (points.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((p - min) / range) * (height - 2 * padding) - padding;
    return { x, y };
  });

  // Generate Bezier path for a smooth wave line
  let pathD = '';
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  // Create area path for the gradient fill below the wave line
  const areaD = pathD ? `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z` : '';

  // Clean identifier for CSS gradients
  const idSafeColor = color.replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `wave-grad-${idSafeColor}`;

  const lastPoint = coords[coords.length - 1];

  return (
    <div className="flex items-center" id={`wave-trend-${idSafeColor}`}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Dynamic Area Under the Curve */}
        {areaD && (
          <path
            d={areaD}
            fill={`url(#${gradientId})`}
            className="transition-all duration-1000 ease-in-out"
          />
        )}

        {/* Dynamic Wave Line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-1000 ease-in-out"
          />
        )}

        {/* Pulsing Dot at the End of the Wave */}
        {lastPoint && (
          <g transform={`translate(${lastPoint.x}, ${lastPoint.y})`}>
            <circle r="2.5" fill={color} className="animate-ping opacity-75" />
            <circle r="1" fill={color} />
          </g>
        )}
      </svg>
    </div>
  );
};
