import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  CheckSquare,
  Square,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Filter,
  CheckCircle2,
  Tv,
  Eye,
  Film,
  Trophy,
} from 'lucide-react';
import { Channel, GroupSummary } from '../types';

interface Step2FiltersProps {
  channels: Channel[];
  onToggleGroup: (groupName: string, selectAll: boolean) => void;
  onToggleChannel: (channelId: string) => void;
  onSelectGreekOnly: () => void;
  onSelectAll: (select: boolean) => void;
  onSelectSportsAndCinema: () => void;
  onProceedToStep3: () => void;
  onBackToStep1: () => void;
}

export const Step2Filters: React.FC<Step2FiltersProps> = ({
  channels,
  onToggleGroup,
  onToggleChannel,
  onSelectGreekOnly,
  onSelectAll,
  onSelectSportsAndCinema,
  onProceedToStep3,
  onBackToStep1,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResolution, setSelectedResolution] = useState<'ALL' | '4K' | 'FHD' | 'HD' | 'SD'>('ALL');
  const [activeTab, setActiveTab] = useState<'groups' | 'channels'>('groups');

  // Compute group summaries
  const groupSummaries = useMemo(() => {
    const map = new Map<string, { total: number; selected: number }>();

    channels.forEach((ch) => {
      const g = ch.group || 'Other';
      const curr = map.get(g) || { total: 0, selected: 0 };
      curr.total += 1;
      if (ch.selected) curr.selected += 1;
      map.set(g, curr);
    });

    const groups: GroupSummary[] = [];
    map.forEach((val, key) => {
      const isGreek =
        key.toLowerCase().includes('greek') ||
        key.toLowerCase().includes('gr') ||
        key.toLowerCase().includes('cyprus');
      groups.push({
        name: key,
        count: val.total,
        selectedCount: val.selected,
        isGreek,
      });
    });

    // Sort greek first, then by count descending
    return groups.sort((a, b) => {
      if (a.isGreek && !b.isGreek) return -1;
      if (!a.isGreek && b.isGreek) return 1;
      return b.count - a.count;
    });
  }, [channels]);

  const totalChannels = channels.length;
  const selectedChannels = channels.filter((c) => c.selected).length;
  const reductionPercentage = totalChannels > 0 ? Math.round(((totalChannels - selectedChannels) / totalChannels) * 100) : 0;

  // Filtered channels list for the detailed view
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      if (selectedResolution !== 'ALL' && ch.resolution !== selectedResolution) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          ch.cleanName.toLowerCase().includes(q) ||
          ch.group.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [channels, searchQuery, selectedResolution]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header with Navigation & Live Reduction Banner */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Βήμα 2 από 4
              </span>
              <h2 className="text-xl font-bold text-white">Κατηγορίες & Έξυπνο Φιλτράρισμα</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Αφαιρέστε χιλιάδες περιττά κανάλια από ξένες χώρες και κρατήστε μόνο αυτά που παρακολουθείτε στην τηλεόρασή σας.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-back-to-step1"
              onClick={onBackToStep1}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Πίσω</span>
            </button>
            <button
              id="btn-proceed-step3-top"
              onClick={onProceedToStep3}
              disabled={selectedChannels === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <span>Συνέχεια στο EPG</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Metric Callout */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Μέτρηση σε Πραγματικό Χρόνο</div>
              <div className="text-sm text-slate-200 mt-0.5">
                Επιλεγμένα: <strong className="text-white text-base font-extrabold">{selectedChannels}</strong> από{' '}
                <span className="text-slate-400">{totalChannels}</span> κανάλια
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-center">
            {reductionPercentage > 0 ? (
              <div className="text-right">
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  ⚡ {reductionPercentage}% Μείωση Μεγέθους
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Η λίστα θα φορτώνει αστραπιαία σε TiviMate & Smart TV
                </p>
              </div>
            ) : (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Έχουν επιλεγεί όλα τα κανάλια
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Smart Quick Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Select Greek Only button */}
          <button
            id="btn-select-greek-only"
            onClick={onSelectGreekOnly}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Επιλογή μόνο Ελληνικών ("Select Greek Only")</span>
          </button>

          {/* Select Sports & Cinema */}
          <button
            id="btn-select-sports-cinema"
            onClick={onSelectSportsAndCinema}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Μόνο Sports & Cinema</span>
          </button>

          {/* Select All */}
          <button
            id="btn-select-all"
            onClick={() => onSelectAll(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Επιλογή Όλων</span>
          </button>

          {/* Deselect All */}
          <button
            id="btn-deselect-all"
            onClick={() => onSelectAll(false)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" />
            <span>Αποεπιλογή Όλων</span>
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            id="btn-view-groups"
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'groups' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Κατηγορίες ({groupSummaries.length})
          </button>
          <button
            id="btn-view-channels"
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'channels' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Λίστα Καναλιών ({filteredChannels.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: Groups Grid */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupSummaries.map((grp) => {
              const isAllSelected = grp.selectedCount === grp.count && grp.count > 0;
              const isNoneSelected = grp.selectedCount === 0;
              const isPartial = !isAllSelected && !isNoneSelected;

              return (
                <div
                  key={grp.name}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    grp.isGreek
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : isAllSelected
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {grp.isGreek && (
                        <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          GR
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-white truncate" title={grp.name}>
                        {grp.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{grp.count} κανάλια</span>
                      <span>•</span>
                      <span className={grp.selectedCount > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {grp.selectedCount} επιλεγμένα
                      </span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    id={`btn-toggle-group-${grp.name.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => onToggleGroup(grp.name, isNoneSelected || isPartial)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                      isAllSelected
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        : isPartial
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isAllSelected ? 'Επιλεγμένο' : isPartial ? 'Μερικό' : 'Προσθήκη'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Detailed Channels List with search & resolution filters */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          {/* Search bar & Resolution Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Αναζήτηση καναλιού (π.χ. MEGA, COSMOTE SPORT, DISCOVERY)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-1 rounded-xl text-xs">
              {(['ALL', '4K', 'FHD', 'HD', 'SD'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setSelectedResolution(res)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition ${
                    selectedResolution === res
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Channels rows */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl divide-y divide-slate-800/80 max-h-[550px] overflow-y-auto">
            {filteredChannels.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Δεν βρέθηκαν κανάλια με τα κριτήρια αναζήτησης.
              </div>
            ) : (
              filteredChannels.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => onToggleChannel(ch.id)}
                  className={`p-3 sm:px-4 flex items-center justify-between gap-3 cursor-pointer transition ${
                    ch.selected ? 'bg-slate-900/90 hover:bg-slate-850' : 'bg-slate-950/40 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={ch.selected}
                      onChange={() => onToggleChannel(ch.id)}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                    />

                    {ch.logoUrl ? (
                      <img
                        src={ch.logoUrl}
                        alt=""
                        className="w-8 h-8 rounded-lg object-contain bg-slate-800 p-0.5 shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Tv className="w-4 h-4" />
                      </div>
                    )}

                    <div className="overflow-hidden min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{ch.name}</span>
                        {ch.resolution && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              ch.resolution === '4K'
                                ? 'bg-purple-500/20 text-purple-400'
                                : ch.resolution === 'FHD'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ch.resolution}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 truncate block">{ch.group}</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-md shrink-0 ${
                      ch.selected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ch.selected ? 'Επιλεγμένο' : 'Εκτός'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <button
          onClick={onBackToStep1}
          className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Βήμα 1: Πηγές</span>
        </button>

        <button
          id="btn-proceed-step3-bottom"
          onClick={onProceedToStep3}
          disabled={selectedChannels === 0}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50"
        >
          <span>Επόμενο: Χαρτογράφηση EPG ({selectedChannels})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
