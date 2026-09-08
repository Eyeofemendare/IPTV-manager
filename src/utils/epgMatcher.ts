import { Channel, EpgChannel } from '../types';

export function normalizeText(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove greek and latin accents/diacritics
    .replace(/[άα]/g, 'α')
    .replace(/[έε]/g, 'ε')
    .replace(/[ήηιίϊΐυύϋΰ]/g, 'ι') // phonetic greek iota normalization
    .replace(/[όοώω]/g, 'ο')
    .replace(/[^a-z0-9α-ω]/gi, '')
    .trim();
}

export function cleanChannelForMatching(name: string): string {
  if (!name) return '';

  let cleaned = name
    .replace(/^([A-Z]{2,3})[\s:|\[\-_]+/i, '') // remove country prefix
    .replace(/\[.*?\]|\(.*?\)/g, '') // remove brackets
    .toLowerCase();

  const stopWords = [
    'fhd', 'uhd', '4k', 'hd', 'sd', 'hevc', 'h265', 'h.265', 'vip', 'raw',
    'backup', 'gr', 'cy', 'el', 'greece', 'cyprus', '50fps', '60fps',
    'tv', 'channel', 'sport', 'sports', 'stream', 'live'
  ];

  for (const word of stopWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }

  return normalizeText(cleaned);
}

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

export function computeSimilarity(target: string, candidate: string): number {
  if (!target || !candidate) return 0;
  if (target === candidate) return 100;

  // Exact substring check gives high confidence
  if (target.includes(candidate) || candidate.includes(target)) {
    const ratio = Math.min(target.length, candidate.length) / Math.max(target.length, candidate.length);
    return Math.round(80 + ratio * 20);
  }

  const maxLen = Math.max(target.length, candidate.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(target, candidate);
  const similarity = Math.max(0, (1 - distance / maxLen) * 100);
  return Math.round(similarity);
}

export interface MatchResult {
  epgChannel: EpgChannel;
  confidence: number;
}

export function findBestEpgMatch(channel: Channel, epgDatabase: EpgChannel[]): MatchResult | null {
  const cleanTarget = cleanChannelForMatching(channel.cleanName || channel.name);
  if (!cleanTarget) return null;

  let bestMatch: EpgChannel | null = null;
  let highestScore = 0;

  for (const epg of epgDatabase) {
    // 1. Direct tvg-id match
    if (channel.tvgId && channel.tvgId.toLowerCase() === epg.id.toLowerCase()) {
      return { epgChannel: epg, confidence: 100 };
    }

    // 2. Clean EPG display name and ID
    const cleanEpgDisplay = cleanChannelForMatching(epg.displayName);
    const cleanEpgId = cleanChannelForMatching(epg.id.replace(/\.(gr|cy|com|net)$/i, ''));

    const scoreDisplay = computeSimilarity(cleanTarget, cleanEpgDisplay);
    const scoreId = computeSimilarity(cleanTarget, cleanEpgId);
    const score = Math.max(scoreDisplay, scoreId);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = epg;
    }
  }

  if (bestMatch && highestScore >= 55) {
    return { epgChannel: bestMatch, confidence: highestScore };
  }

  return null;
}

export function runAutoMatchOnChannels(channels: Channel[], epgDatabase: EpgChannel[]): Channel[] {
  return channels.map((channel) => {
    // If user already manually assigned, respect it
    if (channel.matchType === 'manual') return channel;

    const result = findBestEpgMatch(channel, epgDatabase);
    if (result) {
      return {
        ...channel,
        epgId: result.epgChannel.id,
        epgName: result.epgChannel.displayName,
        matchConfidence: result.confidence,
        matchType: 'auto',
        logoUrl: channel.logoUrl || result.epgChannel.iconUrl,
        currentShow: result.epgChannel.currentShow,
        nextShow: result.epgChannel.nextShow,
      };
    }

    return {
      ...channel,
      matchConfidence: 0,
      matchType: 'none',
    };
  });
}
