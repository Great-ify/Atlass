import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Compass, Activity, Shield, Flame, User, Clock, TrendingUp, Eye, 
  Layers, Database, ArrowRight, ArrowUp, ArrowDown, Star, Skull, Sparkles, 
  Hexagon, ArrowUpRight, Bell, History, Pencil, ArrowLeftRight, LogOut, Command, Wallet, Check
} from 'lucide-react';

import { ActivityEvent, MetricItem, NormieItem } from './types';
import { FEATURES, fetchLiveMetrics, fetchCustomizedEvents } from './data';

import GlobeAnimation from './components/GlobeAnimation';
import SearchModal from './components/SearchModal';
import NormieDetailDrawer from './components/NormieDetailDrawer';
import AppDemoMode from './components/AppDemoMode';
import DocsPage from './components/DocsPage';
import { usePrivy } from './lib/privy';

export default function App() {
  const { authenticated, user, login, logout, setTriggerAppRedirect } = usePrivy();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [demoInitialTab, setDemoInitialTab] = useState<'home' | 'explore' | 'signals' | 'watchlist'>('home');

  // Active main view router: 'landing' or 'docs'
  const [view, setView] = useState<'landing' | 'docs'>('landing');

  // Command Search Modal State
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Selected inspect item for detail views
  const [selectedNormie, setSelectedNormie] = useState<NormieItem | null>(null);
  
  // App Demo Mock Dashboard Trigger State
  const [demoActive, setDemoActive] = useState(false);

  // Synchronize Privy redirection callback to automatically route to app workspace
  useEffect(() => {
    setTriggerAppRedirect(() => {
      setDemoInitialTab('home');
      setDemoActive(true);
    });
    return () => setTriggerAppRedirect(null);
  }, [setTriggerAppRedirect]);

  // Email Subscription Forms State
  const [email, setEmail] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [footerSubscribed, setFooterSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Dynamic ticking activity feeds on Landing Page
  const [liveActivities, setLiveActivities] = useState<ActivityEvent[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<MetricItem[]>([]);

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

  // Set up real-time live on-chain polling on the landing page
  useEffect(() => {
    async function updateLandingData() {
      try {
        const [liveAct, liveMet] = await Promise.all([
          fetchCustomizedEvents(5),
          fetchLiveMetrics()
        ]);
        setLiveActivities(liveAct.slice(0, 5));
        setLiveMetrics(liveMet.slice(0, 6));
      } catch (err) {
        console.warn('Failed to load landing data:', err);
      }
    }

    updateLandingData();

    // Poll live data every 20 seconds
    const interval = setInterval(() => {
      updateLandingData();
    }, 20000);

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
      case 'Bell': return <Bell className="w-5 h-5 text-rose-500" />;
      default: return <Activity className="w-5 h-5 text-zinc-400" />;
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
              initialTab={demoInitialTab}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CORE HEADER BAR - Floating Liquid Crystal Display Panel */}
      {!demoActive && (
        <div className="sticky top-0 w-full z-40 px-4 md:px-12 pt-4 flex justify-center pointer-events-none">
          <header className="pointer-events-auto h-16 w-full max-w-5xl border border-zinc-800/80 bg-black/85 backdrop-blur-md rounded-full px-6 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.9),0_0_15px_rgba(255,255,255,0.01),inset_0_0_12px_rgba(255,255,255,0.02)] relative overflow-hidden">
            {/* Background LCD grid pixel simulation */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none opacity-50" />
            
            {/* Glossy sheen reflecting on glass */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-500/10 to-transparent" />
            
            {/* Logo Element */}
            <div 
              className="flex items-center gap-2 select-none group cursor-pointer z-10" 
              onClick={() => { setView('landing'); triggerToast('Welcome to Atlas L1 Ecosystem Portal.'); }}
            >
              <Hexagon className="w-4.5 h-4.5 text-white stroke-[2.2] transition-transform duration-500 group-hover:rotate-[30deg]" />
              <span className="text-xs font-extrabold tracking-widest font-sans text-white">ATLAS</span>
            </div>

            {/* Centered Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 z-10 bg-[#090a0d]/40 rounded-full px-5 py-1.5 shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]">
              <a 
                href="#product" 
                onClick={(e) => {
                  if (view !== 'landing') {
                    e.preventDefault();
                    setView('landing');
                    setTimeout(() => {
                      document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }
                }}
                className={`text-[11px] transition-colors font-medium font-sans uppercase tracking-wider ${view === 'landing' ? 'text-white font-semibold drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]' : 'text-zinc-400 hover:text-white'}`}
              >
                Product
              </a>
              <a 
                href="#features" 
                onClick={(e) => {
                  if (view !== 'landing') {
                    e.preventDefault();
                    setView('landing');
                    setTimeout(() => {
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }
                }}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors font-medium font-sans uppercase tracking-wider"
              >
                Features
              </a>
              <a 
                href="#stats" 
                onClick={(e) => {
                  if (view !== 'landing') {
                    e.preventDefault();
                    setView('landing');
                    setTimeout(() => {
                      document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }
                }}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors font-medium font-sans uppercase tracking-wider"
              >
                Live Stats
              </a>
              <button 
                onClick={() => {
                  setView('docs');
                  triggerToast('Ecosystem Developer Documentation initialized.');
                }}
                className={`text-[11px] transition-colors font-medium font-sans uppercase tracking-wider ${view === 'docs' ? 'text-white font-semibold drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]' : 'text-zinc-400 hover:text-white'}`}
              >
                Docs
              </button>
            </nav>

            {/* Right Action Widgets */}
            <div className="flex items-center gap-3.5 z-10 relative">
              <button 
                onClick={() => {
                  setDemoInitialTab('home');
                  setDemoActive(true);
                }}
                className="group bg-[#09090b] hover:bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs font-semibold px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.4)] cursor-pointer"
              >
                <span>Launch App</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>

              {authenticated && (
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="w-8 h-8 rounded-full border border-zinc-800 hover:border-purple-500 bg-[#111113] overflow-hidden flex items-center justify-center transition-all cursor-pointer shadow-lg shrink-0"
                  >
                    <img 
                      src={user?.avatarUrl} 
                      alt="User Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <>
                        {/* Global click overlay to dismiss dropdown */}
                        <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                          className="absolute right-0 mt-2 w-48 bg-[#0c0c0e] border border-zinc-800 rounded-xl py-2 shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-40"
                        >
                          {/* User Header info */}
                          <div className="px-3 py-1.5 border-b border-zinc-900 mb-1">
                            <p className="text-[10px] font-mono font-bold text-white truncate">
                              User
                            </p>
                            <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
                              {user?.type} connected
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              triggerToast(`Session Profile: Connected as User via ${user?.type || 'Privy'}`);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              setDemoInitialTab('watchlist');
                              setDemoActive(true);
                              triggerToast('Opening saved Watchlist directory...');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Watchlist</span>
                          </button>

                          <div className="h-[1px] bg-zinc-900 my-1" />

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              logout();
                              triggerToast('Signed out of Atlas secure session.');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </header>
        </div>
      )}

      {/* 4. MAIN LANDING HERO CONTAINER */}
      {view === 'landing' ? (
        <>
          <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-12 md:py-20 space-y-24">
        
        {/* HERO SPLIT SECTION */}
        <section id="product" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Detail */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-5 space-y-6 text-left"
          >
            
            {/* Intel core badge */}
            <div className="inline-flex items-center gap-2 bg-[#09090b] border border-zinc-800 px-3 py-1 rounded-full select-none">
              <span className="w-1.5 h-1.5 rounded-full border border-zinc-600 flex items-center justify-center">
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-400 animate-pulse" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">The Intelligence Layer for Normies</span>
            </div>

            {/* Premium Typographic Headings */}
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-white font-sans">
              Explore.<br />
              Analyze.<br />
              Discover.
            </h1>

            <p className="text-sm md:text-base text-zinc-400 max-w-sm leading-relaxed font-sans">
              Real-time intelligence and analytics for the entire Normies ecosystem. Universal search, on-chain signal trackers, and custom bento indicators.
            </p>

            {/* Launch CTA buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button 
                onClick={() => setDemoActive(true)}
                className="group bg-white hover:bg-zinc-100 text-black text-xs font-bold px-5 py-2.5 rounded-md transition-all flex items-center gap-1.5 shadow-[0_4px_16px_rgba(255,255,255,0.06)]"
              >
                <span>Explore Dashboard</span>
                <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => {
                  setDemoInitialTab('explore');
                  setDemoActive(true);
                  triggerToast('Navigating directly to app discover tab...');
                }}
                className="bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold px-5 py-2.5 rounded-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Discover Normies</span>
                <Command className="w-3.5 h-3.5 text-zinc-500" />
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

          </motion.div>

          {/* Right Holographic Central Globe Animation */}
          <div className="lg:col-span-7 flex items-center justify-center relative">
            <GlobeAnimation />
          </div>

        </section>

        {/* 5. ECOSYSTEM STATS METRIC SECTIONS */}
        <section id="stats" className="space-y-4 pt-4 border-t border-zinc-900/40">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">Real-time Ecosystem Metrics</h3>
            <span className="text-[10px] text-zinc-600 font-mono">On-chain indexer sequences</span>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {(() => {
              const totalNormiesMetric = liveMetrics.find(m => m.id === 'total_normies');
              const transfersMetric = liveMetrics.find(m => m.id === 'normies_transferred');
              const burnedMetric = liveMetrics.find(m => m.id === 'normies_burned');
              
              const displayedMetrics = [
                {
                  id: 'total_normies',
                  label: 'Total Normies',
                  value: totalNormiesMetric?.value || '...',
                  change: totalNormiesMetric?.change || 'Syncing',
                  color: 'legendary' as const,
                  sparklineData: totalNormiesMetric?.sparklineData || [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
                },
                {
                  id: 'normies_transferred',
                  label: 'Normies Transferred',
                  value: transfersMetric?.value || '...',
                  change: transfersMetric?.change || 'Syncing',
                  color: 'info',
                  sparklineData: transfersMetric?.sparklineData || [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
                },
                {
                  id: 'normies_burned',
                  label: 'Normies Burned',
                  value: burnedMetric?.value || '...',
                  change: burnedMetric?.change || 'Syncing',
                  color: 'error',
                  sparklineData: burnedMetric?.sparklineData || [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
                }
              ];

              return displayedMetrics.map((m) => (
                <motion.div 
                  key={m.id} 
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
                  }}
                  className="bg-[#09090b] border border-zinc-900/60 rounded-lg p-4 flex flex-col justify-between hover:border-zinc-800/80 transition-all select-none group"
                >
                  <div>
                    <div className="text-[10px] text-zinc-500 font-mono font-medium">{m.label}</div>
                    <div className="text-lg font-mono font-bold text-white mt-1.5">{m.value}</div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="mt-5 flex items-center justify-between">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        m.color === 'success' ? 'bg-emerald-400' :
                        m.color === 'warning' ? 'bg-amber-400' :
                        m.color === 'error' ? 'bg-red-400' :
                        m.color === 'legendary' ? 'bg-purple-400' :
                        m.color === 'info' ? 'bg-blue-400' :
                        'bg-zinc-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        m.color === 'success' ? 'bg-emerald-500' :
                        m.color === 'warning' ? 'bg-amber-500' :
                        m.color === 'error' ? 'bg-red-500' :
                        m.color === 'legendary' ? 'bg-purple-500' :
                        m.color === 'info' ? 'bg-blue-500' :
                        'bg-zinc-500'
                      }`}></span>
                    </span>
                  </div>
                </motion.div>
              ));
            })()}
          </motion.div>
        </section>

        {/* 7. BENTO CORE FEATURES HIGHLIGHT GRID */}
        <section id="features" className="space-y-6 pt-4 border-t border-zinc-900/40">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Built for Intelligence</span>
            <h2 className="text-2xl md:text-3xl font-bold font-sans text-white tracking-tight">Everything you need to understand the Normies ecosystem.</h2>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {FEATURES.map((feat, idx) => (
              <motion.div 
                key={idx} 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
                }}
                className="bg-[#09090b] border border-zinc-900/60 p-5 rounded-lg flex flex-col justify-between hover:border-zinc-800/80 transition-all group cursor-pointer"
                onClick={() => {
                  if (feat.title.includes('Analytics') || feat.title.includes('Discovery')) {
                    setDemoActive(true);
                  } else {
                    triggerToast(`Ecosystem Module: ${feat.title} portal active.`);
                  }
                }}
              >
                <div className="space-y-4">
                  <div className="p-2.5 w-max rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                    {getFeatureIcon(feat.iconName)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans">{feat.title}</h4>
                    <p className="text-xs text-zinc-400 font-sans mt-2.5 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 8. EARLY ACCESS SUBMISSION ACTION CARD */}
        <section className="bg-gradient-to-tr from-atlas-surface to-[#18181B] border border-atlas-border rounded-xl p-8 md:p-12 overflow-hidden max-w-4xl mx-auto relative">
          
          {/* Subtle design details */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient from-white/[0.02] to-transparent blur-xl rounded-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10 text-left">
            
            {/* Left half: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-3"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Ready to explore?</span>
              <h2 className="text-2xl md:text-3xl font-bold font-sans text-atlas-primary tracking-tight leading-tight">Dive into the intelligence layer for Normies.</h2>
              <p className="text-xs text-atlas-secondary font-sans leading-relaxed max-w-sm">
                Whitelisting coordinate is now open. Register your coordinate email address to secure early priority indexing queues.
              </p>
            </motion.div>

            {/* Right half: Form & details */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Mail subscriber form */}
              {subscribed ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex flex-col items-center gap-1.5"
                >
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-400 font-mono">EARLY ACCESS GRANTED</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Coordinates updated. We will ping you soon.</span>
                </motion.div>
              ) : (
                <form onSubmit={(e) => handleSubscribe(e, false)} className="flex items-center gap-2 bg-[#09090B] border border-atlas-border rounded-lg p-1">
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
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500 font-mono justify-start">
                <button onClick={() => setDemoActive(true)} className="hover:text-atlas-primary transition-colors flex items-center gap-1">
                  <span>● Launch Explorer</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <span>•</span>
                <span>No login required</span>
                <span>•</span>
                <span>Real-time on-chain data</span>
              </div>
            </motion.div>

          </div>
        </section>

      </main>

      {/* 9. DETAILED ESTABLISHED FOOTER */}
      <footer className="border-t border-zinc-900 bg-[#040406] pt-16 pb-8 px-6 md:px-12 mt-16 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-6 pb-12 border-b border-zinc-900/60">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              className="flex items-center gap-2 select-none group cursor-pointer" 
              onClick={() => { setView('landing'); triggerToast('Welcome to Atlas L1 Ecosystem Portal.'); }}
            >
              <Hexagon className="w-4.5 h-4.5 text-white stroke-[2.2] transition-transform duration-500 group-hover:rotate-[30deg]" />
              <span className="text-xs font-extrabold tracking-widest font-sans text-white">ATLAS</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs">
              The intelligence and signals tracking layer for the entire Normies ecosystem. Building decentralized real-time indexing infrastructure.
            </p>
          </div>

          {/* Links Cols */}
          <div>
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold mb-3.5">Product</h5>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><a href="#features" className="hover:text-white transition-colors">Ecosystem Features</a></li>
              <li><a href="#stats" className="hover:text-white transition-colors">Live Stats Grid</a></li>
              <li><button onClick={() => setDemoActive(true)} className="hover:text-white transition-colors text-left">Explorer Portal</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold mb-3.5">Resources</h5>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <button 
                  onClick={() => { setView('docs'); triggerToast('Ecosystem Developer Documentation initialized.'); }} 
                  className="hover:text-white transition-colors text-left font-medium"
                >
                  Documentation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => triggerToast('Ecosystem API reference coming soon.')} 
                  className="hover:text-white transition-colors text-left"
                >
                  Ecosystem API
                </button>
              </li>
            </ul>
          </div>

          {/* Stay Updated Col */}
          <div className="space-y-3.5">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Stay Updated</h5>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Receive on-chain summary newsletters directly.
            </p>

            {footerSubscribed ? (
              <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded text-[10px] font-mono text-white">
                Pinging whitelist inbox soon.
              </div>
            ) : (
              <form onSubmit={(e) => handleSubscribe(e, true)} className="flex items-center gap-1.5 bg-[#09090B] border border-zinc-800 rounded p-1">
                <input 
                  type="email" 
                  placeholder="Your email address..."
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  className="bg-transparent text-[10px] text-white outline-none px-2 py-1 w-full font-sans"
                  required
                />
                <button 
                  type="submit"
                  className="bg-white hover:bg-zinc-200 text-black text-[9px] font-bold px-2.5 py-1 rounded font-mono shrink-0 uppercase"
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
            <a href="#" className="hover:text-white transition-colors">Privacy Node</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Vector</a>
          </div>
        </div>
      </footer>
    </>
  ) : (
    <DocsPage onBackToHome={() => setView('landing')} triggerToast={triggerToast} />
  )}

      {/* 10. MODALS PORTAL OVERLAYS */}
      {/* Cmd+K Search modal overlay */}
      <SearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        onSelectNormie={(item) => setSelectedNormie(item)}
      />

      {/* Normie details side drawer profile inspect */}
      <NormieDetailDrawer 
        normie={selectedNormie} 
        onClose={() => setSelectedNormie(null)} 
      />

    </div>
  );
}
