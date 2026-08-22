export type AudioVoice = "male" | "female";

export const FEMALE_TTS_VOICE = "nova" as const;
export const MALE_TTS_VOICE = "onyx" as const;

export function ttsVoiceId(
  voice: AudioVoice,
): typeof FEMALE_TTS_VOICE | typeof MALE_TTS_VOICE {
  return voice === "male" ? MALE_TTS_VOICE : FEMALE_TTS_VOICE;
}

export function isAudioVoice(value: unknown): value is AudioVoice {
  return value === "male" || value === "female";
}

/** Parse optional audio / audioVoice from a markdown frontmatter block. */
export function parseAudioFrontmatter(markdown: string): {
  audio?: boolean;
  audioVoice?: AudioVoice;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match || match[1] === undefined) {
    return {};
  }

  const result: { audio?: boolean; audioVoice?: AudioVoice } = {};
  for (const line of match[1].split(/\r?\n/)) {
    const audioMatch = line.match(/^audio:\s*(true|false)\s*$/i);
    if (audioMatch && audioMatch[1] !== undefined) {
      result.audio = audioMatch[1].toLowerCase() === "true";
      continue;
    }
    const voiceMatch = line.match(/^audioVoice:\s*["']?(male|female)["']?\s*$/i);
    if (voiceMatch && voiceMatch[1] !== undefined) {
      const voice = voiceMatch[1].toLowerCase();
      if (isAudioVoice(voice)) {
        result.audioVoice = voice;
      }
    }
  }
  return result;
}

/**
 * Title plus body as spoken text. Drops fenced code, images, HTML, and
 * leftover markdown markers so the reader is not spoken.
 */
export function stripPostToSpeechText(title: string, markdown: string): string {
  let body = markdown;

  // Drop a leading frontmatter block so YAML keys are never spoken
  body = body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

  // Fenced code blocks (``` or ~~~)
  body = body.replace(/```[\s\S]*?```/g, " ");
  body = body.replace(/~~~[\s\S]*?~~~/g, " ");

  // Inline code
  body = body.replace(/`[^`]+`/g, " ");

  // Images
  body = body.replace(/!\[[^\]]*]\([^)]+\)/g, " ");

  // HTML tags including comments
  body = body.replace(/<!--[\s\S]*?-->/g, " ");
  body = body.replace(/<[^>]+>/g, " ");

  // Links keep the label
  body = body.replace(/\[([^\]]+)]\([^)]+\)/g, "$1");

  // Headings, quotes, lists, emphasis
  body = body.replace(/^#{1,6}\s+/gm, "");
  body = body.replace(/^>\s+/gm, "");
  body = body.replace(/^[-*+]\s+/gm, "");
  body = body.replace(/^\d+\.\s+/gm, "");
  body = body.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1");

  // Tables and leftover YAML-ish separators
  body = body.replace(/^\|.*\|$/gm, " ");
  body = body.replace(/^[-*]{3,}$/gm, " ");

  body = body.replace(/\r\n/g, "\n");
  body = body.replace(/[ \t]+\n/g, "\n");
  body = body.replace(/\n{3,}/g, "\n\n");
  body = body.replace(/[ \t]{2,}/g, " ");
  body = body.trim();

  const titleText = title.trim();
  if (titleText.length === 0) {
    return body;
  }
  if (body.length === 0) {
    return titleText;
  }
  return `${titleText}.\n\n${body}`;
}

/**
 * `gpt-4o-mini-tts` caps input at 2000 tokens, so the default sits near 900
 * tokens of English prose with room for longer words.
 */
export function splitSpeechChunks(text: string, maxChars = 3500): Array<string> {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return [];
  }
  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks: Array<string> = [];
  let current = "";
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current.length > 0) {
        chunks.push(current.trim());
        current = "";
      }
      for (const piece of splitByWords(sentence, maxChars)) {
        chunks.push(piece);
      }
      continue;
    }
    const next = current.length === 0 ? sentence : `${current} ${sentence}`;
    if (next.length > maxChars) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }
  return chunks;
}

function splitByWords(text: string, maxChars: number): Array<string> {
  const words = text.split(" ");
  const pieces: Array<string> = [];
  let current = "";
  for (const word of words) {
    const next = current.length === 0 ? word : `${current} ${word}`;
    if (next.length > maxChars && current.length > 0) {
      pieces.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current.length > 0) {
    pieces.push(current);
  }
  return pieces;
}

export async function hashSpeechContent(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function speechHashSource(
  title: string,
  markdown: string,
  voice: AudioVoice,
): string {
  return `${voice}\n${stripPostToSpeechText(title, markdown)}`;
}
