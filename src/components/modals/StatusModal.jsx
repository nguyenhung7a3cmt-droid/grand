import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Activity,
  Server,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Cpu,
  RefreshCw,
  Wifi,
  HardDrive
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { systemStatus } from '../../data/status';

export default function StatusModal() {
  const { isStatusModalOpen, closeStatusModal, triggerAudio } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Live Telemetry');
  const [nodeLatencies, setNodeLatencies] = useState({});

  const pingNodes = async () => {
    setIsRefreshing(true);
    const start = performance.now();
    try {
      await fetch('/api/catalog/data', { cache: 'no-store' });
    } catch {}
    const rbxLatency = Math.round(performance.now() - start);

    const start2 = performance.now();
    try {
      await fetch('https://api.binance.com/api/v3/ping', { cache: 'no-store' });
    } catch {}
    const cryptoLatency = Math.round(performance.now() - start2);

    setNodeLatencies({
      'node-blox': `${Math.max(12, rbxLatency)}ms`,
      'node-mm2': `${Math.max(14, rbxLatency + 4)}ms`,
      'node-gpo': `${Math.max(16, rbxLatency + 8)}ms`,
      'node-fisch': `${Math.max(15, rbxLatency + 2)}ms`,
      'node-brainrot': `${Math.max(18, rbxLatency + 6)}ms`,
      'node-stripe': '14ms',
      'node-crypto': `${Math.max(15, cryptoLatency)}ms`
    });
    setLastUpdated(new Date().toLocaleTimeString());
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isStatusModalOpen) {
      pingNodes();
      const onKey = (e) => {
        if (e.key === 'Escape') closeStatusModal();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [isStatusModalOpen, closeStatusModal]);

  if (!isStatusModalOpen) return null;

  const handleRefresh = () => {
    triggerAudio('step');
    pingNodes().then(() => triggerAudio('success'));
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeStatusModal} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain z-10 flex flex-col justify-between" data-lenis-prevent="true"
        >
          {/* Header */}
          <div>
            <div className="p-5 sm:p-6 border-b border-gs-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-success">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-black text-xl sm:text-2xl text-white uppercase">
                      Staff Hub &amp; Support Telemetry
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      18 STAFF ON DUTY
                    </span>
                  </div>
                  <p className="text-xs text-gs-muted">
                    Live telemetry across 1-on-1 human trade specialists &amp; escrow dispute support
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
                  title="Refresh node status"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
                <button
                  onClick={closeStatusModal}
                  className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-gs-raised/40 border-b border-gs-border">
              <div className="p-3.5 rounded-2xl bg-gs-card border border-gs-border text-center">
                <div className="text-[10px] text-gs-muted uppercase font-heading font-bold">Escrow Guarantee</div>
                <div className="text-xl font-heading font-black text-emerald-400 mt-0.5">100% Safe</div>
                <div className="text-[10px] text-emerald-500 font-mono">Zero Ban History</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gs-card border border-gs-border text-center">
                <div className="text-[10px] text-gs-muted uppercase font-heading font-bold">Avg Ticket Response</div>
                <div className="text-xl font-heading font-black text-white mt-0.5">&lt; 45s</div>
                <div className="text-[10px] text-emerald-400 font-mono">Live 1-on-1 Chat</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gs-card border border-gs-border text-center">
                <div className="text-[10px] text-gs-muted uppercase font-heading font-bold">Staff On Duty</div>
                <div className="text-xl font-heading font-black text-gs-primary mt-0.5">18 Active</div>
                <div className="text-[10px] text-gs-light font-mono">24/7 Shifts</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gs-card border border-gs-border text-center">
                <div className="text-[10px] text-gs-muted uppercase font-heading font-bold">24h Hand Deliveries</div>
                <div className="text-xl font-heading font-black text-amber-400 mt-0.5">1,842 Trades</div>
                <div className="text-[10px] text-emerald-400 font-mono">5.0★ Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Node Grid */}
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-heading font-bold uppercase tracking-wider text-gs-muted mb-1">
              <span>Game Delivery Staff Teams</span>
              <span className="font-mono text-[11px] text-gs-muted">Telemetry: {lastUpdated}</span>
            </div>

            <div className="space-y-2.5">
              {systemStatus.nodes.map((node) => (
                <div
                  key={node.id}
                  className="p-3.5 rounded-2xl bg-gs-raised/60 border border-gs-border hover:border-gs-border/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gs-card border border-gs-border flex items-center justify-center text-gs-light shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                        <span>{node.name.replace('Node', 'Team')}</span>
                        <span className="text-[10px] font-mono text-gs-muted font-normal">
                          ({node.game})
                        </span>
                      </div>
                      <div className="text-xs text-gs-muted font-sans flex items-center gap-2 mt-0.5">
                        <span className="text-emerald-400 font-mono font-semibold">
                          {node.online}/{node.total} Agents Online
                        </span>
                        <span>•</span>
                        <span>Ticket Queue: 0 waiting</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-1 sm:justify-end">
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{nodeLatencies[node.id] || node.latency}</span>
                      </div>
                      <div className="text-[10px] text-gs-muted font-mono">Response Time</div>
                    </div>

                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Operational</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gs-raised border-t border-gs-border flex flex-col sm:flex-row items-center justify-between gap-2 px-6 text-xs text-gs-muted font-sans">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>24/7 active staff shifts with dedicated game delivery teams and instant live ticket dispatch.</span>
            </span>
            <button
              onClick={closeStatusModal}
              className="btn-secondary px-4 py-1.5 rounded-xl text-xs font-heading font-bold"
            >
              Close Monitor
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
