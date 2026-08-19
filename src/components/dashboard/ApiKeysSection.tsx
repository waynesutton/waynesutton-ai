import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Key,
  Copy,
  Trash,
  CheckCircle,
  WarningCircle,
  SpinnerGap,
} from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info" | "warning";

function httpActionOrigin(): string {
  if (typeof window === "undefined") {
    return "https://waynesutton.ai";
  }
  const host = window.location.hostname;
  if (host === "waynesutton.ai" || host === "www.waynesutton.ai") {
    return "https://waynesutton.ai";
  }
  const convex = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (convex) {
    return convex.replace(/\.convex\.cloud\/?$/, ".convex.site").replace(/\/+$/, "");
  }
  return "https://waynesutton.ai";
}

function KeySnippet({
  title,
  text,
  onCopy,
}: {
  title: string;
  text: string;
  onCopy: () => void;
}) {
  return (
    <div className="pipeline-key-snippet">
      <div className="pipeline-key-snippet-header">
        <span>{title}</span>
        <button type="button" className="dashboard-action-btn" onClick={onCopy}>
          <Copy size={14} /> Copy
        </button>
      </div>
      <pre className="pipeline-key-snippet-body">{text}</pre>
    </div>
  );
}

/**
 * API Keys dashboard section for the agent blog pipeline.
 * Generates keys for POST /api/v1/drafts (shown once, stored hashed)
 * and reports which vendor env vars are configured.
 */
export function ApiKeysSection({
  addToast,
}: {
  addToast: (message: string, type?: ToastType) => void;
}) {
  const [label, setLabel] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<Id<"apiKeys"> | null>(null);

  // Vendor key override editing state (one row expanded at a time)
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [vendorValue, setVendorValue] = useState("");
  const [savingVendor, setSavingVendor] = useState(false);

  const keys = useQuery(api.pipelineKeys.listApiKeys);
  const vendorStatus = useQuery(api.pipelineKeys.vendorKeyStatus);
  const generateKey = useAction(api.pipelineKeys.generateApiKey);
  const revokeKey = useMutation(api.pipelineKeys.revokeApiKey);
  const setVendorKey = useMutation(api.pipelineKeys.setVendorKey);
  const removeVendorKey = useMutation(api.pipelineKeys.removeVendorKey);

  const handleGenerate = async () => {
    if (!label.trim() || generating) return;
    setGenerating(true);
    try {
      const result = await generateKey({ label: label.trim(), autoPublish });
      setNewKey(result.key);
      setLabel("");
      setAutoPublish(false);
      addToast("API key created. Copy it now, it will not be shown again.", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Key generation failed", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyKey = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    addToast("Key copied to clipboard", "success");
  };

  const handleCopyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    addToast(`${label} copied`, "success");
  };

  const httpOrigin = httpActionOrigin();
  const exportSnippet = newKey ? `export BLOG_POST_KEY=${newKey}` : "";
  const curlSnippet = newKey
    ? `curl -X POST ${httpOrigin}/api/v1/drafts \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: $BLOG_POST_KEY" \\\n  -d '{"title":"Setup verification","rawInput":"Checking that the pipeline key works.","mode":"as-is","source":"curl"}'`
    : "";
  const mcpSnippet = newKey
    ? JSON.stringify(
        {
          mcpServers: {
            "waynesutton-ai": {
              url: `${httpOrigin}/mcp`,
              headers: { "x-api-key": newKey },
            },
          },
        },
        null,
        2,
      )
    : "";

  const handleRevoke = async (keyId: Id<"apiKeys">) => {
    try {
      await revokeKey({ keyId });
      addToast("Key revoked", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Revoke failed", "error");
    } finally {
      setConfirmRevoke(null);
    }
  };

  const handleSaveVendorKey = async (name: string) => {
    if (!vendorValue.trim() || savingVendor) return;
    setSavingVendor(true);
    try {
      await setVendorKey({ name, value: vendorValue.trim() });
      addToast(`${name} override saved for this deployment`, "success");
      setEditingVendor(null);
      setVendorValue("");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setSavingVendor(false);
    }
  };

  const handleRemoveVendorKey = async (name: string) => {
    try {
      await removeVendorKey({ name });
      addToast(`${name} override removed. Environment variable applies again.`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Remove failed", "error");
    }
  };

  return (
    <div className="dashboard-import-section">
      <div className="dashboard-import-header">
        <Key size={32} weight="light" />
        <h2>Pipeline API Keys</h2>
        <p>
          Keys let agents submit drafts to POST /api/v1/drafts with an x-api-key
          header. One key per tool so drafts show where they came from. Full
          setup is in Docs, Publish from agents.
        </p>
      </div>

      {/* Create key */}
      <div className="dashboard-import-form">
        <div className="dashboard-import-input-group">
          <input
            className="dashboard-import-input"
            type="text"
            placeholder="Key label (e.g. claude-code, cursor, chatgpt)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleGenerate();
            }}
          />
          <button
            className="dashboard-import-btn"
            onClick={() => void handleGenerate()}
            disabled={!label.trim() || generating}>
            {generating ? <SpinnerGap size={16} className="spin" /> : "Generate key"}
          </button>
        </div>
        <label className="pipeline-checkbox-label">
          <input
            type="checkbox"
            checked={autoPublish}
            onChange={(e) => setAutoPublish(e.target.checked)}
          />
          Auto-publish drafts from this key (skips the review inbox)
        </label>
      </div>

      {/* One-time key display */}
      {newKey && (
        <div className="pipeline-new-key">
          <p className="pipeline-new-key-warning">
            Copy this key now. It is stored hashed and cannot be shown again.
          </p>
          <div className="pipeline-new-key-row">
            <code className="pipeline-new-key-value">{newKey}</code>
            <button className="dashboard-action-btn" onClick={() => void handleCopyKey()}>
              <Copy size={16} /> Copy
            </button>
            <button className="dashboard-action-btn" onClick={() => setNewKey(null)}>
              Done
            </button>
          </div>
          <div className="pipeline-key-snippets">
            <KeySnippet
              title="Shell export"
              text={exportSnippet}
              onCopy={() => void handleCopyText(exportSnippet, "Export")}
            />
            <KeySnippet
              title="Verify with curl"
              text={curlSnippet}
              onCopy={() => void handleCopyText(curlSnippet, "Curl")}
            />
            <KeySnippet
              title="Optional MCP config"
              text={mcpSnippet}
              onCopy={() => void handleCopyText(mcpSnippet, "MCP config")}
            />
          </div>
        </div>
      )}

      {/* Key list */}
      <div className="dashboard-list-table pipeline-keys-table">
        <div className="dashboard-list-table-header">
          <span className="col-title">Label</span>
          <span className="col-date">Created</span>
          <span className="col-date">Last used</span>
          <span className="col-status">Auto-publish</span>
          <span className="col-actions">Actions</span>
        </div>
        {keys === undefined && (
          <div className="dashboard-list-empty">Loading keys...</div>
        )}
        {keys !== undefined && keys.length === 0 && (
          <div className="dashboard-list-empty">
            No keys yet. Generate one per tool, then copy blogskill/SKILL.md into
            your global skills folder. Docs, Publish from agents has every step.
          </div>
        )}
        {keys?.map((key) => (
          <div key={key._id} className="dashboard-list-row">
            <span className="col-title">{key.label}</span>
            <span className="col-date">
              {new Date(key.createdAt).toLocaleDateString()}
            </span>
            <span className="col-date">
              {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : "Never"}
            </span>
            <span className="col-status">
              <span className={`status-badge ${key.autoPublish ? "published" : "draft"}`}>
                {key.autoPublish ? "Yes" : "No"}
              </span>
            </span>
            <span className="col-actions">
              {confirmRevoke === key._id ? (
                <>
                  <button
                    className="dashboard-action-btn"
                    onClick={() => void handleRevoke(key._id)}>
                    Confirm revoke
                  </button>
                  <button
                    className="dashboard-action-btn"
                    onClick={() => setConfirmRevoke(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="action-btn delete"
                  title="Revoke key"
                  onClick={() => setConfirmRevoke(key._id)}>
                  <Trash size={16} />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Vendor key status and overrides */}
      <div className="pipeline-vendor-status">
        <h3>Vendor keys</h3>
        <p>
          Keys the pipeline and site features use. Set or overwrite a value here to store an
          override in this deployment's database (dev and prod each keep their own). Remove an
          override to fall back to the Convex environment variable set with npx convex env set.
          Values are never shown back.
        </p>
        <div className="pipeline-vendor-grid">
          {vendorStatus?.map((entry) => (
            <div key={entry.name} className="pipeline-vendor-row">
              {entry.configured ? (
                <CheckCircle size={18} weight="fill" className="pipeline-vendor-ok" />
              ) : (
                <WarningCircle size={18} className="pipeline-vendor-missing" />
              )}
              <div>
                <code>{entry.name}</code>
                <span className="pipeline-vendor-purpose">{entry.purpose}</span>
              </div>
              <span className={`status-badge ${entry.configured ? "published" : "draft"}`}>
                {entry.source === "override"
                  ? "Override"
                  : entry.source === "env"
                    ? "Env var"
                    : "Not set"}
              </span>
              {editingVendor === entry.name ? (
                <div className="pipeline-vendor-edit">
                  <input
                    className="dashboard-field-input"
                    type="password"
                    autoComplete="off"
                    placeholder={`Paste ${entry.name} value`}
                    value={vendorValue}
                    onChange={(e) => setVendorValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSaveVendorKey(entry.name);
                      if (e.key === "Escape") {
                        setEditingVendor(null);
                        setVendorValue("");
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="dashboard-action-btn"
                    onClick={() => void handleSaveVendorKey(entry.name)}
                    disabled={!vendorValue.trim() || savingVendor}>
                    {savingVendor ? <SpinnerGap size={14} className="spin" /> : "Save"}
                  </button>
                  <button
                    className="dashboard-action-btn"
                    onClick={() => {
                      setEditingVendor(null);
                      setVendorValue("");
                    }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="pipeline-vendor-actions">
                  <button
                    className="dashboard-action-btn"
                    onClick={() => {
                      setEditingVendor(entry.name);
                      setVendorValue("");
                    }}>
                    {entry.configured ? "Overwrite" : "Set key"}
                  </button>
                  {entry.source === "override" && (
                    <button
                      className="dashboard-action-btn"
                      title="Remove override and fall back to the environment variable"
                      onClick={() => void handleRemoveVendorKey(entry.name)}>
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
