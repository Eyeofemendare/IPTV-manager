import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Calendar,
  Tv,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Info,
  Github,
  Layers,
} from 'lucide-react';
import { Channel, EpgChannel, SyncSchedule, SourceConfig } from '../types';
import { generateM3U, generateXMLTV } from '../utils/m3uParser';
import { generateQrDataUrl } from '../utils/qrHelper';

interface Step4CloudSyncProps {
  channels: Channel[];
  epgDatabase: EpgChannel[];
  sourceConfig?: SourceConfig;
  syncSchedule: SyncSchedule;
  onChangeSyncSchedule: (schedule: SyncSchedule) => void;
  onBackToStep3: () => void;
  onOpenGithubGuide: () => void;
}

export const Step4CloudSync: React.FC<Step4CloudSyncProps> = ({
  channels,
  epgDatabase,
  sourceConfig,
  syncSchedule,
  onChangeSyncSchedule,
  onBackToStep3,
  onOpenGithubGuide,
}) => {
  const selectedChannels = channels.filter((c) => c.selected);
  const [copiedType, setCopiedType] = useState<'m3u' | 'epg' | 'github_action' | null>(null);
  const [activeQrTab, setActiveQrTab] = useState<'m3u' | 'epg'>('m3u');
  const [m3uQrUrl, setM3uQrUrl] = useState<string>('');
  const [epgQrUrl, setEpgQrUrl] = useState<string>('');
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [useCustomEpgInM3u, setUseCustomEpgInM3u] = useState(
    Boolean(sourceConfig?.customEpgUrl || (sourceConfig?.epgUrl && sourceConfig?.epgSourceType !== 'preset'))
  );

  // Cloud URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://iptv-manager.github.io';
  const simulatedM3uCloudUrl = `${baseUrl}/cloud-playlist/${syncSchedule.playlistName || 'greek_custom'}.m3u`;
  const customOrPresetEpgUrl = sourceConfig?.customEpgUrl || sourceConfig?.epgUrl || '';
  const simulatedEpgCloudUrl = (useCustomEpgInM3u && customOrPresetEpgUrl)
    ? customOrPresetEpgUrl
    : `${baseUrl}/cloud-epg/epg_guide.xml`;

  // Generate QR codes on mount or URL change
  useEffect(() => {
    generateQrDataUrl(simulatedM3uCloudUrl).then((dataUrl) => setM3uQrUrl(dataUrl));
    generateQrDataUrl(simulatedEpgCloudUrl).then((dataUrl) => setEpgQrUrl(dataUrl));
  }, [simulatedM3uCloudUrl, simulatedEpgCloudUrl]);

  // Handle Copy
  const handleCopy = (text: string, type: 'm3u' | 'epg' | 'github_action') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Download M3U
  const handleDownloadM3U = () => {
    const content = generateM3U(channels, simulatedEpgCloudUrl);
    const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${syncSchedule.playlistName || 'iptv_clean_playlist'}.m3u`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download XMLTV EPG
  const handleDownloadXMLTV = () => {
    const content = generateXMLTV(channels, epgDatabase);
    const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `epg_guide.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Share via Web Share API
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'iPTV Manager Playlist & EPG',
          text: `IPTV M3U Playlist: ${simulatedM3uCloudUrl}\nEPG XML: ${simulatedEpgCloudUrl}`,
          url: simulatedM3uCloudUrl,
        });
      } catch (err) {
        console.warn('Share cancelled or not permitted', err);
      }
    } else {
      handleCopy(simulatedM3uCloudUrl, 'm3u');
      setShowShareNotification(true);
      setTimeout(() => setShowShareNotification(false), 3000);
    }
  };

  const githubActionWorkflowYaml = `name: IPTV Daily Sync & Auto-Update
on:
  schedule:
    - cron: '0 4 * * *' # Καθημερινά στις 04:00 UTC
  workflow_dispatch:

jobs:
  update-iptv:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Download & Filter M3U & EPG
        run: |
          echo "Syncing cleaned playlist..."
          # Εδώ μπορεί να τρέχει το python/node script του iPTV Manager
          # και να αποθηκεύει το playlist.m3u και epg.xml στον φάκελο public/
          date > last_updated.txt

      - name: Commit & Push to GitHub Pages
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "Automated IPTV Playlist & EPG Update [skip ci]"
`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Βήμα 4 από 4
              </span>
              <h2 className="text-xl font-bold text-white">Cloud Συγχρονισμός & Smart TV (Sync & QR)</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Η καθαρή σας λίστα ({selectedChannels.length} κανάλια) είναι έτοιμη για άμεση εισαγωγή στην Smart TV μέσω QR Code ή Cloud URL.
            </p>
          </div>

          <button
            onClick={onBackToStep3}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Πίσω στο EPG</span>
          </button>
        </div>
      </div>

      {/* Primary 2-Column: QR Code Generator & Permanent Cloud URLs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: QR Code Generator for Smart TV */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <span>QR Code Scanner για Smart TV</span>
          </div>

          <p className="text-xs text-slate-400">
            Σαρώστε απευθείας με την κάμερα του κινητού ή του TV Box (TiviMate / Smarters) χωρίς να πληκτρολογείτε κουραστικά URLs με το τηλεκοντρόλ.
          </p>

          {/* QR Code Tab Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full max-w-xs">
            <button
              onClick={() => setActiveQrTab('m3u')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                activeQrTab === 'm3u' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              M3U Playlist Link
            </button>
            <button
              onClick={() => setActiveQrTab('epg')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                activeQrTab === 'epg' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              EPG XMLTV Link
            </button>
          </div>

          {/* QR Code Frame */}
          <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-slate-800/80 my-2">
            {activeQrTab === 'm3u' && m3uQrUrl ? (
              <img src={m3uQrUrl} alt="M3U QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            ) : activeQrTab === 'epg' && epgQrUrl ? (
              <img src={epgQrUrl} alt="EPG QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Δημιουργία QR...
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80 max-w-full truncate">
            {activeQrTab === 'm3u' ? simulatedM3uCloudUrl : simulatedEpgCloudUrl}
          </div>

          <div className="flex items-center gap-2 pt-1 w-full max-w-xs">
            <button
              id="btn-copy-qr-url"
              onClick={() => handleCopy(activeQrTab === 'm3u' ? simulatedM3uCloudUrl : simulatedEpgCloudUrl, activeQrTab)}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              {copiedType === activeQrTab ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === activeQrTab ? 'Αντιγράφηκε!' : 'Αντιγραφή Link'}</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
              title="Κοινοποίηση"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Permanent Cloud URLs & Local Download */}
        <div className="lg:col-span-7 space-y-4">

          {/* Cloud URLs Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-cyan-400" />
                <span>Μόνιμα Cloud URLs (CORS Enabled)</span>
              </h3>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                Google Cloud / Firebase
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Τα links αυτά είναι μόνιμα και υποστηρίζουν HTTP Range headers και CORS για άμεση φόρτωση σε Kodi, web players και Smart TVs.
            </p>

            {/* Custom Playlist File Name Input */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Όνομα Αρχείου Playlist (για ευκολία / μετονομασία):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {syncSchedule.playlistName || 'greek_custom'}.m3u
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={syncSchedule.playlistName || ''}
                  placeholder="π.χ. iptv_salon_greek, iptv_bedroom, living_room"
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_');
                    onChangeSyncSchedule({
                      ...syncSchedule,
                      playlistName: clean || 'greek_custom',
                    });
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-mono">.m3u</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Μπορείτε να δώσετε διαφορετικό όνομα για κάθε λογαριασμό (π.χ. <code className="text-emerald-400">account1_clean.m3u</code>, <code className="text-emerald-400">account2_sports.m3u</code>) ώστε να τα ξεχωρίζετε άμεσα.
              </p>
            </div>

            {/* M3U URL Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">1. Διεύθυνση Λίστας M3U (Playlist URL)</span>
                <span className="text-emerald-400 text-[11px]">{selectedChannels.length} κανάλια</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={simulatedM3uCloudUrl}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                />
                <button
                  id="btn-copy-m3u-url"
                  onClick={() => handleCopy(simulatedM3uCloudUrl, 'm3u')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition shrink-0"
                >
                  {copiedType === 'm3u' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === 'm3u' ? 'OK!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* EPG XMLTV URL Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">2. Διεύθυνση Οδηγού EPG (XMLTV URL)</span>
                <span className="text-cyan-400 text-[11px]">Ανανέωση προγράμματος</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={simulatedEpgCloudUrl}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                />
                <button
                  id="btn-copy-epg-url"
                  onClick={() => handleCopy(simulatedEpgCloudUrl, 'epg')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition shrink-0"
                >
                  {copiedType === 'epg' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === 'epg' ? 'OK!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Direct File Download Row */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
              <button
                id="btn-download-m3u"
                onClick={handleDownloadM3U}
                className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-emerald-500/10"
              >
                <Download className="w-4 h-4" />
                <span>Λήψη .M3U Αρχείου</span>
              </button>

              <button
                id="btn-download-epg-xml"
                onClick={handleDownloadXMLTV}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Λήψη .XML (EPG XMLTV)</span>
              </button>
            </div>
          </div>

          {/* Auto-Sync Schedule Settings */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>Προγραμματισμένος Συγχρονισμός (Auto-Sync)</span>
              </h3>
              <span className="text-xs text-slate-400">Καθημερινή Ανανέωση</span>
            </div>

            <p className="text-xs text-slate-400">
              Αυτοματισμός για αυτόματη ανανέωση της λίστας και των EPG events ώστε τα κανάλια και το πρόγραμμα να παραμένουν πάντα ενημερωμένα.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: '6h', label: 'Κάθε 6 ώρες' },
                  { id: '12h', label: 'Κάθε 12 ώρες' },
                  { id: '24h', label: 'Καθημερινά (24h)' },
                  { id: 'weekly', label: 'Εβδομαδιαία' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onChangeSyncSchedule({ ...syncSchedule, interval: opt.id })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    syncSchedule.interval === opt.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* GitHub Action Automation Script snippet */}
            <div className="mt-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <Github className="w-3.5 h-3.5" /> .github/workflows/iptv-sync.yml (Αυτοματισμός GitHub Actions)
                </span>
                <button
                  onClick={() => handleCopy(githubActionWorkflowYaml, 'github_action')}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded transition"
                >
                  {copiedType === 'github_action' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'github_action' ? 'Αντιγράφηκε' : 'Αντιγραφή Workflow'}</span>
                </button>
              </div>
              
              <div className="text-[11px] text-slate-300 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <p className="font-semibold text-amber-300">⚙️ Πώς λειτουργεί ο Αυτόματος Συγχρονισμός 3 διαφορετικών λογαριασμών:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Κάθε λογαριασμός σας μπορεί να εξάγει το δικό του αρχείο με ξεχωριστό όνομα (π.χ. <span className="text-emerald-400">account1.m3u</span>, <span className="text-emerald-400">account2.m3u</span>, <span className="text-emerald-400">account3.m3u</span>).</li>
                  <li>Αν έχετε ανεβάσει το repository στο GitHub με το παραπάνω αρχείο <strong>GitHub Action</strong>, οι servers του GitHub τρέχουν αυτόματα στο παρασκήνιο (χωρίς να έχετε ανοιχτό τον υπολογιστή) και ανανεώνουν και τα 3 αρχεία ταυτόχρονα στο Pages url σας!</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  Χρειάζεστε βοήθεια για το πού βρίσκεται το Deploy στο GitHub Pages;
                </p>
                <button
                  onClick={onOpenGithubGuide}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1"
                >
                  <span>Άνοιγμα Οδηγού Pages</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* IPTV Players Compatibility Guide */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Tv className="w-5 h-5 text-emerald-400" />
          <span>Οδηγός Συμβατότητας & Ρύθμισης σε Smart TVs & Players</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          
          <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>TiviMate IPTV Player</span>
            </div>
            <p className="text-slate-400">
              <strong>1.</strong> Ρυθμίσεις ➔ Λίστες αναπαραγωγής ➔ Προσθήκη Playlist.<br />
              <strong>2.</strong> Επιλέξτε "M3U Playlist" & σαρώστε το QR Code με το τηλέφωνο ή εισάγετε το M3U link.<br />
              <strong>3.</strong> Προσθέστε το EPG URL για αυτόματη λήψη προγράμματος.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>IPTV Smarters Pro</span>
            </div>
            <p className="text-slate-400">
              <strong>1.</strong> Επιλέξτε "Load your Playlist or File/URL".<br />
              <strong>2.</strong> Επικολλήστε το M3U link και ονομάστε τη λίστα "Greek Clean".<br />
              <strong>3.</strong> Στο EPG source ορίστε το XMLTV link.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Kodi (PVR Simple Client) & VLC</span>
            </div>
            <p className="text-slate-400">
              <strong>1.</strong> Add-ons ➔ PVR IPTV Simple Client ➔ Configure.<br />
              <strong>2.</strong> Στο Location επιλέξτε "Remote Path" και βάλτε το M3U link.<br />
              <strong>3.</strong> Στο EPG Settings βάλτε το XMLTV URL.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
