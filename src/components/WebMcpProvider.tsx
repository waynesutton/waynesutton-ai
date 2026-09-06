import { useCallback, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import siteConfig from "../config/siteConfig";
import { useWebMcp } from "../hooks/useWebMcp";
import WebMcpConfirmDialog, { type WebMcpConfirmRequest } from "./WebMcpConfirmDialog";

interface WebMcpProviderProps {
  /** Layout's search opener, extended to accept a query */
  openSearch: (query: string) => void;
}

/**
 * Mounts the WebMCP hook and owns the confirm dialog it needs for writes.
 * Renders nothing unless a confirmation is pending. Lives in Layout so it
 * never runs on /dashboard, /write, or /newsletter-admin.
 */
export default function WebMcpProvider({ openSearch }: WebMcpProviderProps) {
  const { setTheme } = useTheme();
  const [request, setRequest] = useState<WebMcpConfirmRequest | null>(null);
  const resolver = useRef<((approved: boolean) => void) | null>(null);

  // One pending confirmation at a time. A newer request cancels the older one
  // so an agent cannot stack dialogs.
  const confirm = useCallback((next: WebMcpConfirmRequest) => {
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setRequest(next);
    });
  }, []);

  const settle = useCallback((approved: boolean) => {
    resolver.current?.(approved);
    resolver.current = null;
    setRequest(null);
  }, []);

  const onConfirm = useCallback(() => settle(true), [settle]);
  const onCancel = useCallback(() => settle(false), [settle]);

  useWebMcp({
    enabled: siteConfig.webmcp?.enabled !== false,
    openSearch,
    setTheme,
    confirm,
  });

  return <WebMcpConfirmDialog request={request} onConfirm={onConfirm} onCancel={onCancel} />;
}
