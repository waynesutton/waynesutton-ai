import { useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

interface UseSearchHighlightingOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

// Maximum time to wait for content to load (ms)
const MAX_WAIT_TIME = 5000;
// How often to check for content (ms)
const POLL_INTERVAL = 100;

/**
 * Hook to highlight search terms on the page and scroll to the first match.
 * Reads the `?q=` query parameter from the URL and highlights all occurrences.
 * Waits for content to load before attempting to highlight.
 */
export function useSearchHighlighting({
  containerRef,
  enabled = true,
}: UseSearchHighlightingOptions): { searchQuery: string | null } {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q");
  const hasHighlighted = useRef(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear highlights function
  const clearHighlights = useCallback(() => {
    document.querySelectorAll("mark.search-highlight").forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });
  }, []);

  // Check if container has meaningful content (not just whitespace)
  const hasContent = useCallback((container: HTMLElement): boolean => {
    // Check for actual text content or child elements
    const textContent = container.textContent?.trim() || "";
    const hasChildElements = container.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, td").length > 0;
    return textContent.length > 50 || hasChildElements;
  }, []);

  // Perform the actual highlighting
  const performHighlighting = useCallback(
    (container: HTMLElement, query: string) => {
      // Escape special regex characters
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedQuery})`, "gi");

      // Walk text nodes and find matches
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          // Skip code blocks and already highlighted content
          const tagName = parent.tagName.toUpperCase();
          if (tagName === "CODE" || tagName === "PRE" || tagName === "SCRIPT" || tagName === "STYLE") {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains("search-highlight")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (regex.test(node.textContent || "")) {
          textNodes.push(node as Text);
        }
        regex.lastIndex = 0; // Reset regex state
      }

      // Highlight each match
      let firstMark: HTMLElement | null = null;
      textNodes.forEach((textNode) => {
        const text = textNode.textContent || "";
        const parts = text.split(regex);

        if (parts.length <= 1) return;

        const fragment = document.createDocumentFragment();
        parts.forEach((part, index) => {
          if (index % 2 === 1) {
            // This is a match
            const mark = document.createElement("mark");
            mark.className = "search-highlight search-highlight-active";
            mark.textContent = part;
            fragment.appendChild(mark);
            if (!firstMark) firstMark = mark;
          } else if (part) {
            fragment.appendChild(document.createTextNode(part));
          }
        });

        textNode.parentNode?.replaceChild(fragment, textNode);
      });

      return firstMark;
    },
    []
  );

  // Main highlighting effect
  useEffect(() => {
    if (!enabled || !searchQuery || hasHighlighted.current) {
      return;
    }

    const startTime = Date.now();

    // Poll until content is available or timeout
    const attemptHighlight = () => {
      const container = containerRef.current;
      const elapsed = Date.now() - startTime;

      // Give up after MAX_WAIT_TIME
      if (elapsed > MAX_WAIT_TIME) {
        // Clean up URL even if we couldn't highlight
        searchParams.delete("q");
        setSearchParams(searchParams, { replace: true });
        return;
      }

      // Check if container exists and has content
      if (!container || !hasContent(container)) {
        // Try again after POLL_INTERVAL
        pollTimeoutRef.current = setTimeout(attemptHighlight, POLL_INTERVAL);
        return;
      }

      // Content is ready, perform highlighting
      const firstMark = performHighlighting(container, searchQuery);
      hasHighlighted.current = true;

      // Scroll to first match with offset for fixed header
      if (firstMark) {
        // Small delay to ensure DOM has updated after highlighting
        setTimeout(() => {
          if (!firstMark) return;
          const headerOffset = 80;
          const elementRect = firstMark.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const offsetPosition = absoluteElementTop - headerOffset - window.innerHeight / 2 + 50;

          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth",
          });
        }, 50);
      }

      // Auto-fade highlights after 4 seconds (remove active class only)
      setTimeout(() => {
        document.querySelectorAll(".search-highlight-active").forEach((el) => {
          el.classList.remove("search-highlight-active");
        });
      }, 4000);

      // Clean up URL (remove ?q= param) after highlighting is applied
      setTimeout(() => {
        searchParams.delete("q");
        setSearchParams(searchParams, { replace: true });
      }, 500);
    };

    // Start polling
    pollTimeoutRef.current = setTimeout(attemptHighlight, POLL_INTERVAL);

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [searchQuery, containerRef, enabled, searchParams, setSearchParams, hasContent, performHighlighting]);

  // Clear highlights on Escape key
  useEffect(() => {
    if (!searchQuery && !hasHighlighted.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearHighlights();
        hasHighlighted.current = false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, clearHighlights]);

  // Reset hasHighlighted when component unmounts or query changes
  useEffect(() => {
    return () => {
      hasHighlighted.current = false;
    };
  }, [searchQuery]);

  return { searchQuery };
}
