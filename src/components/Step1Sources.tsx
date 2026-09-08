import React, { useState } from 'react';
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
} from 'lucide-react';
import { SourceConfig, PingResult, EpgChannel } from '../types';
import { testConnectionPing, buildXtreamM3uUrl, buildXtreamEpgUrl } from '../utils/xtreamHelper';
import { EPG_PRESETS } from '../data/epgPresets';
import { parseXMLTV } from '../utils/xmltvParser';

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
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'm3u_url' | 'm3u_file' | 'xtream'>(sourceConfig.type);
  const [pingResult, setPingResult] = useState<PingResult>({
    status: 'idle',
    latencyMs: 0,
    testedUrl: '',
  });
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);

  // Custom XMLTV states
  const [customXmltvUrl, setCustomXmltvUrl] = useState<string>(
    sourceConfig.customEpgUrl || (sourceConfig.epgSourceType === 'custom_url' ? sourceConfig.epgUrl : '')
  );
  const [isLoadingXmltv, setIsLoadingXmltv] = useState(false);
  const [xmltvFetchStatus, setXmltvFetchStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

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
            onLoadCustomXmltv(xmlString, file.name);
            onChangeSourceConfig({
              ...sourceConfig,
              epgSourceType: 'custom_file',
              epgFileName: file.name,
              epgLoadedAt: new Date().toLocaleTimeString('el-GR'),
            });
            setXmltvFetchStatus({
              type: 'success',
              message: `Επιτυχής ανάλυση ${parsed.length} καναλιών EPG από το αρχείο ${file.name}!`,
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
  };

  // Handle M3U URL Fetch
  const handleFetchM3uUrl = async () => {
    if (!sourceConfig.m3uUrl) return;
    setIsLoadingUrl(true);
    setUrlFetchError(null);

    try {
      handleTestPing(sourceConfig.m3uUrl);
      const response = await fetch(sourceConfig.m3uUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      onLoadM3uContent(text, sourceConfig.m3uUrl);
      onChangeSourceConfig({
        ...sourceConfig,
        type: 'm3u_url',
        loadedAt: new Date().toLocaleTimeString('el-GR'),
      });
    } catch (err: any) {
      console.warn('URL direct fetch restricted by CORS or network', err);
      setUrlFetchError(
        'Η απευθείας ανάκτηση από τον browser περιορίζεται από πολιτική CORS του παρόχου. Μπορείτε να κάνετε λήψη του .m3u αρχείου και να το σύρετε στην καρτέλα "Τοπικό Αρχείο", ή να δοκιμάσετε το Demo Προφίλ.'
      );
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle Fetch Custom XMLTV EPG URL
  const handleFetchCustomXmltvUrl = async () => {
    if (!customXmltvUrl) return;
    setIsLoadingXmltv(true);
    setXmltvFetchStatus({ type: 'idle', message: '' });

    try {
      handleTestPing(customXmltvUrl);

      const response = await fetch(customXmltvUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const xmlString = await response.text();
      const parsed = parseXMLTV(xmlString);

      if (parsed.length > 0) {
        onLoadCustomXmltv(xmlString, customXmltvUrl, customXmltvUrl);
        onChangeSourceConfig({
          ...sourceConfig,
          epgUrl: customXmltvUrl,
          customEpgUrl: customXmltvUrl,
          epgSourceType: 'custom_url',
          epgLoadedAt: new Date().toLocaleTimeString('el-GR'),
        });
        setXmltvFetchStatus({
          type: 'success',
          message: `Επιτυχής ανάκτηση & ανάλυση ${parsed.length} καναλιών EPG από το XMLTV URL!`,
        });
      } else {
        // Fallback: Still set URL for cloud export and provide diagnostic
        onChangeSourceConfig({
          ...sourceConfig,
          epgUrl: customXmltvUrl,
          customEpgUrl: customXmltvUrl,
          epgSourceType: 'custom_url',
          epgLoadedAt: new Date().toLocaleTimeString('el-GR'),
        });
        setXmltvFetchStatus({
          type: 'success',
          message: `Το XMLTV URL αποθηκεύτηκε επιτυχώς για εξαγωγή (${customXmltvUrl}).`,
        });
      }
    } catch (err: any) {
      console.warn('CORS or network restriction on XMLTV fetch', err);
      // Even if CORS limits direct in-browser download of the XMLTV file, we save the URL for export M3U
      onChangeSourceConfig({
        ...sourceConfig,
        epgUrl: customXmltvUrl,
        customEpgUrl: customXmltvUrl,
        epgSourceType: 'custom_url',
        epgLoadedAt: new Date().toLocaleTimeString('el-GR'),
      });
      setXmltvFetchStatus({
        type: 'error',
        message:
          'Η απευθείας ανάκτηση XMLTV περιορίστηκε από CORS του παρόχου. Το URL ορίστηκε επιτυχώς για τη λίστα M3U. Για άμεση αντιστοίχιση στον browser, μπορείτε να κάνετε λήψη του .xml/.xmltv αρχείου και να το ανεβάσετε στο "Τοπικό Αρχείο XMLTV", ή να χρησιμοποιήσετε τα προφορτωμένα Ελληνικά & Διεθνή presets.',
      });
    } finally {
      setIsLoadingXmltv(false);
    }
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
              </div>
            </div>

            {urlFetchError && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>{urlFetchError}</div>
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
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: XMLTV EPG SOURCE & PRESETS (REQUESTED BY USER) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">
                Οδηγός Προγράμματος EPG (XMLTV Source & Presets)
              </h3>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Επιλέξτε προφορτωμένο EPG preset (Ελληνικό, Διεθνές) ή εισάγετε Custom XMLTV URL για αυτόματη ή χειροκίνητη αντιστοίχιση καναλιών.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300">
              Ενεργή Βάση: <strong className="text-emerald-400">{epgDatabase.length} κανάλια EPG</strong>
            </span>
          </div>
        </div>

        {/* EPG Preset Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EPG_PRESETS.filter((p) => p.id !== 'custom_url').map((preset) => {
            const isSelected =
              sourceConfig.epgSourceType === 'preset' && sourceConfig.epgPresetId === preset.id;

            return (
              <div
                key={preset.id}
                id={`epg-preset-${preset.id}`}
                onClick={() => onSelectEpgPreset(preset.id)}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between text-left group ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {preset.badge}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Επιλεγμένο
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

        {/* Custom XMLTV URL & File Upload Accordion / Input Area */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Προσθήκη Custom XMLTV URL ή Αρχείου EPG</span>
            </span>
            {sourceConfig.epgSourceType === 'custom_url' && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Ενεργό Custom URL
              </span>
            )}
            {sourceConfig.epgSourceType === 'custom_file' && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Ενεργό Τοπικό Αρχείο: {sourceConfig.epgFileName}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Διεύθυνση Custom XMLTV EPG URL (.xml / .xmltv / get_epg.php)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="input-custom-epg-url"
                type="url"
                placeholder="π.χ. https://iptv-org.github.io/epg/guides/gr.xml ή http://provider:8080/xmltv.php"
                value={customXmltvUrl}
                onChange={(e) => setCustomXmltvUrl(e.target.value)}
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
                onClick={handleFetchCustomXmltvUrl}
                disabled={!customXmltvUrl || isLoadingXmltv}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-cyan-600/20"
              >
                {isLoadingXmltv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                <span>Φόρτωση & Ανάλυση EPG</span>
              </button>
            </div>
          </div>

          {/* Quick upload local XMLTV file */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Έχετε τοπικό αρχείο .xml ή .xmltv; Μπορείτε να το ανεβάσετε απευθείας:</span>
            </div>
            <label
              htmlFor="xmltv-file-upload-input"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 cursor-pointer transition font-medium self-start sm:self-auto"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Επιλογή Αρχείου XMLTV (.xml)</span>
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
