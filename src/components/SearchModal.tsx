import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Compass, TrendingUp, X, CornerDownLeft, Command, Skull, Shield, Loader2 } from 'lucide-react';
import { NormieItem } from '../types';
import { INITIAL_NORMIES, fetchRealNormies, fetchNormieDetail } from '../data';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNormie: (normie: NormieItem) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectNormie }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NormieItem[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<NormieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input and load recent items when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery('');
      setResults([]);
      
      // Fetch dynamic live recent discoveries
      const loadRecent = async () => {
        try {
          const results = await fetchRealNormies({ limit: 3, sort: 'rank', order: 'asc' });
          setRecentDiscoveries(results);
        } catch (err) {
          console.error('Failed to load recent discoveries:', err);
        }
      };
      loadRecent();
    }
  }, [isOpen]);

  // Live Query Search Logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const cleanQuery = query.trim();
        
        // If query is an exact integer, try fetching that token ID directly to provide instant lookup!
        const isNumeric = /^\d+$/.test(cleanQuery);
        const numericValue = isNumeric ? parseInt(cleanQuery, 10) : -1;
        
        let apiResults: NormieItem[] = [];
        
        if (isNumeric && numericValue >= 0 && numericValue <= 9999) {
          const detail = await fetchNormieDetail(cleanQuery);
          if (detail) {
            apiResults.push(detail);
          }
        }
        
        // Fetch regular list matching search terms
        const searchResults = await fetchRealNormies({ search: cleanQuery, limit: 10 });
        
        // Merge without duplicates
        const merged = [...apiResults];
        searchResults.forEach(sr => {
          if (!merged.some(m => m.id === sr.id)) {
            merged.push(sr);
          }
        });

        setResults(merged);
      } catch (err) {
        console.error('Search query error:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle keyboard shortcuts (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Command Box Panel */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-atlas-surface border border-atlas-border rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[60vh]"
        >
          {/* Top Search Input Box */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-atlas-border bg-atlas-bg/40">
            <Search className="w-4 h-4 text-atlas-secondary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by ID (0-9999), owner, or trait..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-atlas-primary outline-none placeholder:text-zinc-600 font-sans"
            />
            
            {/* ESC badge or Loader */}
            <div className="flex items-center gap-2 shrink-0">
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 text-atlas-secondary animate-spin" />
              ) : (
                <span className="text-[10px] bg-atlas-bg border border-atlas-border px-1.5 py-0.5 rounded text-zinc-500 font-mono">ESC</span>
              )}
            </div>
          </div>

          {/* Results List Area */}
          <div className="overflow-y-auto p-2.5 space-y-4">
            {query.trim() === '' ? (
              // Empty search state - show recent and quick commands
              <div>
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                  Recent Discoveries
                </div>
                <div className="mt-1 space-y-1">
                  {recentDiscoveries.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-zinc-500 font-mono">Loading real-time indexes...</div>
                  ) : (
                    recentDiscoveries.map((item) => {
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectNormie(item);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-mono text-atlas-secondary hover:text-atlas-primary hover:bg-atlas-bg border border-transparent hover:border-atlas-border transition-all"
                        >
                          <div className="flex items-center gap-2">
                            {item.status === 'Zombie' && <Skull className="w-3.5 h-3.5 text-amber-500" />}
                            {item.status === 'Legendary' && <Shield className="w-3.5 h-3.5 text-purple-500" />}
                            {item.status === 'Active' && <Compass className="w-3.5 h-3.5 text-atlas-secondary" />}
                            <span>{item.name} (Rank #{item.rank})</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 font-sans text-[10px] text-zinc-600">
                            <span>Open</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-600 mt-4">
                  Quick Navigation Coordinates
                </div>
                <div className="mt-1 space-y-1">
                  <button 
                    onClick={onClose}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-atlas-secondary hover:text-atlas-primary hover:bg-atlas-bg border border-transparent hover:border-atlas-border/50 transition-all font-sans"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-500" />
                    <span>View ecosystem live activity feed</span>
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-atlas-secondary hover:text-atlas-primary hover:bg-atlas-bg border border-transparent hover:border-atlas-border/50 transition-all font-sans"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Explore trending ranking list</span>
                  </button>
                </div>
              </div>
            ) : results.length > 0 ? (
              // Results found
              <div>
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                  Matching Ecosystem Items ({results.length})
                </div>
                <div className="mt-1 space-y-0.5">
                  {results.map((normie) => (
                    <button
                      key={normie.id}
                      onClick={() => {
                        onSelectNormie(normie);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-atlas-bg border border-transparent hover:border-atlas-border transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={normie.imageUrl} 
                          alt={normie.name} 
                          className="w-7 h-7 rounded object-cover border border-atlas-border"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="text-xs font-semibold text-atlas-primary flex items-center gap-1.5">
                            <span>{normie.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">#{normie.id}</span>
                          </div>
                          <div className="text-[10px] font-mono text-atlas-secondary truncate max-w-[340px] mt-0.5">
                            Owner: {normie.owner} • Level {normie.level}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {normie.status === 'Zombie' && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/10 font-mono">Zombie</span>
                        )}
                        {normie.status === 'Legendary' && (
                          <span className="text-[9px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded border border-purple-500/10 font-mono">Legendary</span>
                        )}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-zinc-500 font-sans flex items-center gap-0.5">
                          <span>View</span>
                          <CornerDownLeft className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // No matching elements
              <div className="py-12 text-center text-xs text-atlas-secondary">
                No items matching <span className="text-atlas-primary font-mono font-semibold">"{query}"</span> in the Normies grid.
              </div>
            )}
          </div>

          {/* Bottom Help Legend Bar */}
          <div className="mt-auto px-4 py-2 border-t border-atlas-border bg-atlas-bg/40 text-[10px] text-zinc-500 font-mono flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="text-[9px] bg-atlas-bg border border-atlas-border px-1 rounded text-zinc-500">↑↓</span>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[9px] bg-atlas-bg border border-atlas-border px-1 rounded text-zinc-500">↵</span>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>K to search</span>
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
