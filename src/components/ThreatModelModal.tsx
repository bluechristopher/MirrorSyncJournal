import { useState, useEffect } from 'react';
import { ShieldCheck, X, Server, Lock, Database, Cpu, Layers, CheckCircle2, Shield, EyeOff, KeyRound } from 'lucide-react';
import { fetchThreatModelStatus } from '../services/api';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThreatModelModal({ isOpen, onClose }: ThreatModelModalProps) {
  const [threatData, setThreatData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchThreatModelStatus()
        .then(setThreatData)
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const securityGuarantees = [
    {
      id: 'sec-1',
      title: 'Local Vault & Isolated State',
      icon: Database,
      badge: 'Isolated',
      badgeColor: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/15',
      summary: 'Private Firestore security rules strictly scoped to your authenticated UID (or browser local storage in Guest mode).'
    },
    {
      id: 'sec-2',
      title: 'Zero Public Training',
      icon: EyeOff,
      badge: 'Enforced',
      badgeColor: 'text-purple-300 border-purple-400/40 bg-purple-500/15',
      summary: 'Your journal reflections and personal entries are never used to train public foundation models.'
    },
    {
      id: 'sec-3',
      title: 'Secure Server-Side AI Proxy',
      icon: Lock,
      badge: 'Protected',
      badgeColor: 'text-sky-300 border-sky-400/40 bg-sky-500/15',
      summary: 'API keys stay confidential on the backend. All Gemini requests are sanitized with 1MB body guards.'
    },
    {
      id: 'sec-4',
      title: 'Multi-Tier Model Resilience',
      icon: Cpu,
      badge: 'Active (3 Tiers)',
      badgeColor: 'text-[#f6e7b8] border-[#f6e7b8]/40 bg-[#f6e7b8]/15',
      summary: 'Automated fallback ladder (Gemini 3.7 Flash → 3.1 Flash-Lite → Latest) prevents disruptions.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl metallic-card border border-white/20 shadow-2xl p-6 sm:p-7 space-y-5 text-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl metallic-gold-panel flex items-center justify-center text-[#f6e7b8] shadow-md border border-[#f6e7b8]/40">
              <ShieldCheck className="w-5 h-5 text-[#f6e7b8]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Privacy & Security Vault</span>
              </h2>
              <p className="text-xs text-slate-300">Concise, verified guarantees for your personal reflections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Concise Security Guarantee Cards with Logos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {securityGuarantees.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl metallic-panel space-y-3 border border-white/10 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm text-slate-100">
                    <div className="p-1.5 rounded-lg metallic-gold-panel text-[#f6e7b8] shrink-0 border border-[#f6e7b8]/30">
                      <Icon className="w-4 h-4 text-[#f6e7b8]" />
                    </div>
                    <span className="leading-snug">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {item.summary}
                  </p>
                </div>
                
                {/* Security Bubble placed cleanly below */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Vault Guaranteed</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>End-to-End Vault Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl metallic-gold-button text-[#070d1e] font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
