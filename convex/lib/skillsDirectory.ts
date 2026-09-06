// Pure helpers for the /skills directory. No Convex server imports so the
// public page can bundle the same grouping and sort logic the VFS, the
// agent-ready sync, and the "Copy as markdown" button use. One renderer means
// browsers and agents read identical content.

export type SkillSectionDoc = {
  _id: string;
  title: string;
  description?: string;
  installCommand?: string;
  order?: number;
};

export type SkillInstallCommand = { label: string; command: string };

export type SkillDoc = {
  title: string;
  command?: string;
  description: string;
  details?: string;
  sectionId?: string;
  authorName?: string;
  authorUrl?: string;
  installCommands?: Array<SkillInstallCommand>;
  repoUrl?: string;
  skillsShUrl?: string;
  docsUrl?: string;
  xUrl?: string;
  order?: number;
  featured?: boolean;
};

export const DEFAULT_SKILL_SECTION_TITLE = "Skills";
export const MAX_SKILL_INSTALL_COMMANDS = 4;

// Featured skills lead their section. Within a group, explicit order wins and
// anything unordered falls to the end, then sorts alphabetically so the list
// never reshuffles between renders.
export function compareSkills(
  a: { featured?: boolean; order?: number; title: string },
  b: { featured?: boolean; order?: number; title: string },
): number {
  const featuredA = a.featured ? 0 : 1;
  const featuredB = b.featured ? 0 : 1;
  if (featuredA !== featuredB) return featuredA - featuredB;
  const orderA = a.order ?? 999;
  const orderB = b.order ?? 999;
  if (orderA !== orderB) return orderA - orderB;
  return a.title.localeCompare(b.title);
}

export function compareSkillSections(
  a: { order?: number; title: string },
  b: { order?: number; title: string },
): number {
  const orderA = a.order ?? 999;
  const orderB = b.order ?? 999;
  if (orderA !== orderB) return orderA - orderB;
  return a.title.localeCompare(b.title);
}

export type SkillGroup<S, K> = { section: S | null; skills: Array<K> };

// Groups skills under their published section, in section order. Skills with
// no section, or whose section is missing or unpublished, land in a trailing
// default group so nothing published ever disappears from the directory.
export function groupSkills<S extends SkillSectionDoc, K extends SkillDoc>(
  sections: Array<S>,
  skills: Array<K>,
): Array<SkillGroup<S, K>> {
  const sortedSections = [...sections].sort(compareSkillSections);
  const bySection = new Map<string, Array<K>>();
  const ungrouped: Array<K> = [];
  const sectionIds = new Set(sortedSections.map((section) => section._id));
  for (const skill of skills) {
    if (skill.sectionId && sectionIds.has(skill.sectionId)) {
      const bucket = bySection.get(skill.sectionId) ?? [];
      bucket.push(skill);
      bySection.set(skill.sectionId, bucket);
    } else {
      ungrouped.push(skill);
    }
  }
  const groups: Array<SkillGroup<S, K>> = [];
  for (const section of sortedSections) {
    const bucket = bySection.get(section._id);
    if (bucket && bucket.length > 0) {
      groups.push({ section, skills: bucket.sort(compareSkills) });
    }
  }
  if (ungrouped.length > 0) {
    groups.push({ section: null, skills: ungrouped.sort(compareSkills) });
  }
  return groups;
}

// The whole directory as one markdown file: H2 per section, H3 per skill.
export function buildSkillsMarkdown(
  sections: Array<SkillSectionDoc>,
  skills: Array<SkillDoc>,
): string {
  const groups = groupSkills(sections, skills);
  const lines: Array<string> = ["# Skills", ""];
  for (const group of groups) {
    lines.push(`## ${group.section?.title ?? DEFAULT_SKILL_SECTION_TITLE}`, "");
    if (group.section?.description) {
      lines.push(group.section.description, "");
    }
    if (group.section?.installCommand) {
      lines.push(
        "Install the collection:",
        "",
        "```bash",
        group.section.installCommand,
        "```",
        "",
      );
    }
    for (const skill of group.skills) {
      lines.push(
        skill.repoUrl
          ? `### [${skill.title}](${skill.repoUrl})`
          : `### ${skill.title}`,
      );
      lines.push("");
      if (skill.command) {
        lines.push(`Command: \`${skill.command}\``, "");
      }
      lines.push(skill.description, "");
      if (skill.authorName) {
        lines.push(
          skill.authorUrl
            ? `By [${skill.authorName}](${skill.authorUrl})`
            : `By ${skill.authorName}`,
          "",
        );
      }
      if (skill.details) {
        lines.push(skill.details.trim(), "");
      }
      for (const install of skill.installCommands ?? []) {
        lines.push(`${install.label}:`, "", "```bash", install.command, "```", "");
      }
      const links: Array<string> = [];
      if (skill.repoUrl) links.push(`[Repo](${skill.repoUrl})`);
      if (skill.skillsShUrl) links.push(`[skills.sh](${skill.skillsShUrl})`);
      if (skill.docsUrl) links.push(`[Docs](${skill.docsUrl})`);
      if (skill.xUrl) links.push(`[X](${skill.xUrl})`);
      if (links.length > 0) {
        lines.push(links.join(" · "), "");
      }
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}
