// Post minimap: a right-aligned heading outline that tracks scroll.
// Enabled per post with frontmatter `minimap: true`. Reads headings from the
// markdown (h1-h6) and links to the ids BlogPost writes on each heading.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Heading } from "../utils/extractHeadings";

interface PostMinimapProps {
  headings: Heading[];
}

const HEADER_OFFSET = 80; // sticky site header height
const SPY_OFFSET = 120; // read a heading as active a little before it hits the top
const MAX_DEPTH = 4; // depth classes: 0 through 4 (h1..h5 relative to the shallowest heading)

export default function PostMinimap({ headings }: PostMinimapProps) {
  const [activeId, setActiveId] = useState<string>("");
  const navRef = useRef<HTMLElement | null>(null);
  const isNavigatingRef = useRef(false);

  // The shallowest level present becomes the bold group header. Depth is relative,
  // so a post that only uses h2/h3 still reads as header + children.
  const topLevel = headings.reduce(
    (min, heading) => Math.min(min, heading.level),
    6,
  );

  // Scroll spy: last heading whose top has passed the spy line is active.
  useEffect(() => {
    if (headings.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      if (isNavigatingRef.current) return;
      const line = window.scrollY + SPY_OFFSET;
      let current = "";
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top + window.scrollY;
        if (line >= top) {
          current = heading.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  // Keep the active item visible when the outline itself overflows. Adjust the
  // rail's own scrollTop instead of scrollIntoView so the page never jumps.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !activeId) return;
    const link = nav.querySelector<HTMLElement>(
      `[data-heading-id="${activeId}"]`,
    );
    if (!link) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    if (linkRect.top < navRect.top + 16) {
      nav.scrollTop -= navRect.top + 16 - linkRect.top;
    } else if (linkRect.bottom > navRect.bottom - 16) {
      nav.scrollTop += linkRect.bottom - (navRect.bottom - 16);
    }
  }, [activeId]);

  const navigateToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    isNavigatingRef.current = true;
    setActiveId(id);

    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, top - HEADER_OFFSET),
      behavior: "smooth",
    });
    window.history.pushState(null, "", `#${id}`);

    // Let the smooth scroll finish before the spy takes over again.
    window.setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  }, []);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav ref={navRef} className="post-minimap" aria-label="On this page">
      <ol className="post-minimap-list">
        {headings.map((heading, index) => {
          const depth = Math.min(heading.level - topLevel, MAX_DEPTH);
          const isActive = activeId === heading.id;
          return (
            <li
              key={`${heading.id}-${index}`}
              className={`post-minimap-item depth-${depth}`}
            >
              <a
                href={`#${heading.id}`}
                data-heading-id={heading.id}
                className={`post-minimap-link ${isActive ? "active" : ""}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  navigateToHeading(heading.id);
                }}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
