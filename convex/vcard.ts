import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

const OVERRIDES_KEY = "runtimeOverrides";

export const defaultVcardFields = {
  givenName: "Wayne",
  familyName: "Sutton",
  jobTitle: "Developer Community Lead",
  company: "Convex",
  website: "https://waynesutton.ai",
  email: "",
  photoUrl: "/images/wayne-sutton.jpeg",
};

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export const getVcardFields = internalQuery({
  args: {},
  returns: v.object({
    givenName: v.string(),
    familyName: v.string(),
    jobTitle: v.string(),
    company: v.string(),
    website: v.string(),
    email: v.string(),
    photoUrl: v.string(),
  }),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", OVERRIDES_KEY))
      .unique();

    const overrides = asRecord(row?.value);
    const vcard = asRecord(overrides?.vcard);

    return {
      givenName: readString(vcard?.givenName, defaultVcardFields.givenName),
      familyName: readString(vcard?.familyName, defaultVcardFields.familyName),
      jobTitle: readString(vcard?.jobTitle, defaultVcardFields.jobTitle),
      company: readString(vcard?.company, defaultVcardFields.company),
      website: readString(vcard?.website, defaultVcardFields.website),
      email: readString(vcard?.email, defaultVcardFields.email),
      photoUrl: readString(vcard?.photoUrl, defaultVcardFields.photoUrl),
    };
  },
});

function escapeVcard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toAbsoluteUrl(siteUrl: string, value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  const origin = siteUrl.replace(/\/$/, "");
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${origin}${path}`;
}

export function buildVcardText(
  fields: {
    givenName: string;
    familyName: string;
    jobTitle: string;
    company: string;
    website: string;
    email: string;
    photoUrl: string;
  },
  siteUrl: string,
): string {
  const fullName = `${fields.givenName} ${fields.familyName}`.trim();
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVcard(fields.familyName)};${escapeVcard(fields.givenName)};;;`,
    `FN:${escapeVcard(fullName)}`,
  ];

  if (fields.jobTitle) {
    lines.push(`TITLE:${escapeVcard(fields.jobTitle)}`);
  }
  if (fields.company) {
    lines.push(`ORG:${escapeVcard(fields.company)}`);
  }
  if (fields.website) {
    lines.push(`URL:${escapeVcard(fields.website)}`);
  }
  if (fields.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVcard(fields.email)}`);
  }
  if (fields.photoUrl) {
    lines.push(
      `PHOTO;VALUE=URI:${escapeVcard(toAbsoluteUrl(siteUrl, fields.photoUrl))}`,
    );
  }

  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}
