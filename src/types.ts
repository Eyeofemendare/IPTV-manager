export interface EpgProgram {
  title: string;
  start: string;
  end: string;
  desc?: string;
  category?: string;
}

export interface EpgChannel {
  id: string; // e.g. "Mega.gr", "ERT1.gr"
  displayName: string;
  iconUrl?: string;
  category: string;
  currentShow: EpgProgram;
  nextShow: EpgProgram;
}

export interface Channel {
  id: string;
  name: string;
  cleanName: string;
  group: string;
  url: string;
  logoUrl?: string;
  tvgId?: string;
  tvgName?: string;
  resolution?: '4K' | 'FHD' | 'HD' | 'SD';
  country?: string;
  selected: boolean;
  epgId?: string;
  epgName?: string;
  matchConfidence?: number; // 0 - 100
  matchType?: 'auto' | 'manual' | 'none';
  currentShow?: EpgProgram;
  nextShow?: EpgProgram;
}

export interface GroupSummary {
  name: string;
  count: number;
  selectedCount: number;
  isGreek?: boolean;
}

export interface EpgPreset {
  id: string;
  name: string;
  nameEn: string;
  url: string;
  description: string;
  badge: string;
  channelCount: number;
}

export interface SourceConfig {
  type: 'demo' | 'm3u_url' | 'm3u_file' | 'xtream';
  m3uUrl: string;
  xtreamServer: string;
  xtreamUser: string;
  xtreamPass: string;
  epgUrl: string;
  epgSourceType: 'preset' | 'custom_url' | 'custom_file';
  epgPresetId: string;
  customEpgUrl?: string;
  epgFileName?: string;
  fileName?: string;
  loadedAt?: string;
  epgLoadedAt?: string;
}

export interface PingResult {
  status: 'idle' | 'testing' | 'online' | 'offline' | 'slow';
  latencyMs: number;
  testedUrl: string;
  testedAt?: string;
  details?: string;
}

export interface SyncSchedule {
  interval: '6h' | '12h' | '24h' | 'weekly';
  destination: 'gcs' | 'firebase' | 'github' | 'local';
  lastSynced?: string;
  autoRefresh: boolean;
  playlistName: string;
}
