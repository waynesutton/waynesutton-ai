import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, History, RotateCcw, Eye, FileCode } from "lucide-react";
import { createPatch } from "diff";
import DiffCodeBlock from "./DiffCodeBlock";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: "post" | "page";
  contentId: string;
  currentContent: string;
  currentTitle: string;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  currentContent,
  currentTitle,
}: VersionHistoryModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"preview" | "diff">("diff");
  const [isRestoring, setIsRestoring] = useState(false);

  const versions = useQuery(api.versions.getVersionHistory, {
    contentType,
    contentId,
  });

  const selectedVersion = useQuery(
    api.versions.getVersion,
    selectedVersionId
      ? { versionId: selectedVersionId as Id<"contentVersions"> }
      : "skip"
  );

  const restoreVersionMutation = useMutation(api.versions.restoreVersion);

  // Generate diff patch when a version is selected
  const diffPatch = useMemo(() => {
    if (!selectedVersion) return "";
    return createPatch(
      "content.md",
      selectedVersion.content,
      currentContent,
      `Version from ${new Date(selectedVersion.createdAt).toLocaleString()}`,
      "Current Version"
    );
  }, [selectedVersion, currentContent]);

  const handleRestore = async () => {
    if (!selectedVersionId) return;

    setIsRestoring(true);
    try {
      const result = await restoreVersionMutation({
        versionId: selectedVersionId as Id<"contentVersions">,
      });
      if (result.success) {
        onClose();
        // The page will automatically update via Convex real-time subscription
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 3) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
    return date.toLocaleString();
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "sync":
        return "Sync";
      case "dashboard":
        return "Dashboard";
      case "restore":
        return "Restore";
      default:
        return source;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="version-modal-overlay" onClick={onClose}>
      <div className="version-modal" onClick={(e) => e.stopPropagation()}>
        <div className="version-modal-header">
          <div className="version-modal-title">
            <History size={18} />
            <span>Version History</span>
            <span className="version-modal-subtitle">
              {currentTitle} ({contentType})
            </span>
          </div>
          <button
            className="version-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="version-modal-content">
          <div className="version-list">
            <div className="version-list-header">
              <span>Previous Versions</span>
              <span className="version-count">
                {versions?.length || 0} version
                {versions?.length !== 1 ? "s" : ""}
              </span>
            </div>

            {versions?.length === 0 && (
              <div className="version-empty">
                <p>No previous versions available.</p>
                <p className="version-empty-hint">
                  Versions are created when content is edited.
                </p>
              </div>
            )}

            {versions?.map((version) => (
              <div
                key={version._id}
                className={`version-item ${selectedVersionId === version._id ? "selected" : ""}`}
                onClick={() => setSelectedVersionId(version._id)}
              >
                <div className="version-item-header">
                  <span className="version-date">
                    {formatDate(version.createdAt)}
                  </span>
                  <span className={`version-source source-${version.source}`}>
                    {getSourceLabel(version.source)}
                  </span>
                </div>
                <div className="version-title">{version.title}</div>
                <div className="version-preview">{version.contentPreview}</div>
              </div>
            ))}
          </div>

          <div className="version-detail">
            {!selectedVersion ? (
              <div className="version-detail-empty">
                <p>Select a version to view details</p>
              </div>
            ) : (
              <>
                <div className="version-detail-header">
                  <div className="version-detail-tabs">
                    <button
                      className={`version-tab ${viewMode === "diff" ? "active" : ""}`}
                      onClick={() => setViewMode("diff")}
                    >
                      <FileCode size={14} />
                      Diff
                    </button>
                    <button
                      className={`version-tab ${viewMode === "preview" ? "active" : ""}`}
                      onClick={() => setViewMode("preview")}
                    >
                      <Eye size={14} />
                      Preview
                    </button>
                  </div>
                  <div className="version-detail-info">
                    <span>
                      {new Date(selectedVersion.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="version-detail-content">
                  {viewMode === "diff" ? (
                    <div className="version-diff-container">
                      <DiffCodeBlock code={diffPatch} language="diff" />
                    </div>
                  ) : (
                    <div className="version-preview-content">
                      <h3>{selectedVersion.title}</h3>
                      {selectedVersion.description && (
                        <p className="version-preview-description">
                          {selectedVersion.description}
                        </p>
                      )}
                      <pre className="version-preview-code">
                        {selectedVersion.content}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="version-modal-footer">
          <button className="version-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="version-btn-primary"
            onClick={handleRestore}
            disabled={!selectedVersionId || isRestoring}
          >
            <RotateCcw size={14} />
            {isRestoring ? "Restoring..." : "Restore This Version"}
          </button>
        </div>
      </div>
    </div>
  );
}
