import type { ModelContextLike } from "./detect";
import type { ToolCatalogEntry } from "./catalog";

/** Result an execute handler hands back to the agent */
export type ToolResult = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export type ToolHandler = (input: Record<string, unknown>) => Promise<ToolResult> | ToolResult;

/**
 * Register a set of catalog tools with their handlers. Returns a function
 * that unregisters them all. Registration failures are swallowed on purpose:
 * WebMCP is experimental and a shape change in Chrome must never break the
 * page for the person reading it.
 */
export function registerTools(
  context: ModelContextLike,
  tools: ReadonlyArray<ToolCatalogEntry>,
  handlers: Record<string, ToolHandler>,
): () => void {
  const controller = new AbortController();
  for (const tool of tools) {
    const handler = handlers[tool.name];
    if (!handler) {
      continue;
    }
    try {
      const pending = context.registerTool(
        {
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: { readOnlyHint: tool.readOnly },
          execute: async (input: Record<string, unknown>) => {
            try {
              return await handler(input ?? {});
            } catch (error) {
              // Give the agent a structured failure instead of a thrown error
              return {
                ok: false,
                reason: error instanceof Error ? error.message : "Tool failed",
              };
            }
          },
        },
        { signal: controller.signal },
      );
      // Some builds return a promise; a rejection must not surface as unhandled
      if (pending && typeof (pending as Promise<void>).catch === "function") {
        void (pending as Promise<void>).catch(() => undefined);
      }
    } catch {
      // Ignore this tool and keep going with the rest
    }
  }
  return () => {
    try {
      controller.abort();
    } catch {
      // Nothing to clean up
    }
  };
}
