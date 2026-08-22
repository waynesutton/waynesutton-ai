import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AgentReadySettingsPanel } from "@waynesutton/agent-ready/react";
import "../styles/agent-ready-section.css";

type WidgetSettings = {
  enabled: boolean;
  position: string;
  widgetTheme: string;
  defaultMobileCollapsed: boolean;
  showHumanTab: boolean;
  showMachineTab: boolean;
  showScoreTab: boolean;
  showChatLinks: boolean;
};

const POSITION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "floating-bottom-right", label: "Floating bottom right" },
  { value: "floating-bottom-left", label: "Floating bottom left" },
  { value: "floating-center", label: "Floating center" },
  { value: "footer", label: "Footer" },
];

const THEME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

const TOGGLES: Array<{ key: keyof WidgetSettings; label: string; hint: string }> = [
  { key: "enabled", label: "Show widget", hint: "Render the widget on the public site" },
  { key: "showMachineTab", label: "Machine tab", hint: "Discovery files and endpoints for agents" },
  { key: "showHumanTab", label: "Human tab", hint: "Human readable summary tab" },
  { key: "showScoreTab", label: "Score tab", hint: "Agent readiness score tab" },
  { key: "showChatLinks", label: "Chat links", hint: "Open-in-chat links inside the widget" },
  { key: "defaultMobileCollapsed", label: "Collapse on mobile", hint: "Start collapsed on small screens" },
];

/**
 * Dashboard section for agent-ready discovery: live widget controls backed by
 * Convex, plus the package settings panel for pages, cache, and regeneration.
 */
export default function AgentReadySection() {
  const savedSettings = useQuery(api.agentReady.settings.getWidgetSettings);
  const updateSettings = useMutation(api.agentReady.settings.updateWidgetSettings);

  const cacheStatus = useQuery(api.agentReady.content.getCacheStatus);
  const pages = useQuery(api.agentReady.content.listPages, { includeAllStatuses: true });
  const regenerate = useAction(api.agentReady.content.regenerateAll);
  const rollback = useMutation(api.agentReady.content.rollbackCache);
  const publish = useMutation(api.agentReady.content.publishPage);
  const draft = useMutation(api.agentReady.content.draftPage);
  const archive = useMutation(api.agentReady.content.archivePage);

  const autoSync = useQuery(api.agentReady.settings.getAutoSyncOnPublish);
  const setAutoSync = useMutation(api.agentReady.settings.setAutoSyncOnPublish);
  const [autoSyncSaving, setAutoSyncSaving] = useState(false);

  const [local, setLocal] = useState<WidgetSettings | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Saves immediately on change; guarded against overlapping calls
  const handleAutoSyncToggle = async (enabled: boolean) => {
    if (autoSyncSaving) return;
    setAutoSyncSaving(true);
    try {
      await setAutoSync({ enabled });
    } finally {
      setAutoSyncSaving(false);
    }
  };

  // Seed local edit state once settings load
  useEffect(() => {
    if (savedSettings && !local) {
      setLocal(savedSettings);
    }
  }, [savedSettings, local]);

  const dirty =
    local !== null &&
    savedSettings !== undefined &&
    JSON.stringify(local) !== JSON.stringify(savedSettings);

  const handleSave = async () => {
    if (!local) return;
    setSaveState("saving");
    try {
      await updateSettings(local);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  };

  return (
    <div className="agent-ready-section">
      <div className="agent-ready-intro">
        <h2>Agent ready</h2>
        <p>
          Discovery files (llms.txt, llms-full.txt, agents.md) tell AI agents what this site
          is and how to use it. Manage the public widget, included pages, and cached files
          here. Full instructions live in the Docs section.
        </p>
      </div>

      <div className="agent-ready-panel">
        <h3>Widget</h3>
        <p className="agent-ready-hint">
          Changes apply to the live site immediately, no redeploy needed.
        </p>
        {local === null ? (
          <p className="agent-ready-hint">Loading settings...</p>
        ) : (
          <>
            <div className="agent-ready-toggle-grid">
              {TOGGLES.map((toggle) => (
                <label key={toggle.key} className="agent-ready-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(local[toggle.key])}
                    onChange={(e) =>
                      setLocal({ ...local, [toggle.key]: e.target.checked })
                    }
                  />
                  <span className="agent-ready-toggle-track" aria-hidden="true" />
                  <span className="agent-ready-toggle-text">
                    <span className="agent-ready-toggle-label">{toggle.label}</span>
                    <span className="agent-ready-toggle-hint">{toggle.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            {!local.enabled && (
              <p className="agent-ready-hint agent-ready-hint-warning">
                Show widget is off, so position and theme have nothing to apply to.
                Turn it on to see the widget on the public site.
              </p>
            )}

            <div className="agent-ready-select-row">
              <label className="agent-ready-select">
                <span>Position</span>
                <select
                  value={local.position}
                  disabled={!local.enabled}
                  onChange={(e) => setLocal({ ...local, position: e.target.value })}
                >
                  {POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="agent-ready-select">
                <span>Widget theme</span>
                <select
                  value={local.widgetTheme}
                  disabled={!local.enabled}
                  onChange={(e) => setLocal({ ...local, widgetTheme: e.target.value })}
                >
                  {THEME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="agent-ready-save-row">
              <button
                type="button"
                className="agent-ready-save-button"
                onClick={handleSave}
                disabled={!dirty || saveState === "saving"}
                aria-busy={saveState === "saving"}
              >
                Save widget settings
              </button>
              {saveState === "saved" && (
                <span className="agent-ready-save-status">Saved</span>
              )}
              {saveState === "error" && (
                <span className="agent-ready-save-status agent-ready-save-error">
                  Save failed, try again
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="agent-ready-panel">
        <h3>Publishing</h3>
        <p className="agent-ready-hint">
          When on, publishing a public post adds it to llms.txt and agents.md and
          regenerates the cached files automatically. Unpublishing, unlisting, or
          deleting a public post removes it. Saves immediately.
        </p>
        <div className="agent-ready-toggle-grid">
          <label className="agent-ready-toggle">
            <input
              type="checkbox"
              checked={autoSync === true}
              disabled={autoSync === undefined || autoSyncSaving}
              onChange={(e) => void handleAutoSyncToggle(e.target.checked)}
            />
            <span className="agent-ready-toggle-track" aria-hidden="true" />
            <span className="agent-ready-toggle-text">
              <span className="agent-ready-toggle-label">Auto sync on publish</span>
              <span className="agent-ready-toggle-hint">
                Refresh discovery files every time a post goes public
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="agent-ready-panel">
        <h3>Pages and cached files</h3>
        <AgentReadySettingsPanel
          cacheStatus={cacheStatus}
          pages={pages}
          onRegenerate={async () => {
            await regenerate({});
          }}
          onRollback={async (fileType) => {
            await rollback({ fileType });
          }}
          onPublishPage={async (path) => {
            await publish({ path });
          }}
          onDraftPage={async (path) => {
            await draft({ path });
          }}
          onArchivePage={async (path) => {
            await archive({ path });
          }}
        />
      </div>

      <div className="agent-ready-panel">
        <h3>Config file</h3>
        <p className="agent-ready-hint">
          Site name, description, agent instructions, page list, and endpoints live in
          agent-ready.config.json at the repo root. After editing, push it to a deployment:
        </p>
        <pre className="agent-ready-code">
          {"npx agent-ready sync        # dev\nnpx agent-ready sync --prod # prod"}
        </pre>
      </div>
    </div>
  );
}
