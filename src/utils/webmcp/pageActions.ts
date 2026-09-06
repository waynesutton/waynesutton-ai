import { useEffect, useRef } from "react";
import type { PageActionKind } from "./catalog";

/**
 * Mount scoped registry for UI that opts into WebMCP.
 *
 * NewsletterSignup, ContactForm, and PostAudioPlayer register a handler while
 * they are on screen and drop it on unmount. The WebMCP provider subscribes
 * and only advertises subscribe_newsletter, submit_contact, or listen_to_post
 * while the matching UI exists, so an agent can never reach a form the person
 * cannot see. Handlers run the exact same code path as a human click.
 */

export type PageActionResult = { ok: true; message: string } | { ok: false; reason: string };

export interface PageActionHandlers {
  newsletter: (input: { email: string }) => Promise<PageActionResult>;
  contact: (input: { name: string; email: string; message: string }) => Promise<PageActionResult>;
  listen: () => Promise<PageActionResult>;
}

type Listener = () => void;

const handlers = new Map<PageActionKind, PageActionHandlers[PageActionKind]>();
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function registerPageAction<K extends PageActionKind>(
  kind: K,
  handler: PageActionHandlers[K],
): () => void {
  handlers.set(kind, handler);
  notify();
  return () => {
    // Only remove if this registration is still the live one
    if (handlers.get(kind) === handler) {
      handlers.delete(kind);
      notify();
    }
  };
}

export function getPageAction<K extends PageActionKind>(kind: K): PageActionHandlers[K] | undefined {
  return handlers.get(kind) as PageActionHandlers[K] | undefined;
}

export function mountedPageActions(): ReadonlySet<PageActionKind> {
  return new Set(handlers.keys());
}

export function subscribePageActions(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Hook form of registerPageAction. Pass null to skip (for example when the
 * player has no audio to play). A stable wrapper is registered once per mount
 * and reads the latest handler from a ref, so re-renders never churn the
 * registry or the agent's tool list.
 */
export function usePageAction<K extends PageActionKind>(
  kind: K,
  handler: PageActionHandlers[K] | null,
): void {
  const latest = useRef(handler);
  latest.current = handler;
  const enabled = handler !== null;
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const stable = ((...args: Array<unknown>) => {
      const current = latest.current as ((...inner: Array<unknown>) => Promise<PageActionResult>) | null;
      if (!current) {
        return Promise.resolve({ ok: false, reason: "Not available" } as PageActionResult);
      }
      return current(...args);
    }) as PageActionHandlers[K];
    return registerPageAction(kind, stable);
  }, [kind, enabled]);
}
