import { useMemo } from 'react';
import { motion } from 'motion/react';

interface SparklineProps {
  data: number[];
  color: 'success' | 'warning' | 'error' | 'info' | 'legendary' | 'zinc';
  width?: number;
  height?: number;
}

const COLOR_MAP = {
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  legendary: '#A855F7',
  zinc: '#71717A',
};

export default function Sparkline({ data, color, width = 120, height = 32 }: SparklineProps) {
  const pathData = useMemo(() => {
    if (data.length < 2) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * (width - 4) + 2;
      // Invert Y because SVG coordinates go top-to-bottom
      const y = height - 2 - ((val - min) / range) * (height - 4);
      return { x, y };
    });

    // Build SVG path
    return points.reduce((path, pt, idx) => {
      if (idx === 0) {
        return `M ${pt.x} ${pt.y}`;
      }
      
      // Compute beautiful control points for a smooth cubic bezier curve
      const prev = points[idx - 1];
      const cpX1 = prev.x + (pt.x - prev.x) / 3;
      const cpY1 = prev.y;
      const cpX2 = prev.x + 2 * (pt.x - prev.x) / 3;
      const cpY2 = pt.y;
      
      return `${path} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`;
    }, '');
  }, [data, width, height]);

  const strokeColor = COLOR_MAP[color] || '#FAFAFA';

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <motion.path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}
