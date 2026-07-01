import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hexagon, X, Wallet, Loader2, ArrowLeft, Shield, Check, Info, AlertTriangle, LogOut, ExternalLink
} from 'lucide-react';

export interface PrivyUser {
  id: string;
  type: 'wallet' | 'google' | 'x';
  wallet?: {
    address: string;
    name: string;
  };
  google?: {
    email: string;
    name: string;
  };
  x?: {
    username: string;
    name: string;
  };
  avatarUrl: string;
}

interface PrivyContextType {
  ready: boolean;
  authenticated: boolean;
  user: PrivyUser | null;
  login: () => void;
  logout: () => void;
  isLoginOpen: boolean;
  closeLogin: () => void;
  triggerAppRedirect: (() => void) | null;
  setTriggerAppRedirect: (fn: (() => void) | null) => void;
}

const PrivyContext = createContext<PrivyContextType | undefined>(undefined);

export function usePrivy() {
  const context = useContext(PrivyContext);
  if (!context) {
    throw new Error('usePrivy must be used within a PrivyProvider');
  }
  return context;
}

// Custom Chrome / Google logo and Twitter / X logo since Lucide does not have direct SVG versions
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<PrivyUser | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const redirectRef = useRef<(() => void) | null>(null);
  const setTriggerAppRedirect = (fn: (() => void) | null) => {
    redirectRef.current = fn;
  };

  // Modal Step: 'providers' | 'wallets' | 'connecting'
  const [modalStep, setModalStep] = useState<'providers' | 'wallets' | 'connecting'>('providers');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<'wallet' | 'google' | 'x' | null>(null);
  const [connectingStatus, setConnectingStatus] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize and check persistent session
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('atlas_privy_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          setAuthenticated(true);
        } catch (e) {
          console.error('Failed to parse saved session', e);
        }
      }
      setReady(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoginOpen) {
        closeLogin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginOpen]);

  const login = () => {
    if (authenticated) return;
    setLoginError(null);
    setActiveProvider(null);
    setSelectedWallet(null);
    setModalStep('providers');
    setIsLoginOpen(true);
  };

  const logout = () => {
    localStorage.removeItem('atlas_privy_session');
    // Clear connected wallet flags inside data to sync
    localStorage.removeItem('atlas_wallet_address');
    localStorage.removeItem('atlas_wallet_connected');
    
    setUser(null);
    setAuthenticated(false);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
  };

  const triggerSuccessfulLogin = (userData: PrivyUser) => {
    // Save to localStorage
    localStorage.setItem('atlas_privy_session', JSON.stringify(userData));
    
    // Sync local wallet variables
    if (userData.type === 'wallet' && userData.wallet) {
      localStorage.setItem('atlas_wallet_address', userData.wallet.address);
      localStorage.setItem('atlas_wallet_connected', 'true');
    } else {
      localStorage.setItem('atlas_wallet_address', userData.id.substring(0, 14));
      localStorage.setItem('atlas_wallet_connected', 'true');
    }

    setUser(userData);
    setAuthenticated(true);
    setIsLoginOpen(false);

    // Call dynamic app launch redirect if available
    if (redirectRef.current) {
      setTimeout(() => {
        redirectRef.current?.();
      }, 300);
    }
  };

  const handleWalletSelect = async (walletName: string) => {
    setSelectedWallet(walletName);
    setModalStep('connecting');
    setLoginError(null);
    setConnectingStatus(`Requesting connection to ${walletName}...`);
    
    // Check for web3 provider window.ethereum if connecting to MetaMask
    if (walletName === 'MetaMask') {
      const anyWindow = window as any;
      if (anyWindow.ethereum) {
        try {
          setConnectingStatus('Connecting to MetaMask extension...');
          const accounts = await anyWindow.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            const rawAddr = accounts[0];
            const displayAddress = rawAddr.substring(0, 6) + '...' + rawAddr.substring(rawAddr.length - 4);
            const userData: PrivyUser = {
              id: 'usr_' + Math.random().toString(36).substring(2, 11),
              type: 'wallet',
              wallet: {
                address: displayAddress,
                name: 'MetaMask'
              },
              avatarUrl: `https://api.normies.art/normie/${Math.floor(Math.random() * 200) + 1}/image.png`
            };
            triggerSuccessfulLogin(userData);
          } else {
            throw new Error('No accounts returned from MetaMask');
          }
        } catch (err: any) {
          console.error('MetaMask connection error:', err);
          setLoginError('Failed to connect to MetaMask (extension handshake blocked by sandbox iframe restrictions). You can use our secure Sandbox Wallet Fallback instead!');
          setModalStep('wallets');
        }
        return;
      }
    }

    // Default simulated path for non-metamask or if window.ethereum is not present
    setTimeout(() => {
      setConnectingStatus(`Awaiting cryptographic signature inside ${walletName}...`);
      setTimeout(() => {
        // Random Hex address
        const chars = '0123456789abcdef';
        let addr = '0x';
        for (let i = 0; i < 40; i++) {
          addr += chars[Math.floor(Math.random() * 16)];
        }
        const userAddress = addr.substring(0, 6) + '...' + addr.substring(36);

        const userData: PrivyUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 11),
          type: 'wallet',
          wallet: {
            address: userAddress,
            name: walletName
          },
          avatarUrl: `https://api.normies.art/normie/${Math.floor(Math.random() * 200) + 1}/image.png`
        };
        triggerSuccessfulLogin(userData);
      }, 1200);
    }, 1000);
  };

  const handleOauthLogin = (provider: 'google' | 'x') => {
    setActiveProvider(provider);
    setModalStep('connecting');
    setConnectingStatus(`Initializing secure handshake with ${provider === 'google' ? 'Google' : 'X'}...`);
    
    setTimeout(() => {
      setConnectingStatus(`Personalizing your Atlas ecosystem account...`);
      setTimeout(() => {
        let userData: PrivyUser;
        const randomId = Math.floor(Math.random() * 200) + 1;
        
        if (provider === 'google') {
          userData = {
            id: 'usr_' + Math.random().toString(36).substring(2, 11),
            type: 'google',
            google: {
              email: 'atlas.explorer@gmail.com',
              name: 'Atlas Explorer'
            },
            avatarUrl: `https://api.normies.art/normie/${randomId}/image.png`
          };
        } else {
          userData = {
            id: 'usr_' + Math.random().toString(36).substring(2, 11),
            type: 'x',
            x: {
              username: 'atlas_network',
              name: 'Atlas Sentinel'
            },
            avatarUrl: `https://api.normies.art/normie/${randomId}/image.png`
          };
        }
        triggerSuccessfulLogin(userData);
      }, 1000);
    }, 1000);
  };

  return (
    <PrivyContext.Provider value={{
      ready,
      authenticated,
      user,
      login,
      logout,
      isLoginOpen,
      closeLogin,
      triggerAppRedirect: redirectRef.current,
      setTriggerAppRedirect
    }}>
      {children}

      {/* RENDER DYNAMIC PRIVY CENTRED LOGIN OVERLAY MODAL */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Fullscreen Backdrop overlay with subtle blur and dim */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLogin}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />

            {/* Premium centered Auth modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-[360px] bg-[#0c0c0e] border border-zinc-800/80 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.9),inset_0_0_12px_rgba(255,255,255,0.01)] overflow-hidden flex flex-col items-center"
            >
              {/* Background scanline simulation */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.004)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-50" />
              
              {/* Top glass reflection sheen */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent" />

              {/* Top-right close button */}
              <button 
                onClick={closeLogin}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-zinc-800/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Content Header */}
              <div className="flex flex-col items-center text-center mt-2 w-full">
                <div className="w-10 h-10 bg-white/5 border border-zinc-800/80 rounded-xl flex items-center justify-center shadow-lg relative group">
                  <div className="absolute inset-0 bg-white/2 rounded-xl blur group-hover:opacity-100 transition-opacity opacity-50" />
                  <Hexagon className="w-5 h-5 text-white stroke-[2]" />
                </div>
                
                <h3 className="text-base font-bold text-white tracking-tight mt-4 font-sans">
                  Sign in to Atlas
                </h3>
                
                <p className="text-[11px] text-zinc-400 font-sans mt-2.5 leading-relaxed max-w-[280px]">
                  Continue to save watchlists, follow ecosystem activity and personalize your Atlas experience.
                </p>
              </div>

              {/* Steps Area */}
              <div className="w-full mt-6 min-h-[180px] flex flex-col justify-center">
                
                {loginError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex flex-col gap-2.5 text-left relative">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <div className="flex-1 pr-4">
                        <p className="font-semibold text-red-400">Connection Error</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{loginError}</p>
                      </div>
                      <button 
                        onClick={() => setLoginError(null)}
                        className="absolute top-2 right-2 text-zinc-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {loginError.includes('MetaMask') && (
                      <button
                        onClick={async () => {
                          setLoginError(null);
                          setModalStep('connecting');
                          setConnectingStatus('Launching with Sandbox secure handshake...');
                          setTimeout(() => {
                            // Generate random wallet address
                            const chars = '0123456789abcdef';
                            let addr = '0x';
                            for (let i = 0; i < 40; i++) {
                              addr += chars[Math.floor(Math.random() * 16)];
                            }
                            const userAddress = addr.substring(0, 6) + '...' + addr.substring(36);
                            const userData: PrivyUser = {
                              id: 'usr_' + Math.random().toString(36).substring(2, 11),
                              type: 'wallet',
                              wallet: {
                                address: userAddress,
                                name: 'MetaMask (Sandbox)'
                              },
                              avatarUrl: `https://api.normies.art/normie/${Math.floor(Math.random() * 200) + 1}/image.png`
                            };
                            triggerSuccessfulLogin(userData);
                          }, 800);
                        }}
                        className="w-full py-1.5 px-3 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-[10px] text-red-200 hover:text-white rounded-md font-medium transition-colors cursor-pointer text-center"
                      >
                        Launch with Sandbox Wallet Fallback
                      </button>
                    )}
                  </div>
                )}
                
                {/* Step 1: Login Providers Options */}
                {modalStep === 'providers' && (
                  <div className="space-y-2.5 w-full">
                    {/* Option 1: Wallet */}
                    <button
                      onClick={() => setModalStep('wallets')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#111113] hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-xs font-semibold text-white transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span>Continue with Wallet</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-300">WEB3</span>
                    </button>

                    {/* Option 2: Google */}
                    <button
                      onClick={() => handleOauthLogin('google')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#111113] hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-xs font-semibold text-white transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <GoogleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Continue with Google</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-300">OAUTH</span>
                    </button>

                    {/* Option 3: X */}
                    <button
                      onClick={() => handleOauthLogin('x')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#111113] hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-xs font-semibold text-white transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <TwitterIcon className="w-4 h-4 text-zinc-300 group-hover:scale-110 transition-transform" />
                        <span>Continue with X</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-300">OAUTH</span>
                    </button>
                  </div>
                )}

                {/* Step 2: Wallet Provider Selection Sub-flow */}
                {modalStep === 'wallets' && (
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between mb-3">
                      <button 
                        onClick={() => setModalStep('providers')}
                        className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back</span>
                      </button>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Select Provider</span>
                    </div>

                    {[
                      { name: 'MetaMask', iconColor: 'text-orange-500' },
                      { name: 'Rabby', iconColor: 'text-blue-500' },
                      { name: 'Coinbase Wallet', iconColor: 'text-blue-600' },
                      { name: 'WalletConnect', iconColor: 'text-sky-500' }
                    ].map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={() => handleWalletSelect(wallet.name)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0e0e10] hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Wallet className={`w-3.5 h-3.5 ${wallet.iconColor}`} />
                          <span>{wallet.name}</span>
                        </div>
                        <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity text-zinc-400" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 3: Loading Handshake State */}
                {modalStep === 'connecting' && (
                  <div className="flex flex-col items-center justify-center py-6 w-full text-center">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    
                    <p className="text-xs font-mono text-zinc-300 mt-4 leading-relaxed px-2">
                      {connectingStatus}
                    </p>
                    
                    <span className="text-[9px] text-zinc-600 font-mono mt-2 tracking-widest uppercase">
                      SECURE CONNECTION BY PRIVY
                    </span>
                  </div>
                )}

              </div>

              {/* Footer Section */}
              <div className="w-full mt-6 pt-4 border-t border-zinc-900 text-center">
                <p className="text-[9px] text-zinc-500 leading-relaxed font-sans max-w-[280px]">
                  By continuing, you agree to our{' '}
                  <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Atlas Ecosystem Terms of Service: Welcome to Atlas. All index data, signals, and wallet coordinate tracking are provided for educational and diagnostic purposes.'); }} className="text-zinc-400 hover:text-white underline transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Atlas Ecosystem Privacy Policy: We value secure coordination. Your local session keys and saved search indexes are stored privately inside your standard secure browser storage.'); }} className="text-zinc-400 hover:text-white underline transition-colors">
                    Privacy Policy
                  </a>.
                </p>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </PrivyContext.Provider>
  );
}
