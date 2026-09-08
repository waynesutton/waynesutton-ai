import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import ReactMarkdown from "react-markdown";
import {
  GithubLogo,
  XLogo,
  Terminal,
  BookOpen,
  Copy,
  Check,
  LinkSimple,
  FileText,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import Footer from "../components/Footer";
import SocialFooter from "../components/SocialFooter";
import siteConfig from "../config/siteConfig";
import {
  groupSkills,
  DEFAULT_SKILL_SECTION_TITLE,
  type SkillInstallCommand,
} from "../../convex/lib/skillsDirectory";

const FILTER_THRESHOLD = 6;
const COPIED_RESET_MS = 1500;

type Section = {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  installCommand?: string;
  order?: number;
};

type Skill = {
  _id: string;
  slug: string;
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

type CopyState = "idle" | "copied" | "failed";

// One hook per copy target so several buttons on the page never share state.
function useCopy(): [CopyState, (text: string) => Promise<void>] {
  const [state, setState] = useState<CopyState>("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [state]);
  const copy = useCallback(async (text: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  }, []);
  return [state, copy];
}

function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [state, copy] = useCopy();
  return (
    <button
      type="button"
      className={`skill-copy${className ? ` ${className}` : ""}`}
      data-state={state}
      onClick={() => void copy(text)}
      aria-label={state === "copied" ? "Copied" : label}
    >
      {state === "copied" ? (
        <Check size={14} weight="bold" />
      ) : (
        <Copy size={14} weight="regular" />
      )}
      <span className="skill-copy-text">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
      </span>
    </button>
  );
}

// Terminal-style install line. Several labeled commands become small tabs over
// one prompt so the card stays a single height whichever tab is active.
function InstallBlock({
  commands,
  idPrefix,
}: {
  commands: Array<SkillInstallCommand>;
  idPrefix: string;
}) {
  const [active, setActive] = useState(0);
  const current = commands[Math.min(active, commands.length - 1)];
  if (!current) return null;
  return (
    <div className="skill-install">
      {commands.length > 1 && (
        <div className="skill-install-tabs" role="tablist" aria-label="Install with">
          {commands.map((entry, index) => (
            <button
              key={`${entry.label}-${index}`}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${index}`}
              aria-selected={index === active}
              aria-controls={`${idPrefix}-panel`}
              className="skill-install-tab"
              onClick={() => setActive(index)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      )}
      <div
        className="skill-install-line"
        role={commands.length > 1 ? "tabpanel" : undefined}
        id={`${idPrefix}-panel`}
        aria-labelledby={
          commands.length > 1 ? `${idPrefix}-tab-${active}` : undefined
        }
      >
        <span className="skill-install-prompt" aria-hidden="true">
          $
        </span>
        <code className="skill-install-command">{current.command}</code>
        <CopyButton
          text={current.command}
          label={`Copy ${current.label} command`}
        />
      </div>
    </div>
  );
}

// Only filled links get an icon. An empty field hides that glyph entirely so a
// missing URL never reads as a disabled control.
const RAIL_LINKS = [
  { key: "repoUrl", Icon: GithubLogo, label: "source on GitHub" },
  { key: "skillsShUrl", Icon: Terminal, label: "on skills.sh" },
  { key: "docsUrl", Icon: BookOpen, label: "documentation" },
  { key: "xUrl", Icon: XLogo, label: "on X" },
] as const;

function SkillLinkRail({ skill }: { skill: Skill }) {
  const links = RAIL_LINKS.flatMap(({ key, Icon, label }) => {
    const href = skill[key]?.trim();
    return href ? [{ key, Icon, label, href }] : [];
  });
  if (links.length === 0) return null;
  return (
    <div className="skill-rail">
      {links.map(({ key, Icon, label, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="skill-rail-icon"
          aria-label={`${skill.title} ${label}`}
        >
          <Icon size={18} weight="regular" />
        </a>
      ))}
    </div>
  );
}

function SkillTitle({ skill }: { skill: Skill }) {
  if (!skill.repoUrl) {
    return <h3 className="skill-title">{skill.title}</h3>;
  }
  return (
    <h3 className="skill-title">
      <a
        href={skill.repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="skill-title-link"
      >
        {skill.title}
      </a>
    </h3>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const installCommands = (skill.installCommands ?? []).filter(
    (entry) => entry.command.trim().length > 0,
  );
  return (
    <article id={skill.slug} className="skill-card">
      <div className="skill-head">
        {skill.command ? (
          <code className="skill-command">{skill.command}</code>
        ) : (
          <span className="skill-command skill-command-empty" aria-hidden="true" />
        )}
        <a
          href={`#${skill.slug}`}
          className="skill-anchor"
          aria-label={`Link to ${skill.title}`}
        >
          <LinkSimple size={14} weight="bold" />
        </a>
      </div>
      <SkillTitle skill={skill} />
      <p className="skill-description">{skill.description}</p>
      {skill.authorName && (
        <p className="skill-author">
          by{" "}
          {skill.authorUrl ? (
            <a href={skill.authorUrl} target="_blank" rel="noopener noreferrer">
              {skill.authorName}
            </a>
          ) : (
            skill.authorName
          )}
        </p>
      )}
      {installCommands.length > 0 && (
        <InstallBlock commands={installCommands} idPrefix={`skill-${skill.slug}`} />
      )}
      {skill.details && skill.details.trim().length > 0 && (
        <details className="skill-details">
          <summary>When to use</summary>
          <div className="skill-details-body">
            <ReactMarkdown>{skill.details}</ReactMarkdown>
          </div>
        </details>
      )}
      <SkillLinkRail skill={skill} />
    </article>
  );
}

function matchesFilter(skill: Skill, needle: string): boolean {
  const haystack = [
    skill.title,
    skill.command ?? "",
    skill.description,
    skill.authorName ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

// Skills directory: sections of agent skills, each a slash command, one line,
// an install prompt, and a link rail. No detail routes; cards carry anchors.
export default function Skills() {
  const directory = useQuery(api.skills.listDirectory);
  const markdown = useQuery(api.skills.getMarkdown);
  const footerPage = useQuery(api.pages.getPageBySlug, { slug: "footer" });
  const [filter, setFilter] = useState("");
  const [markdownState, copyMarkdown] = useCopy();

  const config = siteConfig.skillsPage;
  const title = config?.title ?? "Skills";

  useEffect(() => {
    document.title = `${title} | ${siteConfig.name}`;
    return () => {
      document.title = siteConfig.name;
    };
  }, [title]);

  // Deep links land on the card once data has rendered.
  useEffect(() => {
    if (!directory || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ block: "start" });
    }
  }, [directory]);

  const total = directory?.skills.length ?? 0;
  const needle = filter.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!directory) return [];
    const skills = needle
      ? directory.skills.filter((skill) => matchesFilter(skill, needle))
      : directory.skills;
    return groupSkills<Section, Skill>(directory.sections, skills);
  }, [directory, needle]);

  const visibleCount = groups.reduce((sum, group) => sum + group.skills.length, 0);

  const showFooter =
    siteConfig.footer.enabled && siteConfig.footer.showOnBlogPage;

  return (
    <div className="skills-page">
      <header className="skills-header">
        <div className="skills-header-top">
          <div>
            <h1 className="skills-title">{title}</h1>
            {config?.description && (
              <p className="skills-description">{config.description}</p>
            )}
          </div>
          {total > 0 && (
            <div className="skills-header-actions">
              <button
                type="button"
                className="skills-markdown-button"
                data-state={markdownState}
                disabled={markdown === undefined}
                onClick={() => {
                  if (markdown !== undefined) void copyMarkdown(markdown);
                }}
              >
                {markdownState === "copied" ? (
                  <Check size={14} weight="bold" />
                ) : (
                  <FileText size={14} weight="regular" />
                )}
                {markdownState === "copied"
                  ? "Copied"
                  : markdownState === "failed"
                    ? "Copy failed"
                    : "Copy as markdown"}
              </button>
            </div>
          )}
        </div>
        {total > 0 && (
          <div className="skills-meta">
            <span className="skills-count">
              {total} {total === 1 ? "skill" : "skills"}
            </span>
            <span className="skills-meta-sep" aria-hidden="true">
              ·
            </span>
            <span className="skills-agent-hint">
              Agents:{" "}
              <code className="skills-agent-path" title="cat /skills.md via /vfs/exec">
                skills.md
              </code>
            </span>
          </div>
        )}
        {total > FILTER_THRESHOLD && (
          <div className="skills-filter">
            <input
              type="search"
              className="skills-filter-input"
              placeholder="Filter skills"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter skills"
            />
          </div>
        )}
      </header>

      {directory === undefined ? null : total === 0 ? (
        <p className="skills-empty">
          No skills yet. Add the first one from the dashboard.
        </p>
      ) : visibleCount === 0 ? (
        <p className="skills-empty">No skills match "{filter.trim()}".</p>
      ) : (
        <div className="skills-sections">
          {groups.map((group) => {
            const section = group.section;
            const key = section ? section._id : "__default";
            const heading = section?.title ?? DEFAULT_SKILL_SECTION_TITLE;
            const sectionId = section ? `section-${section.slug}` : "section-skills";
            return (
              <section key={key} className="skills-section" aria-labelledby={sectionId}>
                {(groups.length > 1 || section) && (
                  <div className="skills-section-head">
                    <h2 id={sectionId} className="skills-section-title">
                      {heading}
                    </h2>
                    {section?.description && (
                      <p className="skills-section-description">
                        {section.description}
                      </p>
                    )}
                    {section?.installCommand && (
                      <div className="skill-install skills-section-install">
                        <div className="skill-install-line">
                          <span className="skill-install-prompt" aria-hidden="true">
                            $
                          </span>
                          <code className="skill-install-command">
                            {section.installCommand}
                          </code>
                          <CopyButton
                            text={section.installCommand}
                            label={`Copy install command for ${heading}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="skills-grid">
                  {group.skills.map((skill) => (
                    <SkillCard key={skill._id} skill={skill} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showFooter && <Footer syncedContent={footerPage?.content} />}

      <SocialFooter surface="blog" />
    </div>
  );
}
