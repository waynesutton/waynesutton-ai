import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Check,
  PencilSimple,
  Plus,
  Trash,
  X,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { ImageUploadModal } from "../ImageUploadModal";
import siteConfig from "../../config/siteConfig";

type ToastType = "success" | "error" | "info" | "warning";
type ProjectKind = "project" | "craft";

type ProjectRow = {
  _id: Id<"projects">;
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  published: boolean;
  tags: string[];
  url?: string;
  image?: string;
  featured?: boolean;
  featuredOrder?: number;
  kind: ProjectKind;
  source?: "dashboard" | "sync" | "demo";
};

type ProjectForm = {
  title: string;
  slug: string;
  description: string;
  content: string;
  date: string;
  published: boolean;
  tagsText: string;
  url: string;
  image: string;
  featured: boolean;
  featuredOrder: string;
  kind: ProjectKind;
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): ProjectForm {
  return {
    title: "",
    slug: "",
    description: "",
    content: "",
    date: todayDate(),
    published: false,
    tagsText: "",
    url: "",
    image: "",
    featured: false,
    featuredOrder: "",
    kind: "project",
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTags(tagsText: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const part of tagsText.split(",")) {
    const tag = part.trim();
    const key = tag.toLowerCase();
    if (tag.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

function rowToForm(row: ProjectRow): ProjectForm {
  return {
    title: row.title,
    slug: row.slug,
    description: row.description,
    content: row.content,
    date: row.date,
    published: row.published,
    tagsText: row.tags.join(", "),
    url: row.url ?? "",
    image: row.image ?? "",
    featured: row.featured === true,
    featuredOrder: row.featuredOrder !== undefined ? String(row.featuredOrder) : "",
    kind: row.kind,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong";
}

/**
 * Dashboard CRUD for the projects table (kind project or craft).
 * Demo mode is gated by the parent. Admins create, edit, and delete here.
 */
export function ProjectsSection({
  addToast,
}: {
  addToast: (message: string, type?: ToastType) => void;
}) {
  const projects = useQuery(api.projects.listAll);
  const createProject = useMutation(api.projects.createProject);
  const updateProject = useMutation(api.projects.updateProject);
  const deleteProject = useMutation(api.projects.deleteProject);

  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [editingId, setEditingId] = useState<Id<"projects"> | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kindFilter, setKindFilter] = useState<"all" | ProjectKind>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"projects"> | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const mediaEnabled = siteConfig.media?.enabled ?? false;

  const filtered = useMemo(() => {
    if (!projects) {
      return [];
    }
    if (kindFilter === "all") {
      return projects;
    }
    return projects.filter((project) => project.kind === kindFilter);
  }, [projects, kindFilter]);

  const patchForm = (partial: Partial<ProjectForm>) => {
    setForm((current) => ({ ...current, ...partial }));
  };

  const startCreate = () => {
    setEditingId(null);
    setSlugTouched(false);
    setForm(emptyForm());
  };

  const startEdit = (row: ProjectRow) => {
    setEditingId(row._id);
    setSlugTouched(true);
    setForm(rowToForm(row));
  };

  const handleTitleChange = (title: string) => {
    if (!slugTouched) {
      patchForm({ title, slug: slugify(title) });
      return;
    }
    patchForm({ title });
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const title = form.title.trim();
    const slug = form.slug.trim();
    if (!title || !slug) {
      addToast("Title and slug are required", "error");
      return;
    }

    const featuredOrderRaw = form.featuredOrder.trim();
    const featuredOrder =
      featuredOrderRaw.length > 0 ? Number(featuredOrderRaw) : undefined;
    if (featuredOrderRaw.length > 0 && Number.isNaN(featuredOrder)) {
      addToast("Featured order must be a number", "error");
      return;
    }

    const payload = {
      title,
      slug,
      description: form.description.trim(),
      content: form.content,
      date: form.date.trim() || todayDate(),
      published: form.published,
      tags: parseTags(form.tagsText),
      url: form.url.trim() || undefined,
      image: form.image.trim() || undefined,
      featured: form.featured,
      featuredOrder,
      kind: form.kind,
    };

    setSaving(true);
    try {
      if (editingId) {
        const original = projects?.find((project) => project._id === editingId);
        const clearFields: Array<"url" | "image"> = [];
        if (!payload.url && original?.url) {
          clearFields.push("url");
        }
        if (!payload.image && original?.image) {
          clearFields.push("image");
        }
        await updateProject({
          id: editingId,
          project: payload,
          ...(clearFields.length > 0 ? { clearFields } : {}),
        });
        addToast("Project saved", "success");
      } else {
        await createProject({ project: payload });
        addToast("Project created", "success");
        startCreate();
      }
    } catch (error) {
      addToast(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"projects">) => {
    try {
      await deleteProject({ id });
      addToast("Project deleted", "success");
      setDeleteConfirm(null);
      if (editingId === id) {
        startCreate();
      }
    } catch (error) {
      addToast(errorMessage(error), "error");
    }
  };

  return (
    <div className="dashboard-form-block">
      <div className="dashboard-list-header">
        <div className="dashboard-filter-tabs">
          <button
            type="button"
            className={`dashboard-filter-tab ${kindFilter === "all" ? "active" : ""}`}
            onClick={() => setKindFilter("all")}
          >
            All ({projects?.length ?? 0})
          </button>
          <button
            type="button"
            className={`dashboard-filter-tab ${kindFilter === "project" ? "active" : ""}`}
            onClick={() => setKindFilter("project")}
          >
            Projects
          </button>
          <button
            type="button"
            className={`dashboard-filter-tab ${kindFilter === "craft" ? "active" : ""}`}
            onClick={() => setKindFilter("craft")}
          >
            Craft
          </button>
        </div>
        <button type="button" className="dashboard-action-btn" onClick={startCreate}>
          <Plus size={16} />
          New
        </button>
      </div>

      <div className="dashboard-list-table">
        <div className="dashboard-list-table-header">
          <span className="col-title">Title</span>
          <span className="col-date">Kind</span>
          <span className="col-status">Status</span>
          <span className="col-actions">Actions</span>
        </div>

        {projects === undefined ? (
          <div className="dashboard-list-empty">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="dashboard-list-empty">No projects yet</div>
        ) : (
          filtered.map((project) => (
            <div key={project._id} className="dashboard-list-row">
              <div className="col-title">
                <button
                  type="button"
                  className="post-title post-title-link"
                  onClick={() => startEdit(project)}
                  title="Edit"
                >
                  {project.title}
                </button>
                <span className="post-slug">/{project.slug}</span>
              </div>
              <div className="col-date">
                <span>{project.kind === "craft" ? "Craft" : "Project"}</span>
              </div>
              <div className="col-status">
                <span className={`status-badge ${project.published ? "published" : "draft"}`}>
                  {project.published ? "Published" : "Draft"}
                </span>
                {(!project.source || project.source === "sync") && (
                  <span className="source-badge sync">Synced</span>
                )}
                {project.source === "dashboard" && (
                  <span className="source-badge dashboard">Dashboard</span>
                )}
              </div>
              <div className="col-actions">
                <button
                  className="action-btn edit"
                  onClick={() => startEdit(project)}
                  title="Edit"
                >
                  <PencilSimple size={16} />
                </button>
                {project.url && (
                  <a
                    href={project.url}
                    className="action-btn view"
                    title="Open live url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowSquareOut size={16} />
                  </a>
                )}
                {deleteConfirm === project._id ? (
                  <div className="dashboard-newsletter-delete-confirm">
                    <span>Delete?</span>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project._id)}
                      className="dashboard-action-btn delete"
                      title="Confirm delete"
                    >
                      <Check size={16} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(null)}
                      className="dashboard-action-btn"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="action-btn delete"
                    onClick={() => setDeleteConfirm(project._id)}
                    title="Delete"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="dashboard-config-card" style={{ marginTop: "1.5rem" }}>
        <h3>{editingId ? "Edit project" : "New project"}</h3>
        <div className="config-field">
          <label htmlFor="project-title">Title</label>
          <input
            id="project-title"
            type="text"
            value={form.title}
            onChange={(event) => handleTitleChange(event.target.value)}
          />
        </div>
        <div className="config-field">
          <label htmlFor="project-slug">Slug</label>
          <input
            id="project-slug"
            type="text"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              patchForm({ slug: slugify(event.target.value) });
            }}
          />
        </div>
        <div className="config-field">
          <label htmlFor="project-description">Description</label>
          <textarea
            id="project-description"
            value={form.description}
            onChange={(event) => patchForm({ description: event.target.value })}
            rows={3}
          />
        </div>
        <div className="config-field">
          <label htmlFor="project-kind">Kind</label>
          <select
            id="project-kind"
            value={form.kind}
            onChange={(event) =>
              patchForm({ kind: event.target.value === "craft" ? "craft" : "project" })
            }
          >
            <option value="project">Project</option>
            <option value="craft">Craft</option>
          </select>
        </div>
        <div className="config-field">
          <label htmlFor="project-date">Date</label>
          <input
            id="project-date"
            type="date"
            value={form.date}
            onChange={(event) => patchForm({ date: event.target.value })}
          />
        </div>
        <div className="config-field">
          <label htmlFor="project-tags">Tags</label>
          <input
            id="project-tags"
            type="text"
            value={form.tagsText}
            onChange={(event) => patchForm({ tagsText: event.target.value })}
            placeholder="convex, portfolio"
          />
          <span className="config-hint">Comma separated</span>
        </div>
        <div className="config-field">
          <label htmlFor="project-url">Live url</label>
          <input
            id="project-url"
            type="url"
            value={form.url}
            onChange={(event) => patchForm({ url: event.target.value })}
            placeholder="https://"
          />
        </div>
        <div className="config-field">
          <label htmlFor="project-image">Image url</label>
          <input
            id="project-image"
            type="text"
            value={form.image}
            onChange={(event) => patchForm({ image: event.target.value })}
          />
          {mediaEnabled && (
            <button
              type="button"
              className="dashboard-action-btn"
              onClick={() => setPickerOpen(true)}
              style={{ marginTop: "0.5rem" }}
            >
              Upload image
            </button>
          )}
        </div>
        <div className="config-field checkbox">
          <label>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => patchForm({ published: event.target.checked })}
            />
            <span>Published</span>
          </label>
        </div>
        <div className="config-field checkbox">
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => patchForm({ featured: event.target.checked })}
            />
            <span>Featured</span>
          </label>
        </div>
        <div className="config-field">
          <label htmlFor="project-featured-order">Featured order</label>
          <input
            id="project-featured-order"
            type="number"
            value={form.featuredOrder}
            onChange={(event) => patchForm({ featuredOrder: event.target.value })}
          />
        </div>
        <div className="config-field">
          <label htmlFor="project-content">Content</label>
          <textarea
            id="project-content"
            value={form.content}
            onChange={(event) => patchForm({ content: event.target.value })}
            rows={8}
          />
        </div>
        <button
          type="button"
          className="dashboard-action-btn primary"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? "Saving..." : editingId ? "Save project" : "Create project"}
        </button>
      </div>

      {mediaEnabled && (
        <ImageUploadModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelectUrl={(url) => {
            patchForm({ image: url });
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
