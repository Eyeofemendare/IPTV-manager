import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Save,
  Trash2,
  Copy,
  Edit3,
  Check,
  Download,
  Upload,
  Eye,
  EyeOff,
  Activity,
  Plus,
  Server,
  Globe,
  FileCode2,
  Sparkles,
  Star,
  ShieldCheck,
  AlertCircle,
  Radio,
  FileDown,
  HardDrive,
} from 'lucide-react';
import { SavedAccountProfile, SourceConfig, PingResult } from '../types';
import {
  deleteProfile,
  duplicateProfile,
  upsertProfile,
  exportProfilesJson,
  importProfilesJson,
} from '../utils/profileStorage';
import { testConnectionPing } from '../utils/xtreamHelper';

interface SavedAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProfiles: SavedAccountProfile[];
  activeProfileId: string | null;
  currentSourceConfig: SourceConfig;
  onSelectProfile: (profile: SavedAccountProfile) => void;
  onUpdateProfilesList: (profiles: SavedAccountProfile[], activeId?: string) => void;
}

export const SavedAccountsModal: React.FC<SavedAccountsModalProps> = ({
  isOpen,
  onClose,
  savedProfiles,
  activeProfileId,
  currentSourceConfig,
  onSelectProfile,
  onUpdateProfilesList,
}) => {
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Password visibility map (profileId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Ping results map (profileId -> PingResult)
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({});

  // New Profile inline form
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileNotes, setNewProfileNotes] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestPingForProfile = async (profile: SavedAccountProfile) => {
    let urlToPing = '';
    if (profile.sourceConfig.type === 'xtream') {
      urlToPing = profile.sourceConfig.xtreamServer;
    } else if (profile.sourceConfig.type === 'm3u_url') {
      urlToPing = profile.sourceConfig.m3uUrl;
    } else if (profile.sourceConfig.customEpgUrl) {
      urlToPing = profile.sourceConfig.customEpgUrl;
    }

    if (!urlToPing) return;

    setPingResults((prev) => ({
      ...prev,
      [profile.id]: { status: 'testing', latencyMs: 0, testedUrl: urlToPing },
    }));

    const result = await testConnectionPing(urlToPing);
    setPingResults((prev) => ({ ...prev, [profile.id]: result }));
  };

  const handleStartEdit = (profile: SavedAccountProfile) => {
    setEditingProfileId(profile.id);
    setEditName(profile.name);
    setEditNotes(profile.notes || '');
  };

  const handleSaveEdit = (profile: SavedAccountProfile) => {
    if (!editName.trim()) return;
    const { updatedProfiles } = upsertProfile({
      id: profile.id,
      name: editName.trim(),
      sourceConfig: profile.sourceConfig,
      notes: editNotes.trim(),
      isFavorite: profile.isFavorite,
    });
    onUpdateProfilesList(updatedProfiles);
    setEditingProfileId(null);
    showToast('Το προφίλ ενημερώθηκε επιτυχώς.');
  };

  const handleToggleFavorite = (profile: SavedAccountProfile) => {
    const { updatedProfiles } = upsertProfile({
      id: profile.id,
      name: profile.name,
      sourceConfig: profile.sourceConfig,
      notes: profile.notes,
      isFavorite: !profile.isFavorite,
    });
    onUpdateProfilesList(updatedProfiles);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Είστε βέβαιοι ότι θέλετε να διαγράψετε το προφίλ "${name}";`)) {
      const remaining = deleteProfile(id);
      onUpdateProfilesList(remaining);
      showToast(`Το προφίλ "${name}" διαγράφηκε.`);
    }
  };

  const handleDuplicate = (id: string) => {
    const { updatedProfiles, duplicated } = duplicateProfile(id);
    if (duplicated) {
      onUpdateProfilesList(updatedProfiles);
      showToast(`Δημιουργήθηκε αντίγραφο: "${duplicated.name}"`);
    }
  };

  // Save current active config as new profile
  const handleSaveCurrentAsNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const { updatedProfiles, savedProfile } = upsertProfile({
      name: newProfileName.trim(),
      sourceConfig: currentSourceConfig,
      notes: newProfileNotes.trim(),
    });

    onUpdateProfilesList(updatedProfiles, savedProfile.id);
    setShowNewProfileForm(false);
    setNewProfileName('');
    setNewProfileNotes('');
    showToast(`Ο λογαριασμός "${savedProfile.name}" αποθηκεύτηκε με επιτυχία!`);
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const jsonStr = exportProfilesJson(savedProfiles);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iptv-manager-profiles-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Το αρχείο backup των λογαριασμών κατέβηκε επιτυχώς!');
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        const result = importProfilesJson(text);
        if (result.success) {
          onUpdateProfilesList(result.updatedProfiles);
          showToast(`Εισήχθησαν επιτυχώς ${result.importedCount} λογαριασμοί!`);
        } else {
          showToast(result.errorMessage || 'Σφάλμα εισαγωγής', 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      id="saved-accounts-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="saved-accounts-modal-card"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Διαχείριση Αποθηκευμένων Λογαριασμών IPTV
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {savedProfiles.length} {savedProfiles.length === 1 ? 'προφίλ' : 'προφίλ'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Τοπική αποθήκευση συνδρομών (Xtream, M3U links, EPG) για αποφυγή επαναπληκτρολόγησης.
              </p>
            </div>
          </div>

          <button
            id="btn-close-saved-accounts-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications Toast */}
        {notification && (
          <div
            className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Privacy Note Banner */}
        <div className="bg-slate-950/40 px-5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>100% Τοπική Ασφάλεια:</strong> Όλοι οι κωδικοί και τα links αποθηκεύονται αποκλειστικά στη μνήμη του browser σας (localStorage).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition text-[11px]"
              title="Εξαγωγή όλων των λογαριασμών σε αρχείο .json"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Export Backup</span>
            </button>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition text-[11px] cursor-pointer">
              <Upload className="w-3 h-3 text-emerald-400" />
              <span>Import Backup</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportBackup}
              />
            </label>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Quick Action: Save Current Inputs as New Profile */}
          {!showNewProfileForm ? (
            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">
                  Θέλετε να αποθηκεύσετε τα τρέχοντα στοιχεία ως νέο προφίλ;
                </span>
                <span className="text-[11px] text-slate-400">
                  Τρέχουσα πηγή:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {currentSourceConfig.type === 'xtream'
                      ? `Xtream: ${currentSourceConfig.xtreamServer || 'Διακομιστής'}`
                      : currentSourceConfig.type === 'm3u_url'
                      ? 'M3U Web URL'
                      : currentSourceConfig.type === 'm3u_file'
                      ? `Αρχείο: ${currentSourceConfig.fileName || '.m3u'}`
                      : 'Demo Προφίλ'}
                  </strong>
                </span>
              </div>

              <button
                id="btn-show-new-profile-form"
                onClick={() => {
                  setNewProfileName(
                    currentSourceConfig.type === 'xtream' && currentSourceConfig.xtreamServer
                      ? `Xtream: ${currentSourceConfig.xtreamServer.replace(/^https?:\/\//, '').split(':')[0]}`
                      : 'Ο Λογαριασμός μου'
                  );
                  setShowNewProfileForm(true);
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Αποθήκευση Τρέχοντος</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSaveCurrentAsNew}
              className="bg-slate-950 border border-emerald-500/40 p-4 rounded-xl space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  <span>Αποθήκευση Τρέχουσας Συνδρομής IPTV</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewProfileForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Ακύρωση
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Όνομα Προφίλ / Συνδρομής *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="π.χ. Σαλόνι - Xtream 1 Έτος"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Σημειώσεις / Ημ. Λήξης (Προαιρετικό)
                  </label>
                  <input
                    type="text"
                    placeholder="π.χ. Λήγει 12/2026, πάροχος FastIPTV"
                    value={newProfileNotes}
                    onChange={(e) => setNewProfileNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewProfileForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
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

          {/* List of Saved Profiles */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Αποθηκευμένα Προφίλ ({savedProfiles.length})
            </label>

            {savedProfiles.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                Δεν υπάρχουν ακόμα αποθηκευμένοι λογαριασμοί. Εισάγετε τα στοιχεία σας και πατήστε "Αποθήκευση Τρέχοντος".
              </div>
            ) : (
              savedProfiles.map((profile) => {
                const isActive = activeProfileId === profile.id;
                const isEditing = editingProfileId === profile.id;
                const showPass = Boolean(visiblePasswords[profile.id]);
                const ping = pingResults[profile.id];

                return (
                  <div
                    key={profile.id}
                    id={`profile-card-${profile.id}`}
                    className={`p-4 rounded-xl border transition flex flex-col gap-3 ${
                      isActive
                        ? 'bg-slate-950 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Title, Badge, Action Buttons */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleFavorite(profile)}
                          className={`mt-0.5 text-slate-600 hover:text-amber-400 transition ${
                            profile.isFavorite ? 'text-amber-400' : ''
                          }`}
                          title={profile.isFavorite ? 'Αγαπημένο' : 'Προσθήκη στα αγαπημένα'}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>

                        <div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold"
                              />
                              <input
                                type="text"
                                placeholder="Σημειώσεις"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 w-full"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSaveEdit(profile)}
                                  className="px-2 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded"
                                >
                                  Αποθήκευση
                                </button>
                                <button
                                  onClick={() => setEditingProfileId(null)}
                                  className="text-xs text-slate-400 hover:text-white"
                                >
                                  Ακύρωση
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{profile.name}</h4>
                                {isActive && (
                                  <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    Ενεργό
                                  </span>
                                )}
                              </div>
                              {profile.notes && (
                                <p className="text-xs text-slate-400 mt-0.5">{profile.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right actions: Load, Test Ping, Duplicate, Edit, Delete */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleTestPingForProfile(profile)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                          title="Δοκιμή απόκρισης (Test Ping)"
                        >
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        <button
                          onClick={() => handleStartEdit(profile)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                          title="Επεξεργασία"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(profile.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                          title="Δημιουργία αντιγράφου"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {savedProfiles.length > 1 && (
                          <button
                            onClick={() => handleDelete(profile.id, profile.name)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 transition"
                            title="Διαγραφή"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          id={`btn-load-profile-${profile.id}`}
                          onClick={() => {
                            onSelectProfile(profile);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                          }`}
                        >
                          {isActive ? <Check className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Φορτωμένο' : 'Φόρτωση'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Details / Credentials */}
                    <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs font-mono space-y-1">
                      {profile.sourceConfig.type === 'xtream' && (
                        <>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">Server:</span>
                            <span className="text-cyan-300 truncate max-w-xs">{profile.sourceConfig.xtreamServer}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">User:</span>
                            <span className="text-white">{profile.sourceConfig.xtreamUser}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">Password:</span>
                            <div className="flex items-center gap-1.5">
                              <span>
                                {showPass ? profile.sourceConfig.xtreamPass : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(profile.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {profile.sourceConfig.type === 'm3u_url' && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">M3U URL:</span>
                          <span className="text-emerald-300 truncate max-w-xs">{profile.sourceConfig.m3uUrl}</span>
                        </div>
                      )}

                      {profile.sourceConfig.type === 'm3u_file' && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Αρχείο:</span>
                          <span className="text-emerald-300">{profile.sourceConfig.fileName || 'Τοπικό .m3u'}</span>
                        </div>
                      )}

                      {profile.sourceConfig.type === 'demo' && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Τύπος:</span>
                          <span className="text-amber-300">Προφορτωμένο Ελληνικό Πακέτο (Demo)</span>
                        </div>
                      )}

                      {/* EPG Config line */}
                      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">EPG:</span>
                        <span className="text-slate-400 truncate max-w-xs">
                          {profile.sourceConfig.epgSourceType === 'preset'
                            ? `Preset: ${profile.sourceConfig.epgPresetId}`
                            : profile.sourceConfig.customEpgUrl || profile.sourceConfig.epgUrl}
                        </span>
                      </div>
                    </div>

                    {/* Ping Result Display */}
                    {ping && ping.status !== 'idle' && (
                      <div
                        className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                          ping.status === 'online'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : ping.status === 'slow'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : ping.status === 'testing'
                            ? 'bg-slate-900 text-slate-400'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3" />
                          {ping.status === 'testing'
                            ? 'Έλεγχος σύνδεσης...'
                            : ping.details || 'Ολοκληρώθηκε'}
                        </span>
                        {ping.status !== 'testing' && (
                          <span className="font-mono font-bold">{ping.latencyMs} ms</span>
                        )}
                      </div>
                    )}

                    {/* Bottom Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Τροποποίηση: {profile.updatedAt}</span>
                      <span>ID: {profile.id.slice(0, 14)}...</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {savedProfiles.length} αποθηκευμένοι λογαριασμοί διαθέσιμοι τοπικά
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
};
