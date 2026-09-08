/**
 * Closing note copy. Per-page frontmatter wins, then the dashboard field,
 * then the synced footer.md page. Empty strings skip to the next source.
 */
export function resolveClosingNoteContent(args: {
  frontmatter?: string | null;
  dashboard?: string | null;
  synced?: string | null;
}): string | undefined {
  const frontmatter = args.frontmatter?.trim();
  if (frontmatter) return frontmatter;
  const dashboard = args.dashboard?.trim();
  if (dashboard) return dashboard;
  const synced = args.synced?.trim();
  if (synced) return synced;
  return undefined;
}
