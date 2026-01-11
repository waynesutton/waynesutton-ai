import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { StreamId } from "@convex-dev/persistent-text-streaming";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X,
  PaperPlaneTilt,
  Sparkle,
  SpinnerGap,
  Trash,
  Copy,
  Check,
  Warning,
} from "@phosphor-icons/react";
import { siteConfig } from "../config/siteConfig";

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streamId?: string;
  isDriven?: boolean;
}

// Streaming message component that uses useStream hook
function StreamingMessage({
  streamId,
  isDriven,
  convexUrl,
  onCopy,
  isCopied,
}: {
  streamId: string;
  isDriven: boolean;
  convexUrl: string;
  onCopy: (text: string) => void;
  isCopied: boolean;
}) {
  const { text, status } = useStream(
    api.askAI.getStreamBody,
    new URL(`${convexUrl}/ask-ai-stream`),
    isDriven,
    streamId as StreamId
  );

  const isLoading = status === "pending" || status === "streaming";
  // Show copy button when not loading and we have text (status could be "complete", "done", etc.)
  const showCopyButton = !isLoading && status !== "error" && !!text;

  return (
    <div className="ask-ai-message ask-ai-message-assistant">
      <div className="ask-ai-message-content">
        {text ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                // Check if it's an internal link
                if (href?.startsWith("/")) {
                  return (
                    <Link to={href} className="ask-ai-link">
                      {children}
                    </Link>
                  );
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ask-ai-link"
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {text}
          </ReactMarkdown>
        ) : (
          <div className="ask-ai-thinking">
            <SpinnerGap size={16} className="ask-ai-spinner" />
            <span>Searching and thinking...</span>
          </div>
        )}
        {isLoading && text && <span className="ask-ai-cursor">|</span>}
      </div>
      {showCopyButton && (
        <button
          className="ask-ai-copy-button"
          onClick={() => onCopy(text)}
          title="Copy response"
        >
          {isCopied ? (
            <Check size={14} weight="bold" />
          ) : (
            <Copy size={14} weight="bold" />
          )}
        </button>
      )}
      {status === "error" && (
        <div className="ask-ai-error">Failed to load response</div>
      )}
    </div>
  );
}

// Configuration status interface
interface ConfigStatus {
  configured: boolean;
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  missingKeys: string[];
}

export default function AskAIModal({ isOpen, onClose }: AskAIModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    siteConfig.askAI?.defaultModel || "claude-sonnet-4-20250514"
  );
  const [drivenIds, setDrivenIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [configChecked, setConfigChecked] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createSession = useMutation(api.askAI.createSession);
  const checkConfiguration = useAction(api.askAI.checkConfiguration);

  // Check configuration when modal opens
  useEffect(() => {
    if (isOpen && !configChecked) {
      checkConfiguration({})
        .then((status) => {
          setConfigStatus(status);
          setConfigChecked(true);
        })
        .catch((err) => {
          console.error("Failed to check Ask AI configuration:", err);
          setConfigChecked(true);
        });
    }
  }, [isOpen, configChecked, checkConfiguration]);

  // Handle copy message
  const handleCopy = useCallback(async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Get Convex URL from environment and convert to site URL for HTTP routes
  // VITE_CONVEX_URL is like https://xxx.convex.cloud
  // HTTP routes are served from https://xxx.convex.site
  const convexCloudUrl = import.meta.env.VITE_CONVEX_URL as string;
  const convexUrl = convexCloudUrl.replace(".convex.cloud", ".convex.site");

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSubmitting) return;

    const question = inputValue.trim();
    setInputValue("");
    setIsSubmitting(true);

    // Add user message
    const userMessageId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: question },
    ]);

    try {
      // Create session with question and model stored in database
      // The useStream hook will trigger the HTTP action which retrieves these from DB
      const { streamId } = await createSession({ question, model: selectedModel });

      // Add assistant message with stream
      const assistantMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          streamId,
          isDriven: true,
        },
      ]);

      // Mark this stream as driven by this client
      // The useStream hook will make the HTTP POST request automatically
      setDrivenIds((prev) => new Set(prev).add(streamId));
    } catch (error) {
      console.error("Failed to create session:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "**Error:** Failed to start conversation. Please try again.",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [inputValue, isSubmitting, createSession, selectedModel]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [onClose, handleSend]
  );

  // Clear conversation
  const handleClear = () => {
    setMessages([]);
    setDrivenIds(new Set());
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ask-ai-modal-backdrop" onClick={handleBackdropClick}>
      <div className="ask-ai-modal">
        {/* Header */}
        <div className="ask-ai-modal-header">
          <div className="ask-ai-modal-title">
            <Sparkle size={18} weight="fill" />
            <span>Ask AI</span>
          </div>
          <div className="ask-ai-modal-actions">
            {/* Model selector */}
            {siteConfig.askAI?.models && siteConfig.askAI.models.length > 1 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="ask-ai-model-select"
              >
                {siteConfig.askAI.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleClear}
              className="ask-ai-action-btn"
              title="Clear chat"
              disabled={messages.length === 0}
            >
              <Trash size={16} />
            </button>
            <button
              onClick={onClose}
              className="ask-ai-action-btn"
              aria-label="Close"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Configuration warning banner */}
        {configChecked && configStatus && !configStatus.configured && (
          <div className="ask-ai-config-warning">
            <Warning size={18} weight="bold" />
            <div className="ask-ai-config-warning-content">
              <strong>Ask AI is not fully configured</strong>
              <p>
                Missing environment variables in Convex dashboard:{" "}
                {configStatus.missingKeys.join(", ")}
              </p>
              <p className="ask-ai-config-warning-hint">
                Add these keys via: <code>npx convex env set KEY_NAME value</code>
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="ask-ai-messages">
          {messages.length === 0 && configStatus?.configured !== false && (
            <div className="ask-ai-empty">
              <Sparkle size={32} weight="light" />
              <p>Ask a question about this site</p>
              <p className="ask-ai-hint">
                I'll search the content and provide an answer with sources
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="ask-ai-message ask-ai-message-user">
                  <div className="ask-ai-message-content">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ) : msg.streamId ? (
                <StreamingMessage
                  streamId={msg.streamId}
                  isDriven={drivenIds.has(msg.streamId)}
                  convexUrl={convexUrl}
                  onCopy={(text) => handleCopy(text, msg.id)}
                  isCopied={copiedId === msg.id}
                />
              ) : (
                <div className="ask-ai-message ask-ai-message-assistant">
                  <div className="ask-ai-message-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {msg.content && (
                    <button
                      className="ask-ai-copy-button"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check size={14} weight="bold" />
                      ) : (
                        <Copy size={14} weight="bold" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ask-ai-input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="ask-ai-input"
            rows={1}
            disabled={isSubmitting}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSubmitting}
            className="ask-ai-send-btn"
            title="Send message"
          >
            {isSubmitting ? (
              <SpinnerGap size={18} className="ask-ai-spinner" />
            ) : (
              <PaperPlaneTilt size={18} weight="bold" />
            )}
          </button>
        </div>

        {/* Footer hints */}
        <div className="ask-ai-footer">
          <span>
            <kbd>Enter</kbd> send
          </span>
          <span>
            <kbd>Shift+Enter</kbd> new line
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
