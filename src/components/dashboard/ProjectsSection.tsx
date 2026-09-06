import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  ArrowSquareOut,
  GithubLogo,
  Image as ImageIcon,
  LinkedinLogo,
  PencilSimple,
  Plus,
  SpinnerGap,
  Trash,
  Warning,
  X,
  XLogo,
} from "@phosphor-icons/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ImageUploadModal } from "../ImageUploadModal";
import siteConfig from "../../config/siteConfig";

type ToastType = "success" | "error" | "info" | "warning";

type ProjectDoc = {
  _id: Id<"projects">;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  order?: number;
  featured?: boolean;
  thumbnail?: string;
  url?: string;
  repoUrl?: string;
  xUrl?: string;
  linkedinUrl?: string;
};

// Optional fields the form can empty out. Convex strips undefined from nested
// mutation args, so an emptied field has to be named explicitly to be removed.
const OPTIONAL_FIELDS = [
  "thumbnail",
  "url",
  "repoUrl",
  "xUrl",
  "linkedinUrl",
] as const;

type OptionalField = (typeof OPTIONAL_FIELDS)[number];
type ClearableField = OptionalField | "order" | "featured";

type FormState = {
  title: string;
  slug: string;
  description: string;
  published: boolean;
  featured: boolean;
  order: string;
  thumbnail: string;
  url: string;
  repoUrl: string;
  xUrl: string;
  linkedinUrl: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  published: true,
  featured: false,
  order: "",
  thumbnail: "",
  url: "",
  repoUrl: "",
  xUrl: "",
  linkedinUrl: "",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toForm(project: ProjectDoc): FormState {
  return {
    title: project.title,
    slug: project.slug,
    description: project.description,
    published: project.published,
    featured: project.featured ?? false,
    order: project.order !== undefined ? String(project.order) : "",
    thumbnail: project.thumbnail ?? "",
    url: project.url ?? "",
    repoUrl: project.repoUrl ?? "",
    xUrl: project.xUrl ?? "",
    linkedinUrl: project.linkedinUrl ?? "",
  };
}

function DeleteProjectModal({
  project,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  project: ProjectDoc;
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
      <div className="dashboard-modal dashboard-modal-delete" role="dialog" aria-modal="true" aria-labelledby="delete-project-title">
        <div className="dashboard-modal-header">
          <div className="dashboard-modal-icon dashboard-modal-icon-warning">
            <Warning size={20} />
          </div>
          <h3 id="delete-project-title" className="dashboard-modal-title">Delete project</h3>
          <button className="dashboard-modal-close" aria-label="Close delete project dialog" onClick={onCancel} disabled={isDeleting}>
            <X size={18} />
          </button>
        </div>
        <div className="dashboard-modal-content">
          <p className="dashboard-modal-message">
            This removes the project from the site, including the homepage and Projects page. It cannot be undone.
          </p>
          <div className="dashboard-modal-item-name">{project.title}</div>
        </div>
        <div className="dashboard-modal-footer">
          <div className="dashboard-modal-actions">
            <button
              className="dashboard-modal-btn secondary"
              onClick={onCancel}
              disabled={isDeleting}>
              Keep project
            </button>
            <button
              className="dashboard-modal-btn danger"
              onClick={onConfirm}
              disabled={isDeleting}>
              {isDeleting ? <SpinnerGap size={16} className="animate-spin" /> : <Trash size={16} />}
              Delete project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Projects dashboard section. Projects are dashboard-only content with no
 * markdown source and no detail page, so this is the single place they are
 * created, ordered, and published.
 */
export function ProjectsSection({
  addToast,
  searchQuery,
}: {
  addToast: (message: string, type?: ToastType) => void;
  searchQuery: string;
}) {
  const projects = useQuery(api.projects.listAll);
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);

  // null = list view, "new" = create form, otherwise the project being edited
  const [editingId, setEditingId] = useState<Id<"projects"> | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const mediaEnabled = siteConfig.media?.enabled ?? false;

  const query = searchQuery.trim().toLowerCase();
  const visibleProjects = (projects ?? []).filter(
    (project) =>
      !query ||
      project.title.toLowerCase().includes(query) ||
      project.slug.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query),
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setEditingId("new");
  };

  const startEdit = (project: ProjectDoc) => {
    setForm(toForm(project));
    setSlugTouched(true);
    setEditingId(project._id);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
  };

  // Slug mirrors the title until the author edits it directly
  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const slug = slugify(form.slug || form.title);
    const description = form.description.trim();

    if (!title) {
      addToast("Add a project title before saving", "error");
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

    const parsedOrder = form.order.trim() === "" ? undefined : Number(form.order);
    if (parsedOrder !== undefined && Number.isNaN(parsedOrder)) {
      addToast("Order must be a number", "error");
      return;
    }

    const optionalValues: Record<OptionalField, string> = {
      thumbnail: form.thumbnail.trim(),
      url: form.url.trim(),
      repoUrl: form.repoUrl.trim(),
      xUrl: form.xUrl.trim(),
      linkedinUrl: form.linkedinUrl.trim(),
    };

    setIsSaving(true);
    try {
      if (editingId === "new") {
        await createProject({
          project: {
            slug,
            title,
            description,
            published: form.published,
            featured: form.featured || undefined,
            order: parsedOrder,
            ...Object.fromEntries(
              OPTIONAL_FIELDS.filter((key) => optionalValues[key]).map((key) => [
                key,
                optionalValues[key],
              ]),
            ),
          },
        });
        addToast(`"${title}" created`, "success");
      } else if (editingId) {
        const clearFields: ClearableField[] = OPTIONAL_FIELDS.filter(
          (key) => !optionalValues[key],
        );
        if (parsedOrder === undefined) clearFields.push("order");
        if (!form.featured) clearFields.push("featured");

        await updateProject({
          id: editingId,
          project: {
            slug,
            title,
            description,
            published: form.published,
            featured: form.featured || undefined,
            order: parsedOrder,
            ...Object.fromEntries(
              OPTIONAL_FIELDS.filter((key) => optionalValues[key]).map((key) => [
                key,
                optionalValues[key],
              ]),
            ),
          },
          clearFields,
        });
        addToast(`"${title}" saved`, "success");
      }
      closeForm();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await removeProject({ id: pendingDelete._id });
      addToast(`"${pendingDelete.title}" deleted`, "success");
      if (editingId === pendingDelete._id) closeForm();
      setPendingDelete(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Delete failed", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Editor form
  if (editingId !== null) {
    return (
      <div className="dashboard-config-section">
        <div className="dashboard-list-header">
          <h2 className="dashboard-section-heading">
            {editingId === "new" ? "New project" : "Edit project"}
          </h2>
          <div className="dashboard-list-header-actions">
            <button type="button" className="dashboard-action-btn" onClick={closeForm}>
              Cancel
            </button>
            <button
              type="button"
              className="dashboard-action-btn success"
              onClick={() => void handleSave()}
              disabled={isSaving}
              aria-busy={isSaving}>
              {isSaving ? <SpinnerGap size={16} className="animate-spin" /> : <Plus size={16} />}
              {editingId === "new" ? "Create project" : "Save project"}
            </button>
          </div>
        </div>

        <div className="dashboard-config-grid">
          <div className="dashboard-config-card">
            <h3>Details</h3>
            <div className="config-field">
              <label htmlFor="project-title">Title</label>
              <input
                id="project-title"
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Stagehand"
              />
            </div>
            <div className="config-field">
              <label htmlFor="project-slug">Slug</label>
              <input
                id="project-slug"
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setField("slug", e.target.value);
                }}
                placeholder="stagehand"
              />
              <span className="config-field-note">
                Identifies the project. Projects have no page of their own, so this is
                not a URL.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="project-description">Description</label>
              <textarea
                id="project-description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={2}
                placeholder="Automate the web with natural language"
              />
              <span className="config-field-note">
                One line. This is the only body text a project shows.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="project-order">Order</label>
              <input
                id="project-order"
                type="number"
                value={form.order}
                onChange={(e) => setField("order", e.target.value)}
                placeholder="Leave blank to sort last"
              />
              <span className="config-field-note">
                Lower numbers come first. Projects are not sorted by date.
              </span>
            </div>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setField("published", e.target.checked)}
                />
                <span>Published</span>
              </label>
            </div>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setField("featured", e.target.checked)}
                />
                <span>Pin to the top of the index</span>
              </label>
            </div>
          </div>

          <div className="dashboard-config-card">
            <h3>Thumbnail</h3>
            <div className="config-field">
              <label htmlFor="project-thumbnail">Image URL</label>
              <div className="project-thumbnail-input-row">
                <input
                  id="project-thumbnail"
                  type="text"
                  value={form.thumbnail}
                  onChange={(e) => setField("thumbnail", e.target.value)}
                  placeholder="/images/projects/stagehand.png"
                />
                {mediaEnabled && (
                  <button
                    type="button"
                    className="dashboard-action-btn"
                    onClick={() => setPickerOpen(true)}>
                    <ImageIcon size={16} />
                    Upload
                  </button>
                )}
              </div>
              <span className="config-field-note">
                Cropped to 16:9. Shown in the one column and two column layouts, hidden
                in the list layout.
              </span>
            </div>
            {form.thumbnail ? (
              <div className="project-thumbnail-preview">
                <img src={form.thumbnail} alt="" />
              </div>
            ) : (
              <div className="project-thumbnail-preview project-thumbnail-preview-empty">
                <span>No thumbnail yet</span>
              </div>
            )}
          </div>

          <div className="dashboard-config-card">
            <h3>Links</h3>
            <span className="config-field-note">
              Leave a field blank and its icon stays hidden. Only filled links
              show on the card.
            </span>
            <div className="config-field">
              <label htmlFor="project-url">Live URL</label>
              <input
                id="project-url"
                type="url"
                value={form.url}
                onChange={(e) => setField("url", e.target.value)}
                placeholder="https://stagehand.dev"
              />
              <span className="config-field-note">
                Makes the project title a link. Without it the title stays plain text.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="project-repo">Repository URL</label>
              <input
                id="project-repo"
                type="url"
                value={form.repoUrl}
                onChange={(e) => setField("repoUrl", e.target.value)}
                placeholder="https://github.com/owner/repo"
              />
            </div>
            <div className="config-field">
              <label htmlFor="project-x">X post URL</label>
              <input
                id="project-x"
                type="url"
                value={form.xUrl}
                onChange={(e) => setField("xUrl", e.target.value)}
                placeholder="https://x.com/waynesutton/status/..."
              />
            </div>
            <div className="config-field">
              <label htmlFor="project-linkedin">LinkedIn post URL</label>
              <input
                id="project-linkedin"
                type="url"
                value={form.linkedinUrl}
                onChange={(e) => setField("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/posts/..."
              />
            </div>
          </div>
        </div>

        {mediaEnabled && (
          <ImageUploadModal
            isOpen={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelectUrl={(url) => {
              setField("thumbnail", url);
              setPickerOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="dashboard-list-view">
      <div className="dashboard-list-header">
        <div className="dashboard-filter-tabs">
          <span className="dashboard-filter-tab active">
            All ({projects?.length ?? 0})
          </span>
          <span className="dashboard-filter-tab">
            Published ({(projects ?? []).filter((p) => p.published).length})
          </span>
        </div>
        <button type="button" className="dashboard-action-btn success" onClick={startCreate}>
          <Plus size={16} />
          New project
        </button>
      </div>

      <div className="dashboard-list-table">
        <div className="dashboard-list-table-header">
          <span className="col-title">Title</span>
          <span className="col-order">Order</span>
          <span className="col-status">Status</span>
          <span className="col-actions">Actions</span>
        </div>

        {projects === undefined ? (
          <div className="dashboard-list-empty">Loading projects...</div>
        ) : visibleProjects.length === 0 ? (
          <div className="dashboard-list-empty">
            {query
              ? "No projects match your search"
              : "No projects yet. Add your first one to fill out /projects."}
          </div>
        ) : (
          visibleProjects.map((project) => (
            <div key={project._id} className="dashboard-list-row">
              <div className="col-title">
                <button
                  type="button"
                  className="post-title post-title-link"
                  onClick={() => startEdit(project)}
                  title="Edit">
                  {project.title}
                </button>
                <span className="post-slug">{project.description}</span>
              </div>
              <div className="col-order">
                {project.order !== undefined ? project.order : "-"}
              </div>
              <div className="col-status">
                <span className={`status-badge ${project.published ? "published" : "draft"}`}>
                  {project.published ? "Published" : "Draft"}
                </span>
                {project.featured && <span className="status-badge unlisted">Pinned</span>}
                {/* Which links this project carries, at a glance */}
                <span className="project-row-links">
                  {project.repoUrl && <GithubLogo size={14} />}
                  {project.xUrl && <XLogo size={14} />}
                  {project.linkedinUrl && <LinkedinLogo size={14} />}
                </span>
              </div>
              <div className="col-actions">
                <button
                  className="action-btn edit"
                  onClick={() => startEdit(project)}
                  title="Edit">
                  <PencilSimple size={16} />
                </button>
                {project.url && (
                  <a
                    className="action-btn view"
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open live project">
                    <ArrowSquareOut size={16} />
                  </a>
                )}
                <button
                  className="action-btn delete"
                  onClick={() => setPendingDelete(project)}
                  title="Delete">
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {pendingDelete && (
        <DeleteProjectModal
          project={pendingDelete}
          isDeleting={isDeleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
