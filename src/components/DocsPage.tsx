import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, Code, Server, BookOpen, ChevronRight, Copy, Check, ArrowLeft, 
  Settings, Key, Layers, Radio, HelpCircle
} from 'lucide-react';

interface DocsPageProps {
  onBackToHome: () => void;
  triggerToast: (msg: string) => void;
}

interface DocSection {
  id: string;
  category: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

export default function DocsPage({ onBackToHome, triggerToast }: DocsPageProps) {
  const [activeTab, setActiveTab] = useState<string>('intro');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    triggerToast('Code snippet copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sections: DocSection[] = [
    {
      id: 'intro',
      category: 'Getting Started',
      title: 'Atlas L1 Overview',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Atlas L1 Ecosystem Overview</h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">
              Atlas is a high-performance Layer 1 blockchain specifically architected to provide live, trustless on-chain intelligence, decentralized signal-tracking indexing, and real-time custom bento metrics for the entire Normies ecosystem.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-2">
            <h4 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 uppercase">
              <Radio className="w-3.5 h-3.5 animate-pulse text-zinc-400" /> Network Paradigm
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Unlike typical EVM chains which decouple execution from indexing, Atlas integrates indexing nodes natively into the consensus engine. Every consensus block includes structured signal metadata, enabling microsecond lookup speeds.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 font-semibold">Core Capabilities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#09090b] border border-zinc-900 p-4 rounded-lg space-y-1.5">
                <span className="text-xs font-bold text-zinc-200 block">Sub-second Blocktimes</span>
                <span className="text-xs text-zinc-500 block">Pipelined execution allows transactions to commit in 350ms with instantaneous event emissions.</span>
              </div>
              <div className="bg-[#09090b] border border-zinc-900 p-4 rounded-lg space-y-1.5">
                <span className="text-xs font-bold text-zinc-200 block">Trustless Indexer Nodes</span>
                <span className="text-xs text-zinc-500 block">Indexers verify states concurrently, eliminating reliance on third-party RPC graph servers.</span>
              </div>
              <div className="bg-[#09090b] border border-zinc-900 p-4 rounded-lg space-y-1.5">
                <span className="text-xs font-bold text-zinc-200 block">Integrated Signal Matrix</span>
                <span className="text-xs text-zinc-500 block">Allows developers to construct real-time filters for transfer, conversion, and burn feeds natively.</span>
              </div>
              <div className="bg-[#09090b] border border-zinc-900 p-4 rounded-lg space-y-1.5">
                <span className="text-xs font-bold text-zinc-200 block">Low Ingress Overhead</span>
                <span className="text-xs text-zinc-500 block">Optimized byte serialization minimizes block size, lowering hard drive capacity requirements.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'nodes',
      category: 'Getting Started',
      title: 'Running a Node',
      icon: Server,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Running an Indexer Node</h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">
              Atlas Indexer Nodes sync and process blocks to compile intelligence indexes. Run this setup command in your terminal to initialize a secure node on your localized coordinate.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-500 uppercase">CLI Installation Script</span>
              <button 
                onClick={() => handleCopyCode('node_install', 'curl -sS https://get.atlas.zone/install.sh | bash')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
              >
                {copiedId === 'node_install' ? <Check className="w-3.5 h-3.5 text-zinc-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'node_install' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-[#050506] border border-zinc-900 rounded-lg p-4 font-mono text-xs text-white overflow-x-auto shadow-inner">
              <span className="text-zinc-500">$</span> curl -sS https://get.atlas.zone/install.sh | bash
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 font-semibold">Minimum System Requirements</h3>
            <div className="border border-zinc-900 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left text-zinc-400">
                <thead className="bg-[#09090b] text-zinc-500 font-mono text-[10px] uppercase border-b border-zinc-900">
                  <tr>
                    <th className="px-4 py-3">Hardware Component</th>
                    <th className="px-4 py-3">Minimum Criteria</th>
                    <th className="px-4 py-3">Recommended Specification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-sans">
                  <tr>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-[11px]">Processor (vCPU)</td>
                    <td className="px-4 py-3">4 Cores x86_64</td>
                    <td className="px-4 py-3 text-zinc-300 font-medium">8 Cores x86_64 / ARM64</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-[11px]">System Memory (RAM)</td>
                    <td className="px-4 py-3">8 GB</td>
                    <td className="px-4 py-3 text-zinc-300 font-medium">16 GB DDR5</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-[11px]">Solid State Storage</td>
                    <td className="px-4 py-3">250 GB NVMe SSD</td>
                    <td className="px-4 py-3 text-zinc-300 font-medium">500 GB Gen 4 NVMe</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-[11px]">Network Bandwidth</td>
                    <td className="px-4 py-3">100 Mbps Up/Down</td>
                    <td className="px-4 py-3 text-zinc-300 font-medium">1 Gbps Symmetric</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 font-semibold">Running the Daemon</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              After installation, configure the node with your private key coordinates and start the indexer daemon. It will discover neighboring vectors automatically via libp2p.
            </p>
            <div className="bg-[#050506] border border-zinc-900 rounded-lg p-4 font-mono text-xs text-zinc-400 overflow-x-auto space-y-1.5">
              <div><span className="text-zinc-600"># Configure environment key</span></div>
              <div><span className="text-zinc-300">atlasd</span> config set --node-key="your_coordinate_key_here"</div>
              <div className="pt-2"><span className="text-zinc-600"># Start syncing</span></div>
              <div><span className="text-zinc-300">atlasd</span> start --sync-mode="fast" --log-level="info"</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'signals-api',
      category: 'Core Developer APIs',
      title: 'Signals Tracker API',
      icon: Code,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Signals Tracker API</h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">
              Query on-chain signals, transfer sequences, index outputs, and real-time state metrics using high-performance JSON-RPC or REST endpoints.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-500 uppercase">Endpoint: Query Live Activity</span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-bold">GET</span>
                <span className="text-zinc-300">https://api.atlas.zone/v1/signals/activity</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500 uppercase">Interactive Sample Response</span>
                <button 
                  onClick={() => handleCopyCode('signals_response', `{\n  "status": "success",\n  "data": {\n    "timestamp": 1782808880,\n    "block_height": 1420182,\n    "signals_processed": 5,\n    "events": [\n      {\n        "event_id": "act_883192",\n        "type": "canvas_updated",\n        "actor": "0x5a1b...c98d",\n        "normie_id": 4821,\n        "coordinates": {"x": 12, "y": 44}\n      }\n    ]\n  }\n}`)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                >
                  {copiedId === 'signals_response' ? <Check className="w-3.5 h-3.5 text-zinc-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'signals_response' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-[#050506] border border-zinc-900 rounded-lg p-4 font-mono text-xs text-zinc-400 overflow-x-auto shadow-inner leading-relaxed">
{`{
  "status": "success",
  "data": {
    "timestamp": 1782808880,
    "block_height": 1420182,
    "signals_processed": 5,
    "events": [
      {
        "event_id": "act_883192",
        "type": "canvas_updated",
        "actor": "0x5a1b...c98d",
        "normie_id": 4821,
        "coordinates": {"x": 12, "y": 44}
      }
    ]
  }
}`}
              </pre>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 font-semibold">WebSockets Streaming</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              To obtain real-time notification streams without constant HTTP polling, establish a high-throughput WebSocket channel directly with an active node RPC indexer.
            </p>
            <div className="bg-[#050506] border border-zinc-900 rounded-lg p-4 font-mono text-xs text-white overflow-x-auto">
              const ws = new WebSocket('wss://stream.atlas.zone/v1/signals');
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'standards',
      category: 'Core Developer APIs',
      title: 'L1 Registry Standards',
      icon: Layers,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Ecosystem Registry Standards</h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">
              Developers can deploy custom sub-registries, smart vectors, and dynamic item profiles using the integrated Atlas ERC-Standard specification.
            </p>
          </div>

          <div className="p-4 bg-[#09090b] border border-zinc-900 rounded-lg space-y-3">
            <h4 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 uppercase">
              <Terminal className="w-4 h-4 text-white" /> AT-404 Normie Definition Contract
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Atlas features AT-404 as its native standard. It allows items to possess both non-fungible indexing visual attributes (like Canvas Coordinates, Rare Accessories, and Zombie statuses) and fractional liquid value pools simultaneously.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 font-semibold">Sample Token Deployment</h3>
            <div className="bg-[#050506] border border-zinc-900 rounded-lg p-4 font-mono text-xs text-zinc-400 overflow-x-auto space-y-1.5">
              <div><span className="text-purple-400">contract</span> AtlasNormieRegistry <span className="text-zinc-600">{`{`}</span></div>
              <div className="pl-4 text-zinc-500">// Initialize a new Normie profile entry standard</div>
              <div className="pl-4"><span className="text-purple-400">function</span> <span className="text-blue-400">registerNormie</span>(uint256 id, address owner) <span className="text-purple-400">external</span> <span className="text-zinc-600">{`{`}</span></div>
              <div className="pl-8">_registry[id] = owner;</div>
              <div className="pl-8">emit <span className="text-yellow-400">NormieRegistered</span>(id, owner);</div>
              <div className="pl-4"><span className="text-zinc-600">{`}`}</span></div>
              <div><span className="text-zinc-600">{`}`}</span></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'whitelist',
      category: 'Network Policies',
      title: 'Priority Coordinates Whitelist',
      icon: Key,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Priority Coordinates Whitelist</h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">
              Learn about our coordinates whitelisting procedures. This policy ensures only synchronized node keys participate in high-throughput block indexes during the pre-mainnet phase.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg space-y-1.5">
              <span className="text-xs font-mono font-bold text-amber-400 block uppercase">★ CURRENT POLICY PHASE: CLOSED SANDBOX</span>
              <span className="text-xs text-zinc-400 block leading-relaxed">
                We are gradually admitting whitelisted developer coordinators to secure early queue offsets. To register, submit your coordinate email via the early access form in the dashboard landing section.
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 font-semibold">Admittance Rules</h3>
              <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside font-sans">
                <li>Coordinates must maintain an indexer latency under <span className="text-white">100ms</span>.</li>
                <li>Key registries must be signed by an authorized Atlas genesis coordinate seed.</li>
                <li>Participating indexers must allocate at least <span className="text-white">100 GB</span> NVMe database storage for block caching.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const categories = Array.from(new Set(sections.map(s => s.category)));
  const currentSection = sections.find(s => s.id === activeTab) || sections[0];

  return (
    <div className="min-h-screen bg-[#040406] text-zinc-300 flex flex-col font-sans relative overflow-x-hidden pt-24 pb-16">
      
      {/* Background ambient light */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-zinc-500/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-zinc-500/5 rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Hero section inside docs */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-12 flex items-center justify-between border-b border-zinc-900/60 pb-6 mb-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-300 font-bold bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full uppercase">
              V2.0.4 Pre-Release
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">Developer Portal & Documentation</h1>
          <p className="text-xs text-zinc-500 font-sans">Technical guides, REST/WebSocket API endpoints, and setup daemon matrices.</p>
        </div>

        <button 
          onClick={onBackToHome}
          className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold px-4 py-2 rounded-md transition-all flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          <span>Back to Landing</span>
        </button>
      </div>

      {/* Docs Grid Layout */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-12 grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        
        {/* Left Sidebar Table of Contents */}
        <aside className="lg:col-span-1 space-y-6 bg-black/45 border border-zinc-900/60 rounded-xl p-5 sticky top-28 backdrop-blur-md">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-900 pb-2">
            Table of Contents
          </div>
          
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat} className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest block pl-2">{cat}</span>
                <div className="space-y-0.5">
                  {sections.filter(s => s.category === cat).map((sec) => {
                    const SecIcon = sec.icon;
                    const isActive = sec.id === activeTab;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setActiveTab(sec.id);
                          triggerToast(`Navigated to: ${sec.title}`);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans transition-all flex items-center gap-2 ${
                          isActive 
                            ? 'bg-zinc-900 text-white border border-zinc-800 font-medium' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30 border border-transparent'
                        }`}
                      >
                        <SecIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                        <span className="truncate">{sec.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase block pl-2">Need help?</span>
            <button 
              onClick={() => triggerToast('Connecting to community Discord support channel...')}
              className="w-full bg-[#0a0a0c] hover:bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-md text-[10px] font-mono transition-colors flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask Community Discord</span>
            </button>
          </div>
        </aside>

        {/* Center Main Documentation Panel */}
        <main className="lg:col-span-3 bg-black/40 border border-zinc-900/60 rounded-xl p-8 md:p-10 min-h-[500px] backdrop-blur-md">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {currentSection.content}
          </motion.div>
        </main>

      </div>
    </div>
  );
}
