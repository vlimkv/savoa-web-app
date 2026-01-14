"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import {
  Play, Pause, Maximize, Minimize,
  Airplay, PictureInPicture, Loader2,
  Volume2, VolumeX, RotateCcw, RotateCw, ChevronLeft
} from "lucide-react";

declare global {
  interface HTMLVideoElement {
    webkitShowPlaybackTargetPicker?: () => void;
    webkitEnterFullscreen?: () => void; // iPhone Safari sometimes
  }
}

export interface VideoSource {
  url: string;
  isHls: boolean;
}

interface ProPlayerProps {
  src: VideoSource;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  onBack?: () => void;

  onTime?: (sec: number) => void;
  onEnded?: (sec: number) => void;

  className?: string;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function isSafariLike() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  // iOS Safari + macOS Safari (включая WebView)
  return ua.includes("safari") && !ua.includes("chrome") && !ua.includes("android");
}

export function ProPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  onBack,
  onTime,
  onEnded,
  className = ""
}: ProPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [seekOverlay, setSeekOverlay] = useState<"forward" | "backward" | null>(null);

  const [hasAirPlay, setHasAirPlay] = useState(false);
  const [hasPiP, setHasPiP] = useState(false);

  const safari = useMemo(() => isSafariLike(), []);

  const showUI = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);

    if (isPlaying && !isDragging) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying, isDragging]);

  useEffect(() => {
    showUI();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [showUI]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const handleCenterPlay = useCallback((e: any) => {
    e?.stopPropagation?.();   // ✅ чтобы контейнер не перехватывал тап
    showUI();                 // ✅ показать контролы
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [showUI]);

  const skip = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    const d = Number.isFinite(duration) && duration > 0 ? duration : v.duration || 0;
    const next = Math.min(Math.max(v.currentTime + seconds, 0), d || Infinity);
    v.currentTime = next;
    setCurrentTime(next);
    showUI();

    setSeekOverlay(seconds > 0 ? "forward" : "backward");
    window.setTimeout(() => setSeekOverlay(null), 550);
  }, [duration, showUI]);

  const handleTimelineDrag = useCallback((e: MouseEvent | TouchEvent) => {
    const bar = progressBarRef.current;
    const v = videoRef.current;
    if (!bar || !v) return;

    const rect = bar.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;

    const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const d = Number.isFinite(duration) && duration > 0 ? duration : v.duration || 0;
    const next = percent * (d || 0);

    setCurrentTime(next);
    if (isDragging) v.currentTime = next;
  }, [duration, isDragging]);

  const startDrag = useCallback(() => {
    setIsDragging(true);
    showUI();
  }, [showUI]);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    showUI();
  }, [showUI]);

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleTimelineDrag);
    window.addEventListener("touchmove", handleTimelineDrag, { passive: true });
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchend", stopDrag);

    return () => {
      window.removeEventListener("mousemove", handleTimelineDrag);
      window.removeEventListener("touchmove", handleTimelineDrag);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [isDragging, handleTimelineDrag, stopDrag]);

  const isTouchDevice = () =>
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".interactive")) return;

    if (isTouchDevice()) {
      setShowControls((v) => !v);
      return;
    }

    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();

    if (now - lastTapRef.current.time < 300 && rect) {
      const x = e.clientX - rect.left;
      if (x < rect.width / 3) skip(-10);
      else if (x > (rect.width * 2) / 3) skip(10);
      else togglePlay();
    } else {
      setShowControls((v) => !v);
    }

    lastTapRef.current = { time: now, x: e.clientX };
  };


  // --- Video setup: HLS + events + AirPlay + PiP + fullscreen state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Capabilities
    setHasPiP(!!document.pictureInPictureEnabled);

    // AirPlay availability (Safari)
    const onAirplayAvailability = (ev: any) => {
      // ev.availability: "available" | "not-available"
      if (ev?.availability === "available") setHasAirPlay(true);
      if (ev?.availability === "not-available") setHasAirPlay(false);
    };

    // Fullscreen state listener
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    // Safari event name
    v.addEventListener("webkitplaybacktargetavailabilitychanged", onAirplayAvailability as any);

    // Destroy previous hls
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Source attach
    const canNativeHls =
      src.isHls && typeof v.canPlayType === "function" && v.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (canNativeHls) {
      v.src = src.url;
    } else if (src.isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsRef.current = hls;
      hls.attachMedia(v);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src.url));
    } else {
      v.src = src.url;
    }

    // Events
    const onTimeUpdate = () => {
      if (!isDragging) setCurrentTime(v.currentTime || 0);
      setDuration(v.duration || 0);

      // ✅ отдаём наверх текущее время
      onTime?.(v.currentTime || 0);

      if (v.buffered?.length) {
        try {
          setBuffered(v.buffered.end(v.buffered.length - 1));
        } catch {}
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onEndedLocal = () => {
      setIsPlaying(false);
      onEnded?.(v.currentTime || 0); // ✅ передаём секунды
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("ended", onEndedLocal);

    if (autoPlay) v.play().catch(() => {});

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      v.removeEventListener("webkitplaybacktargetavailabilitychanged", onAirplayAvailability as any);

      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("ended", onEndedLocal);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src.url, src.isHls, autoPlay, onEnded, onTime, isDragging]);

  const toggleAirPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.webkitShowPlaybackTargetPicker?.();
  }, []);

  const togglePiP = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else v.requestPictureInPicture?.().catch(() => {});
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    const v = videoRef.current;
    if (!el) return;

    // iPhone Safari: лучше открывать нативный fullscreen видео (если доступно)
    if (safari && v?.webkitEnterFullscreen && !document.fullscreenElement) {
      v.webkitEnterFullscreen();
      return;
    }

    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  }, [safari]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const safeDuration = duration > 0 ? duration : 0;
  const bufferedPct = safeDuration ? (buffered / safeDuration) * 100 : 0;
  const currentPct = safeDuration ? (currentTime / safeDuration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black overflow-hidden select-none ${className}`}
      onMouseMove={showUI}
      onTouchStart={showUI}
      onClick={handleContainerClick}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        {...({ "x-webkit-airplay": "allow", airplay: "allow" } as any)}
        crossOrigin="anonymous"
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <Loader2 className="w-12 h-12 text-white/90 animate-spin" />
        </div>
      )}

      {seekOverlay && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md rounded-full p-6 animate-pulse">
            {seekOverlay === "forward"
              ? <RotateCw size={40} className="text-white" />
              : <RotateCcw size={40} className="text-white" />
            }
            <span className="text-xs font-bold text-white block text-center mt-1">10s</span>
          </div>
        </div>
      )}

      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            onClick={handleCenterPlay}
            onTouchStart={(e) => e.stopPropagation()}
            className="interactive w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/10 flex items-center justify-center pointer-events-auto cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-2xl"
          >
            <Play className="w-8 h-8 text-white ml-1 fill-white" />
          </div>
        </div>
      )}

      <div className={`absolute inset-0 z-50 flex flex-col justify-between transition-all duration-300 ${showControls ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className="h-32 bg-gradient-to-b from-black/80 to-transparent p-6 flex justify-between items-start">
          {onBack && (
            <button onClick={onBack} className="interactive w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft size={24} color="white" />
            </button>
          )}
          {title && <h3 className="text-white/90 font-medium text-sm tracking-wide drop-shadow-md hidden md:block">{title}</h3>}
        </div>

        <div className="bg-gradient-to-t from-black/95 via-black/60 to-transparent px-6 pb-8 pt-20 space-y-4">
          <div
            ref={progressBarRef}
            className="interactive group/time relative h-6 flex items-center cursor-pointer"
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            <div className="absolute w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover/time:h-1.5 transition-all">
              <div className="absolute h-full bg-white/30" style={{ width: `${Math.max(0, Math.min(100, bufferedPct))}%` }} />
              <div className="absolute h-full bg-white" style={{ width: `${Math.max(0, Math.min(100, currentPct))}%` }} />
            </div>

            <div
              className={`absolute h-4 w-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-0 group-hover/time:scale-100 transition-transform ${isDragging ? "scale-100" : ""}`}
              style={{ left: `${Math.max(0, Math.min(100, currentPct))}%`, transform: "translateX(-50%)" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="interactive text-white hover:text-white/80 active:scale-90 transition">
                {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
              </button>

              <div className="flex items-center gap-3">
                <button onClick={toggleMute} className="interactive hidden sm:block text-white/80 hover:text-white">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <span className="text-xs font-medium text-white/90 font-mono">
                  {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {hasAirPlay && (
                <button
                  onClick={toggleAirPlay}
                  className="interactive text-white hover:text-green-400 transition"
                  title="AirPlay"
                >
                  <Airplay size={22} />
                </button>
              )}

              {hasPiP && (
                <button
                  onClick={togglePiP}
                  className="interactive text-white/70 hover:text-white transition hidden sm:block"
                  title="Picture-in-Picture"
                >
                  <PictureInPicture size={22} />
                </button>
              )}

              <button onClick={toggleFullscreen} className="interactive text-white hover:text-white/80 transition active:scale-90" title="Fullscreen">
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
