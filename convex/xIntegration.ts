import { v, ConvexError } from "convex/values";
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireDashboardAdmin, requireDashboardAdminAction } from "./dashboardAuth";
import { resolveVendorKey } from "./lib/vendorKeyResolver";
import { insertDraftHelper } from "./drafts";

// X (Twitter) integration: OAuth 2.0 PKCE connect, posting, and tweet import.
// Tokens live in the xAccounts singleton row and are only readable by
// internal functions. The public status query reports presence, never values.

const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_API_BASE = "https://api.x.com/2";
const OAUTH_SCOPES = "tweet.read tweet.write users.read offline.access";
const STATE_TTL_MS = 10 * 60 * 1000;
const ACCOUNT_KEY = "primary";
const TWEET_MAX_CHARS = 280;

// ---------- crypto helpers (Web Crypto, available in actions) ----------

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return base64UrlEncode(new Uint8Array(digest));
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

// ---------- internal state and account storage ----------

export const saveOauthState = internalMutation({
  args: {
    state: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.string(),
    returnTo: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Prune stale handshake rows so the table stays tiny
    const now = Date.now();
    const oldest = await ctx.db.query("xOauthStates").take(10);
    await Promise.all(
      oldest
        .filter((row) => now - row.createdAt > STATE_TTL_MS)
        .map((row) => ctx.db.delete(row._id)),
    );
    await ctx.db.insert("xOauthStates", {
      state: args.state,
      codeVerifier: args.codeVerifier,
      redirectUri: args.redirectUri,
      returnTo: args.returnTo,
      createdAt: now,
    });
    return null;
  },
});

export const consumeOauthState = internalMutation({
  args: { state: v.string() },
  returns: v.union(
    v.object({
      codeVerifier: v.string(),
      redirectUri: v.string(),
      returnTo: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("xOauthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();
    if (!row) {
      return null;
    }
    await ctx.db.delete(row._id);
    if (Date.now() - row.createdAt > STATE_TTL_MS) {
      return null;
    }
    return {
      codeVerifier: row.codeVerifier,
      redirectUri: row.redirectUri,
      returnTo: row.returnTo,
    };
  },
});

export const getAccount = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      username: v.string(),
      accessToken: v.string(),
      refreshToken: v.union(v.string(), v.null()),
      expiresAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const account = await ctx.db
      .query("xAccounts")
      .withIndex("by_key", (q) => q.eq("key", ACCOUNT_KEY))
      .unique();
    if (!account) {
      return null;
    }
    return {
      username: account.username,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken ?? null,
      expiresAt: account.expiresAt,
    };
  },
});

export const saveAccount = internalMutation({
  args: {
    username: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scope: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("xAccounts")
      .withIndex("by_key", (q) => q.eq("key", ACCOUNT_KEY))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        updatedAt: now,
      });
      return null;
    }
    await ctx.db.insert("xAccounts", {
      key: ACCOUNT_KEY,
      username: args.username,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      scope: args.scope,
      connectedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const updateTokens = internalMutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("xAccounts")
      .withIndex("by_key", (q) => q.eq("key", ACCOUNT_KEY))
      .unique();
    if (!existing) {
      return null;
    }
    await ctx.db.patch(existing._id, {
      accessToken: args.accessToken,
      // Keep the old refresh token when the provider does not rotate it
      ...(args.refreshToken ? { refreshToken: args.refreshToken } : {}),
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const logShare = internalMutation({
  args: {
    text: v.string(),
    tweetId: v.string(),
    tweetUrl: v.string(),
    postSlug: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("xShares", {
      text: args.text,
      tweetId: args.tweetId,
      tweetUrl: args.tweetUrl,
      postSlug: args.postSlug,
      createdAt: Date.now(),
    });
    return null;
  },
});

// ---------- admin queries ----------

export const getXStatus = query({
  args: {},
  returns: v.object({
    connected: v.boolean(),
    username: v.union(v.string(), v.null()),
    expiresAt: v.union(v.number(), v.null()),
    clientConfigured: v.boolean(),
  }),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const account = await ctx.db
      .query("xAccounts")
      .withIndex("by_key", (q) => q.eq("key", ACCOUNT_KEY))
      .unique();
    // Client keys can come from dashboard overrides or env vars
    const hasKey = async (name: string): Promise<boolean> => {
      const override = await ctx.db
        .query("vendorKeys")
        .withIndex("by_name", (q) => q.eq("name", name))
        .unique();
      if (override && override.value.trim().length > 0) {
        return true;
      }
      const envValue = process.env[name];
      return Boolean(envValue && envValue.trim().length > 0 && envValue.trim() !== "unset");
    };
    const clientConfigured = (await hasKey("X_CLIENT_ID")) && (await hasKey("X_CLIENT_SECRET"));
    return {
      connected: Boolean(account),
      username: account?.username ?? null,
      expiresAt: account?.expiresAt ?? null,
      clientConfigured,
    };
  },
});

export const listShares = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("xShares"),
      _creationTime: v.number(),
      text: v.string(),
      tweetId: v.string(),
      tweetUrl: v.string(),
      postSlug: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    return await ctx.db
      .query("xShares")
      .withIndex("by_createdat")
      .order("desc")
      .take(10);
  },
});

// ---------- admin mutations ----------

export const disconnectX = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const existing = await ctx.db
      .query("xAccounts")
      .withIndex("by_key", (q) => q.eq("key", ACCOUNT_KEY))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

const X_STATUS_URL_PATTERN =
  /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^/]+\/status\/(\d+)/;

/**
 * Turn an X post URL into a blog draft. Inserts a rewrite-mode draft into the
 * agent pipeline; the voice agent pulls the post text via oEmbed and writes a
 * draft that lands in the Drafts Inbox for review.
 */
export const importFromX = mutation({
  args: { url: v.string() },
  returns: v.id("drafts"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const url = args.url.trim();
    if (!X_STATUS_URL_PATTERN.test(url)) {
      throw new ConvexError(
        "Paste a full X post link like https://x.com/user/status/123456789",
      );
    }
    return await insertDraftHelper(ctx, {
      rawInput: `Expand this X post into a full blog post. Post link: ${url}`,
      type: "link-commentary",
      mode: "rewrite",
      source: "x-import",
      links: [url],
    });
  },
});

// ---------- OAuth connect flow ----------

export const beginXConnect = action({
  args: { returnTo: v.string() },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, args) => {
    await requireDashboardAdminAction(ctx);
    const clientId = await resolveVendorKey(ctx, "X_CLIENT_ID");
    const clientSecret = await resolveVendorKey(ctx, "X_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new ConvexError(
        "Set X_CLIENT_ID and X_CLIENT_SECRET in the API Keys section first",
      );
    }
    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) {
      throw new ConvexError("Deployment site URL is unavailable");
    }
    const state = randomToken();
    const codeVerifier = randomToken(48);
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const redirectUri = `${siteUrl}/x/callback`;
    await ctx.runMutation(internal.xIntegration.saveOauthState, {
      state,
      codeVerifier,
      redirectUri,
      returnTo: args.returnTo,
    });
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: OAUTH_SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    return { url: `${X_AUTHORIZE_URL}?${params.toString()}` };
  },
});

/**
 * Complete the OAuth handshake from GET /x/callback. Exchanges the code for
 * tokens, stores the account, and redirects back to the dashboard that
 * started the connect flow. Only completes with a valid admin-created state.
 */
export async function processXCallback(ctx: ActionCtx, requestUrl: URL): Promise<Response> {
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const oauthError = requestUrl.searchParams.get("error");

  const stateRow = state
    ? await ctx.runMutation(internal.xIntegration.consumeOauthState, { state })
    : null;
  const fallbackOrigin = process.env.SITE_URL || "https://waynesutton.ai";
  const returnTo = stateRow?.returnTo || fallbackOrigin;
  const redirect = (result: string) =>
    new Response(null, {
      status: 302,
      headers: { Location: `${returnTo}/dashboard?x=${result}` },
    });

  if (oauthError) {
    return redirect("denied");
  }
  if (!code || !stateRow) {
    return redirect("error");
  }

  const clientId = await resolveVendorKey(ctx, "X_CLIENT_ID");
  const clientSecret = await resolveVendorKey(ctx, "X_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return redirect("error");
  }

  const tokenResponse = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(clientId, clientSecret),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: stateRow.redirectUri,
      code_verifier: stateRow.codeVerifier,
      client_id: clientId,
    }),
  });
  if (!tokenResponse.ok) {
    return redirect("error");
  }
  const tokens = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!tokens.access_token) {
    return redirect("error");
  }

  let username = "connected";
  const meResponse = await fetch(`${X_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (meResponse.ok) {
    const me = (await meResponse.json()) as { data?: { username?: string } };
    if (me.data?.username) {
      username = me.data.username;
    }
  }

  await ctx.runMutation(internal.xIntegration.saveAccount, {
    username,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 7200) * 1000,
    scope: tokens.scope,
  });

  return redirect("connected");
}

// ---------- posting ----------

type TokenResult = { token: string; username: string } | { error: string };

/** Get a valid user access token, refreshing when it is about to expire. */
async function getFreshAccessToken(ctx: ActionCtx): Promise<TokenResult> {
  const account = await ctx.runQuery(internal.xIntegration.getAccount, {});
  if (!account) {
    return { error: "No X account connected. Connect one in the X section." };
  }
  if (account.expiresAt - 60_000 > Date.now()) {
    return { token: account.accessToken, username: account.username };
  }
  if (!account.refreshToken) {
    return { error: "X session expired. Reconnect your account in the X section." };
  }
  const clientId = await resolveVendorKey(ctx, "X_CLIENT_ID");
  const clientSecret = await resolveVendorKey(ctx, "X_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return { error: "X client keys are not configured" };
  }
  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(clientId, clientSecret),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
      client_id: clientId,
    }),
  });
  if (!response.ok) {
    return { error: "X token refresh failed. Reconnect your account in the X section." };
  }
  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    return { error: "X token refresh failed. Reconnect your account in the X section." };
  }
  await ctx.runMutation(internal.xIntegration.updateTokens, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
  });
  return { token: data.access_token, username: account.username };
}

/** Shared tweet posting used by the compose box and the publish flow. */
async function postTweetHelper(
  ctx: ActionCtx,
  text: string,
  postSlug?: string,
): Promise<{ tweetId: string; tweetUrl: string }> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new ConvexError("Post text is required");
  }
  const tokenResult = await getFreshAccessToken(ctx);
  if ("error" in tokenResult) {
    throw new ConvexError(tokenResult.error);
  }
  const response = await fetch(`${X_API_BASE}/tweets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenResult.token}`,
    },
    body: JSON.stringify({ text: trimmed }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new ConvexError(
      `X rejected the post (${response.status}): ${detail.slice(0, 200)}`,
    );
  }
  const result = (await response.json()) as { data?: { id?: string } };
  const tweetId = result.data?.id;
  if (!tweetId) {
    throw new ConvexError("X did not return a post id");
  }
  const tweetUrl = `https://x.com/${tokenResult.username}/status/${tweetId}`;
  await ctx.runMutation(internal.xIntegration.logShare, {
    text: trimmed,
    tweetId,
    tweetUrl,
    postSlug,
  });
  return { tweetId, tweetUrl };
}

/** Compose box: post arbitrary text to the connected X account. */
export const postToX = action({
  args: {
    text: v.string(),
    postSlug: v.optional(v.string()),
  },
  returns: v.object({ tweetId: v.string(), tweetUrl: v.string() }),
  handler: async (ctx, args) => {
    await requireDashboardAdminAction(ctx);
    // Raw-length guard for hand-written text; URLs in the publish flow are
    // weighted to 23 characters by X, so that path skips this check.
    if (args.text.trim().length > TWEET_MAX_CHARS) {
      throw new ConvexError(`Posts are limited to ${TWEET_MAX_CHARS} characters`);
    }
    return await postTweetHelper(ctx, args.text, args.postSlug);
  },
});

/** Publish flow: share a just-published post as title plus canonical URL. */
export const sharePublishedPost = action({
  args: {
    title: v.string(),
    slug: v.string(),
  },
  returns: v.object({ tweetId: v.string(), tweetUrl: v.string() }),
  handler: async (ctx, args) => {
    await requireDashboardAdminAction(ctx);
    const siteUrl = process.env.SITE_URL || "https://waynesutton.ai";
    const postUrl = `${siteUrl}/${args.slug}`;
    // URLs count as 23 characters on X regardless of length
    const budget = TWEET_MAX_CHARS - 23 - 2;
    let title = args.title.trim();
    if (title.length > budget) {
      title = `${title.slice(0, budget - 3)}...`;
    }
    return await postTweetHelper(ctx, `${title}\n\n${postUrl}`, args.slug);
  },
});
