# Vendor model overrides and model docs links

Created: 2026-09-05 20:00 UTC
Last Updated: 2026-09-05 23:10 UTC
Status: Implemented on dev, not deployed

## Problem

Every AI feature hardcodes its model id in server code: `claude-sonnet-4-20250514`, `gpt-4.1-mini`, `gemini-2.0-flash`, `gemini-2.0-flash-exp-image-generation`, `imagen-3.0-generate-002`, `runware:101@1`, `gpt-4o-mini-tts`, and the gateway `auto` ids. Moving to a newer model means editing `convex/aiChatActions.ts`, `convex/askAI.node.ts`, `convex/voiceAgent.ts`, `convex/aiImageGeneration.ts`, and `convex/audioGeneration.ts`, then redeploying. The Vendor keys panel in Dashboard > API Keys shows whether a provider key is set but gives no path to the provider's model list, so finding a valid id means leaving the dashboard.

## Proposed solution

Add per-provider model overrides next to the vendor keys, stored in the deployment database like key overrides, and make every AI action resolve its model through one helper.

- A new `aiModelOverrides` table keyed by vendor key name plus kind (`chat`, `image`, `tts`).
- A registration-free slot catalog (`convex/lib/aiModelSlots.ts`) lists which vendor keys have overridable models, the hardcoded defaults each slot replaces, which features use it, and a docs URL for the provider's model list.
- `convex/aiModels.ts` exposes an admin query for the slots with their current override, admin set/remove mutations, and one internal query that returns the key override and model override for a vendor in a single read.
- `convex/lib/aiProviderResolver.ts` wraps that query: `resolveAiProvider(ctx, { vendor, kind, fallbackModel })` returns `{ apiKey, model, overridden }`. Dashboard key override beats env var; model override beats the requested or hardcoded model.
- Each AI action derives the provider from the requested model id (validators stay unchanged), then swaps the model string for the override before calling the API.
- In the Vendor keys grid, a configured row for a model vendor shows a Model docs link and one line per slot: label, features it drives, effective model with an Override or Default badge, and Override / Edit / Remove actions with a plain text input.

Embedding models stay fixed. The `posts` and `pages` vector indexes are sized for 1536 dimensions, so a model swap there would need a reindex and a schema change.

## Files to change

- `convex/schema.ts`: `aiModelOverrides` table with `by_vendor_and_kind` index.
- `convex/lib/aiModelSlots.ts` (new): slot catalog, vendor docs URLs, `AiModelKind` type.
- `convex/aiModels.ts` (new): `listModelSlots`, `setModelOverride`, `removeModelOverride`, `getProviderConfig`.
- `convex/lib/aiProviderResolver.ts` (new): `resolveAiProvider`.
- `convex/aiChatActions.ts`: resolve key and model together; `callProviderApi` takes a plain string model.
- `convex/askAI.node.ts`: provider from the session model, then resolver for key and model; OpenAI key for embeddings comes from the same resolution.
- `convex/aiImageGeneration.ts`: provider from the requested model, resolver for key and model, Imagen vs Gemini branch by `imagen` prefix, effective model recorded on the job.
- `convex/audioGeneration.ts`: resolver for the TTS key and model.
- `convex/voiceAgent.ts`: agent built per run with `createOpenAI({ apiKey }).chat(model)` from the resolver.
- `src/components/dashboard/ApiKeysSection.tsx`: docs link and model slot rows.
- `src/styles/dashboard-forms.css`: `.pipeline-vendor-models` and `.pipeline-model-slot*`.
- `src/components/dashboard/docsTopics.ts`: Vendor keys and AI features topics describe model overrides.
- `convex/aiModels.test.ts` (new): admin gate, unknown slot rejection, upsert, remove, combined config read.

## Edge cases

- Provider stays pinned to the requested model id. A pasted `claude-opus-5` under `OPENAI_API_KEY` would be sent to OpenAI and fail with the provider's own error, which the chat surfaces. The UI labels each slot with its vendor to make this obvious.
- Concentrate accepts bare ids, so a pasted `concentrate/foo` is stripped to `foo` the same way the default is today. OpenRouter ids keep their `vendor/model` shape.
- One Google image override replaces both the Nano Banana and Imagen 3 picks. Ids starting with `imagen` take the `generateImages` path, everything else the `generateContent` image path.
- Runware AIR ids do not all start with `runware:` (`bfl:5@1`, `civitai:...`), so the Runware branch keys off the requested id, never the effective one.
- Empty or whitespace-containing values are rejected; ids are capped at 200 characters. Remove is idempotent.
- The AI Agent picker still shows the configured display name (for example Claude Sonnet 4) while the override is in effect. The Vendor keys row is the source of truth for the effective id.

## BYOK coverage for every vendor key

The Vendor keys grid promised "dashboard override first, then env var" for every key, but several features still read `process.env` directly, so a green Override badge could sit next to a feature that silently ignored the pasted key. Every consumer now goes through one of three resolvers, all of which check the `vendorKeys` row first and fall back to the Convex env var (treating empty and `unset` as missing):

| Resolver | Where | Used by |
|----------|-------|---------|
| `resolveAiProvider(ctx, vendor, kind, fallback)` | `convex/lib/aiProviderResolver.ts` | Actions that also need a model id: AI chat, Ask AI answer, image generation, post audio, voice agent chat |
| `resolveVendorKey(ctx, name)` / `resolveVendorKeys(ctx, names)` | `convex/lib/vendorKeyResolver.ts` | Actions and HTTP actions: embeddings (batch, regenerate, semantic search, Ask AI retrieval, voice agent RAG), Firecrawl (URL import, chat link scraping), AgentMail (post, digest, stats, custom, new subscriber, contact, automation delivery), GitHub review PRs, both webhook secrets |
| `resolveConfigValue(ctx, name)` | `convex/pipelineKeys.ts` | Mutations that gate a feature on a key: embeddings admin queue, newsletter automation enable |

`resolveVendorKeys` reads several keys in one internal query (`pipelineKeys.getVendorKeyValues`) so the AgentMail trio costs one round trip instead of three. The voice agent RAG client and the embeddings client are now built per call from the resolved key; the embedding model ids themselves stay fixed.

Existing keys are never replaced. Saving a dashboard value writes a `vendorKeys` row and leaves the Convex env var untouched; removing the row falls back to it. The UI says so: the button reads Override when the key comes from env and Replace when a dashboard override already exists, the badge reads Override (env set) when both exist (with a tooltip explaining the fallback), and the edit form shows a one line hint about what saving does. `vendorKeyStatus` gained an `envConfigured` boolean to drive this and now reads all rows in parallel.

Out of scope on purpose: `MCP_API_KEY` (server auth secret, not a vendor), `DASHBOARD_ADMIN_BOOTSTRAP_KEY`, `SITE_URL`, and the R2 and Bunny storage credentials, which configure infrastructure rather than a vendor feature.

## Verification

- `npx tsc --noEmit`, `npx tsc -p convex --noEmit` (via `npx convex dev --once` typecheck), eslint, vitest.
- `npx convex-doctor@latest` run and reviewed. The tool moved to 0.3.3 with new rules since the 100/100 baseline; test files are now excluded in `convex-doctor.toml` (never deployed, `.collect()` on purpose). Remaining findings are pre-existing and outside this PRD: `newsletterAutomation.prepareBatch` schedules one delivery per subscriber inside a loop (flagged as N+1 though scheduler calls in a mutation are transactional), public actions in `xIntegration`, `githubReview`, `pipelineKeys`, and `voiceAgent`, index naming in `schema.ts`, and CORS on four HTTP routes.
- Signed-in dev browser pass: set `OPENAI_API_KEY` chat override to another id, send a dashboard AI chat message with GPT selected, confirm the override id in the Convex function logs; remove the override and confirm the default returns. Repeat for a Google image override and a TTS override.

## Task completion log

- 2026-09-05 20:00 UTC: PRD written, tasks added to TASK.md.
- 2026-09-05 22:40 UTC: `aiModelOverrides` table, slot catalog, `aiModels.ts`, `resolveAiProvider`; chat, Ask AI, image, audio, and voice agent wired; Vendor keys grid shows Model docs and per-slot overrides; `aiModels.test.ts` added.
- 2026-09-05 23:10 UTC: BYOK coverage pass. Embeddings, semantic search, Firecrawl, AgentMail, GitHub review, webhook secrets, newsletter automation gate, and embeddings admin now honor dashboard overrides. `resolveVendorKeys` batch helper and `getVendorKeyValues` added. Vendor keys UI: Override / Replace labels, Override (env set) badge with tooltip, edit hint. Docs topic rewritten. `tsc` (app and convex), eslint, 44 vitest tests pass; convex-doctor 88/100 with only pre-existing findings.
