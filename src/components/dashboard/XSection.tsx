import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  XLogo,
  CheckCircle,
  WarningCircle,
  SpinnerGap,
  LinkSimple,
  PaperPlaneTilt,
  Plugs,
} from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info" | "warning";

const TWEET_MAX_CHARS = 280;

/**
 * X (Twitter) dashboard section: connect an account with OAuth, compose
 * posts, share published posts, and turn X post URLs into blog drafts
 * through the agent pipeline.
 */
export function XSection({
  addToast,
}: {
  addToast: (message: string, type?: ToastType) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [posting, setPosting] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  const status = useQuery(api.xIntegration.getXStatus);
  const shares = useQuery(api.xIntegration.listShares);
  const beginConnect = useAction(api.xIntegration.beginXConnect);
  const disconnect = useMutation(api.xIntegration.disconnectX);
  const postToX = useAction(api.xIntegration.postToX);
  const importFromX = useMutation(api.xIntegration.importFromX);

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const { url } = await beginConnect({ returnTo: window.location.origin });
      window.location.href = url;
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Connect failed", "error");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({});
      addToast("X account disconnected", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Disconnect failed", "error");
    }
  };

  const handlePost = async () => {
    if (!composeText.trim() || posting) return;
    setPosting(true);
    try {
      const result = await postToX({ text: composeText.trim() });
      setComposeText("");
      addToast(`Posted to X: ${result.tweetUrl}`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Post failed", "error");
    } finally {
      setPosting(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim() || importing) return;
    setImporting(true);
    try {
      await importFromX({ url: importUrl.trim() });
      setImportUrl("");
      addToast(
        "Draft started. The agent is writing it now, check the Drafts Inbox in a minute.",
        "success",
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  const charsLeft = TWEET_MAX_CHARS - composeText.length;

  return (
    <div className="dashboard-import-section">
      <div className="dashboard-import-header">
        <XLogo size={32} weight="light" />
        <h2>X</h2>
        <p>
          Connect your X account to share posts from the dashboard and the publish
          flow, and to turn X posts into blog drafts.
        </p>
      </div>

      {/* Connection status */}
      <div className="pipeline-vendor-status">
        <h3>Account</h3>
        {status === undefined ? (
          <p>Loading...</p>
        ) : status.connected ? (
          <div className="pipeline-vendor-row">
            <CheckCircle size={18} weight="fill" className="pipeline-vendor-ok" />
            <div>
              <span className="pipeline-vendor-name">@{status.username}</span>
              <span className="pipeline-vendor-purpose">
                Connected. Tokens refresh automatically.
              </span>
            </div>
            <div className="pipeline-vendor-actions">
              <button className="dashboard-action-btn" onClick={() => void handleDisconnect()}>
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="pipeline-vendor-row">
            <WarningCircle size={18} className="pipeline-vendor-missing" />
            <div>
              <span className="pipeline-vendor-name">Not connected</span>
              <span className="pipeline-vendor-purpose">
                {status.clientConfigured
                  ? "Connect to enable posting and publish sharing."
                  : "Set X_CLIENT_ID and X_CLIENT_SECRET in API Keys first, then connect."}
              </span>
            </div>
            <div className="pipeline-vendor-actions">
              <button
                className="dashboard-import-btn"
                onClick={() => void handleConnect()}
                disabled={!status.clientConfigured || connecting}>
                {connecting ? <SpinnerGap size={16} className="spin" /> : <Plugs size={16} />}
                Connect X account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compose */}
      {status?.connected && (
        <div className="dashboard-import-form">
          <h3>Compose a post</h3>
          <textarea
            className="dashboard-import-input x-compose-textarea"
            rows={4}
            placeholder="What's happening?"
            value={composeText}
            maxLength={TWEET_MAX_CHARS}
            onChange={(e) => setComposeText(e.target.value)}
          />
          <div className="x-compose-footer">
            <span className={`x-compose-counter${charsLeft < 20 ? " warn" : ""}`}>
              {charsLeft}
            </span>
            <button
              className="dashboard-import-btn"
              onClick={() => void handlePost()}
              disabled={!composeText.trim() || posting}>
              {posting ? (
                <SpinnerGap size={16} className="spin" />
              ) : (
                <PaperPlaneTilt size={16} />
              )}
              Post to X
            </button>
          </div>
        </div>
      )}

      {/* Import a post as a blog draft */}
      <div className="dashboard-import-form">
        <h3>Draft a blog post from an X post</h3>
        <p className="dashboard-import-hint">
          Paste a post link and the writing agent expands it into a draft in your
          voice. It lands in the Drafts Inbox for review before publishing.
        </p>
        <div className="dashboard-import-input-group">
          <input
            className="dashboard-import-input"
            type="url"
            placeholder="https://x.com/user/status/123456789"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleImport();
            }}
          />
          <button
            className="dashboard-import-btn"
            onClick={() => void handleImport()}
            disabled={!importUrl.trim() || importing}>
            {importing ? <SpinnerGap size={16} className="spin" /> : <LinkSimple size={16} />}
            Draft it
          </button>
        </div>
      </div>

      {/* Recent shares */}
      {shares && shares.length > 0 && (
        <div className="pipeline-vendor-status">
          <h3>Recent shares</h3>
          <div className="pipeline-vendor-grid">
            {shares.map((share) => (
              <div key={share._id} className="pipeline-vendor-row">
                <XLogo size={16} />
                <div>
                  <span className="pipeline-vendor-name x-share-text">{share.text}</span>
                  <span className="pipeline-vendor-purpose">
                    {new Date(share.createdAt).toLocaleString()}
                    {share.postSlug ? ` · from /${share.postSlug}` : ""}
                  </span>
                </div>
                <div className="pipeline-vendor-actions">
                  <a
                    className="dashboard-action-btn"
                    href={share.tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer">
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
