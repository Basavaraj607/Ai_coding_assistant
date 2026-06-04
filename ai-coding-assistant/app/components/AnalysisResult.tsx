"use client";

import React, { useState } from "react";
import CodeEditor from "./CodeEditor";
import { BugIcon, SparklesIcon, CheckIcon, CopyIcon } from "./Icons";

interface AnalysisResultProps {
  result: {
    errorExplanation: string;
    correctedCode: string;
    originalCode?: string;
    language: string;
    fixes?: string[];
  };
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  const [activeTab, setActiveTab] = useState<"side-by-side" | "solution" | "explanation">("side-by-side");

  const downloadFile = () => {
    const langExtMap: Record<string, string> = {
      python: "py",
      javascript: "js",
      java: "java",
      c: "c",
    };
    const ext = langExtMap[result.language.toLowerCase()] || "txt";
    const filename = `corrected_code.${ext}`;

    const blob = new Blob([result.correctedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Convert markdown explanation into stylized paragraphs & lists
  const renderMarkdownExplanation = (markdown: string) => {
    if (!markdown) return null;

    // Simple markdown line parser
    const lines = markdown.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-semibold text-emerald-400 mt-4 mb-2 uppercase tracking-wide">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-base font-bold text-zinc-100 mt-5 mb-2.5 border-b border-zinc-900 pb-1">
            {trimmed.replace("##", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-lg font-extrabold text-zinc-50 mt-6 mb-3">
            {trimmed.replace("#", "").trim()}
          </h2>
        );
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return (
          <li key={idx} className="text-xs text-zinc-400 list-disc ml-5 mb-1.5 leading-relaxed">
            {trimmed.substring(1).trim()}
          </li>
        );
      }
      if (trimmed.match(/^\d+\./)) {
        return (
          <li key={idx} className="text-xs text-zinc-400 list-decimal ml-5 mb-1.5 leading-relaxed">
            {trimmed.replace(/^\d+\./, "").trim()}
          </li>
        );
      }
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }

      // Handle simple formatting like `code` inside text
      const parsedText = trimmed.split(/(`[^`]+`)/g).map((part, pIdx) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={pIdx}
              className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-400 font-medium"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      return (
        <p key={idx} className="text-xs text-zinc-400 leading-relaxed mb-2.5">
          {parsedText}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner / Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-emerald-950/15 border border-emerald-900/30 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 shadow-inner shadow-emerald-500/10">
            <BugIcon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Code Analysis Complete</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Identified bugs and refactored the source code using AI diagnostics.
            </p>
          </div>
        </div>
        <button
          onClick={downloadFile}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all"
        >
          Download Corrected Code
        </button>
      </div>

      {/* Tabs / Display Selector */}
      <div className="flex border-b border-zinc-900">
        <button
          onClick={() => setActiveTab("side-by-side")}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "side-by-side"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Diff View
        </button>
        <button
          onClick={() => setActiveTab("solution")}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "solution"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Solution Code
        </button>
        <button
          onClick={() => setActiveTab("explanation")}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "explanation"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Explanation
        </button>
      </div>

      {/* Result Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Explanation (Always visible on large screen in Diff View, otherwise based on activeTab) */}
        <div
          className={`${
            activeTab === "explanation"
              ? "lg:col-span-12 block"
              : activeTab === "side-by-side"
              ? "lg:col-span-4 block"
              : "hidden lg:hidden"
          } space-y-4`}
        >
          <div className="rounded-xl glass-card border border-zinc-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide pb-2 border-b border-zinc-900/60">
              <SparklesIcon size={14} className="text-emerald-400" /> Error Explanation
            </h3>
            <div className="overflow-y-auto max-h-[550px] pr-2 scrollbar">
              {renderMarkdownExplanation(result.errorExplanation)}
            </div>
          </div>
        </div>

        {/* Right column: Editors (Original vs Corrected or single Solution Editor) */}
        <div
          className={`${
            activeTab === "explanation"
              ? "hidden"
              : activeTab === "side-by-side"
              ? "lg:col-span-8 block"
              : "lg:col-span-12 block"
          } w-full space-y-4`}
        >
          {activeTab === "side-by-side" ? (
            <div className="space-y-4">
              {result.originalCode && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 pl-1">
                    Original Code
                  </span>
                  <CodeEditor
                    code={result.originalCode}
                    language={result.language}
                    title="bugs_detected"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 pl-1">
                  Fixed Solution
                </span>
                <CodeEditor
                  code={result.correctedCode}
                  language={result.language}
                  title="corrected_output"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 pl-1">
                Refactored Implementation
              </span>
              <CodeEditor
                code={result.correctedCode}
                language={result.language}
                title="full_solution"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
