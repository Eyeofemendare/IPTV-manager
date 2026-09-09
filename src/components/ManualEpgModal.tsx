import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Tv,
  Check,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Channel, EpgChannel } from '../types';

interface ManualEpgModalProps {
  channel: Channel | null;
  epgDatabase: EpgChannel[];
  onClose: () => void;
  onSaveMapping: (channelId: string, epgId: string, epgName: string, iconUrl?: string) => void;
}

export const ManualEpgModal: React.FC<ManualEpgModalProps> = ({
  channel,
  epgDatabase,
  onClose,
  onSaveMapping,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customEpgId, setCustomEpgId] = useState(channel?.epgId || channel?.tvgId || '');

  const categories = useMemo(() => {
    const set = new Set<string>();
    epgDatabase.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [epgDatabase]);

  const filteredEpg = useMemo(() => {
    let list = epgDatabase;
    if (selectedCategory !== 'all') {
      list = list.filter((e) => e.category === selectedCategory);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.displayName.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [epgDatabase, selectedCategory, search]);

  if (!channel) return null;

  const handleSelectEpg = (epg: EpgChannel) => {
    onSaveMapping(channel.id, epg.id, epg.displayName, epg.iconUrl);
    onClose();
  };

  const handleSaveCustom = () => {
    if (!customEpgId.trim()) return;
    onSaveMapping(channel.id, customEpgId.trim(), channel.cleanName || channel.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Χειροκίνητη Σύνδεση EPG: <span className="text-emerald-400">{channel.cleanName || channel.name}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Channel summary */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Κανάλι IPTV:</span>
              <div className="text-white font-bold">{channel.name}</div>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Τρέχον EPG ID:</span>
              <div className="text-cyan-400 font-mono font-semibold">{channel.epgId || channel.tvgId || 'Κανένα'}</div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Αναζήτηση στη βάση EPG (π.χ. ERT1, Mega, Cosmote, Novasports)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Chips */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedCategory === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                Όλα ({epgDatabase.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* EPG channels list */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredEpg.map((epg) => {
              const isSelected = channel.epgId === epg.id;

              return (
                <div
                  key={epg.id}
                  onClick={() => handleSelectEpg(epg)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {epg.iconUrl ? (
                      <img
                        src={epg.iconUrl}
                        alt=""
                        className="w-7 h-7 rounded-lg object-contain bg-slate-950 p-0.5 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Tv className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="overflow-hidden min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{epg.displayName}</span>
                        {epg.sourceName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 truncate max-w-[130px]">
                            {epg.sourceName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 truncate">{epg.id}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectEpg(epg);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isSelected ? 'Επιλεγμένο' : 'Σύνδεση'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Custom EPG ID manual fallback */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Χειροκίνητη εισαγωγή προσαρμοσμένου EPG ID (tvg-id)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="π.χ. CosmoteSport1.gr ή Mega.gr"
                value={customEpgId}
                onChange={(e) => setCustomEpgId(e.target.value)}
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSaveCustom}
                disabled={!customEpgId.trim()}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                Αποθήκευση
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
