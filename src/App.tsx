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
import { Channel, EpgChannel, SourceConfig, SyncSchedule } from './types';
import { INITIAL_DEMO_CHANNELS } from './data/demoData';
import { EPG_PRESETS, GREEK_EPG_DATABASE, getPresetChannels } from './data/epgPresets';
import { parseXMLTV } from './utils/xmltvParser';
import { parseM3U } from './utils/m3uParser';
import { runAutoMatchOnChannels } from './utils/epgMatcher';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [channels, setChannels] = useState<Channel[]>(INITIAL_DEMO_CHANNELS);
  const [epgDatabase, setEpgDatabase] = useState<EpgChannel[]>(GREEK_EPG_DATABASE);

  const [sourceConfig, setSourceConfig] = useState<SourceConfig>({
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

  // Switch EPG Preset (Greek, International, All-in-One, etc.)
  const handleSelectEpgPreset = (presetId: string) => {
    const preset = EPG_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const channelsForPreset = getPresetChannels(presetId);
    setEpgDatabase(channelsForPreset);
    setSourceConfig((prev) => ({
      ...prev,
      epgSourceType: 'preset',
      epgPresetId: presetId,
      epgUrl: preset.url,
      epgLoadedAt: new Date().toLocaleTimeString('el-GR'),
    }));
    // Re-run auto match with the newly selected EPG database
    setChannels((prev) => runAutoMatchOnChannels(prev, channelsForPreset));
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
    const finalEpgDb = parsed.length > 0 ? parsed : epgDatabase;
    if (parsed.length > 0) {
      setEpgDatabase(parsed);
    }
    setSourceConfig((prev) => ({
      ...prev,
      epgSourceType: customUrl ? 'custom_url' : 'custom_file',
      customEpgUrl: customUrl || prev.customEpgUrl,
      epgUrl: customUrl || prev.epgUrl,
      epgFileName: customUrl ? undefined : sourceName,
      epgLoadedAt: new Date().toLocaleTimeString('el-GR'),
    }));
    if (parsed.length > 0) {
      setChannels((prev) => runAutoMatchOnChannels(prev, finalEpgDb));
    }
  };

  // Reset to initial demo profile
  const handleResetToDemo = () => {
    setChannels(INITIAL_DEMO_CHANNELS);
    setEpgDatabase(GREEK_EPG_DATABASE);
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
    });
    setCurrentStep(1);
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
