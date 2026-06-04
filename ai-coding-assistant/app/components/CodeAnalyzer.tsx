"use client";

import React, { useState, useRef } from "react";
import {
  TerminalIcon,
  BugIcon,
  CameraIcon,
  FileUpIcon,
  SparklesIcon,
  XIcon,
  RefreshIcon,
  SettingsIcon,
} from "./Icons";
import CameraCapture from "./CameraCapture";

interface CodeAnalyzerProps {
  onAnalyze: (payload: {
    code: string;
    errorMessage: string;
    language: string;
    image: string | null;
  }) => void;
  isLoading: boolean;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export default function CodeAnalyzer({
  onAnalyze,
  isLoading,
  hasApiKey,
  onOpenSettings,
}: CodeAnalyzerProps) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [language, setLanguage] = useState("python");
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Text file
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCode(e.target.result as string);
          // Auto detect language from extension
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (ext === "py") setLanguage("python");
          else if (ext === "java") setLanguage("java");
          else if (ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx") setLanguage("javascript");
          else if (ext === "c" || ext === "h") setLanguage("c");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setCode("");
    setErrorMessage("");
    setImage(null);
  };

  const triggerAnalysis = () => {
    if (!code.trim() && !image) {
      alert("Please paste some code, upload a file, or capture an image to analyze.");
      return;
    }
    onAnalyze({ code, errorMessage, language, image });
  };

  const getLanguageTip = (lang: string) => {
    switch (lang) {
      case "python":
        return "Note: Python depends on strict indentation. Indent issues will cause IndentationError.";
      case "java":
        return "Note: Java requires class name to match file name. Ensure public class matches your code structure.";
      case "javascript":
        return "Note: JavaScript utilizes lexical scoping and closure. Check brackets and braces matching.";
      case "c":
        return "Note: C requires manual memory declarations. Double check pointers and header inclusions.";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Workbench panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Workarea (Left Side - 8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl glass-panel border border-zinc-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <TerminalIcon className="text-emerald-400" />
                <span className="text-sm font-semibold text-zinc-200">Diagnostics Input Console</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg bg-zinc-900 border border-zinc-850 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-mono select-none"
                >
                  <option value="python">Python (.py)</option>
                  <option value="javascript">JavaScript (.js)</option>
                  <option value="java">Java (.java)</option>
                  <option value="c">C (.c)</option>
                </select>
                <button
                  onClick={handleClear}
                  className="rounded-lg bg-zinc-900 border border-zinc-850 p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors"
                  title="Clear inputs"
                >
                  <RefreshIcon size={12} />
                </button>
              </div>
            </div>

            {/* Code editor input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                Source Code
              </label>
              <div className="relative rounded-xl overflow-hidden border border-zinc-850 bg-zinc-950 focus-within:border-emerald-500/80 transition-colors">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Paste your buggy code snippet here..."
                  className="w-full h-64 bg-transparent p-4 font-mono text-xs text-zinc-300 focus:outline-none resize-none scrollbar leading-relaxed"
                />
              </div>
            </div>

            {/* Error message input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                Terminal Error / Output (Optional)
              </label>
              <div className="relative rounded-xl overflow-hidden border border-zinc-850 bg-zinc-950 focus-within:border-rose-900/60 transition-colors">
                <textarea
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  placeholder="Traceback (most recent call last):&#10;SyntaxError: invalid syntax"
                  className="w-full h-24 bg-transparent p-3 font-mono text-xs text-rose-300 placeholder:text-rose-950/60 focus:outline-none resize-none scrollbar leading-normal"
                />
              </div>
            </div>

            {/* Tip Banner */}
            <div className="text-[11px] text-zinc-500 font-mono bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/60">
              {getLanguageTip(language)}
            </div>
          </div>
        </div>

        {/* Uploads & Actions panel (Right Side - 4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* File/Image Upload area */}
          <div className="rounded-2xl glass-panel border border-zinc-800 p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Import Source</h3>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? "border-emerald-500 bg-emerald-950/10"
                  : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-900/20 hover:border-zinc-700"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*,.py,.js,.java,.c,.txt"
                className="hidden"
              />
              <FileUpIcon size={28} className="text-zinc-500 mb-2" />
              <p className="text-xs text-zinc-300 font-semibold">Drop file or Browse</p>
              <p className="text-[10px] text-zinc-500 mt-1 max-w-[180px]">
                Accepts images of code, script files, or plain text code logs.
              </p>
            </div>

            {/* Camera trigger */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 py-2.5 text-xs font-semibold active:scale-[0.98] transition-all"
            >
              <CameraIcon size={14} className="text-emerald-400" />
              <span>Capture with Camera</span>
            </button>

            {/* Image Preview Container */}
            {image && (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black max-h-[160px] flex items-center justify-center animate-fade-in group">
                <img src={image} alt="Code snippet input" className="object-contain max-h-[160px] w-full" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[10px] text-zinc-400 font-mono">Image attached</span>
                </div>
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 rounded-md bg-black/70 p-1 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/40 transition-colors"
                >
                  <XIcon size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Key status and Analyze triggers */}
          <div className="rounded-2xl glass-panel border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Gemini Interface:</span>
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                <SettingsIcon size={11} /> API Settings
              </button>
            </div>

            <div
              className={`rounded-xl p-3 border text-xs leading-normal flex items-start gap-2 ${
                hasApiKey
                  ? "bg-emerald-950/15 border-emerald-900/30 text-emerald-400"
                  : "bg-amber-950/15 border-amber-900/30 text-amber-500"
              }`}
            >
              <SparklesIcon size={14} className="mt-0.5 shrink-0 animate-pulse" />
              <div>
                <p className="font-semibold">
                  {hasApiKey ? "Gemini Live Mode" : "Local Mock Mode"}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {hasApiKey
                    ? "Direct client-side multimodal AI analysis is active."
                    : "No key found. Falling back to local smart simulator."}
                </p>
              </div>
            </div>

            <button
              onClick={triggerAnalysis}
              disabled={isLoading || (!code.trim() && !image)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold py-3 text-sm shadow-lg shadow-emerald-950/30 hover:shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-30 disabled:scale-100 transition-all glow-emerald"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="font-mono text-xs">ANALYZING_CORE...</span>
                </>
              ) : (
                <>
                  <BugIcon size={16} />
                  <span>Start Diagnostics</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded camera stream capture */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(pic) => setImage(pic)}
      />
    </div>
  );
}
