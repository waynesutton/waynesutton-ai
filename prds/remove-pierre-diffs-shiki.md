# Remove @pierre/diffs and Shiki from the build

Created: 2026-08-16 08:20 UTC
Last Updated: 2026-08-16 08:25 UTC
Status: Done

## Problem

Every deploy uploads ~389 files to Convex storage. Around 300 of them are Shiki
language grammars (672 in `@shikijs/langs`) and themes (122 in `@shikijs/themes`)
plus a 622 kB WASM engine chunk, all code-split by Vite into `dist/assets/`.
They enter the build through one dependency chain:

`src/components/DiffCodeBlock.tsx` -> `@pierre/diffs` (PatchDiff) -> `shiki@3.21.0`

The diffs.com docs confirm there is no non-Shiki rendering mode, and runtime
language restriction (`preloadHighlighter`, `langs: [...]`) does not change what
Vite emits at build time. The only way to drop the files is to drop the library.

## Proposed solution

Remove `@pierre/diffs` and render diff/patch code blocks with the styled
plain-text fallback that already exists inside `DiffCodeBlock.tsx` (green for
`+` lines, red for `-` lines). The component keeps its public interface
(`code`, `language`) so all five call sites are untouched.

Regular (non-diff) code blocks are unaffected: they use `react-syntax-highlighter`
with a hand-picked 14 language list in `BlogPost.tsx`.

## Files to change

- `src/components/DiffCodeBlock.tsx`: drop PatchDiff, theme map, and split/unified
  view toggle; always render the line-colored fallback with header and copy button
- `vite.config.ts`: remove the `vendor-diffs` manual chunk
- `src/styles/global.css`: remove `--diffs-*` theme variables and `.diff-view-toggle`
  selectors; keep `.diff-fallback`, `.diff-added`, `.diff-removed`, header styles
- `package.json` / lockfile: `npm uninstall @pierre/diffs`

## Edge cases

- Content with ```diff blocks that are not valid unified diffs: already rendered
  by the fallback path today, unchanged
- Split view is lost: acceptable, the toggle only existed for PatchDiff
- `VersionHistoryModal`, `Home`, `BlogPost`, `Footer` call sites: same props, no changes

## Verification steps

1. `npm run typecheck` passes
2. `npm run build` succeeds and `dist/assets` file count drops from ~330 to well under 100
3. No `wasm-*`, grammar, or theme chunks in `dist/assets`
4. Diff blocks still render with add/remove coloring on a post that uses ```diff

## Task completion log

- 2026-08-16 08:20 UTC: PRD created
- 2026-08-16 08:25 UTC: Implemented and verified. DiffCodeBlock rewritten,
  vendor-diffs chunk removed, @pierre/diffs CSS removed, package uninstalled.
  Typecheck and build pass. dist/assets: 327 files before, 34 after.
  No wasm, grammar, or theme chunks remain.
