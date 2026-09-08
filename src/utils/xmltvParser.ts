import { EpgChannel, EpgProgram } from '../types';

/**
 * Format XMLTV timestamp (YYYYMMDDhhmmss +ZZZZ) into a readable HH:mm string.
 */
export function formatXmltvTime(timeStr?: string | null): string {
  if (!timeStr) return '18:00';
  const match = timeStr.trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (match) {
    const [, , , , hour, min] = match;
    return `${hour}:${min}`;
  }
  return '18:00';
}

/**
 * Parse an XMLTV string into an array of EpgChannel objects.
 * Uses the browser DOMParser with a fallback for resilient extraction.
 */
export function parseXMLTV(xmlString: string): EpgChannel[] {
  if (!xmlString || typeof xmlString !== 'string') return [];

  const channelsMap = new Map<
    string,
    {
      id: string;
      displayName: string;
      iconUrl?: string;
      category?: string;
      programmes: {
        title: string;
        start: string;
        end: string;
        desc?: string;
        category?: string;
        startTimeVal: number;
      }[];
    }
  >();

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parse error
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.warn('DOMParser reported error, switching to regex extraction', parseError.textContent);
      return parseXmltvWithRegex(xmlString);
    }

    // 1. Extract <channel> tags
    const channelNodes = xmlDoc.querySelectorAll('channel');
    channelNodes.forEach((chNode) => {
      const id = chNode.getAttribute('id') || '';
      if (!id) return;

      const displayNames = chNode.querySelectorAll('display-name');
      let displayName = id;
      if (displayNames.length > 0) {
        // prefer the first non-empty display name
        for (let i = 0; i < displayNames.length; i++) {
          const text = displayNames[i].textContent?.trim();
          if (text) {
            displayName = text;
            break;
          }
        }
      }

      const iconNode = chNode.querySelector('icon');
      const iconUrl = iconNode?.getAttribute('src') || undefined;

      channelsMap.set(id, {
        id,
        displayName,
        iconUrl,
        category: 'EPG Import',
        programmes: [],
      });
    });

    // 2. Extract <programme> tags
    const programmeNodes = xmlDoc.querySelectorAll('programme');
    programmeNodes.forEach((progNode) => {
      const channelId = progNode.getAttribute('channel') || '';
      if (!channelId) return;

      const startRaw = progNode.getAttribute('start') || '';
      const stopRaw = progNode.getAttribute('stop') || '';

      const titleNode = progNode.querySelector('title');
      const descNode = progNode.querySelector('desc');
      const catNode = progNode.querySelector('category');

      const title = titleNode?.textContent?.trim() || 'Πρόγραμμα Ροής';
      const desc = descNode?.textContent?.trim() || undefined;
      const category = catNode?.textContent?.trim() || 'General';

      // Parse start numeric value for sorting
      const matchStart = startRaw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
      const startTimeVal = matchStart ? parseInt(matchStart[1] + matchStart[2] + matchStart[3] + matchStart[4] + matchStart[5], 10) : 0;

      const formattedStart = formatXmltvTime(startRaw);
      const formattedEnd = formatXmltvTime(stopRaw);

      if (!channelsMap.has(channelId)) {
        // Create an implicit channel if missing from <channel> list
        channelsMap.set(channelId, {
          id: channelId,
          displayName: channelId,
          category: 'EPG Import',
          programmes: [],
        });
      }

      channelsMap.get(channelId)!.programmes.push({
        title,
        desc,
        category,
        start: formattedStart,
        end: formattedEnd,
        startTimeVal,
      });
    });
  } catch (err) {
    console.warn('XMLTV parsing error, trying regex fallback', err);
    return parseXmltvWithRegex(xmlString);
  }

  // Convert map to EpgChannel list
  const results: EpgChannel[] = [];

  channelsMap.forEach((val) => {
    // Sort programmes by time
    val.programmes.sort((a, b) => a.startTimeVal - b.startTimeVal);

    let currentShow: EpgProgram;
    let nextShow: EpgProgram;

    if (val.programmes.length >= 2) {
      currentShow = {
        title: val.programmes[0].title,
        start: val.programmes[0].start,
        end: val.programmes[0].end,
        desc: val.programmes[0].desc,
        category: val.programmes[0].category,
      };
      nextShow = {
        title: val.programmes[1].title,
        start: val.programmes[1].start,
        end: val.programmes[1].end,
        desc: val.programmes[1].desc,
        category: val.programmes[1].category,
      };
    } else if (val.programmes.length === 1) {
      currentShow = {
        title: val.programmes[0].title,
        start: val.programmes[0].start,
        end: val.programmes[0].end,
        desc: val.programmes[0].desc,
        category: val.programmes[0].category,
      };
      nextShow = {
        title: `${val.displayName} Live Broadcast`,
        start: val.programmes[0].end,
        end: '23:59',
        desc: 'Συνέχεια προγράμματος σταθμού.',
        category: 'General',
      };
    } else {
      currentShow = {
        title: `${val.displayName} Ζωντανή Ροή`,
        start: '18:00',
        end: '20:00',
        desc: 'Ζωντανή μετάδοση του τηλεοπτικού σταθμού.',
        category: 'Live',
      };
      nextShow = {
        title: `${val.displayName} Βραδινό Πρόγραμμα`,
        start: '20:00',
        end: '22:00',
        desc: 'Ενημέρωση και ψυχαγωγία.',
        category: 'General',
      };
    }

    results.push({
      id: val.id,
      displayName: val.displayName,
      iconUrl: val.iconUrl,
      category: val.category || 'EPG Import',
      currentShow,
      nextShow,
    });
  });

  return results;
}

/**
 * Fallback regex parser when XML is slightly invalid or malformed
 */
function parseXmltvWithRegex(xmlString: string): EpgChannel[] {
  const channels: EpgChannel[] = [];
  const channelRegex = /<channel\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/channel>/gi;
  let match: RegExpExecArray | null;

  while ((match = channelRegex.exec(xmlString)) !== null) {
    const id = match[1];
    const body = match[2];

    const displayMatch = body.match(/<display-name[^>]*>([^<]+)<\/display-name>/i);
    const displayName = displayMatch ? displayMatch[1].trim() : id;

    const iconMatch = body.match(/<icon\s+src="([^"]+)"/i);
    const iconUrl = iconMatch ? iconMatch[1] : undefined;

    channels.push({
      id,
      displayName,
      iconUrl,
      category: 'EPG Import',
      currentShow: {
        title: `${displayName} Ζωντανό Πρόγραμμα`,
        start: '18:00',
        end: '20:00',
        desc: 'Ζωντανή αναμετάδοση.',
        category: 'Live',
      },
      nextShow: {
        title: `${displayName} Επόμενη Εκπομπή`,
        start: '20:00',
        end: '22:00',
        desc: 'Πρόγραμμα σταθμού.',
        category: 'General',
      },
    });
  }

  return channels;
}
