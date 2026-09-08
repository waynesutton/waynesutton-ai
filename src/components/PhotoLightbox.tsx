import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, Pause, Play, Presentation, X } from "@phosphor-icons/react";
import type { PhotoDoc } from "../../convex/lib/photosDirectory";

export type PhotoOverlayMode = "lightbox" | "present";

interface PhotoLightboxProps {
  photos: Array<PhotoDoc>;
  index: number;
  mode: PhotoOverlayMode;
  intervalMs: number;
  onIndexChange: (index: number) => void;
  onModeChange: (mode: PhotoOverlayMode) => void;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
}

const SWIPE_THRESHOLD_PX = 40;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// One overlay for both the lightbox and presentation mode. Lightbox shows
// arrows, a counter, and the caption; present mode strips the chrome and
// autoplays. Both share keyboard, swipe, click thirds, scroll lock, and portal.
export default function PhotoLightbox({
  photos,
  index,
  mode,
  intervalMs,
  onIndexChange,
  onModeChange,
  onClose,
  onTagClick,
}: PhotoLightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion] = useState(prefersReducedMotion);

  const count = photos.length;
  const photo = photos[index];
  const isPresent = mode === "present";

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      // Present mode wraps so autoplay loops; lightbox stops at the ends
      const clamped = isPresent
        ? (next + count) % count
        : Math.min(Math.max(next, 0), count - 1);
      if (clamped !== index) onIndexChange(clamped);
    },
    [count, index, isPresent, onIndexChange],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Keyboard: arrows, Home/End, Escape, Space pauses in present mode, P toggles
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
          event.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          goPrev();
          break;
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(count - 1);
          break;
        case " ":
          if (isPresent) {
            event.preventDefault();
            setPaused((value) => !value);
          }
          break;
        case "p":
        case "P":
          event.preventDefault();
          onModeChange(isPresent ? "lightbox" : "present");
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [count, goNext, goPrev, goTo, isPresent, onClose, onModeChange]);

  // Lock page scroll while open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Preload neighbours so arrows feel instant
  useEffect(() => {
    const neighbours = [photos[index - 1], photos[index + 1]];
    for (const neighbour of neighbours) {
      if (!neighbour) continue;
      const img = new Image();
      img.src = neighbour.url;
    }
  }, [index, photos]);

  // Autoplay in present mode; timer resets when the photo or pause changes
  useEffect(() => {
    if (!isPresent || paused || count < 2) return;
    const timer = window.setTimeout(() => {
      onIndexChange((index + 1) % count);
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [count, index, intervalMs, isPresent, onIndexChange, paused]);

  // Leaving present mode clears pause so the next session autoplays
  useEffect(() => {
    if (!isPresent) setPaused(false);
  }, [isPresent]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a")) return;
    if (isPresent) {
      // Click thirds: left third back, right third forward, middle pauses
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = event.clientX - rect.left;
      if (x < rect.width / 3) goPrev();
      else if (x > (rect.width * 2) / 3) goNext();
      else setPaused((value) => !value);
      return;
    }
    // Lightbox: clicking outside the image or caption closes
    if (!target.closest(".photo-lightbox-stage, .photo-lightbox-caption")) {
      onClose();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  if (!photo) return null;

  const caption = photo.title?.trim() || "";
  const progressPercent = count > 0 ? ((index + 1) / count) * 100 : 100;

  return createPortal(
    <div
      ref={containerRef}
      className={`photo-lightbox photo-lightbox-${mode}`}
      role="dialog"
      aria-modal="true"
      aria-label={caption || `Photo ${index + 1} of ${count}`}
      data-reduced-motion={reducedMotion ? "true" : undefined}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Present mode: thin bar fills across the autoplay interval */}
      {isPresent && (
        <div className="photo-lightbox-progress" aria-hidden="true">
          <div
            key={`${index}-${paused ? "paused" : "playing"}`}
            className="photo-lightbox-progress-bar"
            style={{
              animationDuration: `${intervalMs}ms`,
              animationPlayState: paused ? "paused" : "running",
              width: reducedMotion || count < 2 ? `${progressPercent}%` : undefined,
            }}
          />
        </div>
      )}

      <div className="photo-lightbox-toolbar">
        {!isPresent && (
          <span className="photo-lightbox-counter" aria-live="polite">
            {index + 1} / {count}
          </span>
        )}
        <div className="photo-lightbox-toolbar-actions">
          {isPresent && count > 1 && (
            <button
              type="button"
              className="photo-lightbox-btn"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
            >
              {paused ? <Play size={18} weight="bold" /> : <Pause size={18} weight="bold" />}
            </button>
          )}
          <button
            type="button"
            className="photo-lightbox-btn"
            onClick={() => onModeChange(isPresent ? "lightbox" : "present")}
            aria-label={isPresent ? "Exit presentation" : "Present"}
            title={isPresent ? "Exit presentation (P)" : "Present (P)"}
          >
            <Presentation size={18} weight="regular" />
          </button>
          <button
            type="button"
            className="photo-lightbox-btn"
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>

      {!isPresent && count > 1 && (
        <button
          type="button"
          className="photo-lightbox-arrow photo-lightbox-arrow-prev"
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Previous photo"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
      )}

      <figure className="photo-lightbox-stage">
        <img
          key={photo.slug}
          className="photo-lightbox-image"
          src={photo.url}
          alt={caption || photo.slug}
          width={photo.width}
          height={photo.height}
          decoding="async"
        />
        {!isPresent && (caption || photo.description || photo.tags.length > 0) && (
          <figcaption className="photo-lightbox-caption">
            {caption && <span className="photo-lightbox-title">{caption}</span>}
            {photo.description?.trim() && (
              <span className="photo-lightbox-description">{photo.description.trim()}</span>
            )}
            {photo.tags.length > 0 && (
              <span className="photo-lightbox-tags">
                {photo.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="post-tag post-tag-link photo-lightbox-tag"
                    onClick={() => onTagClick?.(tag)}
                    disabled={!onTagClick}
                  >
                    {tag}
                  </button>
                ))}
              </span>
            )}
          </figcaption>
        )}
      </figure>

      {!isPresent && count > 1 && (
        <button
          type="button"
          className="photo-lightbox-arrow photo-lightbox-arrow-next"
          onClick={goNext}
          disabled={index === count - 1}
          aria-label="Next photo"
        >
          <CaretRight size={24} weight="bold" />
        </button>
      )}

      {isPresent && (
        <div className="photo-lightbox-float" aria-hidden="true">
          {index + 1} / {count}
        </div>
      )}
    </div>,
    document.body,
  );
}
