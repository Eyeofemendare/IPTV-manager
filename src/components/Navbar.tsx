import React from 'react';
import { Tv, Sparkles, CheckCircle2, RotateCcw, Github, Smartphone, ShieldCheck, Bookmark, ChevronDown } from 'lucide-react';
import { Channel, SavedAccountProfile } from '../types';

interface NavbarProps {
  channels: Channel[];
  savedProfiles?: SavedAccountProfile[];
  activeProfileId?: string | null;
  onOpenSavedAccounts?: () => void;
  onResetToDemo: () => void;
  onOpenGithubGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  channels,
  savedProfiles = [],
  activeProfileId,
  onOpenSavedAccounts,
  onResetToDemo,
  onOpenGithubGuide,
}) => {
  const totalChannels = channels.length;
  const selectedChannels = channels.filter((c) => c.selected).length;
  const mappedCount = channels.filter((c) => c.selected && (c.epgId || c.tvgId)).length;
  const reductionPercent = totalChannels > 0 ? Math.round(((totalChannels - selectedChannels) / totalChannels) * 100) : 0;
  const epgPercent = selectedChannels > 0 ? Math.round((mappedCount / selectedChannels) * 100) : 0;

  const activeProfile = savedProfiles.find((p) => p.id === activeProfileId);

  return (
    <header id="iptv-navbar" className="sticky top-0 z-40 bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0b0f17] rounded-[10px] flex items-center justify-center">
              <Tv className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                iPTV <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Manager</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.5 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Εργαλείο διαχείρισης & συγχρονισμού IPTV για Android & Smart TV
            </p>
          </div>
        </div>

        {/* Live Metrics Pills */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          {totalChannels > 0 && (
            <>
              {/* Selected vs Total */}
              <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-slate-400">Κανάλια:</span>
                <span className="font-bold text-white">
                  {selectedChannels} <span className="text-slate-500 font-normal">/ {totalChannels}</span>
                </span>
                {reductionPercent > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    -{reductionPercent}% όγκος
                  </span>
                )}
              </div>

              {/* EPG Coverage */}
              <div className="hidden md:flex bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">EPG:</span>
                <span className="font-bold text-cyan-400">{epgPercent}%</span>
                <span className="text-slate-500 text-[11px]">({mappedCount}/{selectedChannels})</span>
              </div>
            </>
          )}

          {/* Saved Accounts Button */}
          {onOpenSavedAccounts && (
            <button
              id="btn-navbar-saved-accounts"
              onClick={onOpenSavedAccounts}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition"
              title="Διαχείριση αποθηκευμένων λογαριασμών IPTV"
            >
              <Bookmark className="w-3.5 h-3.5 fill-amber-400/30" />
              <span className="max-w-[130px] truncate hidden sm:inline">
                {activeProfile ? activeProfile.name : 'Λογαριασμοί'}
              </span>
              <span className="sm:hidden">Λογαριασμοί</span>
              {savedProfiles.length > 0 && (
                <span className="bg-amber-500/20 px-1 py-0.2 rounded text-[10px] font-bold">
                  {savedProfiles.length}
                </span>
              )}
            </button>
          )}

          {/* Reset button */}
          <button
            id="btn-reset-demo"
            onClick={onResetToDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition"
            title="Επαναφορά στο Demo προφίλ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Επαναφορά Demo</span>
          </button>

          {/* GitHub Pages Host Guide */}
          <button
            id="btn-github-guide"
            onClick={onOpenGithubGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm transition"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Hosting</span>
          </button>
        </div>

      </div>
    </header>
  );
};
