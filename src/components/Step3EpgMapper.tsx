import React, { useState, useMemo } from 'react';
import {
  Radio,
  Play,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tv,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Edit3,
  Check,
  ShieldCheck,
  SlidersHorizontal,
  Globe,
  RefreshCw,
  Plus,
  Upload,
} from 'lucide-react';
import { Channel, EpgChannel, SourceConfig } from '../types';
import { EPG_PRESETS } from '../data/epgPresets';
import { parseXMLTV } from '../utils/xmltvParser';

interface Step3EpgMapperProps {
  channels: Channel[];
  epgDatabase: EpgChannel[];
  sourceConfig: SourceConfig;
  onRunAutoMatch: () => void;
  onSelectEpgPreset?: (presetId: string) => void;
  onLoadCustomXmltv?: (xmlContent: string, sourceName: string, customUrl?: string) => void;
  onOpenManualMapping: (channel: Channel) => void;
  onPreviewStream: (channel: Channel) => void;
  onProceedToStep4: () => void;
  onBackToStep2: () => void;
}

export const Step3EpgMapper: React.FC<Step3EpgMapperProps> = ({
  channels,
  epgDatabase,
  sourceConfig,
  onRunAutoMatch,
  onSelectEpgPreset,
  onLoadCustomXmltv,
  onOpenManualMapping,
  onPreviewStream,
  onProceedToStep4,
  onBackToStep2,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatchingInProgress, setIsMatchingInProgress] = useState(false);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [customUrlInputValue, setCustomUrlInputValue] = useState(sourceConfig.customEpgUrl || sourceConfig.epgUrl || '');
  const [isLoadingXmltv, setIsLoadingXmltv] = useState(false);
  const [xmltvMsg, setXmltvMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Selected channels only
  const selectedChannels = useMemo(() => {
    return channels.filter((c) => c.selected);
  }, [channels]);

  const mappedCount = useMemo(() => {
    return selectedChannels.filter((c) => c.epgId || c.tvgId).length;
  }, [selectedChannels]);

  const unmappedCount = selectedChannels.length - mappedCount;
  const matchPercentage = selectedChannels.length > 0 ? Math.round((mappedCount / selectedChannels) * 100) : 0;

  // Filter channels based on tab & search
  const displayedChannels = useMemo(() => {
    return selectedChannels.filter((ch) => {
      const isMapped = Boolean(ch.epgId || ch.tvgId);
      if (filterTab === 'mapped' && !isMapped) return false;
      if (filterTab === 'unmapped' && isMapped) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          ch.cleanName.toLowerCase().includes(q) ||
          (ch.epgName && ch.epgName.toLowerCase().includes(q)) ||
          (ch.epgId && ch.epgId.toLowerCase().includes(q)) ||
          ch.group.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedChannels, filterTab, searchQuery]);

  const handleAutoMatchClick = () => {
    setIsMatchingInProgress(true);
    setTimeout(() => {
      onRunAutoMatch();
      setIsMatchingInProgress(false);
    }, 300);
  };

  const handlePresetSwitch = (presetId: string) => {
    if (onSelectEpgPreset) {
      onSelectEpgPreset(presetId);
    }
  };

  const handleFetchCustomUrl = async () => {
    if (!customUrlInputValue.trim() || !onLoadCustomXmltv) return;
    setIsLoadingXmltv(true);
    setXmltvMsg(null);

    try {
      const res = await fetch(customUrlInputValue.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = parseXMLTV(xml);
      if (parsed.length > 0) {
        onLoadCustomXmltv(xml, customUrlInputValue.trim(), customUrlInputValue.trim());
        setXmltvMsg({ text: `Φορτώθηκαν επιτυχώς ${parsed.length} κανάλια EPG!`, ok: true });
        setShowCustomUrlInput(false);
      } else {
        setXmltvMsg({ text: 'Δεν βρέθηκαν κανάλια στο XMLTV αρχείο.', ok: false });
      }
    } catch (e: any) {
      // CORS fallback
      if (onLoadCustomXmltv) {
        onLoadCustomXmltv('', customUrlInputValue.trim(), customUrlInputValue.trim());
      }
      setXmltvMsg({
        text: 'Αποθηκεύτηκε το EPG URL για την τελική λίστα (περιορισμός απευθείας ανάγνωσης browser CORS).',
        ok: true,
      });
      setShowCustomUrlInput(false);
    } finally {
      setIsLoadingXmltv(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header Banner */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Βήμα 3 από 4
              </span>
              <h2 className="text-xl font-bold text-white">Χαρτογράφηση EPG (Ηλεκτρονικός Οδηγός)</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Αντιστοιχίστε αυτόματα ή χειροκίνητα κάθε κανάλι με τον επίσημο οδηγό προγράμματος για να βλέπετε "Τώρα & Μετά" στην τηλεόραση.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-back-to-step2"
              onClick={onBackToStep2}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Πίσω</span>
            </button>
            <button
              id="btn-proceed-step4-top"
              onClick={onProceedToStep4}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition"
            >
              <span>Συνέχεια σε Cloud & QR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EPG Source & Preset Quick Switcher (NEW) */}
        <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Πηγή EPG Database:
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-semibold">
                {epgDatabase.length} κανάλια οδηγού διαθέσιμα
              </span>
            </div>

            <button
              onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCustomUrlInput ? 'Απόκρυψη Custom EPG' : 'Προσθήκη / Αλλαγή XMLTV URL'}</span>
            </button>
          </div>

          {/* Presets Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {EPG_PRESETS.filter((p) => p.id !== 'custom_url').map((preset) => {
              const matchedSource = sourceConfig.epgSources?.find((s) => s.presetId === preset.id);
              const isEnabled = matchedSource ? matchedSource.enabled : (sourceConfig.epgSourceType === 'preset' && sourceConfig.epgPresetId === preset.id);

              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSwitch(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isEnabled
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{preset.badge}</span>
                  <span>{preset.name}</span>
                  {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                  <span className="text-[10px] opacity-75">({preset.channelCount})</span>
                </button>
              );
            })}

            {/* If custom URL sources exist */}
            {sourceConfig.epgSources && sourceConfig.epgSources.filter(s => s.type === 'custom_url' && s.enabled).map(s => (
              <span key={s.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {s.name}
              </span>
            ))}

            {/* If custom File sources exist */}
            {sourceConfig.epgSources && sourceConfig.epgSources.filter(s => s.type === 'custom_file' && s.enabled).map(s => (
              <span key={s.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Upload className="w-3 h-3" /> {s.name}
              </span>
            ))}
          </div>

          {/* Expandable Custom URL Box */}
          {showCustomUrlInput && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="Επικολλήστε XMLTV URL (π.χ. https://.../epg.xml)"
                value={customUrlInputValue}
                onChange={(e) => setCustomUrlInputValue(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleFetchCustomUrl}
                disabled={isLoadingXmltv || !customUrlInputValue.trim()}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoadingXmltv ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Radio className="w-3 h-3" />}
                <span>Φόρτωση XMLTV</span>
              </button>
            </div>
          )}

          {xmltvMsg && (
            <div
              className={`text-xs px-2.5 py-1 rounded-lg ${
                xmltvMsg.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
              }`}
            >
              {xmltvMsg.text}
            </div>
          )}
        </div>

        {/* EPG Auto-Match Bar */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Κάλυψη Οδηγού Προγράμματος (EPG)</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {mappedCount} από {selectedChannels.length} κανάλια έχουν EPG ({matchPercentage}%)
              </div>
            </div>
          </div>

          <button
            id="btn-smart-auto-match"
            onClick={handleAutoMatchClick}
            disabled={isMatchingInProgress}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isMatchingInProgress ? 'animate-spin' : ''}`} />
            <span>{isMatchingInProgress ? 'Ανάλυση Levenshtein...' : 'Αυτόματη Αντιστοίχιση (Smart Auto-Match)'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        
        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            id="btn-filter-all"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              filterTab === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Όλα ({selectedChannels.length})
          </button>
          <button
            id="btn-filter-mapped"
            onClick={() => setFilterTab('mapped')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              filterTab === 'mapped' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Χαρτογραφημένα ({mappedCount})</span>
          </button>
          <button
            id="btn-filter-unmapped"
            onClick={() => setFilterTab('unmapped')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              filterTab === 'unmapped' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Αχαρτογράφητα ({unmappedCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Αναζήτηση καναλιού ή EPG..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="space-y-3">
        {displayedChannels.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-medium text-sm">Δεν βρέθηκαν κανάλια για το επιλεγμένο φίλτρο.</p>
            <p className="text-slate-500 text-xs mt-1">Δοκιμάστε να αλλάξετε την καρτέλα προβολής ή την αναζήτηση.</p>
          </div>
        ) : (
          displayedChannels.map((channel) => {
            const isMapped = Boolean(channel.epgId || channel.tvgId);

            return (
              <div
                key={channel.id}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Channel Info & Logo */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="relative">
                    {channel.logoUrl ? (
                      <img
                        src={channel.logoUrl}
                        alt=""
                        className="w-11 h-11 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800 shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Tv className="w-5 h-5" />
                      </div>
                    )}
                    {channel.resolution && (
                      <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {channel.resolution}
                      </span>
                    )}
                  </div>

                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{channel.cleanName || channel.name}</h4>
                      <span className="text-[10px] text-slate-500 truncate hidden sm:inline">({channel.name})</span>
                    </div>

                    {/* EPG Mapping Badge */}
                    <div className="flex items-center gap-2 mt-1">
                      {isMapped ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="truncate max-w-[140px] font-bold">{channel.epgId || channel.tvgId}</span>
                          {channel.matchConfidence ? (
                            <span className="text-[10px] text-emerald-300 font-semibold">({channel.matchConfidence}%)</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" />
                          <span>Χωρίς EPG ID</span>
                        </div>
                      )}
                      <span className="text-[11px] text-slate-500 truncate">{channel.group}</span>
                    </div>

                    {/* Now & Next Preview */}
                    {channel.currentShow && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                            ΤΩΡΑ {channel.currentShow.start}
                          </span>
                          <span className="text-slate-200 font-medium truncate" title={channel.currentShow.title}>
                            {channel.currentShow.title}
                          </span>
                        </div>

                        {channel.nextShow && (
                          <div className="flex items-center gap-2 overflow-hidden text-slate-400">
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded shrink-0">
                              ΜΕΤΑ {channel.nextShow.start}
                            </span>
                            <span className="truncate" title={channel.nextShow.title}>
                              {channel.nextShow.title}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* Stream Preview Player */}
                  <button
                    id={`btn-preview-stream-${channel.id}`}
                    onClick={() => onPreviewStream(channel)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                    title="Δοκιμή ροής βίντεο (HLS / TS)"
                  >
                    <Play className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>Δοκιμή Ροής</span>
                  </button>

                  {/* Manual EPG Mapping Button */}
                  <button
                    id={`btn-map-channel-${channel.id}`}
                    onClick={() => onOpenManualMapping(channel)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
                    title="Χειροκίνητη Αντιστοίχιση EPG"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Αντιστοίχιση</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <button
          onClick={onBackToStep2}
          className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Βήμα 2: Φίλτρα</span>
        </button>

        <button
          id="btn-proceed-step4-bottom"
          onClick={onProceedToStep4}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition"
        >
          <span>Επόμενο: Cloud Συγχρονισμός & QR Code</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
