import { PingResult } from '../types';

export function normalizeServerUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'http://' + cleaned;
  }
  return cleaned.replace(/\/+$/, '');
}

export function buildXtreamM3uUrl(server: string, user: string, pass: string): string {
  const base = normalizeServerUrl(server);
  return `${base}/get.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&type=m3u_plus&output=ts`;
}

export function buildXtreamEpgUrl(server: string, user: string, pass: string): string {
  const base = normalizeServerUrl(server);
  return `${base}/xmltv.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
}

export function buildXtreamLiveStreamUrl(server: string, user: string, pass: string, streamId: string | number): string {
  const base = normalizeServerUrl(server);
  return `${base}/live/${encodeURIComponent(user)}/${encodeURIComponent(pass)}/${streamId}.m3u8`;
}

export async function testConnectionPing(targetUrl: string): Promise<PingResult> {
  const startTime = performance.now();
  const cleanUrl = normalizeServerUrl(targetUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Test ping via fetch with no-cors or standard head
    // Even if CORS limits response body, an opaque response confirms server reachability and latency
    await fetch(cleanUrl, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache',
    });

    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - startTime);

    let status: 'online' | 'slow' | 'offline' = 'online';
    let details = 'Σύνδεση επιτυχής. Ο διακομιστής ανταποκρίθηκε άμεσα.';

    if (latency > 450) {
      status = 'slow';
      details = 'Ο διακομιστής αποκρίθηκε με καθυστέρηση (υψηλό latency).';
    }

    return {
      status,
      latencyMs: latency,
      testedUrl: cleanUrl,
      testedAt: new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      details,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    const isTimeout = err?.name === 'AbortError' || latency >= 5900;

    return {
      status: 'offline',
      latencyMs: isTimeout ? 6000 : latency,
      testedUrl: cleanUrl,
      testedAt: new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      details: isTimeout
        ? 'Χρονικό όριο (Timeout): Ο διακομιστής δεν απάντησε εντός 6 δευτερολέπτων.'
        : 'Σφάλμα σύνδεσης ή απαγόρευση πρόσβασης (Blocked/Unreachable host).',
    };
  }
}
