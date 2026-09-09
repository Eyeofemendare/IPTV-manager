import { Channel, EpgChannel } from '../types';

export function parseM3U(content: string): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];

  let currentExtinf: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentExtinf = line;
    } else if (currentExtinf && !line.startsWith('#')) {
      const streamUrl = line;
      const channel = parseExtinfLine(currentExtinf, streamUrl, channels.length);
      channels.push(channel);
      currentExtinf = null;
    }
  }

  return channels;
}

function parseExtinfLine(extinf: string, url: string, index: number): Channel {
  // Extract attributes
  const tvgIdMatch = extinf.match(/tvg-id="([^"]*)"/i);
  const tvgNameMatch = extinf.match(/tvg-name="([^"]*)"/i);
  const tvgLogoMatch = extinf.match(/tvg-logo="([^"]*)"/i);
  const groupTitleMatch = extinf.match(/group-title="([^"]*)"/i);

  // Extract channel display name after the last comma
  const commaIdx = extinf.lastIndexOf(',');
  let rawName = commaIdx !== -1 ? extinf.substring(commaIdx + 1).trim() : `Channel ${index + 1}`;
  if (!rawName) rawName = tvgNameMatch ? tvgNameMatch[1] : `Channel ${index + 1}`;

  // Clean name
  const cleanName = cleanChannelTitle(rawName);

  // Resolution detection
  let resolution: '4K' | 'FHD' | 'HD' | 'SD' = 'HD';
  const upper = rawName.toUpperCase();
  if (upper.includes('4K') || upper.includes('UHD')) {
    resolution = '4K';
  } else if (upper.includes('FHD') || upper.includes('1080P')) {
    resolution = 'FHD';
  } else if (upper.includes('HD') || upper.includes('720P')) {
    resolution = 'HD';
  } else if (upper.includes('SD')) {
    resolution = 'SD';
  }

  // Country detection
  let country: string | undefined;
  if (/^(GR|GRE|GREECE)[\s:|\[\-]/i.test(rawName) || /greek/i.test(groupTitleMatch ? groupTitleMatch[1] : '')) {
    country = 'GR';
  } else if (/^(CY|CYP|CYPRUS)[\s:|\[\-]/i.test(rawName) || /cyprus/i.test(groupTitleMatch ? groupTitleMatch[1] : '')) {
    country = 'CY';
  } else if (/^(DE|GER)[\s:|\[\-]/i.test(rawName)) {
    country = 'DE';
  } else if (/^(UK|GB)[\s:|\[\-]/i.test(rawName)) {
    country = 'UK';
  } else if (/^(FR|FRA)[\s:|\[\-]/i.test(rawName)) {
    country = 'FR';
  } else if (/^(IT|ITA)[\s:|\[\-]/i.test(rawName)) {
    country = 'IT';
  } else if (/^(US|USA)[\s:|\[\-]/i.test(rawName)) {
    country = 'US';
  }

  const group = (groupTitleMatch && groupTitleMatch[1].trim()) || (country === 'GR' ? 'Greek General' : 'Other');

  return {
    id: `ch-${Date.now().toString(36)}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    name: rawName,
    cleanName: cleanName || rawName,
    group: group,
    url: url,
    logoUrl: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
    tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
    tvgName: tvgNameMatch ? tvgNameMatch[1] : undefined,
    resolution,
    country,
    selected: country === 'GR' || country === 'CY' || group.toLowerCase().includes('greek'),
    matchType: 'none',
  };
}

export function cleanChannelTitle(name: string): string {
  return name
    .replace(/^([A-Z]{2,3})[\s:|\[\-_]+/i, '') // strip country prefixes like "GR: ", "CY | "
    .replace(/\[.*?\]|\(.*?\)/g, '') // remove brackets [HEVC], (BACKUP)
    .replace(/\b(4K|UHD|FHD|HD|SD|1080P|720P|HEVC|H\.265|50FPS|60FPS|RAW|VIP|BACKUP|GR|CY|GREECE)\b/gi, '')
    .replace(/[|\-_:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateM3U(channels: Channel[], epgUrl?: string | string[]): string {
  const selectedChannels = channels.filter((c) => c.selected);
  let effectiveEpgUrl = 'https://iptv-manager.cloud/epg/greece.xml';

  if (Array.isArray(epgUrl)) {
    const valid = epgUrl.map((u) => u.trim()).filter((u) => u.length > 0);
    if (valid.length > 0) {
      effectiveEpgUrl = valid.join(',');
    }
  } else if (epgUrl && epgUrl.trim().length > 0) {
    effectiveEpgUrl = epgUrl.trim();
  }

  let output = `#EXTM3U x-tvg-url="${effectiveEpgUrl}" url-tvg="${effectiveEpgUrl}"\n\n`;

  for (const ch of selectedChannels) {
    const tvgId = ch.epgId || ch.tvgId || '';
    const tvgName = ch.epgName || ch.tvgName || ch.cleanName;
    const logo = ch.logoUrl ? ` tvg-logo="${ch.logoUrl}"` : '';
    const group = ` group-title="${ch.group || 'General'}"`;

    output += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}"${logo}${group},${ch.name}\n`;
    output += `${ch.url}\n\n`;
  }

  return output;
}

export function generateXMLTV(channels: Channel[], epgDb: EpgChannel[]): string {
  const selectedChannels = channels.filter((c) => c.selected && (c.epgId || c.tvgId));
  const epgMap = new Map<string, EpgChannel>();
  epgDb.forEach((e) => epgMap.set(e.id, e));

  const now = new Date();
  const formatXmltvDate = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}00 +0200`;
  };

  const startNow = formatXmltvDate(now);
  const endNow = formatXmltvDate(new Date(now.getTime() + 2 * 60 * 60 * 1000));
  const endNext = formatXmltvDate(new Date(now.getTime() + 4 * 60 * 60 * 1000));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<tv date="${now.toISOString()}" generator-info-name="iPTV Manager" generator-info-url="https://github.com">\n`;

  // Channels
  for (const ch of selectedChannels) {
    const epgId = ch.epgId || ch.tvgId || ch.cleanName;
    xml += `  <channel id="${escapeXml(epgId)}">\n`;
    xml += `    <display-name lang="el">${escapeXml(ch.epgName || ch.cleanName)}</display-name>\n`;
    if (ch.logoUrl) {
      xml += `    <icon src="${escapeXml(ch.logoUrl)}" />\n`;
    }
    xml += `  </channel>\n`;
  }

  // Programmes
  for (const ch of selectedChannels) {
    const epgId = ch.epgId || ch.tvgId;
    if (!epgId) continue;
    const epgData = epgMap.get(epgId);

    const currentTitle = epgData?.currentShow?.title || ch.currentShow?.title || `${ch.cleanName} Live Broadcast`;
    const currentDesc = epgData?.currentShow?.desc || ch.currentShow?.desc || 'Ζωντανό πρόγραμμα του σταθμού σε υψηλή ανάλυση.';
    const currentCat = epgData?.currentShow?.category || 'General';

    const nextTitle = epgData?.nextShow?.title || ch.nextShow?.title || `${ch.cleanName} Βραδινό Πρόγραμμα`;
    const nextDesc = epgData?.nextShow?.desc || ch.nextShow?.desc || 'Ενημερωτικό & ψυχαγωγικό πρόγραμμα.';
    const nextCat = epgData?.nextShow?.category || 'General';

    xml += `  <programme start="${startNow}" stop="${endNow}" channel="${escapeXml(epgId)}">\n`;
    xml += `    <title lang="el">${escapeXml(currentTitle)}</title>\n`;
    xml += `    <desc lang="el">${escapeXml(currentDesc)}</desc>\n`;
    xml += `    <category lang="el">${escapeXml(currentCat)}</category>\n`;
    xml += `  </programme>\n`;

    xml += `  <programme start="${endNow}" stop="${endNext}" channel="${escapeXml(epgId)}">\n`;
    xml += `    <title lang="el">${escapeXml(nextTitle)}</title>\n`;
    xml += `    <desc lang="el">${escapeXml(nextDesc)}</desc>\n`;
    xml += `    <category lang="el">${escapeXml(nextCat)}</category>\n`;
    xml += `  </programme>\n`;
  }

  xml += `</tv>\n`;
  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
