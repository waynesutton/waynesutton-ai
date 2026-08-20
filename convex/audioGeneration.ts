"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  kokoroVoiceId,
  splitSpeechChunks,
  stripPostToSpeechText,
  type AudioVoice,
} from "./lib/audioText";

type GeneratedSpeech = {
  samples: Float32Array;
  sampleRate: number;
};

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i] ?? 0;
    const clipped = Math.max(-1, Math.min(1, sample));
    view.setInt16(
      44 + i * 2,
      clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff,
      true,
    );
  }

  return buffer;
}

function concatSamples(parts: Array<Float32Array>): Float32Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

function asFloat32(value: unknown): Float32Array | null {
  if (value instanceof Float32Array) {
    return value;
  }
  if (value instanceof Float64Array) {
    return Float32Array.from(value);
  }
  if (value instanceof Int16Array) {
    return Float32Array.from(value, (sample) => sample / 32768);
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "number")) {
    return Float32Array.from(value);
  }
  return null;
}

function readGeneratedAudio(result: unknown, fallbackRate: number): GeneratedSpeech {
  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    const samples =
      asFloat32(record.audio) ??
      asFloat32(record.samples) ??
      asFloat32(record.data);
    const sampleRate =
      typeof record.sampling_rate === "number"
        ? record.sampling_rate
        : typeof record.sampleRate === "number"
          ? record.sampleRate
          : fallbackRate;
    if (samples) {
      return { samples, sampleRate };
    }
  }
  const direct = asFloat32(result);
  if (direct) {
    return { samples: direct, sampleRate: fallbackRate };
  }
  throw new Error("TTS returned no audio samples");
}

function isMemoryError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /out of memory|oom|heap|ENOMEM|allocation failed|wasm/i.test(message);
}

async function synthesizeWithKokoro(
  text: string,
  voice: AudioVoice,
  dtypes: ReadonlyArray<"q8" | "q4">,
): Promise<GeneratedSpeech> {
  const { KokoroTTS } = await import("kokoro-js");
  let lastError: unknown;

  for (const dtype of dtypes) {
    try {
      const tts = await KokoroTTS.from_pretrained(
        "onnx-community/Kokoro-82M-v1.0-ONNX",
        {
          dtype,
          device: "cpu",
        },
      );
      const chunks = splitSpeechChunks(text);
      if (chunks.length === 0) {
        throw new Error("No speakable text");
      }
      const parts: Array<Float32Array> = [];
      let sampleRate = 24000;
      for (const chunk of chunks) {
        const generated = await tts.generate(chunk, {
          voice: kokoroVoiceId(voice),
        });
        const speech = readGeneratedAudio(generated, 24000);
        parts.push(speech.samples);
        sampleRate = speech.sampleRate;
      }
      return { samples: concatSamples(parts), sampleRate };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Kokoro synthesis failed");
}

async function synthesizeWithPiper(
  text: string,
  voice: AudioVoice,
): Promise<GeneratedSpeech> {
  // Optional Piper WASM package. Fresh isolate so Kokoro's heap is gone.
  const dynamicImport = new Function("specifier", "return import(specifier)") as (
    specifier: string,
  ) => Promise<Record<string, unknown>>;
  const loaded = await dynamicImport("piper-wasm").catch(() => null);
  if (!loaded) {
    throw new Error("Piper WASM package is not installed");
  }

  const PiperCtor = loaded.Piper ?? loaded.default;
  if (typeof PiperCtor !== "function") {
    throw new Error("Piper WASM export not found");
  }

  const piperVoice = voice === "male" ? "en_US-ryan-low" : "en_US-lessac-low";
  const piper = new (PiperCtor as new (options: {
    voice: string;
  }) => { generate: (input: string) => Promise<unknown> })({
    voice: piperVoice,
  });
  const generated = await piper.generate(text);
  return readGeneratedAudio(generated, 22050);
}

export const generateAudio = internalAction({
  args: { jobId: v.id("audioJobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.audio.getJobForGeneration, {
      jobId: args.jobId,
    });
    if (!job || job.status !== "pending") {
      return null;
    }

    const spoken = stripPostToSpeechText(job.title, job.content);
    if (spoken.length === 0) {
      await ctx.runMutation(internal.audio.failAudioJob, {
        jobId: args.jobId,
        error: "No speakable text",
      });
      return null;
    }

    if (job.existingStorageId && job.existingHash === job.contentHash) {
      return null;
    }

    try {
      const speech = await synthesizeWithKokoro(spoken, job.voice, ["q8", "q4"]);
      const wav = encodeWav(speech.samples, speech.sampleRate);
      const storageId = await ctx.storage.store(
        new Blob([wav], { type: "audio/wav" }),
      );
      await ctx.runMutation(internal.audio.finalizeAudioJob, {
        jobId: args.jobId,
        storageId,
        duration: speech.samples.length / speech.sampleRate,
        contentHash: job.contentHash,
      });
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kokoro failed";
      await ctx.runMutation(internal.audio.failAudioJob, {
        jobId: args.jobId,
        error: message,
        retryWithPiper: isMemoryError(error),
      });
      return null;
    }
  },
});

export const generateAudioPiper = internalAction({
  args: { jobId: v.id("audioJobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.audio.getJobForGeneration, {
      jobId: args.jobId,
    });
    if (!job || job.status !== "pending") {
      return null;
    }

    const spoken = stripPostToSpeechText(job.title, job.content);
    if (spoken.length === 0) {
      await ctx.runMutation(internal.audio.failAudioJob, {
        jobId: args.jobId,
        error: "No speakable text",
      });
      return null;
    }

    try {
      // Fresh isolate: try the smaller Kokoro quant first, then Piper WASM.
      let speech: GeneratedSpeech;
      try {
        speech = await synthesizeWithKokoro(spoken, job.voice, ["q4"]);
      } catch {
        speech = await synthesizeWithPiper(spoken, job.voice);
      }
      const wav = encodeWav(speech.samples, speech.sampleRate);
      const storageId = await ctx.storage.store(
        new Blob([wav], { type: "audio/wav" }),
      );
      await ctx.runMutation(internal.audio.finalizeAudioJob, {
        jobId: args.jobId,
        storageId,
        duration: speech.samples.length / speech.sampleRate,
        contentHash: job.contentHash,
      });
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Piper failed";
      await ctx.runMutation(internal.audio.failAudioJob, {
        jobId: args.jobId,
        error: message,
      });
      return null;
    }
  },
});
