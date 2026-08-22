import { useCallback, useEffect, useId, useRef, useState } from "react";
import siteConfig from "../config/siteConfig";

type AudioVoice = "male" | "female";

type PostAudioPlayerProps = {
  audio?: boolean;
  audioVoice?: AudioVoice;
  audioUrl: string | null;
  audioDuration?: number;
  audioStatus?: "pending" | "ready" | "failed";
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function resolveVoice(audioVoice?: AudioVoice): AudioVoice {
  return audioVoice ?? siteConfig.audio?.defaultVoice ?? "female";
}

function shouldShowPlayer(audio?: boolean): boolean {
  if (audio !== undefined) {
    return audio;
  }
  return siteConfig.audio?.enabledDefault !== false;
}

/** Title plus body, minus code blocks, matching what the server reads aloud. */
function collectFallbackText(): string {
  const root = document.querySelector(".post-content, .docs-article");
  const title = document.querySelector("h1")?.textContent?.trim() ?? "";
  if (!root) {
    return title || document.title;
  }
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("pre, code").forEach((node) => node.remove());
  const body = (clone.textContent ?? "").replace(/\s+/g, " ").trim();
  if (title.length > 0 && body.length > 0) {
    return `${title}. ${body}`;
  }
  return title.length > 0 ? title : body;
}

/**
 * Chrome abandons a single long utterance partway through, so the fallback
 * queues many short ones instead of handing it the whole post at once.
 */
function splitForSpeech(text: string, maxChars = 200): Array<string> {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return [];
  }
  const chunks: Array<string> = [];
  let current = "";
  for (const sentence of normalized.split(/(?<=[.!?])\s+/)) {
    const next = current.length === 0 ? sentence : `${current} ${sentence}`;
    if (next.length > maxChars && current.length > 0) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks;
}

function pickBrowserVoice(voice: AudioVoice): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const wantFemale = voice === "female";
  const match = voices.find((item) => {
    const name = item.name.toLowerCase();
    const gendered =
      name.includes("female") ||
      name.includes("woman") ||
      name.includes("samantha") ||
      name.includes("victoria") ||
      name.includes("male") ||
      name.includes("man") ||
      name.includes("daniel") ||
      name.includes("alex");
    if (!gendered) {
      return false;
    }
    const isFemale =
      name.includes("female") ||
      name.includes("woman") ||
      name.includes("samantha") ||
      name.includes("victoria");
    return wantFemale ? isFemale : !isFemale;
  });
  return match ?? voices[0] ?? null;
}

export default function PostAudioPlayer({
  audio,
  audioVoice,
  audioUrl,
  audioDuration,
  audioStatus,
}: PostAudioPlayerProps) {
  const voice = resolveVoice(audioVoice);
  const enabled = shouldShowPlayer(audio);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(audioDuration ?? 0);
  const progressId = useId();
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stopBrowserSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopBrowserSpeech();
    };
  }, [stopBrowserSpeech]);

  // Chrome stalls a queued speech run after roughly 15 seconds of audio.
  // Nudging it on a timer keeps a long post going to the end.
  useEffect(() => {
    if (!playing || audioUrl) {
      return;
    }
    const timer = window.setInterval(() => {
      const synth = window.speechSynthesis;
      if (synth && synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
    return () => window.clearInterval(timer);
  }, [playing, audioUrl]);

  useEffect(() => {
    const node = audioRef.current;
    if (!node) {
      return;
    }
    const onTime = () => setCurrent(node.currentTime);
    const onMeta = () => {
      if (Number.isFinite(node.duration)) {
        setDuration(node.duration);
      }
    };
    const onEnded = () => setPlaying(false);
    node.addEventListener("timeupdate", onTime);
    node.addEventListener("loadedmetadata", onMeta);
    node.addEventListener("ended", onEnded);
    return () => {
      node.removeEventListener("timeupdate", onTime);
      node.removeEventListener("loadedmetadata", onMeta);
      node.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  if (!enabled) {
    return null;
  }

  if (!audioUrl) {
    if (audioStatus === "pending") {
      return (
        <div className="post-audio" role="status">
          <p className="post-audio-status">Audio not ready</p>
        </div>
      );
    }
    if (audioStatus === "failed") {
      return (
        <div className="post-audio">
          <button
            type="button"
            className="post-audio-play"
            onClick={() => {
              if (!window.speechSynthesis) {
                return;
              }
              if (playing) {
                stopBrowserSpeech();
                setPlaying(false);
                return;
              }
              const chunks = splitForSpeech(collectFallbackText());
              if (chunks.length === 0) {
                return;
              }
              // Clear anything left over from a previous run before queueing.
              window.speechSynthesis.cancel();
              const browserVoice = pickBrowserVoice(voice);
              chunks.forEach((chunk, index) => {
                const utterance = new SpeechSynthesisUtterance(chunk);
                if (browserVoice) {
                  utterance.voice = browserVoice;
                }
                if (index === chunks.length - 1) {
                  utterance.onend = () => setPlaying(false);
                }
                window.speechSynthesis.speak(utterance);
              });
              setPlaying(true);
            }}
          >
            {playing ? "Pause" : "Listen"}
          </button>
          <p className="post-audio-status">Browser voice</p>
        </div>
      );
    }
    return null;
  }

  const toggle = async () => {
    const node = audioRef.current;
    if (!node) {
      return;
    }
    if (playing) {
      node.pause();
      setPlaying(false);
      return;
    }
    await node.play();
    setPlaying(true);
  };

  const onSeek = (value: number) => {
    const node = audioRef.current;
    if (!node) {
      return;
    }
    node.currentTime = value;
    setCurrent(value);
  };

  return (
    <div className="post-audio">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        type="button"
        className="post-audio-play"
        onClick={() => {
          void toggle();
        }}
        aria-label={playing ? "Pause audio" : "Play audio"}
      >
        {playing ? "Pause" : "Listen"}
      </button>
      <div className="post-audio-main">
        <label className="post-audio-visually-hidden" htmlFor={progressId}>
          Audio progress
        </label>
        <input
          id={progressId}
          className="post-audio-progress"
          type="range"
          min={0}
          max={duration || 0}
          step={reduceMotion ? 1 : 0.1}
          value={current}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <div className="post-audio-meta">
          <span>
            {formatTime(current)} / {formatTime(duration || audioDuration || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
