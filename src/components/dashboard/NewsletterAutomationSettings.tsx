import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { AutomationSettings } from "../../../convex/lib/newsletterAutomation";
import { newsletterSubject } from "../../../convex/lib/newsletterAutomation";
import siteConfig from "../../config/siteConfig";

export function NewsletterAutomationSettings() {
  const saved = useQuery(api.newsletterAutomation.getSettings);
  const status = useQuery(api.newsletterAutomation.getStatus);
  const posts = useQuery(api.posts.getAllPosts);
  const save = useMutation(api.newsletterAutomation.saveSettings);
  const [draft, setDraft] = useState<AutomationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const config = draft ?? saved;
  if (!config) return <p role="status">Loading newsletter settings...</p>;
  const patch = (next: Partial<AutomationSettings>) =>
    setDraft({ ...config, ...next });
  const previewPost = posts?.[0];
  return (
    <div className="dashboard-config-card">
      <h3>Automatic newsletters</h3>
      <p className="config-field-note">
        Send new public posts to active subscribers. Existing posts and edits
        are not sent. Daily and weekly digests include only publications queued
        while automation is on. Times use UTC.
      </p>
      <div className="config-field checkbox">
        <label>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
          />
          Automatically email subscribers
        </label>
      </div>
      <div className="config-field">
        <label>
          Send when
          <select
            value={config.mode}
            onChange={(e) =>
              patch({ mode: e.target.value as AutomationSettings["mode"] })
            }
          >
            <option value="new-post">A new post is published</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </select>
        </label>
      </div>
      {config.mode !== "new-post" && (
        <div className="config-field">
          <label>
            Hour (UTC)
            <select
              value={config.hourUtc}
              onChange={(e) => patch({ hourUtc: Number(e.target.value) })}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00 UTC
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {config.mode === "weekly" && (
        <div className="config-field">
          <label>
            Day (UTC)
            <select
              value={config.weekdayUtc}
              onChange={(e) => patch({ weekdayUtc: Number(e.target.value) })}
            >
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="config-field">
        <label>
          Email subject
          <input
            maxLength={200}
            value={config.subject}
            onChange={(e) => patch({ subject: e.target.value })}
          />
        </label>
        <span className="config-field-note">
          Variables: {"{{siteName}}, {{title}}, {{count}}"}. For digests, title
          becomes the number of new posts.
        </span>
      </div>
      <div className="config-field">
        <label>
          Email introduction
          <textarea
            rows={4}
            maxLength={10000}
            value={config.introduction}
            onChange={(e) => patch({ introduction: e.target.value })}
          />
        </label>
        <span className="config-field-note">
          Plain text. Post titles, descriptions, links, and unsubscribe
          instructions are added automatically.
        </span>
      </div>
      <details>
        <summary>Email preview</summary>
        {previewPost ? (
          <div className="home-highlight">
            <strong>
              {newsletterSubject(config.subject, siteConfig.name, [
                previewPost.title,
              ])}
            </strong>
            <p style={{ whiteSpace: "pre-wrap" }}>{config.introduction}</p>
            <h4>{previewPost.title}</h4>
            <p>{previewPost.description}</p>
            <p>Read the post · Unsubscribe</p>
          </div>
        ) : (
          <p>Publish a post to preview the email with real content.</p>
        )}
      </details>
      <button
        type="button"
        className="dashboard-action-btn primary"
        disabled={saving || !config.subject.trim()}
        onClick={async () => {
          setSaving(true);
          setMessage("");
          try {
            await save({ settings: config });
            setDraft(null);
            setMessage("Newsletter automation saved.");
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Could not save settings.",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Saving..." : "Save newsletter automation"}
      </button>
      <p role="status">{message}</p>
      {status && (
        <p className="config-field-note">
          Queued posts: {status.pending >= 100 ? "100+" : status.pending}.
          Failed deliveries: {status.failed >= 100 ? "100+" : status.failed}. In
          progress or uncertain:{" "}
          {status.uncertain >= 100 ? "100+" : status.uncertain}. Check AgentMail
          before retrying a failed or uncertain delivery; automatic retries are
          disabled to avoid duplicate emails.
        </p>
      )}
    </div>
  );
}

export function NewsletterAutomationHistory() {
  const campaigns = useQuery(api.newsletterAutomation.recentCampaigns);
  return (
    <div className="dashboard-config-card">
      <h3>Automatic newsletter history</h3>
      {campaigns === undefined ? (
        <p>Loading deliveries...</p>
      ) : campaigns.length === 0 ? (
        <p>No automatic newsletters yet.</p>
      ) : (
        campaigns.map((campaign) => (
          <article key={campaign.key}>
            <h4>{campaign.subject}</h4>
            <p>
              {new Date(campaign.createdAt).toLocaleString()} ·{" "}
              {campaign.status}
            </p>
            <p>
              Sent: {campaign.sent}. Failed: {campaign.failed}. In progress or
              uncertain: {campaign.pending}. Skipped: {campaign.skipped}.
              {campaign.capped
                ? " Counts show the first 1,000 recipients."
                : ""}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
