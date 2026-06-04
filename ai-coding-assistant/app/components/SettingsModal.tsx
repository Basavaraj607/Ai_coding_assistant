"use client";

import React, { useState, useEffect } from "react";
import { SettingsIcon, XIcon, KeyIcon, EyeIcon, EyeOffIcon, CheckIcon } from "./Icons";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export default function SettingsModal({ isOpen, onClose, onKeySaved }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("gemini_api_key") || "";
      setApiKey(savedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gemini_api_key", apiKey.trim());
      onKeySaved(apiKey.trim());
      setTestStatus("success");
      setTestMessage("API Key saved to localStorage.");
      setTimeout(() => {
        setTestStatus("idle");
        onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gemini_api_key");
      setApiKey("");
      onKeySaved("");
      setTestStatus("success");
      setTestMessage("API Key cleared.");
      setTimeout(() => {
        setTestStatus("idle");
      }, 1500);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestStatus("error");
      setTestMessage("Please enter a key to test.");
      return;
    }

    setTestStatus("testing");
    setTestMessage("Testing API key validity...");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey.trim(),
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Write a 3 word confirmation message.",
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        setTestStatus("success");
        setTestMessage("Success! Key is active and working.");
      } else {
        throw new Error(data?.error?.message || "Invalid response from API");
      }
    } catch (error: any) {
      setTestStatus("error");
      setTestMessage(error.message || "Failed to connect. Check your API key.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl glass-panel border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-emerald-400 animate-spin-slow" />
            <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Gemini API Key
            </label>
            <div className="relative rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden focus-within:border-emerald-500 transition-colors">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <KeyIcon size={16} />
              </span>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-transparent py-2.5 pl-10 pr-10 text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Your API Key is stored only in your browser's local storage and is sent directly to Google's API servers.
            </p>
          </div>

          {/* Setup Help */}
          <div className="rounded-lg bg-zinc-950/50 border border-zinc-900 p-3 text-xs text-zinc-400 leading-relaxed">
            <span className="font-semibold text-emerald-400">Need a key? </span>
            You can generate a free Gemini API key in seconds at{" "}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline hover:text-emerald-300 transition-colors"
            >
              Google AI Studio
            </a>
            . Paste it above to enable live multimodal code analysis.
          </div>

          {/* Test Status Banner */}
          {testStatus !== "idle" && (
            <div
              className={`rounded-lg p-3 text-xs border ${
                testStatus === "testing"
                  ? "bg-amber-950/20 border-amber-900/40 text-amber-300"
                  : testStatus === "success"
                  ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                  : "bg-rose-950/20 border-rose-900/40 text-rose-300"
              }`}
            >
              <div className="flex items-start gap-2">
                {testStatus === "success" && <CheckIcon size={14} className="mt-0.5 shrink-0" />}
                <p className="leading-snug">{testMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-zinc-900/50 px-6 py-4 border-t border-zinc-800">
          <button
            onClick={handleClear}
            disabled={!apiKey}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 disabled:opacity-30 transition-colors"
          >
            Clear Key
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestKey}
              disabled={testStatus === "testing" || !apiKey}
              className="rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-30 transition-colors"
            >
              {testStatus === "testing" ? "Testing..." : "Test Key"}
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
