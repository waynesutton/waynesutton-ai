import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import {
  Tray,
  ArrowsClockwise,
  Check,
  X,
  PencilSimple,
  FloppyDisk,
  GitPullRequest,
  SpinnerGap,
  CaretDown,
  CaretRight,
  Trash,
  EyeSlash,
  FileArrowDown,
  ArrowSquareOut,
} from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info" | "warning";
type DraftStatus = "inbox" | "approved" | "published" | "rejected";

const STATUS_TABS: Array<{ id: DraftStatus | "all"; label: string }> = [
  { id: "inbox", label: "Inbox" },
  { id: "approved", label: "Saved" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

/**
 * Drafts Inbox dashboard section for the agent blog pipeline.
 * Review drafts from agents, email, and the paste box: publish, edit,
 * rewrite with notes, reject, or open a GitHub review PR.
 */
export function DraftsInbox({
  addToast,
  onOpenPost,
}: {
  addToast: (message: string, type?: ToastType) => void;
  /** Opens a post created from a draft in the dashboard post editor. */
  onOpenPost?: (slug: string) => void;
}) {
  const [tab, setTab] = useState<DraftStatus | "all">("inbox");
  const [selectedId, setSelectedId] = useState<Id<"drafts"> | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [rewriteNotes, setRewriteNotes] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [showVoiceProfile, setShowVoiceProfile] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteBody, setPasteBody] = useState("");
  const [pasteMode, setPasteMode] = useState<"rewrite" | "as-is">("rewrite");
  const [voiceRules, setVoiceRules] = useState<string | null>(null);
  const [confirmClearVoice, setConfirmClearVoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"drafts"> | null>(null);

  const drafts = useQuery(
    api.drafts.listDrafts,
    tab === "all" ? {} : { status: tab },
  );
  const selected = useQuery(
    api.drafts.getDraft,
    selectedId ? { draftId: selectedId } : "skip",
  );
  const voiceProfile = useQuery(api.drafts.getVoiceProfile);
  const publishLog = useQuery(api.drafts.listPublishLog);

  const publishDraft = useMutation(api.drafts.publishDraft);
  const saveDraftAsPost = useMutation(api.drafts.saveDraftAsPost);
  const rejectDraft = useMutation(api.drafts.rejectDraft);
  const deleteDraft = useMutation(api.drafts.deleteDraft);
  const updateDraft = useMutation(api.drafts.updateDraft);
  const requestRewrite = useMutation(api.drafts.requestRewrite);
  const createDraft = useMutation(api.drafts.createDraftFromDashboard);
  const saveVoiceProfile = useMutation(api.drafts.saveVoiceProfile);
  const openReviewPr = useAction(api.githubReview.openReviewPr);
  const requestReindex = useAction(api.voiceAgent.requestReindex);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = (draftId: Id<"drafts">, unlisted?: boolean) =>
    run(async () => {
      const slug = await publishDraft({ draftId, unlisted });
      if (!slug) {
        addToast("Publish failed", "error");
        return;
      }
      addToast(
        unlisted
          ? `Published unlisted at /${slug}, hidden from listings and search`
          : `Published as /${slug}`,
        "success",
      );
    });

  const handleSaveAsPost = (draftId: Id<"drafts">) =>
    run(async () => {
      const slug = await saveDraftAsPost({ draftId });
      addToast(
        slug
          ? `Saved as an unpublished post: /${slug}`
          : "Save to draft failed",
        slug ? "success" : "error",
      );
    });

  const handleReject = (draftId: Id<"drafts">) =>
    run(async () => {
      await rejectDraft({ draftId });
      addToast("Draft rejected", "info");
    });

  const handleDelete = (draftId: Id<"drafts">) =>
    run(async () => {
      await deleteDraft({ draftId });
      setConfirmDelete(null);
      if (selectedId === draftId) {
        setSelectedId(null);
        setEditing(false);
      }
      addToast("Draft deleted", "info");
    });

  const handleRewrite = (draftId: Id<"drafts">) =>
    run(async () => {
      await requestRewrite({
        draftId,
        notes: rewriteNotes.trim() || undefined,
      });
      setRewriteNotes("");
      addToast("Voice agent rewriting draft", "info");
    });

  const handleSaveEdit = (draftId: Id<"drafts">) =>
    run(async () => {
      await updateDraft({
        draftId,
        title: editTitle.trim() || undefined,
        postBody: editBody,
      });
      setEditing(false);
      addToast("Draft saved", "success");
    });

  const handleOpenPr = (draftId: Id<"drafts">) =>
    run(async () => {
      const result = await openReviewPr({ draftId });
      addToast(`Review PR opened: ${result.prUrl}`, "success");
    });

  const handleCreatePaste = () =>
    run(async () => {
      if (!pasteBody.trim()) return;
      await createDraft({
        title: pasteTitle.trim() || undefined,
        rawInput: pasteBody,
        mode: pasteMode,
      });
      setPasteTitle("");
      setPasteBody("");
      setShowPasteBox(false);
      addToast(
        pasteMode === "rewrite"
          ? "Draft created, voice agent is writing"
          : "Draft created",
        "success",
      );
    });

  // Single source of truth for the editor: local edits win, otherwise the
  // stored rules. Saving writes exactly what is on screen.
  const storedVoiceRules = voiceProfile?.rules ?? "";
  const voiceRulesValue = voiceRules ?? storedVoiceRules;
  const voiceLoading = voiceProfile === undefined;
  const voiceUnchanged = voiceRulesValue === storedVoiceRules;
  const voiceWouldClear =
    voiceRulesValue.trim().length === 0 && storedVoiceRules.trim().length > 0;

  const handleSaveVoice = (allowEmpty?: boolean) =>
    run(async () => {
      await saveVoiceProfile({ rules: voiceRulesValue, allowEmpty });
      // Drop the local override so the textarea renders from the query,
      // which proves the value round-tripped through the database.
      setVoiceRules(null);
      setConfirmClearVoice(false);
      addToast(
        allowEmpty ? "Voice profile cleared" : "Voice profile saved",
        "success",
      );
    });

  const handleReindex = () =>
    run(async () => {
      const count = await requestReindex();
      addToast(
        count > 0
          ? `Indexed ${count} posts and pages for voice context`
          : "Reindex skipped: OPENAI_API_KEY not configured",
        count > 0 ? "success" : "warning",
      );
    });

  const agentBadge = (draft: {
    agentStatus?: "pending" | "running" | "done" | "failed";
  }) => {
    if (!draft.agentStatus) return null;
    if (draft.agentStatus === "running" || draft.agentStatus === "pending") {
      return (
        <span className="status-badge draft">
          <SpinnerGap size={12} className="spin" /> agent {draft.agentStatus}
        </span>
      );
    }
    if (draft.agentStatus === "failed") {
      return <span className="status-badge draft">agent failed</span>;
    }
    return null;
  };

  /**
   * Link to whatever the draft became. Published posts (listed or unlisted)
   * open at their slug; a saved draft has no public URL, so it opens in the
   * dashboard post editor instead.
   */
  const resultLink = (draft: {
    status: DraftStatus;
    publishedSlug?: string;
    postVisibility?: "listed" | "unlisted" | "draft";
  }) => {
    const slug = draft.publishedSlug;
    if (!slug) return null;
    if (draft.status === "published") {
      return (
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn view"
          title={
            draft.postVisibility === "unlisted"
              ? "View unlisted post (hidden from listings and search)"
              : "View post"
          }>
          /{slug} <ArrowSquareOut size={12} />
        </a>
      );
    }
    if (!onOpenPost) return null;
    return (
      <button
        className="action-btn view"
        title="Open the saved post in the editor"
        onClick={() => onOpenPost(slug)}>
        Open /{slug}
      </button>
    );
  };

  return (
    <div className="dashboard-import-section drafts-inbox-section">
      <div className="dashboard-import-header">
        <Tray size={32} weight="light" />
        <h2>Drafts Inbox</h2>
        <p>
          Drafts from agents, email, and the paste box land here. Publish,
          edit, rewrite, or reject. Nothing goes live without you.
        </p>
      </div>

      {/* Toolbar */}
      <div className="drafts-toolbar">
        <div className="drafts-tabs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              className={`dashboard-action-btn ${tab === t.id ? "primary" : ""}`}
              onClick={() => {
                setTab(t.id);
                setSelectedId(null);
                setConfirmDelete(null);
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="drafts-toolbar-actions">
          <button
            className="dashboard-action-btn"
            onClick={() => setShowPasteBox((s) => !s)}>
            {showPasteBox ? <CaretDown size={14} /> : <CaretRight size={14} />} Paste box
          </button>
          <button
            className="dashboard-action-btn"
            onClick={() => setShowVoiceProfile((s) => !s)}>
            {showVoiceProfile ? <CaretDown size={14} /> : <CaretRight size={14} />} Voice profile
          </button>
          <button
            className="dashboard-action-btn"
            onClick={() => void handleReindex()}
            disabled={busy}
            title="Index published posts and pages so the voice agent can match your voice">
            <ArrowsClockwise size={14} /> Reindex voice context
          </button>
        </div>
      </div>

      {/* Paste box */}
      {showPasteBox && (
        <div className="drafts-panel">
          <input
            className="dashboard-import-input"
            type="text"
            placeholder="Title (optional)"
            value={pasteTitle}
            onChange={(e) => setPasteTitle(e.target.value)}
          />
          <textarea
            className="dashboard-field-textarea drafts-textarea"
            placeholder="Paste notes, a session summary, or a full article..."
            rows={8}
            value={pasteBody}
            onChange={(e) => setPasteBody(e.target.value)}
          />
          <div className="drafts-panel-actions">
            <label className="pipeline-checkbox-label">
              <input
                type="checkbox"
                checked={pasteMode === "as-is"}
                onChange={(e) => setPasteMode(e.target.checked ? "as-is" : "rewrite")}
              />
              Publish as-is (skip the voice agent)
            </label>
            <button
              className="dashboard-action-btn primary"
              onClick={() => void handleCreatePaste()}
              disabled={!pasteBody.trim() || busy}>
              Create draft
            </button>
          </div>
        </div>
      )}

      {/* Voice profile editor */}
      {showVoiceProfile && (
        <div className="drafts-panel">
          <p className="drafts-panel-hint">
            Voice rules guide the rewrite agent. Style, structure, words to
            avoid, and anything else that makes a post sound like you.
          </p>
          <textarea
            className="dashboard-field-textarea drafts-textarea"
            rows={8}
            value={voiceRulesValue}
            onChange={(e) => {
              setVoiceRules(e.target.value);
              setConfirmClearVoice(false);
            }}
            placeholder="Short sentences. No emojis. Sentence case headings. Lead with why it matters..."
          />
          <div className="drafts-panel-actions">
            <span className="drafts-panel-hint">
              {voiceLoading
                ? "Loading saved rules..."
                : voiceProfile
                  ? `Saved ${new Date(voiceProfile.updatedAt).toLocaleString()} (${storedVoiceRules.length} characters)`
                  : "No voice profile saved yet"}
            </span>
            <div className="drafts-panel-buttons">
              {confirmClearVoice ? (
                <>
                  <span className="drafts-panel-hint">
                    Clear the saved voice rules?
                  </span>
                  <button
                    className="dashboard-action-btn"
                    disabled={busy}
                    onClick={() => void handleSaveVoice(true)}>
                    Confirm clear
                  </button>
                  <button
                    className="dashboard-action-btn"
                    onClick={() => setConfirmClearVoice(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="dashboard-action-btn primary"
                  onClick={() => {
                    if (voiceWouldClear) {
                      setConfirmClearVoice(true);
                      return;
                    }
                    void handleSaveVoice();
                  }}
                  disabled={busy || voiceLoading || voiceUnchanged}
                  title={
                    voiceUnchanged
                      ? "No changes to save"
                      : "Save voice rules for the rewrite agent"
                  }>
                  <FloppyDisk size={14} /> Save voice profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Draft list */}
      <div className="dashboard-list-table">
        <div className="dashboard-list-table-header">
          <span className="col-title">Title / source</span>
          <span className="col-date">Received</span>
          <span className="col-status">Status</span>
          <span className="col-actions">Actions</span>
        </div>
        {drafts === undefined && (
          <div className="dashboard-list-empty">Loading drafts...</div>
        )}
        {drafts !== undefined && drafts.length === 0 && (
          <div className="dashboard-list-empty">
            No drafts here. Agents post to /api/v1/drafts, or use the paste box.
          </div>
        )}
        {drafts?.map((draft) => (
          <div
            key={draft._id}
            className={`dashboard-list-row drafts-row ${selectedId === draft._id ? "selected" : ""}`}
            onClick={() => {
              setSelectedId(selectedId === draft._id ? null : draft._id);
              setEditing(false);
            }}>
            <span className="col-title">
              {draft.title ?? "Untitled"}{" "}
              <span className="source-badge dashboard">{draft.source}</span>{" "}
              {agentBadge(draft)}
            </span>
            <span className="col-date">
              {new Date(draft.createdAt).toLocaleString()}
            </span>
            <span className="col-status">
              <span
                className={`status-badge ${draft.status === "published" ? "published" : "draft"}`}>
                {draft.status === "approved" ? "saved" : draft.status}
              </span>{" "}
              {draft.postVisibility === "unlisted" && (
                <span className="status-badge draft">unlisted</span>
              )}
            </span>
            <span className="col-actions" onClick={(e) => e.stopPropagation()}>
              {(draft.status === "inbox" || draft.status === "approved") && (
                <>
                  <button
                    className="action-btn edit"
                    title="Publish"
                    disabled={busy}
                    onClick={() => void handlePublish(draft._id)}>
                    <Check size={16} />
                  </button>
                  <button
                    className="action-btn edit"
                    title="Publish unlisted: live at its slug, hidden from listings, search, RSS, and the sitemap"
                    disabled={busy}
                    onClick={() => void handlePublish(draft._id, true)}>
                    <EyeSlash size={16} />
                  </button>
                  {draft.status === "inbox" && (
                    <button
                      className="action-btn edit"
                      title="Save to draft: create the post unpublished so you can finish it in the editor"
                      disabled={busy}
                      onClick={() => void handleSaveAsPost(draft._id)}>
                      <FileArrowDown size={16} />
                    </button>
                  )}
                  <button
                    className="action-btn delete"
                    title="Reject"
                    disabled={busy}
                    onClick={() => void handleReject(draft._id)}>
                    <X size={16} />
                  </button>
                </>
              )}
              {resultLink(draft)}
              {/* Hard delete; hidden while the voice agent is working on the draft */}
              {draft.agentStatus !== "pending" &&
                draft.agentStatus !== "running" &&
                (confirmDelete === draft._id ? (
                  <>
                    <button
                      className="dashboard-action-btn"
                      disabled={busy}
                      onClick={() => void handleDelete(draft._id)}>
                      Confirm delete
                    </button>
                    <button
                      className="dashboard-action-btn"
                      onClick={() => setConfirmDelete(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="action-btn delete"
                    title="Delete draft"
                    disabled={busy}
                    onClick={() => setConfirmDelete(draft._id)}>
                    <Trash size={16} />
                  </button>
                ))}
            </span>
          </div>
        ))}
      </div>

      {/* Selected draft detail */}
      {selected && (
        <div className="drafts-detail">
          <div className="drafts-detail-header">
            {editing ? (
              <input
                className="dashboard-import-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
              />
            ) : (
              <h3>{selected.title ?? "Untitled"}</h3>
            )}
            <div className="drafts-detail-actions">
              {(selected.status === "inbox" ||
                selected.status === "approved") &&
                !editing && (
                  <>
                    <button
                      className="dashboard-action-btn primary"
                      disabled={busy}
                      onClick={() => void handlePublish(selected._id)}>
                      <Check size={14} /> Publish
                    </button>
                    <button
                      className="dashboard-action-btn"
                      disabled={busy}
                      title="Live at its slug but hidden from listings, search, RSS, the sitemap, and the VFS, and served noindex"
                      onClick={() => void handlePublish(selected._id, true)}>
                      <EyeSlash size={14} /> Publish unlisted
                    </button>
                    {selected.status === "inbox" && (
                      <button
                        className="dashboard-action-btn"
                        disabled={busy}
                        title="Create the post unpublished so you can finish it in the post editor"
                        onClick={() => void handleSaveAsPost(selected._id)}>
                        <FileArrowDown size={14} /> Save to draft
                      </button>
                    )}
                    <button
                      className="dashboard-action-btn"
                      onClick={() => {
                        setEditing(true);
                        setEditTitle(selected.title ?? "");
                        setEditBody(selected.postBody ?? selected.rawInput);
                      }}>
                      <PencilSimple size={14} /> Edit
                    </button>
                    <button
                      className="dashboard-action-btn"
                      disabled={busy}
                      title="Open a GitHub review PR (requires GITHUB_TOKEN and GITHUB_REVIEW_REPO)"
                      onClick={() => void handleOpenPr(selected._id)}>
                      <GitPullRequest size={14} /> Review PR
                    </button>
                    <button
                      className="dashboard-action-btn"
                      disabled={busy}
                      onClick={() => void handleReject(selected._id)}>
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
              {editing && (
                <>
                  <button
                    className="dashboard-action-btn primary"
                    disabled={busy}
                    onClick={() => void handleSaveEdit(selected._id)}>
                    <FloppyDisk size={14} /> Save
                  </button>
                  <button
                    className="dashboard-action-btn"
                    onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </>
              )}
              {!editing &&
                selected.agentStatus !== "pending" &&
                selected.agentStatus !== "running" &&
                (confirmDelete === selected._id ? (
                  <>
                    <button
                      className="dashboard-action-btn"
                      disabled={busy}
                      onClick={() => void handleDelete(selected._id)}>
                      Confirm delete
                    </button>
                    <button
                      className="dashboard-action-btn"
                      onClick={() => setConfirmDelete(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="dashboard-action-btn"
                    disabled={busy}
                    title="Delete draft"
                    onClick={() => setConfirmDelete(selected._id)}>
                    <Trash size={14} /> Delete
                  </button>
                ))}
            </div>
          </div>

          {selected.agentError && (
            <p className="drafts-agent-error">{selected.agentError}</p>
          )}
          {selected.prUrl && (
            <p className="drafts-panel-hint">
              Review PR:{" "}
              <a href={selected.prUrl} target="_blank" rel="noopener noreferrer">
                {selected.prUrl}
              </a>
            </p>
          )}
          {/* Where this draft went, and how to get to it */}
          {selected.publishedSlug && (
            <div className="drafts-result-line">
              <span className="drafts-panel-hint">
                {selected.status === "published"
                  ? selected.postVisibility === "unlisted"
                    ? "Live but unlisted. Reachable at its slug, kept out of listings, search, RSS, and the sitemap."
                    : "Live and listed."
                  : "Saved as an unpublished post. Content edits belong in the post editor from here; Publish only flips it live."}
              </span>
              {resultLink(selected)}
            </div>
          )}

          {editing ? (
            <textarea
              className="dashboard-field-textarea drafts-textarea"
              rows={20}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
            />
          ) : (
            <div className="drafts-preview">
              <ReactMarkdown>
                {selected.postBody ?? selected.rawInput}
              </ReactMarkdown>
            </div>
          )}

          {/* Rewrite with notes */}
          {selected.status === "inbox" && !editing && (
            <div className="drafts-rewrite-row">
              <input
                className="dashboard-import-input"
                type="text"
                placeholder="Notes for the voice agent (optional)"
                value={rewriteNotes}
                onChange={(e) => setRewriteNotes(e.target.value)}
              />
              <button
                className="dashboard-action-btn"
                disabled={busy || selected.agentStatus === "running"}
                onClick={() => void handleRewrite(selected._id)}>
                <ArrowsClockwise size={14} /> Rewrite
              </button>
            </div>
          )}
        </div>
      )}

      {/* Publish log */}
      {publishLog && publishLog.length > 0 && (
        <div className="pipeline-vendor-status">
          <h3>Publish log</h3>
          <div className="dashboard-list-table">
            {publishLog.map((entry) => (
              <div key={entry._id} className="dashboard-list-row">
                <span className="col-title">/{entry.slug}</span>
                <span className="col-date">
                  {new Date(entry.publishedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
