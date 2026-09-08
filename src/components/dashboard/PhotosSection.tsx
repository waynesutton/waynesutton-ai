import { useCallback, useMemo, useRef, useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import {
  ArrowSquareOut,
  BookOpen,
  CheckSquare,
  Envelope,
  Eye,
  EyeSlash,
  Images,
  PencilSimple,
  Square,
  SpinnerGap,
  Trash,
  UploadSimple,
  Warning,
  X,
} from "@phosphor-icons/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import siteConfig from "../../config/siteConfig";
import {
  IMAGE_MAX_BYTES,
  formatUploadLimit,
  isAllowedImageFile,
  resolveImageContentType,
  uploadFileWithProgress,
} from "../../utils/imageUpload";
import {
  THUMBNAIL_CONTENT_TYPE,
  createPhotoThumbnail,
  createThumbnailFromUrl,
  thumbnailKeyFor,
  type ThumbnailResult,
} from "../../utils/photoThumbnail";
import { normalizeTags, parseTagInput } from "../../../convex/lib/photosDirectory";

type ToastType = "success" | "error" | "info" | "warning";

type PhotoProvider = "r2" | "convex";

type PhotoDoc = {
  _id: Id<"photos">;
  slug: string;
  title?: string;
  description?: string;
  tags: Array<string>;
  provider: PhotoProvider;
  key: string;
  url: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  size: number;
  contentType: string;
  published: boolean;
  capturedAt?: number;
  source: "dashboard" | "email";
  createdAt: number;
};

type ListFilter = "all" | "unpublished" | "email";

type UploadItem = {
  id: string;
  name: string;
  progress: number; // 0 to 100 across thumbnail + original
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  tags: string;
  capturedAt: string; // yyyy-mm-dd, blank for none
  published: boolean;
};

const PHOTO_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
const MAX_BATCH = 50;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDateInput(timestamp: number | undefined): string {
  if (!timestamp) return "";
  return new Date(timestamp).toISOString().slice(0, 10);
}

// Date input to a local noon timestamp so a chosen day never shifts across zones
function fromDateInput(value: string): number | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12).getTime();
}

function toForm(photo: PhotoDoc): FormState {
  return {
    title: photo.title ?? "",
    slug: photo.slug,
    description: photo.description ?? "",
    tags: photo.tags.join(", "),
    capturedAt: toDateInput(photo.capturedAt),
    published: photo.published,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DeletePhotosModal({
  count,
  label,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  count: number;
  label: string;
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
        aria-labelledby="delete-photos-title">
        <div className="dashboard-modal-header">
          <div className="dashboard-modal-icon dashboard-modal-icon-warning">
            <Warning size={20} />
          </div>
          <h3 id="delete-photos-title" className="dashboard-modal-title">
            {count === 1 ? "Delete photo" : `Delete ${count} photos`}
          </h3>
          <button
            className="dashboard-modal-close"
            aria-label="Close delete dialog"
            onClick={onCancel}
            disabled={isDeleting}>
            <X size={18} />
          </button>
        </div>
        <div className="dashboard-modal-content">
          <p className="dashboard-modal-message">
            This removes the {count === 1 ? "photo" : "photos"} from the gallery and deletes the
            stored image and thumbnail. It cannot be undone.
          </p>
          <div className="dashboard-modal-item-name">{label}</div>
        </div>
        <div className="dashboard-modal-footer">
          <div className="dashboard-modal-actions">
            <button className="dashboard-modal-btn secondary" onClick={onCancel} disabled={isDeleting}>
              Keep
            </button>
            <button className="dashboard-modal-btn danger" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? <SpinnerGap size={16} className="animate-spin" /> : <Trash size={16} />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Photos dashboard section. The only writer for the /photos gallery besides
 * the email door: multi file upload with browser made thumbnails, per photo
 * edit, bulk publish and delete, and the email inbox settings.
 */
export function PhotosSection({
  addToast,
  searchQuery,
  onOpenDocs,
}: {
  addToast: (message: string, type?: ToastType) => void;
  searchQuery: string;
  onOpenDocs?: () => void;
}) {
  const convex = useConvex();
  const photos = useQuery(api.photos.listAll);
  const emailSettings = useQuery(api.photos.getEmailSettings);
  const uploadSettings = useQuery(api.media.getUploadSettings);

  const generatePhotoUploadUrl = useMutation(api.photos.generateUploadUrl);
  const syncR2Metadata = useMutation(api.r2.syncMetadata);
  const generateDirectUploadUrl = useMutation(api.media.generateDirectUploadUrl);
  const createPhoto = useMutation(api.photos.create);
  const updatePhoto = useMutation(api.photos.update);
  const removeMany = useMutation(api.photos.removeMany);
  const setPublishedMany = useMutation(api.photos.setPublishedMany);
  const setEmailAutoPublish = useMutation(api.photos.setEmailAutoPublish);

  const [filter, setFilter] = useState<ListFilter>("all");
  const [selected, setSelected] = useState<Set<Id<"photos">>>(new Set());
  const [editingId, setEditingId] = useState<Id<"photos"> | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    description: "",
    tags: "",
    capturedAt: "",
    published: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploads, setUploads] = useState<Array<UploadItem>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadTags, setUploadTags] = useState("");
  const [uploadPublish, setUploadPublish] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Array<PhotoDoc> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [backfill, setBackfill] = useState<{ done: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // R2 when the bucket is configured, otherwise Convex storage. convexfs is a
  // media library provider only; photos never store there.
  const provider: PhotoProvider = uploadSettings?.providers.r2 ? "r2" : "convex";
  const galleryEnabled = siteConfig.photosPage?.enabled ?? false;
  const galleryTitle = siteConfig.photosPage?.title ?? "Photos";

  const all = photos ?? [];
  const query = searchQuery.trim().toLowerCase();
  const visible = useMemo(() => {
    return all.filter((photo) => {
      if (filter === "unpublished" && photo.published) return false;
      if (filter === "email" && photo.source !== "email") return false;
      if (!query) return true;
      return (
        (photo.title ?? "").toLowerCase().includes(query) ||
        photo.slug.toLowerCase().includes(query) ||
        (photo.description ?? "").toLowerCase().includes(query) ||
        photo.tags.some((tag) => tag.includes(query))
      );
    });
  }, [all, filter, query]);

  const counts = useMemo(
    () => ({
      all: all.length,
      unpublished: all.filter((photo) => !photo.published).length,
      email: all.filter((photo) => photo.source === "email").length,
      missingThumbs: all.filter((photo) => !photo.thumbnailUrl).length,
    }),
    [all],
  );

  const knownTags = useMemo(() => {
    const set = new Set<string>();
    for (const photo of all) for (const tag of photo.tags) set.add(tag);
    return [...set].sort();
  }, [all]);

  const editing = editingId ? all.find((photo) => photo._id === editingId) ?? null : null;

  // --- Storage helpers -------------------------------------------------------

  // Uploads one blob and returns its key and permanent URL for the active provider.
  const storeBlob = useCallback(
    async (
      file: File,
      contentType: string,
      onProgress: (percent: number) => void,
      customKey?: string,
    ): Promise<{ key: string; url: string }> => {
      if (provider === "r2") {
        const target = await generatePhotoUploadUrl(customKey ? { key: customKey } : {});
        await uploadFileWithProgress({
          url: target.url,
          method: "PUT",
          file,
          contentType,
          onProgress,
        });
        await syncR2Metadata({ key: target.key });
        const url = await convex.query(api.r2.getPermanentUrl, { key: target.key });
        return { key: target.key, url };
      }
      const uploadUrl = await generateDirectUploadUrl({});
      const responseText = await uploadFileWithProgress({
        url: uploadUrl,
        method: "POST",
        file,
        contentType,
        onProgress,
      });
      const { storageId } = JSON.parse(responseText) as { storageId: Id<"_storage"> };
      const url = await convex.query(api.media.getDirectStorageUrl, { storageId });
      if (!url) throw new Error("Upload succeeded but its URL is unavailable");
      return { key: storageId, url };
    },
    [convex, generateDirectUploadUrl, generatePhotoUploadUrl, provider, syncR2Metadata],
  );

  const storeThumbnail = useCallback(
    async (thumb: ThumbnailResult, originalKey: string, onProgress: (p: number) => void) => {
      const thumbFile = new File([thumb.blob], "thumb.webp", { type: THUMBNAIL_CONTENT_TYPE });
      return await storeBlob(
        thumbFile,
        THUMBNAIL_CONTENT_TYPE,
        onProgress,
        provider === "r2" ? thumbnailKeyFor(originalKey) : undefined,
      );
    },
    [provider, storeBlob],
  );

  // --- Upload ----------------------------------------------------------------

  const patchUpload = (id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleFiles = useCallback(
    async (fileList: FileList | Array<File> | null) => {
      if (!fileList || fileList.length === 0 || isUploading) return;
      const files = Array.from(fileList).slice(0, MAX_BATCH);
      if (fileList.length > MAX_BATCH) {
        addToast(`Uploading the first ${MAX_BATCH} files. Drop the rest in a second batch.`, "info");
      }
      const batchTags = parseTagInput(uploadTags);
      const items: Array<UploadItem> = files.map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        progress: 0,
        status: "pending",
      }));
      setUploads(items);
      setIsUploading(true);

      let created = 0;
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const item = items[index];
        patchUpload(item.id, { status: "uploading" });
        try {
          const contentType = resolveImageContentType(file);
          if (!isAllowedImageFile(file) || contentType === "image/svg+xml") {
            const heic = /\.hei[cf]$/i.test(file.name);
            throw new Error(
              heic
                ? "HEIC is not supported in browsers. Export as JPEG first."
                : "Only PNG, JPEG, GIF, and WebP photos are supported",
            );
          }
          if (file.size > IMAGE_MAX_BYTES) {
            throw new Error(`Larger than the ${formatUploadLimit(IMAGE_MAX_BYTES)} limit`);
          }

          // Thumbnail first: it also proves the browser can decode the file
          const thumb = await createPhotoThumbnail(file);
          const original = await storeBlob(file, contentType, (percent) =>
            patchUpload(item.id, { progress: Math.round(percent * 0.85) }),
          );
          const thumbStored = await storeThumbnail(thumb, original.key, (percent) =>
            patchUpload(item.id, { progress: 85 + Math.round(percent * 0.15) }),
          );

          await createPhoto({
            filename: file.name,
            tags: batchTags,
            provider,
            key: original.key,
            url: original.url,
            thumbnailKey: thumbStored.key,
            thumbnailUrl: thumbStored.url,
            width: thumb.width,
            height: thumb.height,
            size: file.size,
            contentType,
            published: uploadPublish,
            capturedAt: file.lastModified || undefined,
          });
          created += 1;
          patchUpload(item.id, { status: "done", progress: 100 });
        } catch (error) {
          patchUpload(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          });
        }
      }

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (created > 0) {
        addToast(
          `${created} ${created === 1 ? "photo" : "photos"} ${uploadPublish ? "published" : "uploaded as unpublished"}`,
          "success",
        );
      }
      const failed = files.length - created;
      if (failed > 0) {
        addToast(`${failed} ${failed === 1 ? "file" : "files"} failed. See the list below.`, "error");
      }
    },
    [
      addToast,
      createPhoto,
      isUploading,
      provider,
      storeBlob,
      storeThumbnail,
      uploadPublish,
      uploadTags,
    ],
  );

  // --- Edit ------------------------------------------------------------------

  const startEdit = (photo: PhotoDoc) => {
    setForm(toForm(photo));
    setEditingId(photo._id);
  };

  const closeEdit = () => setEditingId(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!editing) return;
    const slug = slugify(form.slug);
    if (!slug) {
      addToast("Add a slug before saving", "error");
      return;
    }
    const capturedAt = fromDateInput(form.capturedAt);
    setIsSaving(true);
    try {
      await updatePhoto({
        id: editing._id,
        photo: {
          slug,
          title: form.title,
          description: form.description,
          tags: parseTagInput(form.tags),
          published: form.published,
          ...(capturedAt !== undefined ? { capturedAt } : {}),
        },
        clearFields: capturedAt === undefined ? ["capturedAt"] : [],
      });
      addToast("Photo saved", "success");
      closeEdit();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Rebuilds the thumbnail for one photo from its stored original
  const regenerateThumbnail = useCallback(
    async (photo: PhotoDoc): Promise<void> => {
      const thumb = await createThumbnailFromUrl(photo.url);
      const stored = await storeThumbnail(thumb, photo.key, () => undefined);
      await updatePhoto({
        id: photo._id,
        photo: {
          thumbnailKey: stored.key,
          thumbnailUrl: stored.url,
          width: thumb.width,
          height: thumb.height,
        },
      });
    },
    [storeThumbnail, updatePhoto],
  );

  const handleRegenerateOne = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await regenerateThumbnail(editing);
      addToast("Thumbnail regenerated", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Thumbnail failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackfill = async () => {
    const missing = all.filter((photo) => !photo.thumbnailUrl);
    if (missing.length === 0) return;
    setBackfill({ done: 0, total: missing.length });
    let failed = 0;
    for (let index = 0; index < missing.length; index += 1) {
      try {
        await regenerateThumbnail(missing[index]);
      } catch {
        failed += 1;
      }
      setBackfill({ done: index + 1, total: missing.length });
    }
    setBackfill(null);
    const made = missing.length - failed;
    if (made > 0) addToast(`${made} ${made === 1 ? "thumbnail" : "thumbnails"} generated`, "success");
    if (failed > 0) {
      addToast(
        `${failed} could not be fetched. Check the R2 CORS rule allows GET from this origin.`,
        "error",
      );
    }
  };

  // --- Selection and bulk ----------------------------------------------------

  const toggleSelected = (id: Id<"photos">) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = visible.length > 0 && visible.every((photo) => selected.has(photo._id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const photo of visible) next.delete(photo._id);
        return next;
      }
      return new Set([...prev, ...visible.map((photo) => photo._id)]);
    });
  };

  const selectedIds = [...selected];

  const handleBulkPublish = async (published: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkWorking(true);
    try {
      await setPublishedMany({ ids: selectedIds, published });
      addToast(
        `${selectedIds.length} ${selectedIds.length === 1 ? "photo" : "photos"} ${published ? "published" : "unpublished"}`,
        "success",
      );
      setSelected(new Set());
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Update failed", "error");
    } finally {
      setIsBulkWorking(false);
    }
  };

  const handleTogglePublished = async (photo: PhotoDoc) => {
    try {
      await setPublishedMany({ ids: [photo._id], published: !photo.published });
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Update failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete || pendingDelete.length === 0) return;
    setIsDeleting(true);
    try {
      const removed = await removeMany({ ids: pendingDelete.map((photo) => photo._id) });
      addToast(`${removed} ${removed === 1 ? "photo" : "photos"} deleted`, "success");
      setSelected((prev) => {
        const next = new Set(prev);
        for (const photo of pendingDelete) next.delete(photo._id);
        return next;
      });
      if (editingId && pendingDelete.some((photo) => photo._id === editingId)) closeEdit();
      setPendingDelete(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Delete failed", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleAutoPublish = async (value: boolean) => {
    try {
      await setEmailAutoPublish({ autoPublishEmail: value });
      addToast(
        value ? "Emailed photos publish immediately" : "Emailed photos wait in Unpublished",
        "success",
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Update failed", "error");
    }
  };

  // --- Editor view -----------------------------------------------------------

  if (editing) {
    const publicUrl = `/photos/${editing.slug}`;
    return (
      <div className="dashboard-config-section">
        <div className="dashboard-list-header">
          <h2 className="dashboard-section-heading">Edit photo</h2>
          <div className="dashboard-list-header-actions">
            <button type="button" className="dashboard-action-btn" onClick={closeEdit}>
              Cancel
            </button>
            <button
              type="button"
              className="dashboard-action-btn success"
              onClick={() => void handleSave()}
              disabled={isSaving}
              aria-busy={isSaving}>
              {isSaving ? <SpinnerGap size={16} className="animate-spin" /> : <PencilSimple size={16} />}
              Save photo
            </button>
          </div>
        </div>

        <div className="dashboard-config-grid">
          <div className="dashboard-config-card">
            <h3>Details</h3>
            <div className="config-field">
              <label htmlFor="photo-title">Title</label>
              <input
                id="photo-title"
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Optional. Shows in the lightbox caption."
              />
            </div>
            <div className="config-field">
              <label htmlFor="photo-slug">Slug</label>
              <input
                id="photo-slug"
                type="text"
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
              />
              <span className="config-field-note">
                The photo's address: <code>{publicUrl}</code>. Changing it breaks old links.
              </span>
            </div>
            <div className="config-field">
              <label htmlFor="photo-description">Description</label>
              <textarea
                id="photo-description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                placeholder="Optional. Shows under the title in the lightbox and full frame view."
              />
            </div>
            <div className="config-field">
              <label htmlFor="photo-tags">Tags</label>
              <input
                id="photo-tags"
                type="text"
                value={form.tags}
                onChange={(e) => setField("tags", e.target.value)}
                placeholder="canmore, nature"
                list="photo-known-tags"
              />
              <datalist id="photo-known-tags">
                {knownTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              <span className="config-field-note">
                Comma separated, lowercased. Tags drive the rail filter and <code>?tag=</code>.
              </span>
              {knownTags.length > 0 && (
                <div className="photos-admin-tag-suggestions">
                  {knownTags.map((tag) => {
                    const current = parseTagInput(form.tags);
                    const active = current.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`photos-admin-tag${active ? " is-active" : ""}`}
                        onClick={() => {
                          const next = active
                            ? current.filter((t) => t !== tag)
                            : normalizeTags([...current, tag]);
                          setField("tags", next.join(", "));
                        }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="config-field">
              <label htmlFor="photo-date">Date</label>
              <input
                id="photo-date"
                type="date"
                value={form.capturedAt}
                onChange={(e) => setField("capturedAt", e.target.value)}
              />
              <span className="config-field-note">
                Controls the order in the gallery. Blank sorts by upload time.
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
          </div>

          <div className="dashboard-config-card">
            <h3>Image</h3>
            <div className="photos-admin-preview">
              <img src={editing.thumbnailUrl ?? editing.url} alt={editing.title ?? editing.slug} />
            </div>
            <dl className="photos-admin-facts">
              <div>
                <dt>Size</dt>
                <dd>
                  {editing.width && editing.height
                    ? `${editing.width} x ${editing.height}, `
                    : ""}
                  {formatBytes(editing.size)}
                </dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{editing.source === "email" ? "Email" : "Dashboard"}</dd>
              </div>
              <div>
                <dt>Storage</dt>
                <dd>{editing.provider === "r2" ? "R2" : "Convex"}</dd>
              </div>
              <div>
                <dt>Thumbnail</dt>
                <dd>{editing.thumbnailUrl ? "Ready" : "Missing"}</dd>
              </div>
            </dl>
            <div className="photos-admin-actions-row">
              <button
                type="button"
                className="dashboard-action-btn"
                onClick={() => void handleRegenerateOne()}
                disabled={isSaving}>
                <Images size={16} />
                {editing.thumbnailUrl ? "Regenerate thumbnail" : "Generate thumbnail"}
              </button>
              <a
                className="dashboard-action-btn"
                href={editing.url}
                target="_blank"
                rel="noopener noreferrer">
                <ArrowSquareOut size={16} />
                Open original
              </a>
              {galleryEnabled && editing.published && (
                <a
                  className="dashboard-action-btn"
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer">
                  <ArrowSquareOut size={16} />
                  View on site
                </a>
              )}
              <button
                type="button"
                className="dashboard-action-btn danger"
                onClick={() => setPendingDelete([editing])}>
                <Trash size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {pendingDelete && (
          <DeletePhotosModal
            count={pendingDelete.length}
            label={pendingDelete.map((photo) => photo.title ?? photo.slug).join(", ")}
            isDeleting={isDeleting}
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => void handleDelete()}
          />
        )}
      </div>
    );
  }

  // --- List view -------------------------------------------------------------

  return (
    <div className="dashboard-list-view photos-admin">
      {!galleryEnabled && (
        <div className="photos-admin-notice">
          <Warning size={16} />
          <span>
            The public <code>/photos</code> route is off. Photos stay editable here; turn on{" "}
            <strong>Photos Page</strong> in Site Config to publish the gallery.
          </span>
        </div>
      )}

      {/* Upload zone with batch defaults */}
      <div
        className={`media-upload-zone photos-admin-dropzone${dragOver ? " drag-over" : ""}${isUploading ? " uploading" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}>
        {isUploading ? (
          <SpinnerGap size={32} className="upload-icon spinning" />
        ) : (
          <UploadSimple size={32} className="upload-icon" />
        )}
        <p>{isUploading ? "Uploading photos" : "Drop photos here or click to choose"}</p>
        <span>
          PNG, JPEG, GIF, WebP up to {formatUploadLimit(IMAGE_MAX_BYTES)} each. Stored in{" "}
          {provider === "r2" ? "R2" : "Convex storage"}. An 800px WebP thumbnail is made in your browser.
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          multiple
          hidden
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      <div className="photos-admin-upload-defaults" onClick={(e) => e.stopPropagation()}>
        <div className="config-field">
          <label htmlFor="photos-upload-tags">Tags for this batch</label>
          <input
            id="photos-upload-tags"
            type="text"
            value={uploadTags}
            onChange={(e) => setUploadTags(e.target.value)}
            placeholder="canmore, nature"
            disabled={isUploading}
          />
        </div>
        <div className="config-field checkbox">
          <label>
            <input
              type="checkbox"
              checked={uploadPublish}
              onChange={(e) => setUploadPublish(e.target.checked)}
              disabled={isUploading}
            />
            <span>Publish as soon as each upload finishes</span>
          </label>
        </div>
      </div>

      {uploads.length > 0 && (
        <ul className="photos-admin-uploads" aria-live="polite">
          {uploads.map((item) => (
            <li key={item.id} className={`photos-admin-upload is-${item.status}`}>
              <span className="photos-admin-upload-name">{item.name}</span>
              {item.status === "error" ? (
                <span className="photos-admin-upload-error">{item.error}</span>
              ) : (
                <span className="media-upload-progress">
                  <span style={{ width: `${item.status === "done" ? 100 : item.progress}%` }} />
                </span>
              )}
            </li>
          ))}
          {!isUploading && (
            <li className="photos-admin-upload-clear">
              <button type="button" className="dashboard-action-btn" onClick={() => setUploads([])}>
                Clear list
              </button>
            </li>
          )}
        </ul>
      )}

      {/* Email inbox settings */}
      <div className="dashboard-config-card photos-admin-email">
        <div className="photos-admin-email-head">
          <h3>
            <Envelope size={16} /> Email inbox
          </h3>
          {onOpenDocs && (
            <button type="button" className="dashboard-action-btn" onClick={onOpenDocs}>
              <BookOpen size={16} />
              Docs
            </button>
          )}
        </div>
        {emailSettings === undefined ? (
          <span className="config-field-note">Loading inbox settings</span>
        ) : emailSettings.inbox ? (
          <>
            <p className="config-field-note">
              Send photos as attachments to <code>{emailSettings.inbox}</code> from an allowlisted
              address ({emailSettings.allowedSenderCount}{" "}
              {emailSettings.allowedSenderCount === 1 ? "sender" : "senders"} allowed). Subject
              becomes the title, body the description, and a <code>tags: a, b</code> line sets tags.
              Inline images and signatures are ignored. Up to 10 photos per email.
            </p>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={emailSettings.autoPublishEmail}
                  onChange={(e) => void handleToggleAutoPublish(e.target.checked)}
                />
                <span>Auto publish emailed photos</span>
              </label>
              <span className="config-hint">
                Off keeps them in the Unpublished filter until you publish. Emailed photos have no
                thumbnail until you run the backfill below.
              </span>
            </div>
          </>
        ) : (
          <p className="config-field-note">
            No AgentMail inbox is configured. Set <code>AGENTMAIL_API_KEY</code>,{" "}
            <code>AGENTMAIL_INBOX</code>, and <code>AGENTMAIL_ALLOWED_SENDERS</code> under API Keys
            to email photos in.
          </p>
        )}
      </div>

      {/* Filters and bulk actions */}
      <div className="dashboard-list-header">
        <div className="dashboard-filter-tabs">
          {(
            [
              ["all", `All (${counts.all})`],
              ["unpublished", `Unpublished (${counts.unpublished})`],
              ["email", `From email (${counts.email})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`dashboard-filter-tab${filter === key ? " active" : ""}`}
              onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="dashboard-list-header-actions">
          {counts.missingThumbs > 0 && (
            <button
              type="button"
              className="dashboard-action-btn"
              onClick={() => void handleBackfill()}
              disabled={backfill !== null}>
              {backfill ? (
                <>
                  <SpinnerGap size={16} className="animate-spin" />
                  {backfill.done} / {backfill.total}
                </>
              ) : (
                <>
                  <Images size={16} />
                  Generate missing thumbnails ({counts.missingThumbs})
                </>
              )}
            </button>
          )}
          {visible.length > 0 && (
            <button type="button" className="dashboard-action-btn" onClick={toggleAll}>
              {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              {allVisibleSelected ? "Clear selection" : "Select all"}
            </button>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="photos-admin-bulk" role="toolbar" aria-label="Bulk actions">
          <span>
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            className="dashboard-action-btn success"
            onClick={() => void handleBulkPublish(true)}
            disabled={isBulkWorking}>
            <Eye size={16} />
            Publish
          </button>
          <button
            type="button"
            className="dashboard-action-btn"
            onClick={() => void handleBulkPublish(false)}
            disabled={isBulkWorking}>
            <EyeSlash size={16} />
            Unpublish
          </button>
          <button
            type="button"
            className="dashboard-action-btn danger"
            onClick={() =>
              setPendingDelete(all.filter((photo) => selected.has(photo._id)))
            }
            disabled={isBulkWorking}>
            <Trash size={16} />
            Delete
          </button>
        </div>
      )}

      {/* Photo grid */}
      {photos === undefined ? (
        <div className="dashboard-list-empty">Loading photos...</div>
      ) : visible.length === 0 ? (
        <div className="dashboard-list-empty">
          {query
            ? "No photos match your search"
            : filter === "all"
              ? "No photos yet. Drop a few above or email them in."
              : filter === "unpublished"
                ? "Everything is published."
                : "No photos have arrived by email yet."}
        </div>
      ) : (
        <div className="photos-admin-grid">
          {visible.map((photo) => {
            const isSelected = selected.has(photo._id);
            return (
              <article
                key={photo._id}
                className={`photos-admin-card${isSelected ? " is-selected" : ""}${photo.published ? "" : " is-draft"}`}>
                <button
                  type="button"
                  className="photos-admin-card-select"
                  onClick={() => toggleSelected(photo._id)}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? "Deselect photo" : "Select photo"}>
                  {isSelected ? <CheckSquare size={18} weight="fill" /> : <Square size={18} />}
                </button>
                <button
                  type="button"
                  className="photos-admin-card-image"
                  onClick={() => startEdit(photo)}
                  title="Edit">
                  <img src={photo.thumbnailUrl ?? photo.url} alt={photo.title ?? photo.slug} loading="lazy" />
                  {!photo.thumbnailUrl && (
                    <span className="photos-admin-card-flag" title="No thumbnail yet">
                      Full size
                    </span>
                  )}
                </button>
                <div className="photos-admin-card-body">
                  <button
                    type="button"
                    className="photos-admin-card-title"
                    onClick={() => startEdit(photo)}>
                    {photo.title?.trim() || photo.slug}
                  </button>
                  <div className="photos-admin-card-meta">
                    <span className={`status-badge ${photo.published ? "published" : "draft"}`}>
                      {photo.published ? "Published" : "Unpublished"}
                    </span>
                    {photo.source === "email" && (
                      <span className="status-badge unlisted">Email</span>
                    )}
                  </div>
                  {photo.tags.length > 0 && (
                    <div className="photos-admin-card-tags">
                      {photo.tags.map((tag) => (
                        <span key={tag} className="photos-admin-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="photos-admin-card-actions">
                  <button
                    className="action-btn"
                    onClick={() => void handleTogglePublished(photo)}
                    title={photo.published ? "Unpublish" : "Publish"}>
                    {photo.published ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                  <button className="action-btn edit" onClick={() => startEdit(photo)} title="Edit">
                    <PencilSimple size={16} />
                  </button>
                  {galleryEnabled && photo.published && (
                    <a
                      className="action-btn view"
                      href={`/photos/${photo.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open on ${galleryTitle}`}>
                      <ArrowSquareOut size={16} />
                    </a>
                  )}
                  <button
                    className="action-btn delete"
                    onClick={() => setPendingDelete([photo])}
                    title="Delete">
                    <Trash size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pendingDelete && (
        <DeletePhotosModal
          count={pendingDelete.length}
          label={
            pendingDelete.length <= 3
              ? pendingDelete.map((photo) => photo.title?.trim() || photo.slug).join(", ")
              : `${pendingDelete
                  .slice(0, 3)
                  .map((photo) => photo.title?.trim() || photo.slug)
                  .join(", ")} and ${pendingDelete.length - 3} more`
          }
          isDeleting={isDeleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
