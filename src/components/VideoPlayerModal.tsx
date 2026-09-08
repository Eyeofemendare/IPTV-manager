import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  Copy,
  Check,
  Tv,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerModalProps {
  channel: Channel | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [streamInfo, setStreamInfo] = useState<{
    codec: string;
    bufferLatency: number;
    videoWidth: number;
    videoHeight: number;
  }>({
    codec: 'H.264 / AAC (TS)',
    bufferLatency: 1.2,
    videoWidth: 1920,
    videoHeight: 1080,
  });

  useEffect(() => {
    if (!channel || !videoRef.current) return;

    let hls: Hls | null = null;
    const video = videoRef.current;
    setErrorMsg(null);

    const streamUrl = channel.url;
    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('/live/');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMsg('Σφάλμα δικτύου ή CORS στον διακομιστή του παρόχου.');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              setErrorMsg('Αδυναμία αναπαραγωγής της ροής στον browser. Δοκιμάστε να ανοίξετε τη ροή σε εξωτερικό player (VLC).');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = streamUrl;
      video.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      // Direct mp4 / webm fallback
      video.src = streamUrl;
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }

    const handleLoadedMetadata = () => {
      setStreamInfo((prev) => ({
        ...prev,
        videoWidth: video.videoWidth || 1920,
        videoHeight: video.videoHeight || 1080,
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (hls) {
        hls.destroy();
      }
    };
  }, [channel]);

  if (!channel) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(channel.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // External player links
  const vlcUrl = `vlc://${channel.url}`;
  const mxPlayerIntent = `intent:${channel.url}#Intent;type=video/*;package=com.mxtech.videoplayer.ad;end`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Tv className="w-4 h-4" />
            </div>
            <div className="overflow-hidden min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{channel.cleanName || channel.name}</h3>
              <p className="text-xs text-slate-400 truncate">{channel.group} • {channel.resolution || 'HD'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            muted={isMuted}
          />

          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-sm font-semibold text-white mb-1">Περιορισμός Browser / CORS</p>
              <p className="text-xs text-slate-400 max-w-md mb-4">{errorMsg}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <a
                  href={vlcUrl}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
                >
                  Άνοιγμα σε VLC
                </a>
                <button
                  onClick={handleCopyUrl}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                >
                  {copied ? 'Αντιγράφηκε!' : 'Αντιγραφή Stream URL'}
                </button>
              </div>
            </div>
          )}

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title={isPlaying ? 'Παύση' : 'Αναπαραγωγή'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title={isMuted ? 'Κατάργηση σίγασης' : 'Σίγαση'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-amber-400" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <span className="text-xs font-mono text-slate-300">
                {streamInfo.videoWidth}x{streamInfo.videoHeight}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="Πλήρης οθόνη"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Technical Stream Parameters & External Launchers */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Stream URL:</span>
              <span className="font-mono text-slate-300 truncate max-w-xs sm:max-w-md bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {channel.url}
              </span>
            </div>

            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 flex items-center gap-1 transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Αντιγράφηκε' : 'Αντιγραφή'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-4 text-slate-400">
              <span>Codec: <strong className="text-slate-200">{streamInfo.codec}</strong></span>
              <span>Buffer: <strong className="text-emerald-400">{streamInfo.bufferLatency}s</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={vlcUrl}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                <span>Άνοιγμα σε VLC</span>
              </a>

              <a
                href={mxPlayerIntent}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>MX Player (Android)</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
