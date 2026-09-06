import { action, internalAction } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { requireDashboardAdminAction } from "./dashboardAuth";
import { resolveVendorKeys } from "./lib/vendorKeyResolver";

// GitHub review surface (PRD phase 5): drafts can be reviewed as pull
// requests against a content repo. Merging the PR publishes the post.

const GITHUB_API = "https://api.github.com";

async function githubRequest(
  token: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  return await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "waynesutton-ai-blog-pipeline",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function slugifyForBranch(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "untitled"
  );
}

// btoa handles ASCII only; use TextEncoder for UTF-8 safe base64
function toBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64Utf8(value: string): string {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Open a review PR for a draft in the configured content repo.
 * Requires GITHUB_TOKEN and GITHUB_REVIEW_REPO ("owner/repo").
 */
export const openReviewPr = action({
  args: { draftId: v.id("drafts") },
  returns: v.object({ prUrl: v.string(), prNumber: v.number() }),
  handler: async (ctx, args) => {
    await requireDashboardAdminAction(ctx);

    // Dashboard BYOK overrides first, then env vars, in one query
    const { GITHUB_TOKEN: token, GITHUB_REVIEW_REPO: repo } =
      await resolveVendorKeys(ctx, ["GITHUB_TOKEN", "GITHUB_REVIEW_REPO"]);
    if (!token || !repo) {
      throw new ConvexError(
        "GITHUB_TOKEN and GITHUB_REVIEW_REPO must be configured to open review PRs. See prds/finish-updating-guide.md.",
      );
    }

    const draft = await ctx.runQuery(internal.drafts.getDraftInternal, {
      draftId: args.draftId,
    });
    if (!draft) {
      throw new ConvexError("Draft not found");
    }
    const body = draft.postBody ?? draft.rawInput;
    if (!body || body.trim().length === 0) {
      throw new ConvexError("Draft has no content for a review PR");
    }
    const title = draft.title ?? "Untitled draft";
    const slug = slugifyForBranch(title);
    const branch = `post/${slug}-${String(args.draftId).slice(-6)}`;

    // 1. Find the default branch and its head SHA
    const repoResponse = await githubRequest(token, "GET", `/repos/${repo}`);
    if (!repoResponse.ok) {
      throw new ConvexError(
        `GitHub repo lookup failed (${repoResponse.status}). Check GITHUB_REVIEW_REPO and token permissions.`,
      );
    }
    const repoData = (await repoResponse.json()) as { default_branch: string };
    const defaultBranch = repoData.default_branch;

    const refResponse = await githubRequest(
      token,
      "GET",
      `/repos/${repo}/git/ref/heads/${defaultBranch}`,
    );
    if (!refResponse.ok) {
      throw new ConvexError(
        `Could not read ${defaultBranch} ref (${refResponse.status})`,
      );
    }
    const refData = (await refResponse.json()) as { object: { sha: string } };

    // 2. Create the review branch (ignore "already exists" for idempotency)
    const branchResponse = await githubRequest(
      token,
      "POST",
      `/repos/${repo}/git/refs`,
      { ref: `refs/heads/${branch}`, sha: refData.object.sha },
    );
    if (!branchResponse.ok && branchResponse.status !== 422) {
      throw new ConvexError(
        `Branch creation failed (${branchResponse.status})`,
      );
    }

    // 3. Commit the post file to the branch
    const filePath = `posts/${slug}.md`;
    const fileContent = `<!-- draftId: ${String(args.draftId)} -->\n\n${body}`;
    const fileResponse = await githubRequest(
      token,
      "PUT",
      `/repos/${repo}/contents/${filePath}`,
      {
        message: `draft: ${title}`,
        content: toBase64Utf8(fileContent),
        branch,
      },
    );
    if (!fileResponse.ok) {
      throw new ConvexError(`File commit failed (${fileResponse.status})`);
    }

    // 4. Open the pull request
    const prResponse = await githubRequest(
      token,
      "POST",
      `/repos/${repo}/pulls`,
      {
        title: `Draft: ${title}`,
        head: branch,
        base: defaultBranch,
        body: [
          `Review draft \`${String(args.draftId)}\` from the blog pipeline.`,
          "",
          "Merge to publish. Close without merging to reject.",
        ].join("\n"),
      },
    );
    if (!prResponse.ok) {
      throw new ConvexError(`PR creation failed (${prResponse.status})`);
    }
    const prData = (await prResponse.json()) as {
      number: number;
      html_url: string;
    };

    await ctx.runMutation(internal.drafts.setDraftPr, {
      draftId: args.draftId,
      prNumber: prData.number,
      prUrl: prData.html_url,
    });

    return { prUrl: prData.html_url, prNumber: prData.number };
  },
});

/**
 * Handle a closed PR from the GitHub webhook. Merged publishes the draft
 * with the (possibly edited) file content; closed without merge rejects it.
 */
export const handlePrClosed = internalAction({
  args: {
    prNumber: v.number(),
    merged: v.boolean(),
    branchRef: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!args.branchRef.startsWith("post/")) {
      return null;
    }
    const draft = await ctx.runQuery(internal.drafts.getDraftByPrNumber, {
      prNumber: args.prNumber,
    });
    if (!draft) {
      return null;
    }

    if (!args.merged) {
      await ctx.runMutation(internal.drafts.rejectDraftInternal, {
        draftId: draft._id,
      });
      return null;
    }

    // Pull the merged file content so PR edits carry into the published post
    // Dashboard BYOK overrides first, then env vars, in one query
    const { GITHUB_TOKEN: token, GITHUB_REVIEW_REPO: repo } =
      await resolveVendorKeys(ctx, ["GITHUB_TOKEN", "GITHUB_REVIEW_REPO"]);
    let content = draft.postBody ?? draft.rawInput;
    if (token && repo) {
      const slug = args.branchRef
        .replace(/^post\//, "")
        .replace(/-[a-z0-9]{6}$/, "");
      const fileResponse = await githubRequest(
        token,
        "GET",
        `/repos/${repo}/contents/posts/${slug}.md`,
      );
      if (fileResponse.ok) {
        const fileData = (await fileResponse.json()) as { content?: string };
        if (fileData.content) {
          content = fromBase64Utf8(fileData.content)
            .replace(/^<!-- draftId: .+ -->\n*/m, "")
            .trim();
        }
      }
    }

    await ctx.runMutation(internal.drafts.publishDraftFromPr, {
      draftId: draft._id,
      content,
      title: draft.title,
    });
    return null;
  },
});
