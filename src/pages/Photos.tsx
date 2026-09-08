import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import {
  Check,
  FileText,
  Presentation,
  Rows,
  SquaresFour,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import Footer from "../components/Footer";
import SocialFooter from "../components/SocialFooter";
import PhotoLightbox, { type PhotoOverlayMode } from "../components/PhotoLightbox";
import siteConfig from "../config/siteConfig";
import {
  collectTagCounts,
  filterPhotosByTag,
  type PhotoDoc,
} from "../../convex/lib/photosDirectory";

type ViewMode = "grid" | "full";

const VIEW_MODE_STORAGE_KEY = "photos-view-mode";
const COPIED_RESET_MS = 1500;

type CopyState = "idle" | "copied" | "failed";

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

// The saved view wins over the config default so a visitor's choice sticks.
function readStoredViewMode(fallback: ViewMode): ViewMode {
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "grid" || stored === "full" ? stored : fallback;
  } catch {
    return fallback;
  }
}

function photoAlt(photo: PhotoDoc): string {
  return photo.title?.trim() || photo.slug;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Photo gallery: grid by default, full frame toggle, tag rail with the filter in
// ?tag=, lightbox on /photos/<slug>, presentation mode from the header.
export default function Photos() {
  const config = siteConfig.photosPage;
  const title = config?.title ?? "Photos";
  const intervalMs = config?.slideshowIntervalMs ?? 5000;

  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTag = searchParams.get("tag")?.trim().toLowerCase() || null;

  const photos = useQuery(api.photos.listPublished);
  const markdown = useQuery(api.photos.getMarkdown, {
    siteUrl: typeof window === "undefined" ? undefined : window.location.origin,
  });
  const footerPage = useQuery(api.pages.getPageBySlug, { slug: "footer" });

  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    readStoredViewMode(config?.viewMode ?? "grid"),
  );
  const [overlayMode, setOverlayMode] = useState<PhotoOverlayMode>("lightbox");
  const [markdownState, copyMarkdown] = useCopy();

  const showToggle = config?.showViewToggle ?? true;
  const showTags = config?.showTagFilter ?? true;

  const allPhotos = useMemo(() => photos ?? [], [photos]);
  const tagCounts = useMemo(() => collectTagCounts(allPhotos), [allPhotos]);
  const visible = useMemo(
    () => filterPhotosByTag(allPhotos, activeTag),
    [allPhotos, activeTag],
  );

  // The open photo is looked up in the filtered list so arrows stay inside the
  // active tag. A slug outside the filter drops the filter instead of 404ing.
  const openIndex = slug ? visible.findIndex((photo) => photo.slug === slug) : -1;
  const openPhoto = openIndex >= 0 ? visible[openIndex] : null;
  const slugExists = slug ? allPhotos.some((photo) => photo.slug === slug) : false;
  const notFound = photos !== undefined && Boolean(slug) && !slugExists;

  const search = activeTag ? `?tag=${encodeURIComponent(activeTag)}` : "";

  useEffect(() => {
    if (slug && photos !== undefined && slugExists && openIndex < 0) {
      navigate(`/photos/${encodeURIComponent(slug)}`, { replace: true });
    }
  }, [navigate, openIndex, photos, slug, slugExists]);

  useEffect(() => {
    const suffix = ` | ${siteConfig.name}`;
    document.title = openPhoto
      ? `${photoAlt(openPhoto)}${suffix}`
      : activeTag
        ? `${title}: ${activeTag}${suffix}`
        : `${title}${suffix}`;
    return () => {
      document.title = siteConfig.name;
    };
  }, [activeTag, openPhoto, title]);

  // Closing the overlay through any path returns to lightbox mode next time
  useEffect(() => {
    if (!openPhoto) setOverlayMode("lightbox");
  }, [openPhoto]);

  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Private mode or storage disabled: the toggle still works for this visit
    }
  };

  const openAt = useCallback(
    (index: number, options: { replace?: boolean } = {}) => {
      const target = visible[index];
      if (!target) return;
      navigate(`/photos/${encodeURIComponent(target.slug)}${search}`, {
        replace: options.replace ?? false,
      });
    },
    [navigate, search, visible],
  );

  const closeOverlay = useCallback(() => {
    navigate(`/photos${search}`);
  }, [navigate, search]);

  const startPresentation = () => {
    if (visible.length === 0) return;
    setOverlayMode("present");
    if (openIndex < 0) openAt(0);
  };

  const jumpToTag = useCallback(
    (tag: string) => {
      navigate(`/photos?tag=${encodeURIComponent(tag)}`);
    },
    [navigate],
  );

  const total = allPhotos.length;
  const showFooter = siteConfig.footer.enabled && siteConfig.footer.showOnBlogPage;
  const hasRail = showTags && tagCounts.length > 0;

  return (
    <div className="photos-page">
      <header className="photos-header">
        <div className="photos-header-top">
          <div>
            <h1 className="photos-title">{title}</h1>
            {config?.description && (
              <p className="photos-description">{config.description}</p>
            )}
          </div>
          {total > 0 && (
            <div className="photos-header-actions">
              {showToggle && (
                <div className="photos-view-toggle" role="group" aria-label="Layout">
                  <button
                    type="button"
                    className="photos-view-btn"
                    aria-pressed={viewMode === "grid"}
                    onClick={() => changeView("grid")}
                    title="Grid"
                    aria-label="Grid view"
                  >
                    <SquaresFour size={16} weight={viewMode === "grid" ? "fill" : "regular"} />
                  </button>
                  <button
                    type="button"
                    className="photos-view-btn"
                    aria-pressed={viewMode === "full"}
                    onClick={() => changeView("full")}
                    title="Full frame"
                    aria-label="Full frame view"
                  >
                    <Rows size={16} weight={viewMode === "full" ? "fill" : "regular"} />
                  </button>
                </div>
              )}
              <button
                type="button"
                className="slide-present-btn photos-present-btn"
                onClick={startPresentation}
                disabled={visible.length === 0}
                title="Present (P)"
              >
                <Presentation size={16} weight="regular" />
                <span>Present</span>
              </button>
              <button
                type="button"
                className="skills-markdown-button photos-markdown-button"
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
                <span>
                  {markdownState === "copied"
                    ? "Copied"
                    : markdownState === "failed"
                      ? "Copy failed"
                      : "Copy as markdown"}
                </span>
              </button>
            </div>
          )}
        </div>
        {total > 0 && (
          <div className="photos-meta">
            <span className="photos-count">
              {activeTag ? `${visible.length} of ${total}` : total}{" "}
              {total === 1 ? "photo" : "photos"}
            </span>
            {activeTag && (
              <>
                <span className="photos-meta-sep" aria-hidden="true">
                  ·
                </span>
                <span className="photos-active-tag">
                  Tag <strong>{activeTag}</strong>
                </span>
                <Link to="/photos" className="photos-clear-tag">
                  Clear
                </Link>
              </>
            )}
            <span className="photos-meta-sep" aria-hidden="true">
              ·
            </span>
            <span className="photos-agent-hint">
              Agents:{" "}
              <code className="skills-agent-path" title="cat /photos.md via /vfs/exec">
                photos.md
              </code>
            </span>
          </div>
        )}
      </header>

      {notFound && (
        <div className="photos-notfound" role="status">
          <p>That photo is not here. It may be unpublished or the link is old.</p>
          <Link to="/photos" className="photos-notfound-link">
            Back to {title}
          </Link>
        </div>
      )}

      {photos === undefined ? null : total === 0 ? (
        <p className="photos-empty">No photos yet.</p>
      ) : (
        <div className={`photos-layout${hasRail ? " photos-layout-with-rail" : ""}`}>
          <div className="photos-main">
            {visible.length === 0 ? (
              <p className="photos-empty">
                No photos tagged "{activeTag}".{" "}
                <Link to="/photos">Show all</Link>
              </p>
            ) : viewMode === "grid" ? (
              <div className="photos-grid" role="list">
                {visible.map((photo, index) => (
                  <button
                    key={photo._id}
                    type="button"
                    role="listitem"
                    className="photo-tile"
                    onClick={() => openAt(index)}
                    aria-label={`Open ${photoAlt(photo)}`}
                  >
                    <img
                      src={photo.thumbnailUrl ?? photo.url}
                      alt={photoAlt(photo)}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="photos-full">
                {visible.map((photo, index) => (
                  <figure key={photo._id} className="photos-full-item">
                    <button
                      type="button"
                      className="photos-full-button"
                      onClick={() => openAt(index)}
                      aria-label={`Open ${photoAlt(photo)}`}
                    >
                      <img
                        src={photo.url}
                        alt={photoAlt(photo)}
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                        decoding="async"
                        style={
                          photo.width && photo.height
                            ? { aspectRatio: `${photo.width} / ${photo.height}` }
                            : undefined
                        }
                      />
                    </button>
                    {(photo.title || photo.description || photo.tags.length > 0) && (
                      <figcaption className="photos-full-caption">
                        {photo.title && (
                          <span className="photos-full-title">{photo.title}</span>
                        )}
                        {photo.description && (
                          <span className="photos-full-description">
                            {photo.description}
                          </span>
                        )}
                        <span className="photos-full-meta">
                          <time dateTime={new Date(photo.capturedAt ?? photo.createdAt).toISOString()}>
                            {formatDate(photo.capturedAt ?? photo.createdAt)}
                          </time>
                          {photo.tags.map((tag) => (
                            <Link
                              key={tag}
                              to={`/photos?tag=${encodeURIComponent(tag)}`}
                              className="post-tag post-tag-link"
                            >
                              {tag}
                            </Link>
                          ))}
                        </span>
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </div>

          {hasRail && (
            <aside className="photos-rail" aria-label="Filter by tag">
              <span className="photos-rail-label">Tags</span>
              <div className="photos-rail-chips">
                <Link
                  to="/photos"
                  className={`photos-tag-chip${activeTag ? "" : " is-active"}`}
                  aria-current={activeTag ? undefined : "true"}
                >
                  All <span className="photos-tag-count">{total}</span>
                </Link>
                {tagCounts.map((entry) => {
                  const isActive = entry.tag === activeTag;
                  return (
                    <Link
                      key={entry.tag}
                      to={isActive ? "/photos" : `/photos?tag=${encodeURIComponent(entry.tag)}`}
                      className={`photos-tag-chip${isActive ? " is-active" : ""}`}
                      aria-current={isActive ? "true" : undefined}
                    >
                      {entry.tag} <span className="photos-tag-count">{entry.count}</span>
                    </Link>
                  );
                })}
              </div>
              <span className="photos-rail-count">
                {visible.length} {visible.length === 1 ? "photo" : "photos"}
              </span>
            </aside>
          )}
        </div>
      )}

      {openPhoto && (
        <PhotoLightbox
          photos={visible}
          index={openIndex}
          mode={overlayMode}
          intervalMs={intervalMs}
          onIndexChange={(index) => openAt(index, { replace: true })}
          onModeChange={setOverlayMode}
          onClose={closeOverlay}
          onTagClick={jumpToTag}
        />
      )}

      {showFooter && <Footer syncedContent={footerPage?.content} />}

      <SocialFooter surface="blog" />
    </div>
  );
}
