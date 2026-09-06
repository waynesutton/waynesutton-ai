import { useEffect, useMemo, useState } from "react";
import { Code, X, Warning, XLogo, YoutubeLogo } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import {
  buildEmbedMarkdown,
  describeEmbed,
  parseEmbedInput,
} from "../utils/embedMarkdown";

interface EmbedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the iframe markup to drop into the body */
  onInsert: (markdown: string) => void;
}

/**
 * Paste an X post or YouTube link, preview the generated iframe markup, and
 * insert it at the cursor. Reuses the media modal styles so it matches the
 * rest of the dashboard.
 */
export function EmbedDialog({ isOpen, onClose, onInsert }: EmbedDialogProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);

  const parsed = useMemo(() => parseEmbedInput(input), [input]);
  const markdown = useMemo(() => {
    if (!parsed) return "";
    // Match the X card to the current dashboard theme
    const embedTheme = theme === "dark" ? "dark" : "light";
    return buildEmbedMarkdown(parsed, { theme: embedTheme });
  }, [parsed, theme]);

  // Reset when reopened so a stale link never lingers
  useEffect(() => {
    if (isOpen) {
      setInput("");
      setTouched(false);
    }
  }, [isOpen]);

  // Escape closes, Enter inserts when the link is valid
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && parsed && markdown) {
        e.preventDefault();
        onInsert(markdown);
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, parsed, markdown, onInsert, onClose]);

  if (!isOpen) return null;

  const showError = touched && input.trim().length > 0 && !parsed;

  return (
    <div className="image-upload-modal-backdrop" onClick={onClose}>
      <div className="image-upload-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="embed-dialog-title">
        <div className="image-upload-modal-header">
          <h3 id="embed-dialog-title">
            <Code size={20} />
            Embed a post or video
          </h3>
          <button className="image-upload-modal-close" onClick={onClose} aria-label="Close embed dialog">
            <X size={20} />
          </button>
        </div>

        <div className="image-upload-modal-content embed-dialog-content">
          <label className="embed-dialog-label" htmlFor="embed-dialog-input">
            Paste a link
          </label>
          <input
            id="embed-dialog-input"
            className="embed-dialog-input"
            type="url"
            autoFocus
            placeholder="https://x.com/user/status/123 or https://youtu.be/abc"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => setTouched(true)}
            spellCheck={false}
          />
          <p className="embed-dialog-hint">
            Works with X posts (x.com or twitter.com status links, or a bare post id) and YouTube
            watch, shorts, or youtu.be links.
          </p>

          {showError && (
            <div className="image-upload-error">
              <Warning size={16} />
              <span>That link is not an X post or YouTube video. Copy the URL from the address bar and try again.</span>
            </div>
          )}

          {parsed && (
            <div className="embed-dialog-preview">
              <div className="embed-dialog-preview-head">
                {parsed.kind === "x" ? <XLogo size={16} /> : <YoutubeLogo size={16} />}
                <span>{describeEmbed(parsed)}</span>
                <a href={parsed.url} target="_blank" rel="noopener noreferrer">
                  Open source
                </a>
              </div>
              <pre className="embed-dialog-code">
                <code>{markdown}</code>
              </pre>
              <p className="embed-dialog-hint">
                This HTML goes straight into your markdown. The site renders it lazily inside a
                sandboxed frame. Preview mode shows it too.
              </p>
            </div>
          )}
        </div>

        <div className="image-upload-modal-footer">
          <button className="image-upload-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="image-upload-insert"
            disabled={!parsed}
            onClick={() => {
              if (!parsed) return;
              onInsert(markdown);
              onClose();
            }}>
            Insert embed
          </button>
        </div>
      </div>
    </div>
  );
}
