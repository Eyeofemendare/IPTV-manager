import { EpgChannel, EpgSourceItem } from '../types';
import { EPG_PRESETS, getPresetChannels, GREEK_EPG_DATABASE } from '../data/epgPresets';

function getSafeHostname(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.hostname || urlStr;
  } catch {
    return urlStr;
  }
}

/**
 * Extract clean URLs from a string containing one or multiple URLs
 * separated by commas, semicolons, or newlines.
 */
export function extractUrlsFromString(input: string): string[] {
  if (!input || !input.trim()) return [];
  return input
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http://') || s.startsWith('https://'));
}

export function createDefaultEpgSources(): EpgSourceItem[] {
  const greekChannels = getPresetChannels('greek_full');
  return [
    {
      id: 'preset-greek_full',
      name: 'Ελληνικό Πακέτο (Greek & Cyprus EPG)',
      type: 'preset',
      presetId: 'greek_full',
      url: 'https://iptv-manager.cloud/epg/greece.xml',
      channelCount: greekChannels.length,
      enabled: true,
      loadedAt: 'Προεπιλεγμένο',
      channels: greekChannels,
    },
  ];
}

/**
 * Merge multiple EPG sources into a single unified EPG database.
 * Channels are keyed by channel id; duplicates keep the first enabled source's metadata
 * but preserve full programme coverage.
 */
export function mergeEpgSources(sources: EpgSourceItem[]): EpgChannel[] {
  const enabled = (sources || []).filter((s) => s.enabled);
  if (enabled.length === 0) {
    return [];
  }

  const map = new Map<string, EpgChannel>();

  for (const src of enabled) {
    for (const ch of src.channels || []) {
      const channelId = ch.id.trim();
      if (!channelId) continue;

      if (!map.has(channelId)) {
        map.set(channelId, {
          ...ch,
          sourceName: ch.sourceName || src.name,
          sourceId: ch.sourceId || src.id,
        });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Build comma-separated list of all enabled EPG URLs for standard M3U url-tvg headers
 */
export function buildEffectiveEpgUrl(sources: EpgSourceItem[]): string {
  const urls = (sources || [])
    .filter((s) => s.enabled && s.url && s.url.trim().length > 0)
    .map((s) => s.url!.trim());

  if (urls.length === 0) {
    return 'https://iptv-manager.cloud/epg/greece.xml';
  }

  // Comma-separated for IPTV players (TiviMate, Kodi, OTT Navigator)
  return urls.join(',');
}

/**
 * Add or toggle a preset in the sources list
 */
export function addOrTogglePresetSource(
  currentSources: EpgSourceItem[],
  presetId: string
): EpgSourceItem[] {
  const existing = currentSources.find((s) => s.presetId === presetId);
  if (existing) {
    // If it exists, toggle it to enabled if disabled, or toggle
    return currentSources.map((s) =>
      s.presetId === presetId ? { ...s, enabled: !s.enabled } : s
    );
  }

  const preset = EPG_PRESETS.find((p) => p.id === presetId);
  if (!preset) return currentSources;

  const channels = getPresetChannels(presetId);
  const newSource: EpgSourceItem = {
    id: `preset-${presetId}-${Date.now()}`,
    name: preset.name,
    type: 'preset',
    presetId,
    url: preset.url,
    channelCount: channels.length,
    enabled: true,
    loadedAt: new Date().toLocaleTimeString('el-GR'),
    channels,
  };

  return [...currentSources, newSource];
}

/**
 * Add a custom XMLTV URL source
 */
export function addUrlEpgSource(
  currentSources: EpgSourceItem[],
  url: string,
  name: string,
  channels: EpgChannel[]
): EpgSourceItem[] {
  const cleanUrl = url.trim();
  const existingIndex = currentSources.findIndex(
    (s) => s.type === 'custom_url' && s.url === cleanUrl
  );

  const hostname = getSafeHostname(cleanUrl);
  const newSource: EpgSourceItem = {
    id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name || `XMLTV EPG (${hostname})`,
    type: 'custom_url',
    url: cleanUrl,
    channelCount: channels.length,
    enabled: true,
    loadedAt: new Date().toLocaleTimeString('el-GR'),
    channels: channels.map((c) => ({
      ...c,
      sourceName: name || `XMLTV (${hostname})`,
      sourceId: cleanUrl,
    })),
  };

  if (existingIndex >= 0) {
    const updated = [...currentSources];
    updated[existingIndex] = newSource;
    return updated;
  }

  return [...currentSources, newSource];
}

/**
 * Add multiple custom XMLTV URL sources at once
 */
export function addMultipleUrlEpgSources(
  currentSources: EpgSourceItem[],
  items: Array<{ url: string; name?: string; channels: EpgChannel[] }>
): EpgSourceItem[] {
  let result = [...currentSources];
  for (const item of items) {
    result = addUrlEpgSource(result, item.url, item.name || '', item.channels);
  }
  return result;
}

/**
 * Add a local XMLTV file source
 */
export function addFileEpgSource(
  currentSources: EpgSourceItem[],
  fileName: string,
  channels: EpgChannel[]
): EpgSourceItem[] {
  const newSource: EpgSourceItem = {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `Αρχείο: ${fileName}`,
    type: 'custom_file',
    fileName,
    channelCount: channels.length,
    enabled: true,
    loadedAt: new Date().toLocaleTimeString('el-GR'),
    channels: channels.map((c) => ({
      ...c,
      sourceName: fileName,
      sourceId: fileName,
    })),
  };

  return [...currentSources, newSource];
}

/**
 * Toggle enable/disable of an EPG source
 */
export function toggleEpgSource(
  currentSources: EpgSourceItem[],
  sourceId: string
): EpgSourceItem[] {
  return currentSources.map((s) =>
    s.id === sourceId ? { ...s, enabled: !s.enabled } : s
  );
}

/**
 * Remove an EPG source
 */
export function removeEpgSource(
  currentSources: EpgSourceItem[],
  sourceId: string
): EpgSourceItem[] {
  return currentSources.filter((s) => s.id !== sourceId);
}
