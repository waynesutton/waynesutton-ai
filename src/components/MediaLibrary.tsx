import { useCallback, useMemo, useRef, useState } from "react";
import { useConvex, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import {
  Check,
  CheckSquare,
  CloudArrowUp,
  Code,
  CopySimple,
  FilmStrip,
  Image as ImageIcon,
  Link as LinkIcon,
  MagnifyingGlass,
  SelectionAll,
  Square,
  Trash,
  Upload,
  Warning,
  X,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  formatUploadLimit,
  getMaxMediaFileSize,
  getMediaKind,
  isAllowedMediaFile,
  MEDIA_UPLOAD_ACCEPT,
  resolveMediaContentType,
  uploadFileWithProgress,
} from "../utils/imageUpload";

const getSiteUrl = () => {
  const explicitSiteUrl =
    (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined) ||
    (import.meta.env.VITE_SITE_URL as string | undefined);
  if (explicitSiteUrl) return explicitSiteUrl;
  const convexUrl = import.meta.env.VITE_CONVEX_URL ?? "";
  return convexUrl.replace(/\.cloud$/, ".site");
};

type CopyFormat = "markdown" | "html" | "url";

function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary() {
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<CopyFormat | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"mediaAssets"> | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<Id<"mediaAssets">>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const convex = useConvex();

  const uploadSettings = useQuery(api.media.getUploadSettings);
  const mediaProvider = uploadSettings?.provider ?? "convex";
  const commitFile = useMutation(api.files.commitFile);
  const generateDirectUploadUrl = useMutation(api.media.generateDirectUploadUrl);
  const generateR2UploadUrl = useMutation(api.r2.generateUploadUrl);
  const syncR2Metadata = useMutation(api.r2.syncMetadata);
  const recordMediaAsset = useMutation(api.media.recordMediaAsset);
  const deleteMediaAsset = useMutation(api.media.deleteMediaAsset);
  const { results, status, loadMore } = usePaginatedQuery(
    api.media.listMediaAssets,
    {},
    { initialNumItems: 30 },
  );

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return results;
    return results.filter((asset) => asset.filename.toLowerCase().includes(term));
  }, [results, search]);

  const siteUrl = getSiteUrl();
  const cdnHostname = import.meta.env.VITE_BUNNY_CDN_HOSTNAME;
  const getCdnUrl = useCallback(
    (path: string, blobId: string) =>
      cdnHostname ? `https://${cdnHostname}${path}` : `${siteUrl}/fs/blobs/${blobId}`,
    [cdnHostname, siteUrl],
  );

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);
      setUploading(true);

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setUploadProgress(0);
        setUploadLabel(`Uploading ${file.name} (${index + 1}/${files.length})`);

        try {
          const contentType = resolveMediaContentType(file);
          const kind = getMediaKind(contentType);
          if (!kind || !isAllowedMediaFile(file)) {
            throw new Error(`${file.name} is not a supported image or video`);
          }

          const providerLimit = uploadSettings?.limits[mediaProvider];
          const maxBytes = kind === "video"
            ? providerLimit?.videoMaxBytes ?? getMaxMediaFileSize(mediaProvider, kind)
            : providerLimit?.imageMaxBytes ?? getMaxMediaFileSize(mediaProvider, kind);
          if (file.size > maxBytes) {
            throw new Error(`${file.name} exceeds the ${formatUploadLimit(maxBytes)} limit`);
          }

          const dimensions = kind === "image"
            ? await imageDimensions(file)
            : { width: 0, height: 0 };
          let key = "";
          let url = "";

          if (mediaProvider === "convexfs") {
            const responseText = await uploadFileWithProgress({
              url: `${siteUrl}/fs/upload`,
              method: "POST",
              file,
              contentType,
              onProgress: setUploadProgress,
            });
            const { blobId } = JSON.parse(responseText) as { blobId: string };
            const committed = await commitFile({
              blobId,
              filename: file.name,
              contentType,
              size: file.size,
              ...(kind === "image" ? dimensions : {}),
            });
            key = committed.path;
            url = getCdnUrl(committed.path, blobId);
          } else if (mediaProvider === "r2") {
            const upload = await generateR2UploadUrl({});
            await uploadFileWithProgress({
              url: upload.url,
              method: "PUT",
              file,
              contentType,
              onProgress: setUploadProgress,
            });
            await syncR2Metadata({ key: upload.key });
            key = upload.key;
            url = await convex.query(api.r2.getPermanentUrl, { key });
          } else {
            const uploadUrl = await generateDirectUploadUrl({});
            const responseText = await uploadFileWithProgress({
              url: uploadUrl,
              method: "POST",
              file,
              contentType,
              onProgress: setUploadProgress,
            });
            const { storageId } = JSON.parse(responseText) as { storageId: Id<"_storage"> };
            const resolvedUrl = await convex.query(api.media.getDirectStorageUrl, { storageId });
            if (!resolvedUrl) throw new Error("Upload succeeded but its URL is unavailable");
            key = storageId;
            url = resolvedUrl;
          }

          await recordMediaAsset({
            provider: mediaProvider,
            key,
            url,
            filename: file.name,
            contentType,
            kind,
            size: file.size,
            ...(kind === "image" ? dimensions : {}),
          });
        } catch (uploadError) {
          setError((uploadError as Error).message);
          break;
        }
      }

      setUploading(false);
      setUploadLabel(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [
      commitFile,
      convex,
      generateDirectUploadUrl,
      generateR2UploadUrl,
      getCdnUrl,
      mediaProvider,
      recordMediaAsset,
      siteUrl,
      syncR2Metadata,
      uploadSettings,
    ],
  );

  const handleCopy = async (asset: (typeof results)[number], format: CopyFormat) => {
    const videoHtml = `<video src="${asset.url}" controls playsinline preload="metadata"></video>`;
    const text = format === "url"
      ? asset.url
      : asset.kind === "video"
        ? videoHtml
        : format === "markdown"
          ? `![${asset.filename}](${asset.url})`
          : `<img src="${asset.url}" alt="${asset.filename}" />`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(asset._id);
      setCopiedFormat(format);
      window.setTimeout(() => {
        setCopiedId(null);
        setCopiedFormat(null);
      }, 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const handleDelete = async (id: Id<"mediaAssets">) => {
    try {
      await deleteMediaAsset({ id });
      setDeleteConfirm(null);
      setSelectedAssets((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedAssets) await deleteMediaAsset({ id });
      setSelectedAssets(new Set());
      setSelectMode(false);
      setBulkDeleteConfirm(false);
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  };

  const providerConfigured = uploadSettings?.providers[mediaProvider] ?? false;
  const videoLimit = uploadSettings?.limits[mediaProvider].videoMaxBytes ??
    getMaxMediaFileSize(mediaProvider, "video");

  return (
    <div className="media-library">
      <div className="media-library-header">
        <ImageIcon size={32} weight="light" />
        <h2>Media library</h2>
        <p>Upload and manage images and videos for your content</p>
      </div>

      {!providerConfigured && (
        <div className="media-config-warning">
          <Warning size={20} />
          <div>
            <strong>{mediaProvider} is not configured</strong>
            <p>Finish the provider environment setup before uploading new media.</p>
          </div>
        </div>
      )}
      {mediaProvider === "r2" && providerConfigured && !uploadSettings?.r2PublicUrl && (
        <div className="media-config-warning">
          <Warning size={20} />
          <div>
            <strong>R2 custom domain is not configured</strong>
            <p>Uploads use the Convex signed-redirect fallback until R2_PUBLIC_URL is set.</p>
          </div>
        </div>
      )}

      <div className="media-toolbar media-toolbar-search-row">
        <label className="media-search">
          <MagnifyingGlass size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search filenames" />
        </label>
        {results.length > 0 && (
          <button className={`media-toolbar-btn ${selectMode ? "active" : ""}`} onClick={() => {
            setSelectMode((current) => !current);
            setSelectedAssets(new Set());
          }}>
            <SelectionAll size={16} />
            <span>{selectMode ? "Cancel" : "Select"}</span>
          </button>
        )}
        {selectMode && (
          <>
            <button className="media-toolbar-btn" onClick={() => setSelectedAssets(new Set(filteredAssets.map((asset) => asset._id)))}>
              <CheckSquare size={16} /><span>Select all</span>
            </button>
            {selectedAssets.size > 0 && (
              <button className="media-toolbar-btn danger" onClick={() => setBulkDeleteConfirm(true)}>
                <Trash size={16} /><span>Delete ({selectedAssets.size})</span>
              </button>
            )}
          </>
        )}
      </div>

      {bulkDeleteConfirm && (
        <div className="media-bulk-delete-confirm">
          <Warning size={20} />
          <p>Delete {selectedAssets.size} selected media items and their stored files?</p>
          <div className="media-bulk-delete-actions">
            <button className="cancel" onClick={() => setBulkDeleteConfirm(false)}>Cancel</button>
            <button className="confirm" onClick={() => void handleBulkDelete()}>Delete all</button>
          </div>
        </div>
      )}

      {error && (
        <div className="media-error">
          <Warning size={16} /><span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error"><X size={14} /></button>
        </div>
      )}

      <div
        className={`media-upload-zone ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
        onDragLeave={(event) => { event.preventDefault(); setDragOver(false); }}
        onDrop={(event) => { event.preventDefault(); setDragOver(false); void handleUpload(event.dataTransfer.files); }}
        onClick={() => !uploading && providerConfigured && fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept={MEDIA_UPLOAD_ACCEPT} multiple onChange={(event) => void handleUpload(event.target.files)} style={{ display: "none" }} />
        {uploading ? (
          <>
            <CloudArrowUp size={48} className="upload-icon" />
            <p>{uploadLabel} - {uploadProgress}%</p>
            <div className="media-upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${uploadProgress}%` }} />
            </div>
          </>
        ) : (
          <>
            <Upload size={48} className="upload-icon" />
            <p><strong>Click to upload</strong> or drag and drop</p>
            <span>Images up to 10MB or MP4, WebM, MOV up to {formatUploadLimit(videoLimit)}</span>
          </>
        )}
      </div>

      <div className="media-grid">
        {filteredAssets.map((asset) => {
          const selected = selectedAssets.has(asset._id);
          return (
            <div
              key={asset._id}
              className={`media-item ${selectMode ? "select-mode" : ""} ${selected ? "selected" : ""}`}
              onClick={selectMode ? () => setSelectedAssets((current) => {
                const next = new Set(current);
                if (next.has(asset._id)) next.delete(asset._id);
                else next.add(asset._id);
                return next;
              }) : undefined}
            >
              {selectMode && (
                <div className="media-item-checkbox">
                  {selected ? <CheckSquare size={20} weight="fill" /> : <Square size={20} />}
                </div>
              )}
              <div className="media-item-preview">
                {asset.kind === "video" ? (
                  <video src={asset.url} controls playsInline preload="metadata" />
                ) : (
                  <img src={asset.url} alt={asset.filename} loading="lazy" />
                )}
                {asset.kind === "video" && <span className="media-kind-badge"><FilmStrip size={13} /> Video</span>}
              </div>
              <div className="media-item-info">
                <span className="media-item-name" title={asset.filename}>{asset.filename}</span>
                <span className="media-item-size">{formatSize(asset.size)} · {asset.provider}</span>
              </div>
              {!selectMode && (
                <div className="media-item-actions">
                  {(["markdown", "html", "url"] as const).map((format) => (
                    <button
                      key={format}
                      className={`media-copy-btn ${copiedId === asset._id && copiedFormat === format ? "copied" : ""}`}
                      onClick={(event) => { event.stopPropagation(); void handleCopy(asset, format); }}
                      title={`Copy ${format}`}
                    >
                      {copiedId === asset._id && copiedFormat === format
                        ? <Check size={14} />
                        : format === "markdown"
                          ? <CopySimple size={14} />
                          : format === "html"
                            ? <Code size={14} />
                            : <LinkIcon size={14} />}
                      <span>{format === "markdown" ? "MD" : format === "html" ? "HTML" : "URL"}</span>
                    </button>
                  ))}
                  <button className="media-delete-btn" onClick={(event) => { event.stopPropagation(); setDeleteConfirm(asset._id); }} title="Delete">
                    <Trash size={14} />
                  </button>
                </div>
              )}
              {deleteConfirm === asset._id && (
                <div className="media-delete-confirm" onClick={(event) => event.stopPropagation()}>
                  <p>Delete this media item and its stored file?</p>
                  <div className="media-delete-confirm-actions">
                    <button className="cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    <button className="confirm" onClick={() => void handleDelete(asset._id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {status === "CanLoadMore" && <button className="media-load-more" onClick={() => loadMore(30)}>Load more</button>}
      {status === "LoadingMore" && <div className="media-loading">Loading...</div>}
      {filteredAssets.length === 0 && status !== "LoadingFirstPage" && (
        <div className="media-empty">
          <ImageIcon size={64} weight="light" />
          <p>{search ? "No matching media" : "No media uploaded yet"}</p>
          <span>{search ? "Try another filename" : "Upload your first image or video to get started"}</span>
        </div>
      )}

      <div className="media-info">
        <h3>Usage</h3>
        <p>Copy Markdown, HTML, or a direct URL. New uploads are stored in the shared catalog and served by the active {mediaProvider} provider.</p>
      </div>
    </div>
  );
}
