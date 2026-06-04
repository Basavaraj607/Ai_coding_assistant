"use client";

import React, { useState } from "react";
import { CopyIcon, CheckIcon } from "./Icons";

interface CodeEditorProps {
  code: string;
  language: string;
  title?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ code, language, title, readOnly = true }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "python":
        return "text-blue-400 bg-blue-950/40 border-blue-900/30";
      case "javascript":
      case "js":
        return "text-yellow-400 bg-yellow-950/40 border-yellow-900/30";
      case "java":
        return "text-orange-400 bg-orange-950/40 border-orange-900/30";
      case "c":
        return "text-indigo-400 bg-indigo-950/40 border-indigo-900/30";
      default:
        return "text-zinc-400 bg-zinc-950/40 border-zinc-900/30";
    }
  };

  // Custom regex syntax highlighter to keep package size 0 and avoid React 19 load errors
  const highlightCode = (rawCode: string, lang: string) => {
    if (!rawCode) return <span className="text-zinc-400">No code provided</span>;

    const lines = rawCode.split("\n");
    return lines.map((line, idx) => {
      let lineHtml = line;

      // Handle simple escape HTML
      lineHtml = lineHtml
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const l = lang.toLowerCase();

      // Basic regexes for code highlights
      const rules = [
        // Comments
        {
          regex: l === "python" ? /(#.*)$/g : /(\/\/.*|\/\*[\s\S]*?\*\/)$/g,
          class: "text-zinc-500 italic",
        },
        // Strings
        { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: "text-amber-400 font-medium" },
        // Keywords
        {
          regex:
            /\b(def|class|return|if|else|elif|for|while|import|from|as|in|try|except|finally|public|static|void|int|double|float|char|boolean|String|new|package|var|let|const|function|import|export|default|switch|case|break|include|define|struct|typedef)\b/g,
          class: "text-purple-400 font-semibold",
        },
        // Functions
        { regex: /\b([a-zA-Z_]\w*)(?=\()/g, class: "text-sky-400" },
        // Numbers
        { regex: /\b(\d+)\b/g, class: "text-emerald-400" },
      ];

      // We apply rules in a controlled fashion to prevent inner tags breakage
      // Since it's client-side text rendering, we construct markup securely.
      // For simplicity, let's process token mapping:
      let tokens: { text: string; className: string }[] = [{ text: line, className: "text-zinc-300" }];

      // Apply comments first as they override others
      if (l === "python" && line.includes("#")) {
        const parts = line.split("#");
        tokens = [
          { text: parts[0], className: "text-zinc-300" },
          { text: "#" + parts.slice(1).join("#"), className: "text-zinc-500 italic" },
        ];
      } else if (line.includes("//")) {
        const parts = line.split("//");
        tokens = [
          { text: parts[0], className: "text-zinc-300" },
          { text: "//" + parts.slice(1).join("//"), className: "text-zinc-500 italic" },
        ];
      } else {
        // Simple highlight pattern
        // Let's replace keywords and functions directly for displaying visual colors
      }

      return (
        <div key={idx} className="table-row hover:bg-zinc-900/40 transition-colors">
          {/* Line number */}
          <span className="table-cell select-none text-right pr-4 text-zinc-600 font-mono text-xs w-10 border-r border-zinc-900/60 pl-2">
            {idx + 1}
          </span>
          {/* Line Content */}
          <span
            className="table-cell pl-4 font-mono text-xs whitespace-pre break-all leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: applyRegexHighlighting(line, l),
            }}
          />
        </div>
      );
    });
  };

  const applyRegexHighlighting = (text: string, lang: string) => {
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Temp placeholders to avoid nested replacements
    const placeholders: string[] = [];

    // 1. Strings replacement
    escaped = escaped.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (match) => {
      placeholders.push(`<span class="text-emerald-400 font-normal">${match}</span>`);
      return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });

    // 2. Comments replacement
    const commentRegex = lang === "python" ? /(#.*)$/g : /(\/\/.*)$/g;
    escaped = escaped.replace(commentRegex, (match) => {
      placeholders.push(`<span class="text-zinc-500 italic">${match}</span>`);
      return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });

    // 3. Keywords replacement
    const keywordRegex =
      /\b(def|class|return|if|else|elif|for|while|import|from|as|in|try|except|finally|public|static|void|int|double|float|char|boolean|String|new|package|var|let|const|function|export|default|switch|case|break|include|define|struct|typedef|null|true|false)\b/g;
    escaped = escaped.replace(keywordRegex, '<span class="text-purple-400 font-medium">$1</span>');

    // 4. Builtins or API names
    const builtinRegex = /\b(print|console|log|System|out|println|printf|scanf|list|dict|set|len|range)\b/g;
    escaped = escaped.replace(builtinRegex, '<span class="text-amber-400 font-medium">$1</span>');

    // 5. Function names
    escaped = escaped.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="text-sky-400">$1</span>');

    // Restore placeholders
    placeholders.forEach((html, i) => {
      escaped = escaped.replace(`___PLACEHOLDER_${i}___`, html);
    });

    return escaped;
  };

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c0e] flex flex-col shadow-inner">
      {/* Tab Header */}
      <div className="flex items-center justify-between bg-zinc-950 px-4 py-2 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          {title && <span className="text-xs text-zinc-400 font-medium">{title}</span>}
          <span
            className={`text-[9px] uppercase tracking-widest font-mono px-2 py-0.5 rounded border ${getLanguageColor(
              language
            )}`}
          >
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 px-2 py-1 rounded transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon size={12} className="text-emerald-400 animate-pulse" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Body */}
      <div className="py-3 overflow-x-auto select-text font-mono text-zinc-300">
        <div className="table min-w-full">
          {highlightCode(code, language)}
        </div>
      </div>
    </div>
  );
}
