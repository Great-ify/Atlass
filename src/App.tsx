import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Compass, Activity, Shield, Flame, User, Clock, TrendingUp, Eye, 
  Layers, Database, ArrowRight, ArrowUp, ArrowDown, Star, Skull, Sparkles, 
  GitBranch, Wallet, Check, ChevronRight, CornerDownLeft, Command, Info
} from 'lucide-react';

import { ActivityEvent, MetricItem, NormieItem } from './types';
import { INITIAL_NORMIES, INITIAL_ACTIVITIES, INITIAL_METRICS, FEATURES, generateRandomEvent, getNormieById } from './data';

import GlobeAnimation from './components/GlobeAnimation';
import Sparkline from './components/Sparkline';
import SearchModal from './components/SearchModal';
import NormieDetailsModal from './components/NormieDetailsModal';
import AppDemoMode from './components/AppDemoMode';

export default function App() {
  // Command Search Modal State
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Selected inspect item for detail views
  const [selectedNormie, setSelectedNormie] = useState<NormieItem | null>(null);
  
  // App Demo Mock Dashboard Trigger State
  const [demoActive, setDemoActive] = useState(false);

  // Email Subscription Forms State
  const [email, setEmail] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [footerSubscribed, setFooterSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Dynamic ticking activity feeds on Landing Page
  const [liveActivities, setLiveActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [liveMetrics, setLiveMetrics] = useState<MetricItem[]>(INITIAL_METRICS);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle hotkey Command+K / Ctrl+K to trigger command menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set up real-time live tickers on the coming soon landing page
  useEffect(() => {
    const interval = setInterval(() => {
      // 25% chance of ticking live state
      if (Math.random() < 0.25) {
        const newEvent = generateRandomEvent();
        
        // Feed ticker
        setLiveActivities(prev => [newEvent, ...prev.slice(0, 4)]);
        
        // Bounce toast message
        triggerToast(`Live activity detected: ${newEvent.title}`);

        // Update corresponding metrics sparkline
        setLiveMetrics(prev => prev.map(m => {
          if (
            (newEvent.type === 'canvas_updated' && m.id === 'canvas_updates') ||
            (newEvent.type === 'zombie_conversion' && m.id === 'zombie_conversions') ||
            (newEvent.type === 'normie_transferred' && m.id === 'normies_transferred') ||
            (newEvent.type === 'legendary_acquired' && m.id === 'legendary_acquired') ||
            (newEvent.type === 'normie_burned' && m.id === 'normies_burned')
          ) {
            const currentNum = parseInt(m.value.replace(/,/g, ''));
            const nextValue = (currentNum + 1).toLocaleString();
            const nextSpark = [...m.sparklineData.slice(1), m.sparklineData[m.sparklineData.length - 1] + Math.floor(Math.random() * 6) - 2];
            return {
              ...m,
              value: nextValue,
              sparklineData: nextSpark
            };
          }
          return m;
        }));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sign up simulation
  const handleSubscribe = (e: FormEvent, isFooter: boolean) => {
    e.preventDefault();
    const targetEmail = isFooter ? footerEmail : email;
    if (!targetEmail || !targetEmail.includes('@')) {
      triggerToast('Please provide a valid email coordinate address.');
      return;
    }

    setSubscribing(true);
    setTimeout(() => {
      setSubscribing(false);
      if (isFooter) {
        setFooterSubscribed(true);
        setFooterEmail('');
      } else {
        setSubscribed(true);
        setEmail('');
      }
      // Save subscription securely in local storage
      const savedList = JSON.parse(localStorage.getItem('atlas_subscriptions') || '[]');
      savedList.push({ email: targetEmail, date: new Date().toISOString() });
      localStorage.setItem('atlas_subscriptions', JSON.stringify(savedList));
      triggerToast('Coordinates saved. Early access whitelisting verified.');
    }, 1000);
  };

  // Map icon names from static FEATURES features card config to React Lucide components
  const getFeatureIcon = (name: string) => {
    switch (name) {
      case 'Activity': return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'Compass': return <Compass className="w-5 h-5 text-blue-500" />;
      case 'Clock': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'Wallet': return <Wallet className="w-5 h-5 text-indigo-500" />;
      case 'Shield': return <Shield className="w-5 h-5 text-purple-500" />;
      case 'Flame': return <Flame className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-atlas-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-atlas-bg text-atlas-primary selection:bg-atlas-primary/20 selection:text-white flex flex-col relative overflow-x-hidden">
      
      {/* 1. TOAST ALERTS BANNER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 right-6 z-50 bg-[#111113] border border-atlas-border text-xs px-4 py-3 rounded-lg flex items-center gap-2.5 shadow-2xl"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-mono text-atlas-secondary">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. DEMO FULL SCREEN DASHBOARD MODE INTERACTION */}
      <AnimatePresence>
        {demoActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40"
          >
            <AppDemoMode 
              onClose={() => setDemoActive(false)} 
              onOpenSearch={() => setSearchOpen(true)}
              onSelectNormie={(item) => setSelectedNormie(item)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CORE HEADER BAR */}
      <header className="h-20 border-b border-atlas-border/50 flex items-center justify-between px-6 md:px-12 bg-atlas-bg/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-8">
          {/* Logo element */}
          <div className="flex items-center gap-2.5 select-none group cursor-pointer" onClick={() => triggerToast('Welcome to Atlas L1 Ecosystem Portal.')}>
            <div className="w-6 h-6 rounded bg-[#FAFAFA] flex items-center justify-center border border-white/20 transition-transform group-hover:rotate-6">
              <span className="text-[10px] font-bold text-black font-mono">A</span>
            </div>
            <span className="text-sm font-bold tracking-wider uppercase font-sans">ATLAS</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#product" className="text-xs text-atlas-secondary hover:text-atlas-primary transition-colors font-medium">Product</a>
            <a href="#features" className="text-xs text-atlas-secondary hover:text-atlas-primary transition-colors font-medium font-sans">Features</a>
            <a href="#stats" className="text-xs text-atlas-secondary hover:text-atlas-primary transition-colors font-medium font-sans">Live Stats</a>
            <a href="#discover" className="text-xs text-atlas-secondary hover:text-atlas-primary transition-colors font-medium font-sans">Explore</a>
            <a 
              href="#docs" 
              onClick={(e) => { e.preventDefault(); triggerToast('Ecosystem developer documentation is coming soon alongside mainnet launch.'); }}
              className="text-xs text-atlas-secondary hover:text-atlas-primary transition-colors font-medium"
            >
              Docs
            </a>
          </nav>
        </div>

        {/* Action Button: Launch preview app */}
        <div className="flex items-center gap-3">
          {/* Subtle search hotkey preview */}
          <button 
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 hover:text-atlas-primary bg-atlas-surface border border-atlas-border px-2.5 py-1.5 rounded-lg transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <span className="text-[10px] bg-atlas-bg px-1 rounded border border-atlas-border/50 font-mono">⌘K</span>
          </button>

          <button 
            onClick={() => setDemoActive(true)}
            className="bg-atlas-primary hover:bg-opacity-90 text-black text-xs font-semibold px-4 py-1.5 rounded-lg transition-all border border-transparent flex items-center gap-1.5 shadow-[0_4px_12px_rgba(250,250,250,0.06)]"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 4. MAIN LANDING HERO CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-12 md:py-20 space-y-24">
        
        {/* HERO SPLIT SECTION */}
        <section id="product" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Detail */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Intel core badge */}
            <div className="inline-flex items-center gap-2 bg-atlas-surface border border-atlas-border px-3 py-1.5 rounded-full select-none">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-atlas-secondary">The Intelligence Layer for Normies</span>
            </div>

            {/* Premium Typographic Headings */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-none text-atlas-primary font-sans">
              Explore.<br />
              Analyze.<br />
              Discover.
            </h1>

            <p className="text-sm md:text-base text-atlas-secondary max-w-sm leading-relaxed font-sans">
              Real-time intelligence and analytics for the entire Normies ecosystem. Universal search, on-chain signal trackers, and custom bento indicators.
            </p>

            {/* Launch CTA buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button 
                onClick={() => setDemoActive(true)}
                className="bg-atlas-primary hover:bg-opacity-95 text-black text-xs font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg"
              >
                <span>Explore Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button 
                onClick={() => setSearchOpen(true)}
                className="bg-atlas-surface border border-atlas-border hover:border-atlas-primary/20 text-atlas-primary text-xs font-semibold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2"
              >
                <span>Discover Normies</span>
                <Command className="w-3.5 h-3.5 text-atlas-secondary" />
              </button>
            </div>

            {/* Trusted indicators */}
            <div className="pt-6 border-t border-atlas-border/50 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80'
                ].map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    alt="avatar" 
                    className="w-6.5 h-6.5 rounded-full object-cover border-2 border-[#09090B]"
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="w-6.5 h-6.5 rounded-full bg-atlas-surface border-2 border-[#09090B] flex items-center justify-center text-[8px] font-mono font-bold text-atlas-secondary">
                  +2.4K
                </div>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                <span className="text-atlas-success font-semibold">● Live data</span>
                <span className="mx-1.5">|</span>
                <span>On-chain + Real-time</span>
              </div>
            </div>

          </div>

          {/* Right Holographic Central Globe Animation */}
          <div className="lg:col-span-7 flex items-center justify-center relative">
            <GlobeAnimation />
          </div>

        </section>

        {/* 5. ECOSYSTEM STATS METRIC SECTIONS */}
        <section id="stats" className="space-y-4 pt-4 border-t border-atlas-border/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-atlas-secondary font-semibold">Real-time Ecosystem Metrics</h3>
            <span className="text-[10px] text-zinc-600 font-mono">Simulated blockchain node sequences</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {liveMetrics.map((m) => (
              <div key={m.id} className="bg-atlas-surface border border-atlas-border rounded-lg p-4 flex flex-col justify-between hover:border-atlas-primary/10 transition-all select-none group">
                <div>
                  <div className="text-[10px] text-atlas-secondary font-mono">{m.label}</div>
                  <div className="text-lg font-mono font-bold text-atlas-primary mt-1">{m.value}</div>
                </div>
                
                {/* Embedded sparkline with corresponding hex color */}
                <div className="mt-5 flex items-end justify-between">
                  <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                    m.color === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    m.color === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                    m.color === 'error' ? 'bg-red-500/10 text-red-500' :
                    m.color === 'legendary' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {m.change}
                  </span>
                  
                  {/* Miniature canvas sparkline */}
                  <div className="h-5 w-14 opacity-75 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={m.sparklineData} color={m.color} width={56} height={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. LIVE ACTIVITY FEED */}
        <section className="space-y-4 pt-4 border-t border-atlas-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-atlas-secondary font-semibold">Live Activity Feed</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
            </div>
            <button 
              onClick={() => setDemoActive(true)}
              className="text-[10px] text-zinc-500 hover:text-atlas-primary font-mono transition-colors flex items-center gap-1"
            >
              <span>View all activity</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-atlas-surface border border-atlas-border rounded-lg divide-y divide-atlas-border/60">
            {liveActivities.map((act) => {
              const matchedNormie = getNormieById(act.normieId);
              return (
                <div 
                  key={act.id}
                  onClick={() => setSelectedNormie(matchedNormie)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-atlas-card/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Status color coded dots */}
                    <div className={`p-1.5 rounded shrink-0 ${
                      act.type === 'canvas_updated' ? 'bg-emerald-500/10 text-emerald-500' :
                      act.type === 'zombie_conversion' ? 'bg-amber-500/10 text-amber-500' :
                      act.type === 'normie_transferred' ? 'bg-blue-500/10 text-blue-500' :
                      act.type === 'legendary_acquired' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {act.type === 'canvas_updated' && <Activity className="w-3.5 h-3.5" />}
                      {act.type === 'zombie_conversion' && <Skull className="w-3.5 h-3.5" />}
                      {act.type === 'normie_transferred' && <GitBranch className="w-3.5 h-3.5" />}
                      {act.type === 'legendary_acquired' && <Shield className="w-3.5 h-3.5" />}
                      {act.type === 'normie_burned' && <Flame className="w-3.5 h-3.5" />}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-atlas-primary flex items-center gap-1.5">
                        <span>{act.title}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Normie #{act.normieId}</span>
                      </div>
                      <div className="text-[10px] text-atlas-secondary font-mono mt-0.5">
                        {act.type === 'normie_transferred' ? (
                          <span>From <span className="text-atlas-primary">{act.userAddress}</span> to <span className="text-atlas-primary">{act.toAddress}</span></span>
                        ) : (
                          <span>By <span className="text-atlas-primary">{act.userAddress}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-[10px] text-zinc-600 font-mono uppercase bg-atlas-bg px-1.5 py-0.5 rounded border border-atlas-border/50">
                      CONFIRMED
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-mono">{act.timeAgo}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-atlas-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. BENTO CORE FEATURES HIGHLIGHT GRID */}
        <section id="features" className="space-y-6 pt-4 border-t border-atlas-border/30">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Built for Intelligence</span>
            <h2 className="text-2xl md:text-3xl font-bold font-sans text-atlas-primary tracking-tight">Everything you need to understand the Normies ecosystem.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-atlas-surface border border-atlas-border p-5 rounded-lg flex flex-col justify-between hover:border-atlas-primary/25 transition-all group cursor-pointer"
                onClick={() => triggerToast(`Feature preview: ${feat.title} sandbox model active.`)}
              >
                <div className="space-y-4">
                  <div className="p-2 w-max rounded bg-atlas-bg border border-atlas-border">
                    {getFeatureIcon(feat.iconName)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-atlas-primary font-sans">{feat.title}</h4>
                    <p className="text-xs text-atlas-secondary font-sans mt-2.5 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-atlas-border/40 flex items-center justify-between text-[10px] font-mono text-zinc-500 group-hover:text-atlas-primary transition-colors">
                  <span>SANDBOX READY</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-atlas-primary transition-all group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. EARLY ACCESS SUBMISSION ACTION CARD */}
        <section className="bg-gradient-to-tr from-atlas-surface to-[#18181B] border border-atlas-border rounded-xl p-8 md:p-12 text-center space-y-6 max-w-4xl mx-auto relative overflow-hidden">
          
          {/* Subtle design details */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient from-white/[0.02] to-transparent blur-xl rounded-full" />
          
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Ready to explore?</span>
            <h2 className="text-3xl font-bold font-sans text-atlas-primary tracking-tight">Dive into the intelligence layer for Normies.</h2>
            <p className="text-xs text-atlas-secondary font-sans max-w-md mx-auto leading-relaxed">
              Whitelisting coordinate is now open. Register your coordinate email address to secure early priority indexing queues.
            </p>
          </div>

          {/* Mail subscriber form */}
          {subscribed ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 max-w-md mx-auto p-4 rounded-lg flex flex-col items-center gap-1.5"
            >
              <Check className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-400 font-mono">EARLY ACCESS GRANTED</span>
              <span className="text-[10px] text-zinc-500 font-mono">Coordinates updated. We will ping you soon.</span>
            </motion.div>
          ) : (
            <form onSubmit={(e) => handleSubscribe(e, false)} className="flex items-center gap-2 max-w-md mx-auto bg-[#09090B] border border-atlas-border rounded-lg p-1">
              <input 
                type="email" 
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-xs text-atlas-primary outline-none px-3 py-1.5"
                required
              />
              <button 
                type="submit"
                disabled={subscribing}
                className="bg-atlas-primary hover:bg-opacity-90 text-black text-[10px] font-bold px-3.5 py-1.5 rounded font-mono transition-all uppercase shrink-0"
              >
                {subscribing ? 'Registering...' : 'Get Access'}
              </button>
            </form>
          )}

          {/* Quick launch links info */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[10px] text-zinc-500 font-mono">
            <button onClick={() => setDemoActive(true)} className="hover:text-atlas-primary transition-colors flex items-center gap-1">
              <span>● Simulated Sandbox Live</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <span>•</span>
            <span>No login required</span>
            <span>•</span>
            <span>Real-time on-chain data</span>
          </div>
        </section>

      </main>

      {/* 9. DETAILED ESTABLISHED FOOTER */}
      <footer className="border-t border-atlas-border/50 bg-[#111113] pt-16 pb-8 px-6 md:px-12 mt-16 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-6 pb-12 border-b border-atlas-border/50">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 select-none">
              <div className="w-5.5 h-5.5 rounded bg-atlas-primary flex items-center justify-center">
                <span className="text-[9px] font-bold text-black font-mono">A</span>
              </div>
              <span className="text-xs font-bold tracking-wider uppercase font-sans">ATLAS</span>
            </div>
            <p className="text-[11px] text-atlas-secondary leading-relaxed max-w-xs">
              The intelligence and signals tracking layer for the entire Normies ecosystem. Building decentralized real-time indexing infrastructure.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 pt-2">
              <a href="#" className="hover:text-atlas-primary transition-colors">Twitter (X)</a>
              <span>•</span>
              <a href="#" className="hover:text-atlas-primary transition-colors">Discord</a>
              <span>•</span>
              <a href="#" className="hover:text-atlas-primary transition-colors">GitHub</a>
            </div>
          </div>

          {/* Links Cols */}
          <div>
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold mb-3.5">Product</h5>
            <ul className="space-y-2.5 text-xs text-atlas-secondary">
              <li><a href="#features" className="hover:text-atlas-primary transition-colors">Ecosystem Features</a></li>
              <li><a href="#stats" className="hover:text-atlas-primary transition-colors">Live Stats Grid</a></li>
              <li><button onClick={() => setDemoActive(true)} className="hover:text-atlas-primary transition-colors text-left">Explorer Portal</button></li>
              <li><button onClick={() => triggerToast('Pricing is $0/month. Free for indexers during preview.')} className="hover:text-atlas-primary transition-colors text-left">Node Pricing</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold mb-3.5">Resources</h5>
            <ul className="space-y-2.5 text-xs text-atlas-secondary">
              <li><a href="#" onClick={(e) => { e.preventDefault(); triggerToast('Docs coming soon.'); }} className="hover:text-atlas-primary transition-colors">Documentation</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); triggerToast('API keys will be provisioned on launch.'); }} className="hover:text-atlas-primary transition-colors">Ecosystem API</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); triggerToast('No blog updates yet.'); }} className="hover:text-atlas-primary transition-colors">Blog Nodes</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); triggerToast('Current version: v2.0.4 pre-release'); }} className="hover:text-atlas-primary transition-colors">Changelog</a></li>
            </ul>
          </div>

          {/* Stay Updated Col */}
          <div className="space-y-3.5">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Stay Updated</h5>
            <p className="text-[11px] text-atlas-secondary leading-relaxed">
              Receive on-chain summary newsletters directly.
            </p>

            {footerSubscribed ? (
              <div className="bg-emerald-500/10 border border-emerald-500/10 px-3 py-1.5 rounded text-[10px] font-mono text-emerald-400">
                Pinging whitelist inbox soon.
              </div>
            ) : (
              <form onSubmit={(e) => handleSubscribe(e, true)} className="flex items-center gap-1.5 bg-[#09090B] border border-atlas-border rounded p-1">
                <input 
                  type="email" 
                  placeholder="Your email address..."
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  className="bg-transparent text-[10px] text-atlas-primary outline-none px-2 py-1 w-full"
                  required
                />
                <button 
                  type="submit"
                  className="bg-atlas-primary hover:bg-opacity-90 text-black text-[9px] font-bold px-2.5 py-1 rounded font-mono shrink-0 uppercase"
                >
                  Join
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Footer legal bar */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-600 font-mono gap-4">
          <span>© 2026 Atlas. All rights reserved. Built for Intelligence.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-atlas-primary transition-colors">Privacy Node</a>
            <span>•</span>
            <a href="#" className="hover:text-atlas-primary transition-colors">Terms of Vector</a>
          </div>
        </div>
      </footer>

      {/* 10. MODALS PORTAL OVERLAYS */}
      {/* Cmd+K Search modal overlay */}
      <SearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        onSelectNormie={(item) => setSelectedNormie(item)}
      />

      {/* Normie details popup profile inspect */}
      <NormieDetailsModal 
        normie={selectedNormie} 
        onClose={() => setSelectedNormie(null)} 
      />

    </div>
  );
}
