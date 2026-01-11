import { ConvexFS } from "convex-fs";
import { components } from "./_generated/api";

// Check if Bunny CDN is configured
// All three required env vars must be set
export const isBunnyConfigured =
  !!process.env.BUNNY_API_KEY &&
  !!process.env.BUNNY_STORAGE_ZONE &&
  !!process.env.BUNNY_CDN_HOSTNAME;

// ConvexFS instance with Bunny.net Edge Storage
// Set these environment variables in Convex Dashboard:
// - BUNNY_API_KEY: Your Bunny.net API key
// - BUNNY_STORAGE_ZONE: Storage zone name (e.g., "my-storage")
// - BUNNY_CDN_HOSTNAME: CDN hostname (e.g., "my-storage.b-cdn.net")
// - BUNNY_TOKEN_KEY: Optional, for signed URLs
// - BUNNY_REGION: Optional, storage region ("ny", "la", "sg", etc.)

// Only create ConvexFS instance if configured
// This prevents validation errors when env vars are not set
export const fs = isBunnyConfigured
  ? new ConvexFS(components.fs, {
      storage: {
        type: "bunny",
        apiKey: process.env.BUNNY_API_KEY!,
        storageZoneName: process.env.BUNNY_STORAGE_ZONE!,
        cdnHostname: process.env.BUNNY_CDN_HOSTNAME!,
        region: process.env.BUNNY_REGION,
        tokenKey: process.env.BUNNY_TOKEN_KEY,
      },
      downloadUrlTtl: 3600, // URL expiration in seconds (1 hour)
      blobGracePeriod: 86400, // Orphaned blobs deleted after 24 hours
    })
  : null;
