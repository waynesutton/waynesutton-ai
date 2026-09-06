import { useEffect, useRef } from "react";
import { Robot, X } from "@phosphor-icons/react";

export interface WebMcpConfirmRequest {
  /** Tool name, shown as a small eyebrow */
  tool: string;
  title: string;
  description: string;
  /** What the agent is about to send, shown so the person can check it */
  details: ReadonlyArray<{ label: string; value: string }>;
  confirmLabel: string;
}

interface WebMcpConfirmDialogProps {
  request: WebMcpConfirmRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Site styled confirmation for WebMCP writes. An in-page agent can fill a
 * form, but the person in the tab presses the button. Never window.confirm.
 */
export default function WebMcpConfirmDialog({
  request,
  onConfirm,
  onCancel,
}: WebMcpConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Escape cancels, focus lands on the primary button so keyboard users can
  // approve or move to Cancel with one tab
  useEffect(() => {
    if (!request) return;
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [request, onCancel]);

  if (!request) return null;

  return (
    <div className="search-modal-backdrop webmcp-confirm-backdrop" onClick={onCancel}>
      <div
        className="webmcp-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="webmcp-confirm-title"
        aria-describedby="webmcp-confirm-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="webmcp-confirm-header">
          <span className="webmcp-confirm-eyebrow">
            <Robot size={14} weight="bold" />
            Agent request: {request.tool}
          </span>
          <button
            type="button"
            className="webmcp-confirm-close"
            onClick={onCancel}
            aria-label="Cancel agent request"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
        <h2 id="webmcp-confirm-title" className="webmcp-confirm-title">
          {request.title}
        </h2>
        <p id="webmcp-confirm-description" className="webmcp-confirm-description">
          {request.description}
        </p>
        <dl className="webmcp-confirm-details">
          {request.details.map((detail) => (
            <div key={detail.label} className="webmcp-confirm-row">
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
        <div className="webmcp-confirm-actions">
          <button type="button" className="webmcp-confirm-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="webmcp-confirm-submit"
            onClick={onConfirm}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
