"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import {
  splitSpeechChunks,
  stripPostToSpeechText,
  ttsVoiceId,
  type AudioVoice,
} from "./lib/audioText";

// OpenAI returns raw PCM as 24kHz, 16-bit signed little endian, mono.
const PCM_SAMPLE_RATE = 24000;
const PCM_BYTES_PER_SAMPLE = 2;
const TTS_MODEL = "gpt-4o-mini-tts";

type GeneratedSpeech = {
  /** Raw 16-bit little endian PCM, ready to wrap in a WAV container. */
  pcm: Uint8Array;
  sampleRate: number;
};

function encodeWav(pcm: Uint8Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * PCM_BYTES_PER_SAMPLE, true);
  view.setUint16(32, PCM_BYTES_PER_SAMPLE, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcm.length, true);

  new Uint8Array(buffer, 44).set(pcm);

  return buffer;
}

function concatPcm(parts: Array<Uint8Array>): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

function speechDurationSeconds(pcm: Uint8Array, sampleRate: number): number {
  return pcm.length / PCM_BYTES_PER_SAMPLE / sampleRate;
}

async function synthesizeWithOpenAI(
  text: string,
  voice: AudioVoice,
): Promise<GeneratedSpeech> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured in Convex environment");
  }

  const chunks = splitSpeechChunks(text);
  if (chunks.length === 0) {
    throw new Error("No speakable text");
  }

  const openai = new OpenAI({ apiKey });
  const parts: Array<Uint8Array> = [];

  // PCM chunks concatenate cleanly, so long posts stay a single seamless file.
  for (const chunk of chunks) {
    const response = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: ttsVoiceId(voice),
      input: chunk,
      response_format: "pcm",
    });
    parts.push(new Uint8Array(await response.arrayBuffer()));
  }

  const pcm = concatPcm(parts);
  if (pcm.length === 0) {
    throw new Error("TTS returned no audio samples");
  }

  return { pcm, sampleRate: PCM_SAMPLE_RATE };
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
      const speech = await synthesizeWithOpenAI(spoken, job.voice);
      const wav = encodeWav(speech.pcm, speech.sampleRate);
      const storageId = await ctx.storage.store(
        new Blob([wav], { type: "audio/wav" }),
      );
      await ctx.runMutation(internal.audio.finalizeAudioJob, {
        jobId: args.jobId,
        storageId,
        duration: speechDurationSeconds(speech.pcm, speech.sampleRate),
        contentHash: job.contentHash,
      });
      return null;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Speech generation failed";
      await ctx.runMutation(internal.audio.failAudioJob, {
        jobId: args.jobId,
        error: message,
      });
      return null;
    }
  },
});
