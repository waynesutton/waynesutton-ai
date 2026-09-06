import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConvex, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import {
  ArrowsOut,
  Check,
  CloudArrowUp,
  FilmStrip,
  Image as ImageIcon,
  Images,
  MagnifyingGlass,
  Upload,
  Warning,
  X,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import {
  formatUploadLimit,
  getMaxMediaFileSize,
  getMediaKind,
  IMAGE_UPLOAD_ACCEPT,
  isAllowedMediaFile,
  MEDIA_UPLOAD_ACCEPT,
  type MediaKind,
  type MediaProvider,
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

const SIZE_PRESETS = [
  { id: "original", label: "Original", width: null },
  { id: "large", label: "Large", width: 1200 },
  { id: "medium", label: "Medium", width: 800 },
  { id: "small", label: "Small", width: 400 },
  { id: "thumbnail", label: "Thumbnail", width: 200 },
  { id: "custom", label: "Custom", width: null },
] as const;

type SizePreset = (typeof SIZE_PRESETS)[number]["id"];

interface ImageUploadModalProps {
  isOpen: boolean;
  requiredProvider?: MediaProvider;
  initialTab?: "upload" | "library";
  onClose: () => void;
  onInsert?: (markdown: string) => void;
  // URL mode is used by image-only frontmatter fields.
  onSelectUrl?: (url: string) => void;
}

interface SelectedMedia {
  url: string;
  width: number;
  height: number;
  filename: string;
  kind: MediaKind;
}

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

export function ImageUploadModal({
  isOpen,
  requiredProvider,
  initialTab = "upload",
  onClose,
  onInsert,
  onSelectUrl,
}: ImageUploadModalProps) {
  const urlMode = onSelectUrl !== undefined;
  const [activeTab, setActiveTab] = useState<"upload" | "library">(initialTab);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [sizePreset, setSizePreset] = useState<SizePreset>("original");
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const convex = useConvex();

  const uploadSettings = useQuery(api.media.getUploadSettings);
  const mediaProvider = requiredProvider ?? uploadSettings?.provider ?? "convex";
  const commitFile = useMutation(api.files.commitFile);
  const generateDirectUploadUrl = useMutation(api.media.generateDirectUploadUrl);
  const generateR2UploadUrl = useMutation(api.r2.generateUploadUrl);
  const syncR2Metadata = useMutation(api.r2.syncMetadata);
  const recordMediaAsset = useMutation(api.media.recordMediaAsset);

  const { results: mediaAssets, status: mediaStatus, loadMore } = usePaginatedQuery(
    api.media.listMediaAssets,
    urlMode ? { kind: "image" } : {},
    { initialNumItems: 24 },
  );

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return mediaAssets;
    return mediaAssets.filter((asset) => asset.filename.toLowerCase().includes(term));
  }, [mediaAssets, search]);

  const siteUrl = getSiteUrl();
  const cdnHostname = import.meta.env.VITE_BUNNY_CDN_HOSTNAME;

  const getCdnUrl = useCallback(
    (path: string, blobId: string) =>
      cdnHostname ? `https://${cdnHostname}${path}` : `${siteUrl}/fs/blobs/${blobId}`,
    [cdnHostname, siteUrl],
  );

  const handleClose = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setAltText("");
    setSelectedMedia(null);
    setError(null);
    setUploadProgress(0);
    setSizePreset("original");
    setCustomWidth(null);
    setCustomHeight(null);
    setActiveTab(initialTab);
    setSearch("");
    onClose();
  };

  const getDisplayDimensions = useCallback(() => {
    if (!selectedMedia || selectedMedia.kind === "video") return { width: 0, height: 0 };
    const { width: originalWidth, height: originalHeight } = selectedMedia;
    const aspectRatio = originalHeight > 0 ? originalWidth / originalHeight : 1;

    if (sizePreset === "original") return { width: originalWidth, height: originalHeight };
    if (sizePreset === "custom") {
      if (customWidth && customHeight) return { width: customWidth, height: customHeight };
      if (customWidth) return { width: customWidth, height: Math.round(customWidth / aspectRatio) };
      if (customHeight) return { width: Math.round(customHeight * aspectRatio), height: customHeight };
      return { width: originalWidth, height: originalHeight };
    }

    const preset = SIZE_PRESETS.find((item) => item.id === sizePreset);
    const width = Math.min(preset?.width ?? originalWidth, originalWidth);
    return { width, height: Math.round(width / aspectRatio) };
  }, [customHeight, customWidth, selectedMedia, sizePreset]);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setUploadProgress(0);

      try {
        const contentType = resolveMediaContentType(file);
        const kind = getMediaKind(contentType);
        if (!kind || !isAllowedMediaFile(file)) {
          throw new Error("Choose a PNG, JPG, GIF, WebP, SVG, MP4, WebM, or MOV file");
        }
        if (urlMode && kind === "video") {
          throw new Error("This frontmatter field accepts images only");
        }

        if (!uploadSettings) throw new Error("Storage settings are still loading. Try again.");
        if (!uploadSettings.providers[mediaProvider]) throw new Error(`${mediaProvider.toUpperCase()} storage is not configured. Configure it before uploading.`);
        const configuredLimit = uploadSettings?.limits[mediaProvider];
        const maxBytes = kind === "video"
          ? configuredLimit?.videoMaxBytes ?? getMaxMediaFileSize(mediaProvider, kind)
          : configuredLimit?.imageMaxBytes ?? getMaxMediaFileSize(mediaProvider, kind);
        if (file.size > maxBytes) {
          throw new Error(`${file.name} exceeds the ${formatUploadLimit(maxBytes)} limit`);
        }

        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setAltText(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
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
          const result = await commitFile({
            blobId,
            filename: file.name,
            contentType,
            size: file.size,
            ...(kind === "image" ? dimensions : {}),
          });
          key = result.path;
          url = getCdnUrl(result.path, blobId);
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
          const { storageId } = JSON.parse(responseText) as { storageId: string };
          const resolvedUrl = await convex.query(api.media.getDirectStorageUrl, {
            storageId: storageId as never,
          });
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

        URL.revokeObjectURL(localPreview);
        setPreview(url);
        setSelectedMedia({ ...dimensions, url, filename: file.name, kind });
      } catch (uploadError) {
        setError((uploadError as Error).message);
        setPreview(null);
      } finally {
        setUploading(false);
      }
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
      urlMode,
    ],
  );

  const selectFromLibrary = (asset: (typeof mediaAssets)[number]) => {
    setSelectedMedia({
      url: asset.url,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      filename: asset.filename,
      kind: asset.kind,
    });
    setPreview(asset.url);
    setAltText(asset.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
  };

  const generateMarkup = () => {
    if (!selectedMedia) return "";
    if (selectedMedia.kind === "video") {
      return `<video src="${selectedMedia.url}" controls playsinline preload="metadata"></video>`;
    }

    const alt = altText || "image";
    if (sizePreset === "original") return `![${alt}](${selectedMedia.url})`;
    const dimensions = getDisplayDimensions();
    return `<img src="${selectedMedia.url}" alt="${alt}" width="${dimensions.width}" height="${dimensions.height}" />`;
  };

  const handleInsert = () => {
    if (!selectedMedia) return;
    if (onSelectUrl) onSelectUrl(selectedMedia.url);
    else if (onInsert) onInsert(generateMarkup());
    handleClose();
  };

  useEffect(() => {
    if (sizePreset !== "custom" && selectedMedia?.kind === "image") {
      const dimensions = getDisplayDimensions();
      setCustomWidth(dimensions.width);
      setCustomHeight(dimensions.height);
    }
  }, [getDisplayDimensions, selectedMedia, sizePreset]);

  if (!isOpen) return null;
  const displayDimensions = getDisplayDimensions();
  const activeLimit = uploadSettings?.limits[mediaProvider];
  const imageLimit = activeLimit?.imageMaxBytes ?? getMaxMediaFileSize(mediaProvider, "image");
  const videoLimit = activeLimit?.videoMaxBytes ?? getMaxMediaFileSize(mediaProvider, "video");

  return (
    <div className="image-upload-modal-backdrop" onClick={handleClose}>
      <div className="image-upload-modal image-upload-modal-large" onClick={(event) => event.stopPropagation()}>
        <div className="image-upload-modal-header">
          <h3>
            {urlMode ? <ImageIcon size={20} /> : <Images size={20} />}
            {urlMode ? "Select image" : "Insert media"}
          </h3>
          <button className="image-upload-modal-close" onClick={handleClose} aria-label="Close media picker">
            <X size={20} />
          </button>
        </div>

        <div className="image-upload-tabs">
          <button className={`image-upload-tab ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>
            <Upload size={16} /> Upload new
          </button>
          <button className={`image-upload-tab ${activeTab === "library" ? "active" : ""}`} onClick={() => setActiveTab("library")}>
            <Images size={16} /> Media library
          </button>
        </div>

        <div className="image-upload-modal-content">
          {error && (
            <div className="image-upload-error"><Warning size={16} /><span>{error}</span></div>
          )}

          {activeTab === "upload" && !selectedMedia && (
            <div
              className={`image-upload-dropzone ${dragOver ? "drag-over" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
              onDragLeave={(event) => { event.preventDefault(); setDragOver(false); }}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                const file = event.dataTransfer.files[0];
                if (file) void handleUpload(file);
              }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={urlMode ? IMAGE_UPLOAD_ACCEPT : MEDIA_UPLOAD_ACCEPT}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
                style={{ display: "none" }}
              />
              {uploading ? (
                <>
                  <CloudArrowUp size={48} />
                  <p>Uploading {uploadProgress}%</p>
                  <div className="media-upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${uploadProgress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <Upload size={48} />
                  <p><strong>Click to upload</strong> or drag and drop</p>
                  <span>
                    {urlMode
                      ? `PNG, JPG, GIF, WebP, or SVG up to ${formatUploadLimit(imageLimit)}`
                      : `Images up to ${formatUploadLimit(imageLimit)} or MP4, WebM, MOV up to ${formatUploadLimit(videoLimit)}`}
                  </span>
                </>
              )}
            </div>
          )}

          {activeTab === "library" && !selectedMedia && (
            <div className="image-upload-library">
              <label className="image-upload-library-search">
                <MagnifyingGlass size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search filenames" />
              </label>
              {filteredAssets.length === 0 ? (
                <div className="image-upload-library-empty">
                  <Images size={32} />
                  <p>{search ? "No matching media" : "No media uploaded yet"}</p>
                  {!search && <button onClick={() => setActiveTab("upload")}>Upload media</button>}
                </div>
              ) : (
                <>
                  <div className="image-upload-library-grid">
                    {filteredAssets.map((asset) => (
                      <button key={asset._id} className="image-upload-library-item" onClick={() => selectFromLibrary(asset)}>
                        {asset.kind === "video" ? (
                          <>
                            <video src={asset.url} muted preload="metadata" playsInline />
                            <span className="media-kind-badge"><FilmStrip size={13} /> Video</span>
                          </>
                        ) : (
                          <img src={asset.url} alt={asset.filename} loading="lazy" />
                        )}
                        <span className="image-upload-library-name">{asset.filename}</span>
                      </button>
                    ))}
                  </div>
                  {mediaStatus === "CanLoadMore" && (
                    <button className="image-upload-library-loadmore" onClick={() => loadMore(24)}>Load more</button>
                  )}
                </>
              )}
            </div>
          )}

          {selectedMedia && (
            <div className="image-upload-selected">
              <div className="image-upload-preview-container">
                <div className="image-upload-preview">
                  {selectedMedia.kind === "video" ? (
                    <video src={preview ?? selectedMedia.url} controls playsInline preload="metadata" />
                  ) : (
                    <img src={preview ?? selectedMedia.url} alt="Preview" />
                  )}
                </div>
                {selectedMedia.kind === "image" && (
                  <div className="image-upload-dimensions">
                    <ArrowsOut size={14} />
                    <span>
                      {selectedMedia.width} x {selectedMedia.height}px
                      {sizePreset !== "original" && <> to {displayDimensions.width} x {displayDimensions.height}px</>}
                    </span>
                  </div>
                )}
              </div>

              <div className="image-upload-settings">
                {!urlMode && selectedMedia.kind === "image" && (
                  <div className="image-upload-field">
                    <label htmlFor="alt-text">Alt text</label>
                    <input id="alt-text" value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image" />
                  </div>
                )}
                {!urlMode && selectedMedia.kind === "image" && (
                  <div className="image-upload-field">
                    <label>Size</label>
                    <div className="image-upload-size-presets">
                      {SIZE_PRESETS.map((preset) => (
                        <button key={preset.id} className={`image-upload-size-btn ${sizePreset === preset.id ? "active" : ""}`} onClick={() => setSizePreset(preset.id)}>
                          {sizePreset === preset.id && <Check size={12} />}
                          {preset.label}
                          {preset.width && <span className="size-hint">{preset.width}px</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!urlMode && selectedMedia.kind === "image" && sizePreset === "custom" && (
                  <div className="image-upload-custom-size">
                    <div className="image-upload-field-inline">
                      <label>Width</label>
                      <input type="number" value={customWidth ?? ""} onChange={(event) => {
                        const value = Number.parseInt(event.target.value, 10) || null;
                        setCustomWidth(value);
                        if (value && selectedMedia.height > 0) setCustomHeight(Math.round(value / (selectedMedia.width / selectedMedia.height)));
                      }} />
                      <span>px</span>
                    </div>
                    <div className="image-upload-field-inline">
                      <label>Height</label>
                      <input type="number" value={customHeight ?? ""} onChange={(event) => {
                        const value = Number.parseInt(event.target.value, 10) || null;
                        setCustomHeight(value);
                        if (value && selectedMedia.height > 0) setCustomWidth(Math.round(value * (selectedMedia.width / selectedMedia.height)));
                      }} />
                      <span>px</span>
                    </div>
                  </div>
                )}
                <button className="image-upload-change" onClick={() => { setSelectedMedia(null); setPreview(null); }}>
                  Choose different media
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="image-upload-modal-footer">
          <button className="image-upload-cancel" onClick={handleClose}>Cancel</button>
          <button className="image-upload-insert" onClick={handleInsert} disabled={!selectedMedia || uploading}>
            {urlMode ? "Use image" : selectedMedia?.kind === "video" ? "Insert video" : "Insert image"}
          </button>
        </div>
      </div>
    </div>
  );
}
