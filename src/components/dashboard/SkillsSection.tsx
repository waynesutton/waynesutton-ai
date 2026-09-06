import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  ArrowSquareOut,
  BookOpen,
  DownloadSimple,
  GithubLogo,
  PencilSimple,
  Plus,
  SpinnerGap,
  Terminal,
  Trash,
  Warning,
  X,
  XLogo,
} from "@phosphor-icons/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MAX_SKILL_INSTALL_COMMANDS } from "../../../convex/lib/skillsDirectory";
import siteConfig from "../../config/siteConfig";
import { prefillFromSkillMdUrl, slugifySkillName } from "../../utils/skillMdPrefill";

type ToastType = "success" | "error" | "info" | "warning";

type SectionDoc = {
  _id: Id<"skillSections">;
  slug: string;
  title: string;
  description?: string;
  installCommand?: string;
  order?: number;
  published: boolean;
};

type InstallCommand = { label: string; command: string };

type SkillDoc = {
  _id: Id<"skills">;
  slug: string;
  title: string;
  command?: string;
  description: string;
  details?: string;
  sectionId?: Id<"skillSections">;
  authorName?: string;
  authorUrl?: string;
  installCommands?: Array<InstallCommand>;
  repoUrl?: string;
  skillsShUrl?: string;
  docsUrl?: string;
  xUrl?: string;
  published: boolean;
  order?: number;
  featured?: boolean;
};

// Optional string fields the skill form can empty out. Convex strips undefined
// from nested mutation args, so an emptied field is named explicitly to clear it.
const SKILL_OPTIONAL_FIELDS = [
  "command",
  "details",
  "authorName",
  "authorUrl",
  "repoUrl",
  "skillsShUrl",
  "docsUrl",
  "xUrl",
] as const;

type SkillOptionalField = (typeof SKILL_OPTIONAL_FIELDS)[number];
type SkillClearableField =
  | SkillOptionalField
  | "sectionId"
  | "installCommands"
  | "order"
  | "featured";

type SectionClearableField = "description" | "installCommand" | "order";

type SkillForm = {
  title: string;
  slug: string;
  command: string;
  description: string;
  details: string;
  sectionId: string;
  authorName: string;
  authorUrl: string;
  installCommands: Array<InstallCommand>;
  repoUrl: string;
  skillsShUrl: string;
  docsUrl: string;
  xUrl: string;
  published: boolean;
  featured: boolean;
  order: string;
};

const EMPTY_SKILL_FORM: SkillForm = {
  title: "",
  slug: "",
  command: "",
  description: "",
  details: "",
  sectionId: "",
  authorName: "",
  authorUrl: "",
  installCommands: [],
  repoUrl: "",
  skillsShUrl: "",
  docsUrl: "",
  xUrl: "",
  published: true,
  featured: false,
  order: "",
};

type SectionForm = {
  title: string;
  slug: string;
  description: string;
  installCommand: string;
  order: string;
  published: boolean;
};

const EMPTY_SECTION_FORM: SectionForm = {
  title: "",
  slug: "",
  description: "",
  installCommand: "",
  order: "",
  published: true,
};

function skillToForm(skill: SkillDoc): SkillForm {
  return {
    title: skill.title,
    slug: skill.slug,
    command: skill.command ?? "",
    description: skill.description,
    details: skill.details ?? "",
    sectionId: skill.sectionId ?? "",
    authorName: skill.authorName ?? "",
    authorUrl: skill.authorUrl ?? "",
    installCommands: (skill.installCommands ?? []).map((entry) => ({ ...entry })),
    repoUrl: skill.repoUrl ?? "",
    skillsShUrl: skill.skillsShUrl ?? "",
    docsUrl: skill.docsUrl ?? "",
    xUrl: skill.xUrl ?? "",
    published: skill.published,
    featured: skill.featured ?? false,
    order: skill.order !== undefined ? String(skill.order) : "",
  };
}

function sectionToForm(section: SectionDoc): SectionForm {
  return {
    title: section.title,
    slug: section.slug,
    description: section.description ?? "",
    installCommand: section.installCommand ?? "",
    order: section.order !== undefined ? String(section.order) : "",
    published: section.published,
  };
}

function parseOrder(value: string): number | undefined | null {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function ConfirmDeleteModal({
  title,
  message,
  itemName,
  confirmLabel,
  cancelLabel,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  itemName: string;
  confirmLabel: string;
  cancelLabel: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="dashboard-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}>
      <div
        className="dashboard-modal dashboard-modal-delete"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-skill-title">
        <div className="dashboard-modal-header">
          <div className="dashboard-modal-icon dashboard-modal-icon-warning">
            <Warning size={20} />
          </div>
          <h3 id="delete-skill-title" className="dashboard-modal-title">
            {title}
          </h3>
          <button
            className="dashboard-modal-close"
            aria-label="Close dialog"
            onClick={onCancel}
            disabled={isDeleting}>
            <X size={18} />
          </button>
        </div>
        <div className="dashboard-modal-content">
          <p className="dashboard-modal-message">{message}</p>
          <div className="dashboard-modal-item-name">{itemName}</div>
        </div>
        <div className="dashboard-modal-footer">
          <div className="dashboard-modal-actions">
            <button className="dashboard-modal-btn secondary" onClick={onCancel} disabled={isDeleting}>
              {cancelLabel}
            </button>
            <button className="dashboard-modal-btn danger" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? <SpinnerGap size={16} className="animate-spin" /> : <Trash size={16} />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skills dashboard section. Two stacked cards: the sections that group the
 * directory, and the skills themselves. Skills are dashboard-only content with
 * no markdown source and no detail page, so this is the single place they are
 * created, ordered, grouped, and published.
 */
export function SkillsSection({
  addToast,
  searchQuery,
}: {
  addToast: (message: string, type?: ToastType) => void;
  searchQuery: string;
}) {
  const skills = useQuery(api.skills.listAllSkills);
  const sections = useQuery(api.skills.listAllSections);
  const createSkill = useMutation(api.skills.createSkill);
  const updateSkill = useMutation(api.skills.updateSkill);
  const removeSkill = useMutation(api.skills.removeSkill);
  const createSection = useMutation(api.skills.createSection);
  const updateSection = useMutation(api.skills.updateSection);
  const removeSection = useMutation(api.skills.removeSection);

  // Skill editor: null = list view, "new" = create, otherwise the skill being edited
  const [editingSkillId, setEditingSkillId] = useState<Id<"skills"> | "new" | null>(null);
  const [skillForm, setSkillForm] = useState<SkillForm>(EMPTY_SKILL_FORM);
  const [skillSlugTouched, setSkillSlugTouched] = useState(false);
  const [isSavingSkill, setIsSavingSkill] = useState(false);
  const [pendingSkillDelete, setPendingSkillDelete] = useState<SkillDoc | null>(null);

  // Section editor lives inline inside the sections card
  const [editingSectionId, setEditingSectionId] = useState<Id<"skillSections"> | "new" | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionForm>(EMPTY_SECTION_FORM);
  const [sectionSlugTouched, setSectionSlugTouched] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [pendingSectionDelete, setPendingSectionDelete] = useState<SectionDoc | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // SKILL.md prefill
  const [prefillUrl, setPrefillUrl] = useState("");
  const [isPrefilling, setIsPrefilling] = useState(false);

  const skillsPageEnabled = siteConfig.skillsPage?.enabled ?? false;

  const query = searchQuery.trim().toLowerCase();
  const visibleSkills = (skills ?? []).filter(
    (skill) =>
      !query ||
      skill.title.toLowerCase().includes(query) ||
      skill.slug.toLowerCase().includes(query) ||
      (skill.command ?? "").toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query),
  );

  const sectionTitleById = new Map<string, string>(
    (sections ?? []).map((section) => [section._id, section.title]),
  );
  const skillCountBySection = new Map<string, number>();
  for (const skill of skills ?? []) {
    if (skill.sectionId) {
      skillCountBySection.set(skill.sectionId, (skillCountBySection.get(skill.sectionId) ?? 0) + 1);
    }
  }

  const setSkillField = <K extends keyof SkillForm>(key: K, value: SkillForm[K]) => {
    setSkillForm((prev) => ({ ...prev, [key]: value }));
  };

  const setSectionField = <K extends keyof SectionForm>(key: K, value: SectionForm[K]) => {
    setSectionForm((prev) => ({ ...prev, [key]: value }));
  };

  // --- Skill editor handlers ---

  const startCreateSkill = () => {
    setSkillForm(EMPTY_SKILL_FORM);
    setSkillSlugTouched(false);
    setPrefillUrl("");
    setEditingSkillId("new");
  };

  const startEditSkill = (skill: SkillDoc) => {
    setSkillForm(skillToForm(skill));
    setSkillSlugTouched(true);
    setPrefillUrl("");
    setEditingSkillId(skill._id);
  };

  const closeSkillForm = () => {
    setEditingSkillId(null);
    setSkillForm(EMPTY_SKILL_FORM);
    setSkillSlugTouched(false);
    setPrefillUrl("");
  };

  // Slug mirrors the title until the author edits it directly
  const handleSkillTitleChange = (title: string) => {
    setSkillForm((prev) => ({
      ...prev,
      title,
      slug: skillSlugTouched ? prev.slug : slugifySkillName(title),
    }));
  };

  const handlePrefill = async () => {
    if (!prefillUrl.trim()) {
      addToast("Paste a GitHub SKILL.md link first", "error");
      return;
    }
    setIsPrefilling(true);
    try {
      const prefill = await prefillFromSkillMdUrl(prefillUrl);
      setSkillForm((prev) => ({
        ...prev,
        title: prefill.title || prev.title,
        slug: prefill.slug || prev.slug,
        command: prefill.command || prev.command,
        description: prefill.description || prev.description,
        repoUrl: prefill.repoUrl || prev.repoUrl,
        installCommands:
          prev.installCommands.length > 0 ? prev.installCommands : prefill.installCommands,
      }));
      setSkillSlugTouched(true);
      addToast("Prefilled from SKILL.md. Check the fields and save.", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not read SKILL.md", "error");
    } finally {
      setIsPrefilling(false);
    }
  };

  const updateInstallCommand = (index: number, patch: Partial<InstallCommand>) => {
    setSkillForm((prev) => ({
      ...prev,
      installCommands: prev.installCommands.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const addInstallCommand = () => {
    setSkillForm((prev) => {
      if (prev.installCommands.length >= MAX_SKILL_INSTALL_COMMANDS) return prev;
      return {
        ...prev,
        installCommands: [...prev.installCommands, { label: "", command: "" }],
      };
    });
  };

  const removeInstallCommand = (index: number) => {
    setSkillForm((prev) => ({
      ...prev,
      installCommands: prev.installCommands.filter((_, i) => i !== index),
    }));
  };

  const handleSaveSkill = async () => {
    const title = skillForm.title.trim();
    const slug = slugifySkillName(skillForm.slug || skillForm.title);
    const description = skillForm.description.trim();

    if (!title) {
      addToast("Add a skill title before saving", "error");
      return;
    }
    if (!slug) {
      addToast("Add a slug before saving", "error");
      return;
    }
    if (!description) {
      addToast("Add a one line description before saving", "error");
      return;
    }
    const parsedOrder = parseOrder(skillForm.order);
    if (parsedOrder === null) {
      addToast("Order must be a number", "error");
      return;
    }

    // Drop empty rows; reject half-filled ones so the page never shows a blank tab
    const installCommands = skillForm.installCommands
      .map((entry) => ({ label: entry.label.trim(), command: entry.command.trim() }))
      .filter((entry) => entry.label || entry.command);
    if (installCommands.some((entry) => !entry.label || !entry.command)) {
      addToast("Each install command needs a label and a command", "error");
      return;
    }

    const optionalValues: Record<SkillOptionalField, string> = {
      command: skillForm.command.trim(),
      details: skillForm.details.trim(),
      authorName: skillForm.authorName.trim(),
      authorUrl: skillForm.authorUrl.trim(),
      repoUrl: skillForm.repoUrl.trim(),
      skillsShUrl: skillForm.skillsShUrl.trim(),
      docsUrl: skillForm.docsUrl.trim(),
      xUrl: skillForm.xUrl.trim(),
    };
    const filledOptional = Object.fromEntries(
      SKILL_OPTIONAL_FIELDS.filter((key) => optionalValues[key]).map((key) => [
        key,
        optionalValues[key],
      ]),
    );
    const sectionId = skillForm.sectionId
      ? (skillForm.sectionId as Id<"skillSections">)
      : undefined;

    setIsSavingSkill(true);
    try {
      if (editingSkillId === "new") {
        await createSkill({
          skill: {
            slug,
            title,
            description,
            published: skillForm.published,
            featured: skillForm.featured || undefined,
            order: parsedOrder,
            sectionId,
            installCommands: installCommands.length > 0 ? installCommands : undefined,
            ...filledOptional,
          },
        });
        addToast(`"${title}" created`, "success");
      } else if (editingSkillId) {
        const clearFields: Array<SkillClearableField> = SKILL_OPTIONAL_FIELDS.filter(
          (key) => !optionalValues[key],
        );
        if (parsedOrder === undefined) clearFields.push("order");
        if (!skillForm.featured) clearFields.push("featured");
        if (!sectionId) clearFields.push("sectionId");
        if (installCommands.length === 0) clearFields.push("installCommands");

        await updateSkill({
          id: editingSkillId,
          skill: {
            slug,
            title,
            description,
            published: skillForm.published,
            featured: skillForm.featured || undefined,
            order: parsedOrder,
            sectionId,
            installCommands: installCommands.length > 0 ? installCommands : undefined,
            ...filledOptional,
          },
          clearFields,
        });
        addToast(`"${title}" saved`, "success");
      }
      closeSkillForm();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setIsSavingSkill(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!pendingSkillDelete) return;
    setIsDeleting(true);
    try {
      await removeSkill({ id: pendingSkillDelete._id });
      addToast(`"${pendingSkillDelete.title}" deleted`, "success");
      if (editingSkillId === pendingSkillDelete._id) closeSkillForm();
      setPendingSkillDelete(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Delete failed", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Section editor handlers ---

  const startCreateSection = () => {
    setSectionForm(EMPTY_SECTION_FORM);
    setSectionSlugTouched(false);
    setEditingSectionId("new");
  };

  const startEditSection = (section: SectionDoc) => {
    setSectionForm(sectionToForm(section));
    setSectionSlugTouched(true);
    setEditingSectionId(section._id);
  };

  const closeSectionForm = () => {
    setEditingSectionId(null);
    setSectionForm(EMPTY_SECTION_FORM);
    setSectionSlugTouched(false);
  };

  const handleSectionTitleChange = (title: string) => {
    setSectionForm((prev) => ({
      ...prev,
      title,
      slug: sectionSlugTouched ? prev.slug : slugifySkillName(title),
    }));
  };

  const handleSaveSection = async () => {
    const title = sectionForm.title.trim();
    const slug = slugifySkillName(sectionForm.slug || sectionForm.title);
    if (!title) {
      addToast("Add a section title before saving", "error");
      return;
    }
    if (!slug) {
      addToast("Add a slug before saving", "error");
      return;
    }
    const parsedOrder = parseOrder(sectionForm.order);
    if (parsedOrder === null) {
      addToast("Order must be a number", "error");
      return;
    }
    const description = sectionForm.description.trim();
    const installCommand = sectionForm.installCommand.trim();

    setIsSavingSection(true);
    try {
      if (editingSectionId === "new") {
        await createSection({
          section: {
            slug,
            title,
            published: sectionForm.published,
            order: parsedOrder,
            description: description || undefined,
            installCommand: installCommand || undefined,
          },
        });
        addToast(`Section "${title}" created`, "success");
      } else if (editingSectionId) {
        const clearFields: Array<SectionClearableField> = [];
        if (!description) clearFields.push("description");
        if (!installCommand) clearFields.push("installCommand");
        if (parsedOrder === undefined) clearFields.push("order");
        await updateSection({
          id: editingSectionId,
          section: {
            slug,
            title,
            published: sectionForm.published,
            order: parsedOrder,
            description: description || undefined,
            installCommand: installCommand || undefined,
          },
          clearFields,
        });
        addToast(`Section "${title}" saved`, "success");
      }
      closeSectionForm();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!pendingSectionDelete) return;
    setIsDeleting(true);
    try {
      await removeSection({ id: pendingSectionDelete._id });
      addToast(`Section "${pendingSectionDelete.title}" deleted`, "success");
      if (editingSectionId === pendingSectionDelete._id) closeSectionForm();
      setPendingSectionDelete(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Delete failed", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Skill editor form ---
  if (editingSkillId !== null) {
    const canAddInstall = skillForm.installCommands.length < MAX_SKILL_INSTALL_COMMANDS;
    return (
      <div className="dashboard-config-section">
        <div className="dashboard-list-header">
          <h2 className="dashboard-section-heading">
            {editingSkillId === "new" ? "New skill" : "Edit skill"}
          </h2>
          <div className="dashboard-list-header-actions">
            <button type="button" className="dashboard-action-btn" onClick={closeSkillForm}>
              Cancel
            </button>
            <button
              type="button"
              className="dashboard-action-btn success"
              onClick={() => void handleSaveSkill()}
              disabled={isSavingSkill}
              aria-busy={isSavingSkill}>
              {isSavingSkill ? <SpinnerGap size={16} className="animate-spin" /> : <Plus size={16} />}
              {editingSkillId === "new" ? "Create skill" : "Save skill"}
            </button>
          </div>
        </div>

        <div className="dashboard-config-grid">
          <div className="dashboard-config-card">
            <h3>Details</h3>
            <div className="config-field">
              <label htmlFor="skill-prefill">Prefill from SKILL.md</label>
              <div className="skill-prefill-row">
                <input
                  id="skill-prefill"
                  type="url"
                  value={prefillUrl}
                  onChange={(e) => setPrefillUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handlePrefill();
                    }
                  }}
                  placeholder="https://github.com/owner/repo/blob/main/skill/SKILL.md"
                />
                <button
                  type="button"
                  className="dashboard-action-btn"
                  onClick={() => void handlePrefill()}
                  disabled={isPrefilling}
                  aria-busy={isPrefilling}>
                  {isPrefilling ? (
                    <SpinnerGap size={16} className="animate-spin" />
                  ) : (
                    <DownloadSimple size={16} />
                  )}
                  Prefill
                </button>
              </div>
              <span className="config-field-note">
                Paste a GitHub link to a SKILL.md or its folder. Fills the title, slug,
                command, description, repo link, and a Skills CLI install command.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="skill-title">Title</label>
              <input
                id="skill-title"
                type="text"
                value={skillForm.title}
                onChange={(e) => handleSkillTitleChange(e.target.value)}
                placeholder="Blog post"
              />
            </div>
            <div className="config-field">
              <label htmlFor="skill-slug">Slug</label>
              <input
                id="skill-slug"
                type="text"
                value={skillForm.slug}
                onChange={(e) => {
                  setSkillSlugTouched(true);
                  setSkillField("slug", e.target.value);
                }}
                placeholder="blog-post"
              />
              <span className="config-field-note">
                Anchor on the directory: /skills#{skillForm.slug || "slug"}. Not a page of its own.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="skill-command">Command</label>
              <input
                id="skill-command"
                type="text"
                value={skillForm.command}
                onChange={(e) => setSkillField("command", e.target.value)}
                placeholder="/blog-post"
              />
              <span className="config-field-note">
                The slash command an agent runs. Shown in mono at the top of the card.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="skill-description">Description</label>
              <textarea
                id="skill-description"
                value={skillForm.description}
                onChange={(e) => setSkillField("description", e.target.value)}
                rows={2}
                placeholder="Draft a blog post in your voice from notes or a transcript"
              />
              <span className="config-field-note">One line. What the skill does.</span>
            </div>
            <div className="config-field">
              <label htmlFor="skill-details">When to use</label>
              <textarea
                id="skill-details"
                value={skillForm.details}
                onChange={(e) => setSkillField("details", e.target.value)}
                rows={4}
                placeholder="Optional markdown. Shown behind a collapsible toggle on the card."
              />
            </div>
            <div className="config-field">
              <label htmlFor="skill-section">Section</label>
              <select
                id="skill-section"
                value={skillForm.sectionId}
                onChange={(e) => setSkillField("sectionId", e.target.value)}>
                <option value="">No section (default group)</option>
                {(sections ?? []).map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.title}
                    {section.published ? "" : " (draft)"}
                  </option>
                ))}
              </select>
              <span className="config-field-note">
                Skills without a section, or in a draft section, render under a plain
                "Skills" heading.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="skill-order">Order</label>
              <input
                id="skill-order"
                type="number"
                value={skillForm.order}
                onChange={(e) => setSkillField("order", e.target.value)}
                placeholder="Leave blank to sort last"
              />
              <span className="config-field-note">Lower numbers come first within a section.</span>
            </div>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={skillForm.published}
                  onChange={(e) => setSkillField("published", e.target.checked)}
                />
                <span>Published</span>
              </label>
            </div>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={skillForm.featured}
                  onChange={(e) => setSkillField("featured", e.target.checked)}
                />
                <span>Pin to the top of its section</span>
              </label>
            </div>
          </div>

          <div className="dashboard-config-card">
            <h3>Install commands</h3>
            <span className="config-field-note">
              Up to {MAX_SKILL_INSTALL_COMMANDS}. Each label becomes a tab over one copyable
              command. Leave empty to hide the install block.
            </span>
            <div className="skill-install-rows">
              {skillForm.installCommands.map((entry, index) => (
                <div key={index} className="skill-install-row">
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(e) => updateInstallCommand(index, { label: e.target.value })}
                    placeholder="Skills CLI"
                    aria-label={`Install command ${index + 1} label`}
                    className="skill-install-row-label"
                  />
                  <input
                    type="text"
                    value={entry.command}
                    onChange={(e) => updateInstallCommand(index, { command: e.target.value })}
                    placeholder="npx skills add owner/repo --skill blog-post"
                    aria-label={`Install command ${index + 1}`}
                    className="skill-install-row-command"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="action-btn delete"
                    onClick={() => removeInstallCommand(index)}
                    title="Remove install command"
                    aria-label={`Remove install command ${index + 1}`}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="dashboard-action-btn"
              onClick={addInstallCommand}
              disabled={!canAddInstall}>
              <Plus size={16} />
              Add install command
            </button>

            <h3 className="skill-form-subheading">Author</h3>
            <span className="config-field-note">
              Fill in for skills you did not write. The card shows "by Author" only when set.
            </span>
            <div className="config-field">
              <label htmlFor="skill-author-name">Author name</label>
              <input
                id="skill-author-name"
                type="text"
                value={skillForm.authorName}
                onChange={(e) => setSkillField("authorName", e.target.value)}
                placeholder="Matt Pocock"
              />
            </div>
            <div className="config-field">
              <label htmlFor="skill-author-url">Author URL</label>
              <input
                id="skill-author-url"
                type="url"
                value={skillForm.authorUrl}
                onChange={(e) => setSkillField("authorUrl", e.target.value)}
                placeholder="https://x.com/mattpocockuk"
              />
            </div>
          </div>

          <div className="dashboard-config-card">
            <h3>Links</h3>
            <span className="config-field-note">
              Leave a field blank and its icon stays hidden. Only filled links show on the
              card.
            </span>
            <div className="config-field">
              <label htmlFor="skill-repo">Repository URL</label>
              <input
                id="skill-repo"
                type="url"
                value={skillForm.repoUrl}
                onChange={(e) => setSkillField("repoUrl", e.target.value)}
                placeholder="https://github.com/owner/repo/tree/main/skill"
              />
              <span className="config-field-note">
                Makes the skill title a link. Without it the title stays plain text.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="skill-skillssh">skills.sh URL</label>
              <input
                id="skill-skillssh"
                type="url"
                value={skillForm.skillsShUrl}
                onChange={(e) => setSkillField("skillsShUrl", e.target.value)}
                placeholder="https://skills.sh/owner/repo/skill"
              />
            </div>
            <div className="config-field">
              <label htmlFor="skill-docs">Docs URL</label>
              <input
                id="skill-docs"
                type="url"
                value={skillForm.docsUrl}
                onChange={(e) => setSkillField("docsUrl", e.target.value)}
                placeholder="https://example.com/docs"
              />
            </div>
            <div className="config-field">
              <label htmlFor="skill-x">X post URL</label>
              <input
                id="skill-x"
                type="url"
                value={skillForm.xUrl}
                onChange={(e) => setSkillField("xUrl", e.target.value)}
                placeholder="https://x.com/waynesutton/status/..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- List view ---
  const publishedCount = (skills ?? []).filter((skill) => skill.published).length;

  return (
    <div className="dashboard-list-view skills-dashboard">
      {!skillsPageEnabled && (
        <div className="skills-dashboard-hint" role="status">
          The public /skills route is off. Turn on "Enable /skills route" under Site
          Config, Skills Page, to publish this directory.
        </div>
      )}

      {/* Sections card */}
      <div className="dashboard-config-card skills-sections-card">
        <div className="dashboard-list-header">
          <div>
            <h3>Sections</h3>
            <span className="config-field-note">
              Group skills by who wrote them or what they are for. Sections render as
              headings on /skills in this order.
            </span>
          </div>
          {editingSectionId === null && (
            <button type="button" className="dashboard-action-btn" onClick={startCreateSection}>
              <Plus size={16} />
              New section
            </button>
          )}
        </div>

        {editingSectionId !== null && (
          <div className="skill-section-form">
            <div className="skill-section-form-grid">
              <div className="config-field">
                <label htmlFor="section-title">Title</label>
                <input
                  id="section-title"
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) => handleSectionTitleChange(e.target.value)}
                  placeholder="My skills"
                />
              </div>
              <div className="config-field">
                <label htmlFor="section-slug">Slug</label>
                <input
                  id="section-slug"
                  type="text"
                  value={sectionForm.slug}
                  onChange={(e) => {
                    setSectionSlugTouched(true);
                    setSectionField("slug", e.target.value);
                  }}
                  placeholder="my-skills"
                />
              </div>
              <div className="config-field">
                <label htmlFor="section-description">Description</label>
                <input
                  id="section-description"
                  type="text"
                  value={sectionForm.description}
                  onChange={(e) => setSectionField("description", e.target.value)}
                  placeholder="Skills I wrote and use every day"
                />
              </div>
              <div className="config-field">
                <label htmlFor="section-install">Collection install command</label>
                <input
                  id="section-install"
                  type="text"
                  value={sectionForm.installCommand}
                  onChange={(e) => setSectionField("installCommand", e.target.value)}
                  placeholder="npx skills add waynesutton/skills"
                  spellCheck={false}
                />
                <span className="config-field-note">
                  Optional. One command that installs every skill in the section.
                </span>
              </div>
              <div className="config-field">
                <label htmlFor="section-order">Order</label>
                <input
                  id="section-order"
                  type="number"
                  value={sectionForm.order}
                  onChange={(e) => setSectionField("order", e.target.value)}
                  placeholder="Leave blank to sort last"
                />
              </div>
              <div className="config-field checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={sectionForm.published}
                    onChange={(e) => setSectionField("published", e.target.checked)}
                  />
                  <span>Published</span>
                </label>
              </div>
            </div>
            <div className="dashboard-list-header-actions">
              <button type="button" className="dashboard-action-btn" onClick={closeSectionForm}>
                Cancel
              </button>
              <button
                type="button"
                className="dashboard-action-btn success"
                onClick={() => void handleSaveSection()}
                disabled={isSavingSection}
                aria-busy={isSavingSection}>
                {isSavingSection ? (
                  <SpinnerGap size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {editingSectionId === "new" ? "Create section" : "Save section"}
              </button>
            </div>
          </div>
        )}

        <div className="dashboard-list-table">
          <div className="dashboard-list-table-header">
            <span className="col-title">Section</span>
            <span className="col-order">Order</span>
            <span className="col-status">Status</span>
            <span className="col-actions">Actions</span>
          </div>
          {sections === undefined ? (
            <div className="dashboard-list-empty">Loading sections...</div>
          ) : sections.length === 0 ? (
            <div className="dashboard-list-empty">
              No sections yet. Skills without a section render under a plain "Skills"
              heading.
            </div>
          ) : (
            sections.map((section) => {
              const count = skillCountBySection.get(section._id) ?? 0;
              return (
                <div key={section._id} className="dashboard-list-row">
                  <div className="col-title">
                    <button
                      type="button"
                      className="post-title post-title-link"
                      onClick={() => startEditSection(section)}
                      title="Edit">
                      {section.title}
                    </button>
                    <span className="post-slug">
                      {section.slug} · {count} {count === 1 ? "skill" : "skills"}
                    </span>
                  </div>
                  <div className="col-order">
                    {section.order !== undefined ? section.order : "-"}
                  </div>
                  <div className="col-status">
                    <span className={`status-badge ${section.published ? "published" : "draft"}`}>
                      {section.published ? "Published" : "Draft"}
                    </span>
                    {section.installCommand && (
                      <span className="skill-row-links" title="Has a collection install command">
                        <Terminal size={14} />
                      </span>
                    )}
                  </div>
                  <div className="col-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => startEditSection(section)}
                      title="Edit">
                      <PencilSimple size={16} />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => setPendingSectionDelete(section)}
                      title="Delete">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Skills card */}
      <div className="dashboard-list-header">
        <div className="dashboard-filter-tabs">
          <span className="dashboard-filter-tab active">All ({skills?.length ?? 0})</span>
          <span className="dashboard-filter-tab">Published ({publishedCount})</span>
        </div>
        <button type="button" className="dashboard-action-btn success" onClick={startCreateSkill}>
          <Plus size={16} />
          New skill
        </button>
      </div>

      <div className="dashboard-list-table">
        <div className="dashboard-list-table-header">
          <span className="col-title">Skill</span>
          <span className="col-order">Order</span>
          <span className="col-status">Status</span>
          <span className="col-actions">Actions</span>
        </div>

        {skills === undefined ? (
          <div className="dashboard-list-empty">Loading skills...</div>
        ) : visibleSkills.length === 0 ? (
          <div className="dashboard-list-empty">
            {query
              ? "No skills match your search"
              : "No skills yet. Add your first one to fill out /skills."}
          </div>
        ) : (
          visibleSkills.map((skill) => {
            const sectionTitle = skill.sectionId
              ? sectionTitleById.get(skill.sectionId)
              : undefined;
            return (
              <div key={skill._id} className="dashboard-list-row">
                <div className="col-title">
                  <button
                    type="button"
                    className="post-title post-title-link"
                    onClick={() => startEditSkill(skill)}
                    title="Edit">
                    {skill.title}
                  </button>
                  <span className="post-slug">
                    {skill.command ? <code className="skill-row-command">{skill.command}</code> : null}
                    {skill.command ? " · " : ""}
                    {sectionTitle ?? "No section"}
                  </span>
                </div>
                <div className="col-order">{skill.order !== undefined ? skill.order : "-"}</div>
                <div className="col-status">
                  <span className={`status-badge ${skill.published ? "published" : "draft"}`}>
                    {skill.published ? "Published" : "Draft"}
                  </span>
                  {skill.featured && <span className="status-badge unlisted">Pinned</span>}
                  {/* Which links this skill carries, at a glance */}
                  <span className="skill-row-links">
                    {skill.repoUrl && <GithubLogo size={14} />}
                    {skill.skillsShUrl && <Terminal size={14} />}
                    {skill.docsUrl && <BookOpen size={14} />}
                    {skill.xUrl && <XLogo size={14} />}
                  </span>
                </div>
                <div className="col-actions">
                  <button className="action-btn edit" onClick={() => startEditSkill(skill)} title="Edit">
                    <PencilSimple size={16} />
                  </button>
                  {skill.repoUrl && (
                    <a
                      className="action-btn view"
                      href={skill.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open repository">
                      <ArrowSquareOut size={16} />
                    </a>
                  )}
                  <button
                    className="action-btn delete"
                    onClick={() => setPendingSkillDelete(skill)}
                    title="Delete">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingSkillDelete && (
        <ConfirmDeleteModal
          title="Delete skill"
          message="This removes the skill from /skills and from the agent discovery files. It cannot be undone."
          itemName={pendingSkillDelete.title}
          confirmLabel="Delete skill"
          cancelLabel="Keep skill"
          isDeleting={isDeleting}
          onCancel={() => setPendingSkillDelete(null)}
          onConfirm={() => void handleDeleteSkill()}
        />
      )}

      {pendingSectionDelete && (
        <ConfirmDeleteModal
          title="Delete section"
          message={(() => {
            const count = skillCountBySection.get(pendingSectionDelete._id) ?? 0;
            if (count === 0) {
              return "This removes the section heading. No skills are assigned to it.";
            }
            return `This removes the section heading. ${count} ${
              count === 1 ? "skill moves" : "skills move"
            } to the default "Skills" group and ${count === 1 ? "stays" : "stay"} published.`;
          })()}
          itemName={pendingSectionDelete.title}
          confirmLabel="Delete section"
          cancelLabel="Keep section"
          isDeleting={isDeleting}
          onCancel={() => setPendingSectionDelete(null)}
          onConfirm={() => void handleDeleteSection()}
        />
      )}
    </div>
  );
}
