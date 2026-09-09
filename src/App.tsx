/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WizardSteps } from './components/WizardSteps';
import { Step1Sources } from './components/Step1Sources';
import { Step2Filters } from './components/Step2Filters';
import { Step3EpgMapper } from './components/Step3EpgMapper';
import { Step4CloudSync } from './components/Step4CloudSync';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ManualEpgModal } from './components/ManualEpgModal';
import { GithubHostingModal } from './components/GithubHostingModal';
import { SavedAccountsModal } from './components/SavedAccountsModal';
import { Channel, EpgChannel, SourceConfig, SyncSchedule, SavedAccountProfile, EpgSourceItem } from './types';
import { INITIAL_DEMO_CHANNELS } from './data/demoData';
import { EPG_PRESETS, GREEK_EPG_DATABASE, getPresetChannels } from './data/epgPresets';
import { parseXMLTV } from './utils/xmltvParser';
import { parseM3U } from './utils/m3uParser';
import { runAutoMatchOnChannels } from './utils/epgMatcher';
import { getSavedProfiles, upsertProfile, getActiveProfileId, setActiveProfileId } from './utils/profileStorage';
import {
  createDefaultEpgSources,
  mergeEpgSources,
  buildEffectiveEpgUrl,
  addOrTogglePresetSource,
  addUrlEpgSource,
  addFileEpgSource,
  toggleEpgSource,
  removeEpgSource,
} from './utils/epgSourcesHelper';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [channels, setChannels] = useState<Channel[]>(INITIAL_DEMO_CHANNELS);

  // Saved Account Profiles (Local Storage)
  const [savedProfiles, setSavedProfiles] = useState<SavedAccountProfile[]>(() => getSavedProfiles());
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    const active = getActiveProfileId();
    if (active) return active;
    const initial = getSavedProfiles();
    return initial[0]?.id || null;
  });
  const [isSavedAccountsModalOpen, setIsSavedAccountsModalOpen] = useState<boolean>(false);

  const [sourceConfig, setSourceConfig] = useState<SourceConfig>(() => {
    const initialProfiles = getSavedProfiles();
    const activeId = getActiveProfileId();
    const matched = initialProfiles.find((p) => p.id === activeId) || initialProfiles[0];
    const defaultSources = createDefaultEpgSources();

    if (matched && matched.sourceConfig) {
      return {
        ...matched.sourceConfig,
        epgSources:
          matched.sourceConfig.epgSources && matched.sourceConfig.epgSources.length > 0
            ? matched.sourceConfig.epgSources
            : defaultSources,
      };
    }
    return {
      type: 'demo',
      m3uUrl: '',
      xtreamServer: '',
      xtreamUser: '',
      xtreamPass: '',
      epgUrl: 'https://iptv-manager.cloud/epg/greece.xml',
      customEpgUrl: '',
      epgPresetId: 'greek_default',
      epgSourceType: 'preset',
      loadedAt: 'Προεπιλεγμένο Demo',
      epgSources: defaultSources,
    };
  });

  const [epgDatabase, setEpgDatabase] = useState<EpgChannel[]>(() => {
    return mergeEpgSources(sourceConfig.epgSources || createDefaultEpgSources());
  });

  const [syncSchedule, setSyncSchedule] = useState<SyncSchedule>({
    interval: '24h',
    destination: 'github',
    autoRefresh: true,
    playlistName: 'greek_smart_tv',
  });

  const [previewChannel, setPreviewChannel] = useState<Channel | null>(null);
  const [manualMappingChannel, setManualMappingChannel] = useState<Channel | null>(null);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState<boolean>(false);

  // Multi-EPG synchronizer: merges sources and updates EPG database + auto-match
  const updateSourcesAndEpg = (newSources: EpgSourceItem[]) => {
    const mergedDb = mergeEpgSources(newSources);
    const effectiveUrl = buildEffectiveEpgUrl(newSources);

    setEpgDatabase(mergedDb);
    setSourceConfig((prev) => ({
      ...prev,
      epgSources: newSources,
      epgUrl: effectiveUrl,
      epgLoadedAt: new Date().toLocaleTimeString('el-GR'),
    }));

    if (mergedDb.length > 0) {
      setChannels((prev) => runAutoMatchOnChannels(prev, mergedDb));
    }
  };

  const handleToggleEpgSource = (sourceId: string) => {
    const current = sourceConfig.epgSources && sourceConfig.epgSources.length > 0
      ? sourceConfig.epgSources
      : createDefaultEpgSources();
    const updated = toggleEpgSource(current, sourceId);
    updateSourcesAndEpg(updated);
  };

  const handleRemoveEpgSource = (sourceId: string) => {
    const current = sourceConfig.epgSources && sourceConfig.epgSources.length > 0
      ? sourceConfig.epgSources
      : createDefaultEpgSources();
    const updated = removeEpgSource(current, sourceId);
    updateSourcesAndEpg(updated);
  };

  const handleAddOrTogglePreset = (presetId: string) => {
    const current = sourceConfig.epgSources && sourceConfig.epgSources.length > 0
      ? sourceConfig.epgSources
      : createDefaultEpgSources();
    const updated = addOrTogglePresetSource(current, presetId);
    updateSourcesAndEpg(updated);
  };

  const handleAddUrlSource = (url: string, name: string, parsedChannels: EpgChannel[]) => {
    const current = sourceConfig.epgSources && sourceConfig.epgSources.length > 0
      ? sourceConfig.epgSources
      : createDefaultEpgSources();
    const updated = addUrlEpgSource(current, url, name, parsedChannels);
    updateSourcesAndEpg(updated);
  };

  const handleAddFileSource = (fileName: string, parsedChannels: EpgChannel[]) => {
    const current = sourceConfig.epgSources && sourceConfig.epgSources.length > 0
      ? sourceConfig.epgSources
      : createDefaultEpgSources();
    const updated = addFileEpgSource(current, fileName, parsedChannels);
    updateSourcesAndEpg(updated);
  };

  // Load custom M3U text (from URL or file)
  const handleLoadM3uContent = (content: string, sourceName: string) => {
    try {
      const parsedChannels = parseM3U(content);
      if (parsedChannels.length > 0) {
        // Run auto-match against active EPG DB
        const matched = runAutoMatchOnChannels(parsedChannels, epgDatabase);
        setChannels(matched);
        setCurrentStep(2); // Automatically advance to Step 2: Filters
      }
    } catch (err) {
      console.error('Failed to parse M3U content', err);
    }
  };

  // Switch/Toggle EPG Preset
  const handleSelectEpgPreset = (presetId: string) => {
    handleAddOrTogglePreset(presetId);
  };

  // Load Custom XMLTV EPG from URL or file
  const handleLoadCustomXmltv = (xmlContent: string, sourceName: string, customUrl?: string) => {
    let parsed: EpgChannel[] = [];
    if (xmlContent) {
      try {
        parsed = parseXMLTV(xmlContent);
      } catch (err) {
        console.warn('XMLTV parse failed', err);
      }
    }
    if (customUrl) {
      handleAddUrlSource(customUrl, `XMLTV: ${customUrl}`, parsed);
    } else {
      handleAddFileSource(sourceName, parsed);
    }
  };

  // Reset to initial demo profile
  const handleResetToDemo = () => {
    const defaultSources = createDefaultEpgSources();
    setChannels(INITIAL_DEMO_CHANNELS);
    setEpgDatabase(mergeEpgSources(defaultSources));
    setSourceConfig({
      type: 'demo',
      m3uUrl: '',
      xtreamServer: '',
      xtreamUser: '',
      xtreamPass: '',
      epgUrl: 'https://iptv-manager.cloud/epg/greece.xml',
      customEpgUrl: '',
      epgPresetId: 'greek_default',
      epgSourceType: 'preset',
      loadedAt: 'Demo Ελληνικό Πακέτο',
      epgSources: defaultSources,
    });
    setCurrentStep(1);
  };

  // Select saved profile
  const handleSelectProfile = (profile: SavedAccountProfile) => {
    setSourceConfig(profile.sourceConfig);
    setActiveProfileIdState(profile.id);
    setActiveProfileId(profile.id);

    // If profile has multi-EPG sources, merge them
    if (profile.sourceConfig.epgSources && profile.sourceConfig.epgSources.length > 0) {
      setEpgDatabase(mergeEpgSources(profile.sourceConfig.epgSources));
    } else if (profile.sourceConfig.epgSourceType === 'preset' && profile.sourceConfig.epgPresetId) {
      const channelsForPreset = getPresetChannels(profile.sourceConfig.epgPresetId);
      setEpgDatabase(channelsForPreset);
    }

    // If demo profile, restore demo channels
    if (profile.sourceConfig.type === 'demo') {
      setChannels(INITIAL_DEMO_CHANNELS);
    }
  };

  // Save current config as profile
  const handleSaveCurrentAsProfile = (name: string, notes?: string) => {
    const { updatedProfiles, savedProfile } = upsertProfile({
      name,
      sourceConfig,
      notes,
    });
    setSavedProfiles(updatedProfiles);
    setActiveProfileIdState(savedProfile.id);
  };

  // Update profiles list from modal
  const handleUpdateProfilesList = (updated: SavedAccountProfile[], activeId?: string) => {
    setSavedProfiles(updated);
    if (activeId) {
      setActiveProfileIdState(activeId);
      const matched = updated.find((p) => p.id === activeId);
      if (matched) {
        setSourceConfig(matched.sourceConfig);
      }
    }
  };

  // Toggle group selection
  const handleToggleGroup = (groupName: string, selectAll: boolean) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.group === groupName) {
          return { ...ch, selected: selectAll };
        }
        return ch;
      })
    );
  };

  // Toggle single channel
  const handleToggleChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, selected: !ch.selected } : ch))
    );
  };

  // Select Greek only
  const handleSelectGreekOnly = () => {
    setChannels((prev) =>
      prev.map((ch) => {
        const isGreek =
          ch.country === 'GR' ||
          ch.country === 'CY' ||
          ch.group.toLowerCase().includes('greek') ||
          ch.group.toLowerCase().includes('cyprus');
        return { ...ch, selected: isGreek };
      })
    );
  };

  // Select All or Deselect All
  const handleSelectAll = (select: boolean) => {
    setChannels((prev) => prev.map((ch) => ({ ...ch, selected: select })));
  };

  // Select Sports and Cinema
  const handleSelectSportsAndCinema = () => {
    setChannels((prev) =>
      prev.map((ch) => {
        const isSportsOrCinema =
          ch.group.toLowerCase().includes('sport') ||
          ch.group.toLowerCase().includes('cinema') ||
          ch.group.toLowerCase().includes('movie');
        return { ...ch, selected: isSportsOrCinema };
      })
    );
  };

  // Run Smart Auto Match on selected channels
  const handleRunAutoMatch = () => {
    setChannels((prev) => runAutoMatchOnChannels(prev, epgDatabase));
  };

  // Save manual EPG mapping
  const handleSaveManualMapping = (channelId: string, epgId: string, epgName: string, iconUrl?: string) => {
    const epgItem = epgDatabase.find((e) => e.id === epgId);

    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === channelId) {
          return {
            ...ch,
            epgId,
            epgName,
            matchType: 'manual',
            matchConfidence: 100,
            logoUrl: iconUrl || ch.logoUrl || epgItem?.iconUrl,
            currentShow: epgItem?.currentShow || ch.currentShow,
            nextShow: epgItem?.nextShow || ch.nextShow,
          };
        }
        return ch;
      })
    );
  };

  const selectedCount = channels.filter((c) => c.selected).length;
  const mappedCount = channels.filter((c) => c.selected && (c.epgId || c.tvgId)).length;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navigation */}
      <Navbar
        channels={channels}
        savedProfiles={savedProfiles}
        activeProfileId={activeProfileId}
        onOpenSavedAccounts={() => setIsSavedAccountsModalOpen(true)}
        onResetToDemo={handleResetToDemo}
        onOpenGithubGuide={() => setIsGithubModalOpen(true)}
      />

      {/* 4-Step Interactive Wizard Bar */}
      <WizardSteps
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        channelCount={channels.length}
        selectedCount={selectedCount}
        mappedCount={mappedCount}
      />

      {/* Main Wizard Step Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentStep === 1 && (
          <Step1Sources
            sourceConfig={sourceConfig}
            onChangeSourceConfig={setSourceConfig}
            onLoadM3uContent={handleLoadM3uContent}
            onLoadDemoProfile={handleResetToDemo}
            onProceedToStep2={() => setCurrentStep(2)}
            totalChannelsLoaded={channels.length}
            epgDatabase={epgDatabase}
            onSelectEpgPreset={handleSelectEpgPreset}
            onLoadCustomXmltv={handleLoadCustomXmltv}
            savedProfiles={savedProfiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            onOpenSavedAccountsModal={() => setIsSavedAccountsModalOpen(true)}
            onSaveCurrentAsProfile={handleSaveCurrentAsProfile}
            epgSources={sourceConfig.epgSources || []}
            onToggleEpgSource={handleToggleEpgSource}
            onRemoveEpgSource={handleRemoveEpgSource}
            onAddOrTogglePreset={handleAddOrTogglePreset}
            onAddUrlSource={handleAddUrlSource}
            onAddFileSource={handleAddFileSource}
          />
        )}

        {currentStep === 2 && (
          <Step2Filters
            channels={channels}
            onToggleGroup={handleToggleGroup}
            onToggleChannel={handleToggleChannel}
            onSelectGreekOnly={handleSelectGreekOnly}
            onSelectAll={handleSelectAll}
            onSelectSportsAndCinema={handleSelectSportsAndCinema}
            onProceedToStep3={() => setCurrentStep(3)}
            onBackToStep1={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3EpgMapper
            channels={channels}
            epgDatabase={epgDatabase}
            sourceConfig={sourceConfig}
            onRunAutoMatch={handleRunAutoMatch}
            onSelectEpgPreset={handleSelectEpgPreset}
            onLoadCustomXmltv={handleLoadCustomXmltv}
            onOpenManualMapping={(ch) => setManualMappingChannel(ch)}
            onPreviewStream={(ch) => setPreviewChannel(ch)}
            onProceedToStep4={() => setCurrentStep(4)}
            onBackToStep2={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4CloudSync
            channels={channels}
            epgDatabase={epgDatabase}
            sourceConfig={sourceConfig}
            syncSchedule={syncSchedule}
            onChangeSyncSchedule={setSyncSchedule}
            onBackToStep3={() => setCurrentStep(3)}
            onOpenGithubGuide={() => setIsGithubModalOpen(true)}
          />
        )}
      </main>

      {/* Stream Preview Modal */}
      {previewChannel && (
        <VideoPlayerModal
          channel={previewChannel}
          onClose={() => setPreviewChannel(null)}
        />
      )}

      {/* Manual EPG Mapping Modal */}
      {manualMappingChannel && (
        <ManualEpgModal
          channel={manualMappingChannel}
          epgDatabase={epgDatabase}
          onClose={() => setManualMappingChannel(null)}
          onSaveMapping={handleSaveManualMapping}
        />
      )}

      {/* GitHub Pages Hosting Guide Modal */}
      <GithubHostingModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />

      {/* Saved Accounts & Profiles Management Modal */}
      <SavedAccountsModal
        isOpen={isSavedAccountsModalOpen}
        onClose={() => setIsSavedAccountsModalOpen(false)}
        savedProfiles={savedProfiles}
        activeProfileId={activeProfileId}
        currentSourceConfig={sourceConfig}
        onSelectProfile={handleSelectProfile}
        onUpdateProfilesList={handleUpdateProfilesList}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">iPTV Manager</span>
            <span>•</span>
            <span>Συμβατό με TiviMate, IPTV Smarters, Kodi, OTT Navigator, Smart TVs</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGithubModalOpen(true)}
              className="text-slate-400 hover:text-emerald-400 transition"
            >
              Φιλοξενία στο GitHub
            </button>
            <span>•</span>
            <span className="text-slate-500">Client-Side Streaming & Offline Ready</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
