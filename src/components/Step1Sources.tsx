import React, { useState, useEffect } from 'react';
import {
  Layers,
  Upload,
  Globe,
  KeyRound,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileCode2,
  Radio,
  Server,
  FileText,
  Compass,
  Check,
  Zap,
  Bookmark,
  Save,
  Star,
  HardDrive,
  FolderLock,
  Plus,
  Download,
  ExternalLink,
  HelpCircle,
  Trash2,
  Copy,
  Link,
  ListPlus,
} from 'lucide-react';
import { SourceConfig, PingResult, EpgChannel, SavedAccountProfile, EpgSourceItem } from '../types';
import { testConnectionPing, buildXtreamM3uUrl, buildXtreamEpgUrl } from '../utils/xtreamHelper';
import { EPG_PRESETS } from '../data/epgPresets';
import { parseXMLTV } from '../utils/xmltvParser';
import { extractUrlsFromString } from '../utils/epgSourcesHelper';

interface Step1SourcesProps {
  sourceConfig: SourceConfig;
  onChangeSourceConfig: (config: SourceConfig) => void;
  onLoadM3uContent: (content: string, sourceName: string) => void;
  onLoadDemoProfile: () => void;
  onProceedToStep2: () => void;
  totalChannelsLoaded: number;
  epgDatabase: EpgChannel[];
  onSelectEpgPreset: (presetId: string) => void;
  onLoadCustomXmltv: (xmlContent: string, sourceName: string, customUrl?: string) => void;
  savedProfiles?: SavedAccountProfile[];
  activeProfileId?: string | null;
  onSelectProfile?: (profile: SavedAccountProfile) => void;
  onOpenSavedAccountsModal?: () => void;
  onSaveCurrentAsProfile?: (name: string, notes?: string) => void;
  // Multi-EPG sources handlers
  epgSources?: EpgSourceItem[];
  onAddOrTogglePreset?: (presetId: string) => void;
  onAddUrlSource?: (url: string, name: string, channels: EpgChannel[]) => void;
  onAddMultipleUrlSources?: (items: Array<{ url: string; name?: string; channels: EpgChannel[] }>) => void;
  onAddFileSource?: (fileName: string, channels: EpgChannel[]) => void;
  onToggleEpgSource?: (sourceId: string) => void;
  onRemoveEpgSource?: (sourceId: string) => void;
}

export const Step1Sources: React.FC<Step1SourcesProps> = ({
  sourceConfig,
  onChangeSourceConfig,
  onLoadM3uContent,
  onLoadDemoProfile,
  onProceedToStep2,
  totalChannelsLoaded,
  epgDatabase,
  onSelectEpgPreset,
  onLoadCustomXmltv,
  savedProfiles = [],
  activeProfileId,
  onSelectProfile,
  onOpenSavedAccountsModal,
  onSaveCurrentAsProfile,
  epgSources = [],
  onAddOrTogglePreset,
  onAddUrlSource,
  onAddMultipleUrlSources,
  onAddFileSource,
  onToggleEpgSource,
  onRemoveEpgSource,
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'm3u_url' | 'm3u_file' | 'xtream'>(sourceConfig.type);
  const [pingResult, setPingResult] = useState<PingResult>({
    status: 'idle',
    latencyMs: 0,
    testedUrl: '',
  });
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlFetchProgress, setUrlFetchProgress] = useState<string>('');
  const [urlFetchSuccess, setUrlFetchSuccess] = useState<string | null>(null);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);

  // Inline profile save states
  const [showInlineSave, setShowInlineSave] = useState(false);
  const [inlineProfileName, setInlineProfileName] = useState('');
  const [inlineProfileNotes, setInlineProfileNotes] = useState('');

  // Sync activeTab if sourceConfig type changes (e.g. when loading a profile)
  useEffect(() => {
    setActiveTab(sourceConfig.type);
  }, [sourceConfig.type]);

  // Custom XMLTV states
  const [customXmltvUrl, setCustomXmltvUrl] = useState<string>(
    sourceConfig.customEpgUrl || (sourceConfig.epgSourceType === 'custom_url' ? sourceConfig.epgUrl : '')
  );
  const [urlInputMode, setUrlInputMode] = useState<'single' | 'bulk'>('single');
  const [bulkUrlsText, setBulkUrlsText] = useState<string>('');
  const [isLoadingXmltv, setIsLoadingXmltv] = useState(false);
  const [copiedSourceId, setCopiedSourceId] = useState<string | null>(null);
  const [multiEpgCopied, setMultiEpgCopied] = useState<boolean>(false);
  const [xmltvFetchStatus, setXmltvFetchStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // Curated Popular XMLTV EPG URLs
  const POPULAR_EPG_URLS = [
    {
      name: 'iptv-org Ελλάδα',
      badge: 'GR',
      url: 'https://iptv-org.github.io/epg/guides/gr.xml',
      description: 'Ελληνικός οδηγός καναλιών (iptv-org)',
    },
    {
      name: 'iptv-org Κύπρος',
      badge: 'CY',
      url: 'https://iptv-org.github.io/epg/guides/cy.xml',
      description: 'Κυπριακός οδηγός (iptv-org)',
    },
    {
      name: 'EPGShare GR',
      badge: 'GR1',
      url: 'https://epgshare01.online/epgshare01/epg_ripper_GR1.xml.gz',
      description: 'Ελληνικά κανάλια & συνδρομητικά',
    },
    {
      name: 'Sports EPG Cloud',
      badge: 'SPORT',
      url: 'https://iptv-manager.cloud/epg/sports.xml',
      description: 'Ευρωπαϊκός αθλητικός οδηγός',
    },
    {
      name: 'iptv-org UK Guide',
      badge: 'UK',
      url: 'https://iptv-org.github.io/epg/guides/uk.xml',
      description: 'Βρετανικά και διεθνή κανάλια',
    },
  ];

  const handleCopySourceUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSourceId(id);
    setTimeout(() => setCopiedSourceId(null), 2000);
  };

  const handleCopyAllEpgUrls = () => {
    const urls = (epgSources || [])
      .filter((s) => s.enabled && s.url)
      .map((s) => s.url!.trim());
    if (urls.length > 0) {
      navigator.clipboard.writeText(urls.join(','));
      setMultiEpgCopied(true);
      setTimeout(() => setMultiEpgCopied(false), 2000);
    }
  };

  // Run ping test
  const handleTestPing = async (urlToTest: string) => {
    if (!urlToTest) return;
    setPingResult({ status: 'testing', latencyMs: 0, testedUrl: urlToTest });
    const result = await testConnectionPing(urlToTest);
    setPingResult(result);
  };

  // Handle M3U file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onLoadM3uContent(content, file.name);
        onChangeSourceConfig({
          ...sourceConfig,
          type: 'm3u_file',
          fileName: file.name,
          loadedAt: new Date().toLocaleTimeString('el-GR'),
        });
      }
    };
    reader.readAsText(file);
  };

  // Handle XMLTV file upload (.xml or .xmltv)
  const handleXmltvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlString = event.target?.result as string;
      if (xmlString) {
        try {
          const parsed = parseXMLTV(xmlString);
          if (parsed.length > 0) {
            if (onAddFileSource) {
              onAddFileSource(file.name, parsed);
            } else {
              onLoadCustomXmltv(xmlString, file.name);
            }
            setXmltvFetchStatus({
              type: 'success',
              message: `Επιτυχής προσθήκη αρχείου ${file.name} με ${parsed.length} κανάλια EPG στις πηγές!`,
            });
          } else {
            setXmltvFetchStatus({
              type: 'error',
              message: 'Δεν βρέθηκαν έγκυρα κανάλια <channel> ή προγράμματα στο αρχείο XMLTV.',
            });
          }
        } catch (err: any) {
          setXmltvFetchStatus({
            type: 'error',
            message: `Σφάλμα ανάλυσης αρχείου XMLTV: ${err.message || err}`,
          });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Smart Fetch helper with multiple CORS proxies fallback
  const fetchWithCorsFallback = async (
    targetUrl: string,
    onProgress?: (msg: string) => void
  ): Promise<{ text: string; viaProxy: boolean }> => {
    // Attempt 1: Direct fetch
    try {
      if (onProgress) onProgress('Απευθείας ανάκτηση από διακομιστή...');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          return { text, viaProxy: false };
        }
      }
    } catch (directErr) {
      console.warn('Direct fetch blocked by CORS or network, attempting CORS proxy 1...', directErr);
    }

    // Attempt 2: AllOrigins proxy
    try {
      if (onProgress) onProgress('Δοκιμή μέσω ασφαλούς CORS Proxy (AllOrigins)...');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          return { text, viaProxy: true };
        }
      }
    } catch (proxy1Err) {
      console.warn('AllOrigins proxy failed, attempting CORS proxy 2...', proxy1Err);
    }

    // Attempt 3: CorsProxy.io
    try {
      if (onProgress) onProgress('Δοκιμή μέσω εναλλακτικού CORS Proxy (CorsProxy.io)...');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          return { text, viaProxy: true };
        }
      }
    } catch (proxy2Err) {
      console.warn('CorsProxy.io failed:', proxy2Err);
    }

    throw new Error('CORS_RESTRICTED');
  };

  // Handle M3U URL Fetch
  const handleFetchM3uUrl = async () => {
    if (!sourceConfig.m3uUrl) return;
    setIsLoadingUrl(true);
    setUrlFetchError(null);
    setUrlFetchSuccess(null);
    setUrlFetchProgress('Έναρξη σύνδεσης...');

    try {
      handleTestPing(sourceConfig.m3uUrl);
      const { text, viaProxy } = await fetchWithCorsFallback(sourceConfig.m3uUrl, (msg) => {
        setUrlFetchProgress(msg);
      });

      onLoadM3uContent(text, sourceConfig.m3uUrl);
      onChangeSourceConfig({
        ...sourceConfig,
        type: 'm3u_url',
        loadedAt: new Date().toLocaleTimeString('el-GR'),
      });
      setUrlFetchSuccess(
        viaProxy
          ? 'Επιτυχής ανάκτηση καναλιών μέσω CORS Proxy!'
          : 'Επιτυχής απευθείας ανάκτηση καναλιών!'
      );
    } catch (err: any) {
      console.warn('URL direct fetch restricted by CORS or network', err);
      setUrlFetchError('CORS_RESTRICTED');
    } finally {
      setIsLoadingUrl(false);
      setUrlFetchProgress('');
    }
  };

  // Handle Fetch Custom XMLTV EPG URL(s)
  const handleFetchCustomXmltvUrl = async (urlsOverride?: string) => {
    const rawInput =
      urlsOverride !== undefined
        ? urlsOverride
        : urlInputMode === 'bulk'
        ? bulkUrlsText
        : customXmltvUrl;

    if (!rawInput || !rawInput.trim()) return;

    let urls = extractUrlsFromString(rawInput);
    if (urls.length === 0) {
      const trimmed = rawInput.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        urls = [trimmed];
      } else {
        setXmltvFetchStatus({
          type: 'error',
          message: 'Παρακαλώ εισάγετε έγκυρο σύνδεσμο HTTP/HTTPS XMLTV (π.χ. https://.../epg.xml).',
        });
        return;
      }
    }

    setIsLoadingXmltv(true);
    setXmltvFetchStatus({ type: 'idle', message: `Έναρξη επεξεργασίας ${urls.length} EPG URLs...` });

    const addedItems: Array<{ url: string; name?: string; channels: EpgChannel[] }> = [];
    let totalChannelsParsed = 0;

    for (let i = 0; i < urls.length; i++) {
      const targetUrl = urls[i];
      let domain = 'Web XMLTV';
      try {
        domain = new URL(targetUrl).hostname || 'Web XMLTV';
      } catch {}

      setXmltvFetchStatus({
        type: 'idle',
        message: `Ανάλυση URL ${i + 1} από ${urls.length}: ${domain}...`,
      });

      try {
        handleTestPing(targetUrl);
        const { text: xmlString } = await fetchWithCorsFallback(targetUrl);
        const parsed = parseXMLTV(xmlString);

        if (parsed.length > 0) {
          totalChannelsParsed += parsed.length;
          addedItems.push({
            url: targetUrl,
            name: `XMLTV (${domain})`,
            channels: parsed,
          });
        } else {
          addedItems.push({
            url: targetUrl,
            name: `XMLTV (${domain})`,
            channels: [],
          });
        }
      } catch (err: any) {
        console.warn(`CORS/Network restriction for ${targetUrl}`, err);
        // Include anyway for final M3U url-tvg export!
        addedItems.push({
          url: targetUrl,
          name: `XMLTV (${domain})`,
          channels: [],
        });
      }
    }

    if (addedItems.length > 0) {
      if (onAddMultipleUrlSources) {
        onAddMultipleUrlSources(addedItems);
      } else if (onAddUrlSource) {
        for (const item of addedItems) {
          onAddUrlSource(item.url, item.name || '', item.channels);
        }
      } else {
        // Fallback for single legacy
        onLoadCustomXmltv('', addedItems[0].url, addedItems[0].url);
      }

      setXmltvFetchStatus({
        type: 'success',
        message:
          addedItems.length === 1
            ? `Επιτυχής προσθήκη XMLTV URL! (${totalChannelsParsed} κανάλια EPG αναλύθηκαν και είναι διαθέσιμα για αντιστοίχιση)`
            : `Επιτυχής προσθήκη ${addedItems.length} EPG URLs! (${totalChannelsParsed} νέα κανάλια EPG ενοποιήθηκαν στην ομάδα)`,
      });

      setCustomXmltvUrl('');
      setBulkUrlsText('');
    }

    setIsLoadingXmltv(false);
  };

  // Handle Xtream Codes Convert
  const handleApplyXtream = () => {
    if (!sourceConfig.xtreamServer || !sourceConfig.xtreamUser || !sourceConfig.xtreamPass) return;
    const generatedM3u = buildXtreamM3uUrl(
      sourceConfig.xtreamServer,
      sourceConfig.xtreamUser,
      sourceConfig.xtreamPass
    );
    const generatedEpg = buildXtreamEpgUrl(
      sourceConfig.xtreamServer,
      sourceConfig.xtreamUser,
      sourceConfig.xtreamPass
    );

    onChangeSourceConfig({
      ...sourceConfig,
      type: 'xtream',
      m3uUrl: generatedM3u,
      epgUrl: generatedEpg,
      customEpgUrl: generatedEpg,
      loadedAt: new Date().toLocaleTimeString('el-GR'),
    });

    handleTestPing(sourceConfig.xtreamServer);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Βήμα 1 από 4
            </span>
            <h2 className="text-xl font-bold text-white">Εισαγωγή Πηγής IPTV & EPG (Sources)</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Εισάγετε M3U URL / αρχείο / Xtream Codes και επιλέξτε προφορτωμένο EPG preset (Ελληνικό, Διεθνές) ή δικό σας Custom XMLTV EPG URL.
          </p>
        </div>

        {totalChannelsLoaded > 0 && (
          <button
            id="btn-proceed-step2-top"
            onClick={onProceedToStep2}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition group"
          >
            <span>Συνέχεια στο Βήμα 2</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* SECTION 0: SAVED ACCOUNTS & PROFILES (LOCAL STORAGE) */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Bookmark className="w-4 h-4 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Αποθηκευμένοι Λογαριασμοί IPTV (Local Storage)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                  {savedProfiles.length} {savedProfiles.length === 1 ? 'προφίλ' : 'προφίλ'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Τοπική αποθήκευση συνδρομών για αποφυγή επαναπληκτρολόγησης και εύκολη εναλλαγή παρόχων.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Profile Select Dropdown */}
            {savedProfiles.length > 0 && onSelectProfile && (
              <select
                id="select-active-profile"
                value={activeProfileId || ''}
                onChange={(e) => {
                  const target = savedProfiles.find((p) => p.id === e.target.value);
                  if (target) onSelectProfile(target);
                }}
                className="bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                title="Επιλογή αποθηκευμένου προφίλ"
              >
                {savedProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.isFavorite ? '★ ' : ''}
                    {p.name} (
                    {p.sourceConfig.type === 'xtream'
                      ? 'Xtream'
                      : p.sourceConfig.type === 'm3u_url'
                      ? 'M3U URL'
                      : p.sourceConfig.type === 'm3u_file'
                      ? 'Αρχείο'
                      : 'Demo'}
                    )
                  </option>
                ))}
              </select>
            )}

            {/* Quick Save Current Button */}
            {onSaveCurrentAsProfile && (
              <button
                id="btn-quick-save-profile"
                type="button"
                onClick={() => {
                  setInlineProfileName(
                    sourceConfig.type === 'xtream' && sourceConfig.xtreamServer
                      ? `Xtream: ${sourceConfig.xtreamServer.replace(/^https?:\/\//, '').split(':')[0]}`
                      : sourceConfig.type === 'm3u_url'
                      ? 'M3U Web Playlist'
                      : 'Συνδρομή IPTV'
                  );
                  setShowInlineSave((v) => !v);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                title="Αποθήκευση τρεχόντων στοιχείων ως νέο προφίλ"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Αποθήκευση</span>
              </button>
            )}

            {/* Manage Accounts Modal Opener */}
            {onOpenSavedAccountsModal && (
              <button
                id="btn-open-saved-accounts-modal"
                type="button"
                onClick={onOpenSavedAccountsModal}
                className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                title="Πλήρης διαχείριση λογαριασμών (Backup, Επεξεργασία, Ping, Διαγραφή)"
              >
                <FolderLock className="w-3.5 h-3.5" />
                <span>Διαχείριση</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Profile Chips Row */}
        {savedProfiles.length > 1 && onSelectProfile && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Γρήγορη Εναλλαγή:</span>
            {savedProfiles.map((p) => {
              const isSelected = p.id === activeProfileId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProfile(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  <span>{p.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {p.sourceConfig.type === 'xtream' ? 'Xtream' : p.sourceConfig.type === 'm3u_url' ? 'M3U' : 'Demo'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Inline Save Form */}
        {showInlineSave && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inlineProfileName.trim() && onSaveCurrentAsProfile) {
                onSaveCurrentAsProfile(inlineProfileName.trim(), inlineProfileNotes.trim());
                setShowInlineSave(false);
                setInlineProfileName('');
                setInlineProfileNotes('');
              }
            }}
            className="bg-slate-950 border border-emerald-500/40 p-4 rounded-xl space-y-3 pt-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                <span>Αποθήκευση Τρέχουσας Πηγής & EPG τοπικά (Local Storage)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowInlineSave(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Ακύρωση
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Όνομα Λογαριασμού / Προφίλ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="π.χ. Σπίτι - Xtream TV"
                  value={inlineProfileName}
                  onChange={(e) => setInlineProfileName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Σημειώσεις / Ημ. Λήξης (Προαιρετικό)
                </label>
                <input
                  type="text"
                  placeholder="π.χ. Λήγει 31/12/2026"
                  value={inlineProfileNotes}
                  onChange={(e) => setInlineProfileNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowInlineSave(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Ακύρωση
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Αποθήκευση Προφίλ</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SECTION 1: PLAYLIST SOURCE TABS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>1. Πηγή Λίστας Καναλιών (Playlist Source)</span>
          </label>
          <span className="text-xs text-slate-500">
            {totalChannelsLoaded > 0 ? `${totalChannelsLoaded} κανάλια φορτωμένα` : 'Επιλέξτε πηγή'}
          </span>
        </div>

        {/* Tabs Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800">
          <button
            id="tab-demo"
            onClick={() => setActiveTab('demo')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'demo'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Demo Προφίλ</span>
          </button>

          <button
            id="tab-m3u-url"
            onClick={() => setActiveTab('m3u_url')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'm3u_url'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>M3U / M3U_PLUS URL</span>
          </button>

          <button
            id="tab-m3u-file"
            onClick={() => setActiveTab('m3u_file')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'm3u_file'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Τοπικό Αρχείο (.m3u)</span>
          </button>

          <button
            id="tab-xtream"
            onClick={() => setActiveTab('xtream')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'xtream'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Xtream Codes API</span>
          </button>
        </div>

        {/* Tab 1: Demo Profiles */}
        {activeTab === 'demo' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Έτοιμο Ελληνικό Προφίλ (Greek Channels & Cosmote / Nova EPG)
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Φορτώστε άμεσα ένα ρεαλιστικό πακέτο IPTV με ελληνικά κανάλια (ERT, Mega, Ant1, Alpha, Star, ΣΚΑΪ, Open), αθλητικά (Cosmote Sport, Novasports), σειρές/ταινίες, καθώς και χιλιάδες περιττά διεθνή κανάλια για να δοκιμάσετε το έξυπνο φιλτράρισμα.
                </p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-full shrink-0">
                Προτεινόμενο για Δοκιμή
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                <div className="text-xs text-slate-400 font-medium">Ελληνικά Κανάλια & Sports</div>
                <div className="text-lg font-bold text-white mt-1">20+ Κανάλια</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Με έτοιμο EPG & HLS Live
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                <div className="text-xs text-slate-400 font-medium">Συνολικά Κανάλια Πηγής</div>
                <div className="text-lg font-bold text-white mt-1">15.420 Κανάλια</div>
                <div className="text-xs text-slate-400 mt-1">Περιλαμβάνει DE, FR, UK, TR κ.α.</div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                <div className="text-xs text-slate-400 font-medium">EPG Πηγή (Cosmote / XMLTV)</div>
                <div className="text-lg font-bold text-cyan-400 mt-1">Ενεργό</div>
                <div className="text-xs text-slate-400 mt-1">Τώρα & Μετά πρόγραμμα (Live)</div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                id="btn-load-demo-profile"
                onClick={onLoadDemoProfile}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Φόρτωση Προεγκατεστημένου Demo</span>
              </button>
              <span className="text-xs text-slate-400">
                {totalChannelsLoaded > 0
                  ? `Έχουν φορτωθεί ήδη ${totalChannelsLoaded} κανάλια στη μνήμη.`
                  : 'Κάντε κλικ για άμεση έναρξη χωρίς να εισάγετε δικά σας στοιχεία.'}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: M3U URL */}
        {activeTab === 'm3u_url' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              Εισαγωγή M3U / M3U_PLUS URL
            </h3>
            <p className="text-sm text-slate-400">
              Επικολλήστε το M3U Plus URL που σας έδωσε ο πάροχος IPTV (συνήθως περιέχει username, password & output=ts).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Διεύθυνση Playlist M3U URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="input-m3u-url"
                  type="url"
                  placeholder="http://iptv-provider.example:8080/get.php?username=USER&password=PASS&type=m3u_plus&output=ts"
                  value={sourceConfig.m3uUrl}
                  onChange={(e) => onChangeSourceConfig({ ...sourceConfig, m3uUrl: e.target.value })}
                  className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  id="btn-test-ping-url"
                  onClick={() => handleTestPing(sourceConfig.m3uUrl)}
                  disabled={!sourceConfig.m3uUrl}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Test Ping</span>
                </button>
                <button
                  id="btn-fetch-m3u-url"
                  onClick={handleFetchM3uUrl}
                  disabled={!sourceConfig.m3uUrl || isLoadingUrl}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isLoadingUrl ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  <span>Ανάκτηση</span>
                </button>
                {onSaveCurrentAsProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setInlineProfileName('M3U Web Playlist');
                      setShowInlineSave(true);
                    }}
                    disabled={!sourceConfig.m3uUrl}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    title="Αποθήκευση URL τοπικά"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Αποθήκευση</span>
                  </button>
                )}
              </div>
            </div>

            {/* Loading progress */}
            {isLoadingUrl && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-xs text-cyan-200 flex items-center gap-2.5 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                <span>{urlFetchProgress || 'Ανάκτηση λίστας σε εξέλιξη...'}</span>
              </div>
            )}

            {/* Success feedback */}
            {urlFetchSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-500/40 p-3.5 rounded-xl text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{urlFetchSuccess}</span>
                </div>
                <button
                  onClick={onProceedToStep2}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition shrink-0 self-end sm:self-auto"
                >
                  Συνέχεια στο Βήμα 2 ➔
                </button>
              </div>
            )}

            {/* CORS Restriction Assistance Card */}
            {urlFetchError && (
              <div className="bg-slate-950 border border-amber-500/40 p-4 sm:p-5 rounded-xl space-y-3 shadow-lg">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">
                      Περιορισμός Ασφαλείας Browser (CORS Policy Παρόχου)
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Ο διακομιστής IPTV του παρόχου σας δεν περιλαμβάνει κεφαλίδες CORS (<code className="text-emerald-400">Access-Control-Allow-Origin</code>), με αποτέλεσμα ο browser να μπλοκάρει την απευθείας ανάγνωση του περιεχομένου.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      💡 <em>Σημείωση: Οι εφαρμογές τηλεόρασης (TiviMate, IPTV Smarters, Kodi) δεν έχουν αυτόν τον περιορισμό browser και θα παίζουν κανονικά.</em>
                    </p>
                  </div>
                </div>

                {/* 2 Easy Solutions */}
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-2.5">
                  <span className="text-xs font-semibold text-white block">
                    Επιλέξτε έναν από τους 2 άμεσους τρόπους για να συνεχίσετε:
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Solution 1: Direct Download */}
                    <a
                      href={sourceConfig.m3uUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200 transition group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      </div>
                      <div>
                        <div className="font-bold text-white">1. Λήψη Αρχείου M3U</div>
                        <div className="text-[10px] text-slate-400">Ανοίγει άμεσα για λήψη στον υπολογιστή</div>
                      </div>
                    </a>

                    {/* Solution 2: Switch to Local File */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('m3u_file')}
                      className="p-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl flex items-center gap-2.5 text-xs text-cyan-200 text-left transition group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <div>
                        <div className="font-bold text-white">2. Καρτέλα "Τοπικό Αρχείο"</div>
                        <div className="text-[10px] text-slate-400">Σύρετε το αρχείο .m3u για άμεση επεξεργασία</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: M3U Local File */}
        {activeTab === 'm3u_file' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Επιλογή Τοπικού Αρχείου M3U (.m3u / .m3u8)
            </h3>
            <p className="text-sm text-slate-400">
              Ανεβάστε το αρχείο λίστας από τον υπολογιστή ή το κινητό σας. Η επεξεργασία γίνεται τοπικά με ταχύτατο streaming parser χωρίς να αποστέλλονται δεδομένα σε εξωτερικούς διακομιστές.
            </p>

            <label
              htmlFor="file-upload-input"
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center transition">
                <FileCode2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-white group-hover:text-emerald-400">
                  Κάντε κλικ για επιλογή αρχείου
                </span>
                <span className="text-xs text-slate-400 block mt-1">ή σύρετε το αρχείο .m3u εδώ</span>
              </div>
              <input
                id="file-upload-input"
                type="file"
                accept=".m3u,.m3u8,text/plain"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {sourceConfig.fileName && (
              <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">{sourceConfig.fileName}</span>
                </div>
                <span className="text-xs text-slate-400">{sourceConfig.loadedAt}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Xtream Codes API */}
        {activeTab === 'xtream' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              Σύνδεση μέσω Xtream Codes API
            </h3>
            <p className="text-sm text-slate-400">
              Εισάγετε τα στοιχεία διακομιστή του παρόχου σας για αυτόματη δημιουργία των συνδέσμων ροής και του EPG XMLTV.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Server URL & Port</label>
                <input
                  id="input-xtream-server"
                  type="text"
                  placeholder="http://provider.tv:8080"
                  value={sourceConfig.xtreamServer}
                  onChange={(e) => onChangeSourceConfig({ ...sourceConfig, xtreamServer: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Username</label>
                <input
                  id="input-xtream-user"
                  type="text"
                  placeholder="Όνομα Χρήστη"
                  value={sourceConfig.xtreamUser}
                  onChange={(e) => onChangeSourceConfig({ ...sourceConfig, xtreamUser: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  id="input-xtream-pass"
                  type="password"
                  placeholder="Κωδικός Πρόσβασης"
                  value={sourceConfig.xtreamPass}
                  onChange={(e) => onChangeSourceConfig({ ...sourceConfig, xtreamPass: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="btn-test-ping-xtream"
                onClick={() => handleTestPing(sourceConfig.xtreamServer)}
                disabled={!sourceConfig.xtreamServer}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Ping Server</span>
              </button>
              <button
                id="btn-apply-xtream"
                onClick={handleApplyXtream}
                disabled={!sourceConfig.xtreamServer || !sourceConfig.xtreamUser || !sourceConfig.xtreamPass}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Δημιουργία M3U & EPG Links</span>
              </button>
              {onSaveCurrentAsProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setInlineProfileName(
                      sourceConfig.xtreamServer
                        ? `Xtream: ${sourceConfig.xtreamServer.replace(/^https?:\/\//, '').split(':')[0]}`
                        : 'Xtream Account'
                    );
                    setShowInlineSave(true);
                  }}
                  disabled={!sourceConfig.xtreamServer || !sourceConfig.xtreamUser || !sourceConfig.xtreamPass}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Αποθήκευση στοιχείων Xtream τοπικά"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Αποθήκευση Λογαριασμού</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: XMLTV EPG SOURCE & PRESETS (REQUESTED BY USER - MULTI-EPG SUPPORT) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">
                Οδηγός Προγράμματος EPG (Διαχείριση Πολλαπλών Πηγών EPG)
              </h3>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Υποστηρίζεται ο συνδυασμός 2 ή περισσότερων αρχείων/πηγών EPG (π.χ. Ελληνικό Πακέτο + Διεθνές + Custom XMLTV παρόχου). Όλα τα προγράμματα συγχωνεύονται αυτόματα!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl self-start sm:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300">
              Ενεργές Πηγές: <strong className="text-cyan-300">{epgSources.filter((s) => s.enabled).length}</strong> / {epgSources.length}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-semibold text-slate-300">
              Σύνολο: <strong className="text-emerald-400">{epgDatabase.length} κανάλια EPG</strong>
            </span>
          </div>
        </div>

        {/* ACTIVE EPG SOURCES LIST (Multi-EPG Manager) */}
        {epgSources.length > 0 && (
          <div className="bg-slate-950/90 border border-cyan-500/20 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Ενεργή Ομάδα Πηγών EPG ({epgSources.filter((s) => s.enabled).length} επιλεγμένες / {epgSources.length} συνολικά)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {epgSources.filter((s) => s.enabled && s.url).length >= 2 && (
                  <button
                    type="button"
                    onClick={handleCopyAllEpgUrls}
                    className="text-xs px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg flex items-center gap-1.5 transition"
                    title="Αντιγραφή όλων των ενεργών EPG URLs διαχωρισμένων με κόμμα (για TiviMate / OTT Navigator / IPTV Smarters)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{multiEpgCopied ? 'Αντιγράφηκαν Όλα!' : 'Αντιγραφή Συνδυασμένων URLs'}</span>
                  </button>
                )}
                {epgSources.filter((s) => s.enabled).length >= 2 && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3 h-3" /> Multi-URL EPG ({epgSources.filter((s) => s.enabled).length} πηγές)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {epgSources.map((source) => {
                const count = source.channelCount ?? source.channels?.length ?? 0;
                const isCopied = copiedSourceId === source.id;
                return (
                  <div
                    key={source.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition ${
                      source.enabled
                        ? 'bg-slate-900/90 border-slate-700/80'
                        : 'bg-slate-950/40 border-slate-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      {/* Toggle Checkbox */}
                      <button
                        type="button"
                        onClick={() => onToggleEpgSource && onToggleEpgSource(source.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition border ${
                          source.enabled
                            ? 'bg-cyan-600 border-cyan-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                        title={source.enabled ? 'Κλικ για απενεργοποίηση' : 'Κλικ για ενεργοποίηση'}
                      >
                        {source.enabled ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                      </button>

                      {/* Source Icon & Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{source.name}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              source.type === 'preset'
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                                : source.type === 'custom_url'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {source.type === 'preset'
                              ? 'Preset'
                              : source.type === 'custom_url'
                              ? 'Web XMLTV'
                              : 'Τοπικό Αρχείο'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {count} κανάλια EPG
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                          {source.url && (
                            <span className="truncate max-w-md text-slate-400 select-all">{source.url}</span>
                          )}
                          {source.fileName && (
                            <span className="text-slate-300">Αρχείο: {source.fileName}</span>
                          )}
                          {source.loadedAt && (
                            <span className="text-slate-500 font-sans">Ενημερώθηκε: {source.loadedAt}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {source.url && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopySourceUrl(source.url!, source.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition border border-transparent hover:border-cyan-500/20"
                            title="Αντιγραφή URL"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTestPing(source.url!)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition border border-transparent hover:border-cyan-500/20"
                            title="Δοκιμή Ping"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleEpgSource && onToggleEpgSource(source.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                          source.enabled
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {source.enabled ? 'Ενεργό' : 'Ανενεργό'}
                      </button>

                      {epgSources.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveEpgSource && onRemoveEpgSource(source.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Αφαίρεση πηγής EPG"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {epgSources.filter((s) => s.enabled).length >= 2 && (
              <div className="text-xs text-cyan-300/90 bg-cyan-950/40 p-3 rounded-lg border border-cyan-800/40 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-cyan-200">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Συνδυασμός Πολλαπλών Πηγών EPG (Multi-URL):</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Όλα τα ενεργά προγράμματα συγχωνεύονται αυτόματα στη βάση αντιστοίχισης. Στην τελική εξαγωγή M3U, η κεφαλίδα περιλαμβάνει όλα τα ενεργά EPG URLs χωρισμένα με κόμμα (<code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono text-[11px]">url-tvg="url1,url2"</code>).
                </p>
                {epgSources.filter((s) => s.enabled && s.url).length > 0 && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded p-2 text-[11px] font-mono text-slate-300 truncate">
                    <span className="text-cyan-400">url-tvg="</span>
                    {epgSources.filter((s) => s.enabled && s.url).map((s) => s.url).join(',')}
                    <span className="text-cyan-400">"</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* EPG Preset Selector Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Προσθήκη / Εναλλαγή Προφορτωμένων EPG Presets</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Κάντε κλικ για άμεση προσθήκη ή ενεργοποίηση
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EPG_PRESETS.filter((p) => p.id !== 'custom_url').map((preset) => {
              const matchedSource = epgSources.find((s) => s.presetId === preset.id);
              const isIncluded = Boolean(matchedSource);
              const isEnabled = Boolean(matchedSource?.enabled);

              return (
                <div
                  key={preset.id}
                  id={`epg-preset-${preset.id}`}
                  onClick={() => {
                    if (onAddOrTogglePreset) {
                      onAddOrTogglePreset(preset.id);
                    } else {
                      onSelectEpgPreset(preset.id);
                    }
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between text-left group ${
                    isEnabled
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : isIncluded
                      ? 'bg-slate-900/70 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {preset.badge}
                      </span>
                      {isEnabled ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Ενεργό στην ομάδα
                        </span>
                      ) : isIncluded ? (
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          Ανενεργό
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-cyan-400 group-hover:underline flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Προσθήκη
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2 group-hover:text-cyan-300 transition">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{preset.description}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono truncate max-w-[160px]">{preset.url}</span>
                    <span className="text-emerald-400 font-semibold">{preset.channelCount} κανάλια</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom XMLTV URL & File Upload Accordion / Input Area */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Προσθήκη XMLTV EPG URLs (Μεμονωμένα ή Μαζικά)
              </span>
            </div>
            {/* Input Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setUrlInputMode('single')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  urlInputMode === 'single'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>Μεμονωμένο URL</span>
              </button>
              <button
                type="button"
                onClick={() => setUrlInputMode('bulk')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  urlInputMode === 'bulk'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Μαζική Εισαγωγή URLs</span>
              </button>
            </div>
          </div>

          {urlInputMode === 'single' ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Διεύθυνση Custom XMLTV EPG URL (.xml / .xmltv / get_epg.php)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="input-custom-epg-url"
                  type="url"
                  placeholder="π.χ. https://iptv-org.github.io/epg/guides/gr.xml (ή πολλαπλά χωρισμένα με κόμμα)"
                  value={customXmltvUrl}
                  onChange={(e) => setCustomXmltvUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchCustomXmltvUrl();
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  id="btn-test-ping-epg"
                  onClick={() => handleTestPing(customXmltvUrl)}
                  disabled={!customXmltvUrl}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Test Ping</span>
                </button>
                <button
                  id="btn-fetch-custom-epg"
                  onClick={() => handleFetchCustomXmltvUrl()}
                  disabled={!customXmltvUrl || isLoadingXmltv}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-cyan-600/20"
                >
                  {isLoadingXmltv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>+ Προσθήκη URL στην Ομάδα</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Επικόλληση Πολλαπλών XMLTV URLs (ένα ανά γραμμή ή χωρισμένα με κόμμα)
                </label>
                {bulkUrlsText.trim() && (
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {extractUrlsFromString(bulkUrlsText).length} URLs εντοπίστηκαν
                  </span>
                )}
              </div>
              <textarea
                id="textarea-bulk-epg-urls"
                rows={4}
                placeholder={`https://iptv-org.github.io/epg/guides/gr.xml\nhttps://epgshare01.online/epgshare01/epg_ripper_GR1.xml.gz\nhttp://provider.org:8080/xmltv.php?username=...&password=...`}
                value={bulkUrlsText}
                onChange={(e) => setBulkUrlsText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-y"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Υποστηρίζει πολλαπλά links, αυτόματη ανίχνευση και ενοποίηση όλων των οδηγών.
                </span>
                <button
                  id="btn-fetch-bulk-epg"
                  onClick={() => handleFetchCustomXmltvUrl(bulkUrlsText)}
                  disabled={!bulkUrlsText.trim() || isLoadingXmltv}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-cyan-600/20"
                >
                  {isLoadingXmltv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ListPlus className="w-3.5 h-3.5" />}
                  <span>+ Μαζική Προσθήκη Όλων των URLs</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick-add popular XMLTV EPG presets */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Δημοφιλείς Έτοιμες Πηγές XMLTV (Άμεση Προσθήκη):
            </span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_EPG_URLS.map((pop) => {
                const isAlreadyAdded = (epgSources || []).some(
                  (s) => s.url && s.url.trim().toLowerCase() === pop.url.trim().toLowerCase()
                );
                return (
                  <button
                    key={pop.url}
                    type="button"
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        handleFetchCustomXmltvUrl(pop.url);
                      }
                    }}
                    disabled={isAlreadyAdded || isLoadingXmltv}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-2 ${
                      isAlreadyAdded
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 opacity-80 cursor-default'
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-slate-850'
                    }`}
                    title={pop.description}
                  >
                    <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {pop.badge}
                    </span>
                    <span className="font-medium">{pop.name}</span>
                    {isAlreadyAdded ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Plus className="w-3 h-3 text-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick upload local XMLTV file */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Έχετε τοπικά αρχεία .xml ή .xmltv; Μπορείτε να ανεβάσετε πολλαπλά αρχεία:</span>
            </div>
            <label
              htmlFor="xmltv-file-upload-input"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 cursor-pointer transition font-medium self-start sm:self-auto"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Προσθήκη Αρχείου XMLTV (.xml)</span>
              <input
                id="xmltv-file-upload-input"
                type="file"
                accept=".xml,.xmltv,text/xml"
                className="hidden"
                onChange={handleXmltvFileUpload}
              />
            </label>
          </div>

          {/* XMLTV Fetch status / feedback */}
          {xmltvFetchStatus.type !== 'idle' && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                xmltvFetchStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              }`}
            >
              {xmltvFetchStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{xmltvFetchStatus.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* Ping Connection Latency Monitor */}
      {pingResult.status !== 'idle' && (
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                pingResult.status === 'testing'
                  ? 'bg-slate-800 text-slate-400'
                  : pingResult.status === 'online'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : pingResult.status === 'slow'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              <Activity className={`w-5 h-5 ${pingResult.status === 'testing' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">Έλεγχος Απόκρισης (Test Ping)</span>
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-xs">{pingResult.testedUrl}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{pingResult.details}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-center">
            {pingResult.status !== 'testing' && (
              <div className="text-right">
                <div className="text-xs text-slate-400">Χρόνος Απόκρισης</div>
                <div
                  className={`text-lg font-mono font-bold ${
                    pingResult.status === 'online'
                      ? 'text-emerald-400'
                      : pingResult.status === 'slow'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {pingResult.latencyMs} ms
                </div>
              </div>
            )}
            <button
              id="btn-retest-ping"
              onClick={() => handleTestPing(pingResult.testedUrl)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Επανάληψη δοκιμής"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      {totalChannelsLoaded > 0 && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-sm font-bold text-white">
                Έτοιμο! Αναλύθηκαν {totalChannelsLoaded} κανάλια με ενεργή πηγή EPG ({epgDatabase.length} κανάλια οδηγού).
              </span>
              <p className="text-xs text-slate-300">
                Προχωρήστε στο Βήμα 2 για να επιλέξετε τις κατηγορίες και να μειώσετε το μέγεθος της λίστας.
              </p>
            </div>
          </div>

          <button
            id="btn-proceed-step2-bottom"
            onClick={onProceedToStep2}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <span>Επόμενο: Κατηγορίες</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
