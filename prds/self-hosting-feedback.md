# Feedback and feature suggestions for @convex-dev/self-hosting

Tested against version `0.1.1`. Feedback from a production Vite + React + Convex app using the self-hosted static deployment workflow.

---

## Context

This project is a markdown blog and content sync framework built on Convex. The app uses:

- Vite with `manualChunks` for vendor code splitting
- Two separate deploy paths: Convex backend functions and static frontend files
- The `npm run deploy` script maps to `npx @convex-dev/self-hosting deploy`

---

## What works well

- The `--skip-convex` flag on the `deploy` command is excellent. It lets you skip the Convex backend deploy when only frontend files changed. This is already useful.
- The `--skip-build` flag is also helpful for CI scenarios where you build separately.
- The two-step workflow (`npx convex deploy` then `upload --build --prod`) is clean and well-documented.
- The `listAssets` + `gcOldAssets` pattern for versioned deployments is solid.
- The CDN mode with convex-fs is a great option for high-traffic apps.

---

## Current behavior that causes friction

### Full upload on every deploy

Every call to `upload` re-uploads all files from `dist/`, regardless of whether they have changed since the last deployment. For a Vite app with `manualChunks`, vendor bundles like `vendor-react-AbCd1234.js` are content-hashed and will have identical filenames between builds if the dependency did not change. There is no mechanism today to skip files that are already present in Convex storage with the same path and content.

This adds unnecessary upload time and Convex storage bandwidth for large apps or fast-iteration workflows where only one or two files changed.

---

## Suggested features

### 1. Incremental upload: skip files already in storage

**Flag:** `--incremental` or `--skip-unchanged`

**Behavior:** Before uploading each file, call `listAssets` to fetch the current deployment's asset manifest. Compare each file's path and SHA-256 digest against what is already stored. Skip the upload if the path and digest match.

**Why this works with Vite:** Vite already generates content-hashed filenames for JS and CSS chunks. Files that have not changed between builds will have identical names and identical content. The comparison is cheap.

**Edge cases to handle:**
- `index.html` is never hashed by Vite and always changes. It should always be re-uploaded even in incremental mode.
- Files removed from the new build should still be garbage collected via `gcOldAssets` as normal.
- If `listAssets` returns an empty manifest (first deploy or after a GC), fall back to a full upload.

**Example usage:**

```bash
npx @convex-dev/self-hosting upload --build --prod --incremental
```

---

### 2. Dry-run mode

**Flag:** `--dry-run`

**Behavior:** Run the full diff logic (compare local dist against current deployment manifest) but do not upload anything. Print a summary of what would be uploaded, skipped, and garbage collected.

**Why this is useful:** Lets you audit what a deploy will actually push before committing bandwidth. Also useful in CI for gating deploys on meaningful change detection.

**Example output:**

```
Dry run summary for production deployment:
  Unchanged (skip): 8 files
  New or changed (upload): 2 files
    + index.html
    + assets/main-NewHash.js
  To remove (gc): 1 file
    - assets/main-OldHash.js
```

---

### 3. Manifest diff output on every upload

**Flag:** `--verbose` or `--diff`

**Behavior:** Even without `--incremental`, print a diff summary after the upload completes showing what changed relative to the previous deployment. No behavior change, just better observability.

**Example output:**

```
Deployment complete.
  Uploaded: 10 files
  Unchanged since last deploy: 8 files (would be skipped with --incremental)
  GC'd: 1 file
  New deployment ID: dep_abc123
```

---

### 4. Deploy only if frontend changed

**Flag:** `--only-if-changed`

**Behavior:** Before building or uploading, compare the local `dist/` content (or a hash of the build inputs) against the current deployment manifest. If nothing would change, exit 0 without deploying. Useful in CI to avoid no-op deploys.

**Note:** This is most useful when combined with `--incremental`. If no files are new or changed, skip the deploy entirely and print a message like `No frontend changes detected. Skipping upload.`

---

### 5. Configurable GC behavior

**Flag:** `--no-gc` and `--gc-delay <ms>`

**Current behavior:** Old assets are garbage collected immediately after a new deployment is recorded.

**Suggested improvement:** Allow a configurable delay before GC runs (e.g., `--gc-delay 60000` for 60 seconds). This gives in-flight requests to the old deployment time to complete without 404s. This is especially useful in zero-downtime deploy scenarios.

---

### 6. Upload concurrency already exists, document it more prominently

The `--concurrency` flag exists on the `upload` command but is not mentioned in `INTEGRATION.md`. Worth adding a note in the integration guide that bumping this from the default of 5 to 10 or 20 can significantly reduce upload time for larger apps.

**Suggested addition to INTEGRATION.md:**

```bash
# Speed up uploads for large apps
npx @convex-dev/self-hosting upload --build --prod --concurrency 10
```

---

## Summary table

| Feature | Flag | Status |
|---|---|---|
| Skip Convex backend deploy | `--skip-convex` | Already exists |
| Skip build step | `--skip-build` | Already exists |
| Parallel uploads | `--concurrency <n>` | Exists, underdocumented |
| Skip unchanged files | `--incremental` | Not yet |
| Dry run diff | `--dry-run` | Not yet |
| Verbose diff output | `--verbose` | Not yet |
| Skip deploy if no changes | `--only-if-changed` | Not yet |
| Configurable GC delay | `--gc-delay <ms>` | Not yet |

---

## Implementation note on incremental uploads

The `listAssets` internal function is already exposed by `exposeUploadApi`. The CLI already calls it to build the asset manifest for the new deployment. The incremental logic would be:

1. Call `listAssets` for the current (previous) deployment
2. For each file in `dist/`, compute its SHA-256
3. Check if a matching `{ path, sha256 }` record exists in the previous manifest
4. If yes, skip the upload and reuse the existing storage ID when recording the new deployment
5. If no, upload as normal and record the new storage ID

This approach requires `recordAsset` to accept an optional existing storage ID to "carry forward" an asset from a previous deployment without re-uploading the bytes. That is the only backend change needed.

---

## Repo reference

- Package: `@convex-dev/self-hosting`
- Version tested: `0.1.1`
- Source: https://github.com/get-convex/self-hosting
- Integration guide: https://raw.githubusercontent.com/get-convex/self-hosting/main/INTEGRATION.md
