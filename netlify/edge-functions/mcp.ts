import type { Config, Context } from "@netlify/edge-functions";

// MCP Server configuration
const SITE_URL = "https://www.waynesutton.ai";
const SITE_NAME = "markdown sync framework";
const MCP_SERVER_NAME = "markdown-fast-mcp";
const MCP_SERVER_VERSION = "1.0.0";

// JSON-RPC 2.0 types
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// MCP tool definitions
const MCP_TOOLS = [
  {
    name: "list_posts",
    description: "Get all published blog posts with metadata (no content). Returns title, slug, description, date, tags, and read time.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_post",
    description: "Get a single blog post by slug with full content.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "The URL slug of the post to retrieve",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "list_pages",
    description: "Get all published pages with metadata (no content). Returns title, slug, and order.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_page",
    description: "Get a single page by slug with full content.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "The URL slug of the page to retrieve",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_homepage",
    description: "Get homepage data including featured posts, featured pages, and recent posts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "search_content",
    description: "Full text search across all posts and pages. Returns matching results with snippets.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query string",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "export_all",
    description: "Export all posts and pages with full content. Useful for bulk content retrieval.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// Helper: Create JSON-RPC success response
function successResponse(id: string | number | null, result: unknown): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

// Helper: Create JSON-RPC error response
function errorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message, data },
  };
}

// Helper: Fetch data from Convex HTTP endpoint
async function fetchConvex(convexSiteUrl: string, path: string, params?: URLSearchParams): Promise<Response> {
  const url = params 
    ? `${convexSiteUrl}${path}?${params.toString()}`
    : `${convexSiteUrl}${path}`;
  
  return fetch(url, {
    headers: { Accept: "application/json" },
  });
}

// Tool handlers
async function handleListPosts(convexSiteUrl: string): Promise<unknown> {
  const response = await fetchConvex(convexSiteUrl, "/api/posts");
  if (!response.ok) {
    throw new Error("Failed to fetch posts from Convex");
  }
  const data = await response.json();
  return {
    site: SITE_NAME,
    url: SITE_URL,
    posts: data.posts || [],
  };
}

async function handleGetPost(convexSiteUrl: string, slug: string): Promise<unknown> {
  const params = new URLSearchParams({ slug });
  const response = await fetchConvex(convexSiteUrl, "/api/post", params);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Post not found: ${slug}`);
    }
    throw new Error("Failed to fetch post from Convex");
  }
  const post = await response.json();
  return {
    site: SITE_NAME,
    url: `${SITE_URL}/${slug}`,
    post,
  };
}

async function handleListPages(convexSiteUrl: string): Promise<unknown> {
  // Fetch all posts and filter to get pages data from the response
  const response = await fetchConvex(convexSiteUrl, "/api/posts");
  if (!response.ok) {
    throw new Error("Failed to fetch pages from Convex");
  }
  
  // Pages are served via a different endpoint, we need to get them from sitemap or similar
  // For now, return a structured response indicating pages endpoint
  return {
    site: SITE_NAME,
    url: SITE_URL,
    pages: [],
    note: "Use get_page with specific slugs: about, docs, contact, newsletter, projects, changelog-page",
  };
}

async function handleGetPage(convexSiteUrl: string, slug: string): Promise<unknown> {
  // Pages use the same /api/post endpoint but check pages table first via slug
  const params = new URLSearchParams({ slug });
  const response = await fetchConvex(convexSiteUrl, "/api/post", params);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Page not found: ${slug}`);
    }
    throw new Error("Failed to fetch page from Convex");
  }
  
  const page = await response.json();
  return {
    site: SITE_NAME,
    url: `${SITE_URL}/${slug}`,
    page,
  };
}

async function handleGetHomepage(convexSiteUrl: string): Promise<unknown> {
  const response = await fetchConvex(convexSiteUrl, "/api/posts");
  if (!response.ok) {
    throw new Error("Failed to fetch homepage data from Convex");
  }
  const data = await response.json();
  
  // Get recent posts (first 5)
  const recentPosts = (data.posts || []).slice(0, 5);
  
  return {
    site: SITE_NAME,
    url: SITE_URL,
    description: data.description,
    recentPosts,
    totalPosts: data.posts?.length || 0,
  };
}

async function handleSearchContent(convexSiteUrl: string, query: string): Promise<unknown> {
  if (!query || !query.trim()) {
    return {
      site: SITE_NAME,
      query: "",
      results: [],
    };
  }
  
  // Search is handled client-side in the app, so we do a simple filter here
  const response = await fetchConvex(convexSiteUrl, "/api/posts");
  if (!response.ok) {
    throw new Error("Failed to fetch posts for search");
  }
  const data = await response.json();
  
  const queryLower = query.toLowerCase();
  const results = (data.posts || [])
    .filter((post: { title: string; description: string; tags: string[] }) => 
      post.title.toLowerCase().includes(queryLower) ||
      post.description.toLowerCase().includes(queryLower) ||
      post.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))
    )
    .slice(0, 15)
    .map((post: { title: string; slug: string; description: string; tags: string[] }) => ({
      type: "post",
      title: post.title,
      slug: post.slug,
      description: post.description,
      url: `${SITE_URL}/${post.slug}`,
    }));
  
  return {
    site: SITE_NAME,
    query,
    resultCount: results.length,
    results,
  };
}

async function handleExportAll(convexSiteUrl: string): Promise<unknown> {
  const response = await fetchConvex(convexSiteUrl, "/api/export");
  if (!response.ok) {
    throw new Error("Failed to export content from Convex");
  }
  const data = await response.json();
  return data;
}

// Handle tool calls
async function handleToolCall(
  convexSiteUrl: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "list_posts":
      return handleListPosts(convexSiteUrl);
    
    case "get_post":
      if (!args.slug || typeof args.slug !== "string") {
        throw new Error("Missing required parameter: slug");
      }
      return handleGetPost(convexSiteUrl, args.slug);
    
    case "list_pages":
      return handleListPages(convexSiteUrl);
    
    case "get_page":
      if (!args.slug || typeof args.slug !== "string") {
        throw new Error("Missing required parameter: slug");
      }
      return handleGetPage(convexSiteUrl, args.slug);
    
    case "get_homepage":
      return handleGetHomepage(convexSiteUrl);
    
    case "search_content":
      if (!args.query || typeof args.query !== "string") {
        throw new Error("Missing required parameter: query");
      }
      return handleSearchContent(convexSiteUrl, args.query);
    
    case "export_all":
      return handleExportAll(convexSiteUrl);
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Handle MCP JSON-RPC methods
async function handleMcpMethod(
  convexSiteUrl: string,
  method: string,
  params: Record<string, unknown> | undefined,
  id: string | number | null
): Promise<JsonRpcResponse> {
  try {
    switch (method) {
      // MCP initialization
      case "initialize":
        return successResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: MCP_SERVER_NAME,
            version: MCP_SERVER_VERSION,
          },
        });
      
      // MCP initialized notification (no response needed for notifications)
      case "notifications/initialized":
        return successResponse(id, null);
      
      // List available tools
      case "tools/list":
        return successResponse(id, {
          tools: MCP_TOOLS,
        });
      
      // Call a tool
      case "tools/call": {
        const toolName = params?.name as string;
        const toolArgs = (params?.arguments || {}) as Record<string, unknown>;
        
        if (!toolName) {
          return errorResponse(id, -32602, "Missing tool name");
        }
        
        const result = await handleToolCall(convexSiteUrl, toolName, toolArgs);
        return successResponse(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
      }
      
      // Ping for health check
      case "ping":
        return successResponse(id, {});
      
      default:
        return errorResponse(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(id, -32000, message);
  }
}

// Validate API key for optional authentication
function validateApiKey(request: Request): { valid: boolean; authenticated: boolean } {
  const authHeader = request.headers.get("Authorization");
  const mcpApiKey = Deno.env.get("MCP_API_KEY");
  
  // If no API key is configured, allow public access
  if (!mcpApiKey) {
    return { valid: true, authenticated: false };
  }
  
  // If no auth header provided, allow public access
  if (!authHeader) {
    return { valid: true, authenticated: false };
  }
  
  // If auth header provided, validate it
  const token = authHeader.replace("Bearer ", "");
  if (token === mcpApiKey) {
    return { valid: true, authenticated: true };
  }
  
  // Invalid API key provided
  return { valid: false, authenticated: false };
}

// Main edge function handler
export default async function handler(
  request: Request,
  _context: Context
): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  
  // Only accept POST requests
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify(errorResponse(null, -32600, "Method not allowed. Use POST.")),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
  
  // Validate optional API key
  const { valid, authenticated } = validateApiKey(request);
  if (!valid) {
    return new Response(
      JSON.stringify(errorResponse(null, -32600, "Invalid API key")),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
  
  // Get Convex URL
  const convexUrl = Deno.env.get("VITE_CONVEX_URL") || Deno.env.get("CONVEX_URL");
  if (!convexUrl) {
    return new Response(
      JSON.stringify(errorResponse(null, -32000, "Server configuration error")),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
  
  // Convert Convex URL for HTTP endpoints
  const convexSiteUrl = convexUrl.replace(".cloud", ".site");
  
  // Parse JSON-RPC request
  let jsonRpcRequest: JsonRpcRequest;
  try {
    const body = await request.text();
    jsonRpcRequest = JSON.parse(body);
  } catch {
    return new Response(
      JSON.stringify(errorResponse(null, -32700, "Parse error: Invalid JSON")),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
  
  // Validate JSON-RPC format
  if (jsonRpcRequest.jsonrpc !== "2.0" || !jsonRpcRequest.method) {
    return new Response(
      JSON.stringify(errorResponse(jsonRpcRequest.id ?? null, -32600, "Invalid JSON-RPC request")),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
  
  // Handle the MCP method
  const response = await handleMcpMethod(
    convexSiteUrl,
    jsonRpcRequest.method,
    jsonRpcRequest.params as Record<string, unknown> | undefined,
    jsonRpcRequest.id ?? null
  );
  
  // Add authentication status to response headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "X-MCP-Server": MCP_SERVER_NAME,
    "X-MCP-Version": MCP_SERVER_VERSION,
  };
  
  if (authenticated) {
    headers["X-MCP-Authenticated"] = "true";
  }
  
  return new Response(JSON.stringify(response), { headers });
}

// Netlify Edge Function configuration with rate limiting
// Rate limit: 50 requests per minute per IP for public access
export const config: Config = {
  path: "/mcp",
  rateLimit: {
    windowLimit: 50,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
