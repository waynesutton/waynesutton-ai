import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface DiffCodeBlockProps {
  code: string;
  language: "diff" | "patch";
}

// Lightweight diff renderer: colors added/removed lines without a
// syntax highlighting library (keeps Shiki out of the bundle)
export default function DiffCodeBlock({ code, language }: DiffCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="diff-block-wrapper">
      <div className="diff-block-header">
        <span className="diff-language">{language}</span>
        <div className="diff-block-controls">
          <button
            className="diff-copy-button"
            onClick={handleCopy}
            aria-label={copied ? "Copied!" : "Copy code"}
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <pre className="diff-fallback">
        <code>
          {code.split("\n").map((line, i) => {
            let className = "";
            if (line.startsWith("+") && !line.startsWith("+++"))
              className = "diff-added";
            else if (line.startsWith("-") && !line.startsWith("---"))
              className = "diff-removed";
            return (
              <span key={i} className={className}>
                {line}
                {"\n"}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
