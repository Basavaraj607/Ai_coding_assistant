"use client";

import React, { useState } from "react";
import { HistoryIcon, XIcon, TrashIcon, ChevronRightIcon } from "./Icons";

interface HistoryItem {
  id: string;
  timestamp: string;
  language: string;
  codeSnippet: string;
  errorMessage?: string;
  errorExplanation: string;
  correctedCode: string;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export default function HistorySidebar({
  isOpen,
  onClose,
  historyList,
  onSelectItem,
  onDeleteItem,
  onClearAll,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredHistory = historyList.filter(
    (item) =>
      item.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.codeSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.errorMessage && item.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group items by Date
  const getGroupTitle = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const groupedHistory: Record<string, HistoryItem[]> = {};
  filteredHistory.forEach((item) => {
    const title = getGroupTitle(item.timestamp);
    if (!groupedHistory[title]) {
      groupedHistory[title] = [];
    }
    groupedHistory[title].push(item);
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end animate-fade-in bg-black/60 backdrop-blur-xs select-none">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sidebar Panel */}
      <div className="relative z-10 w-[85%] sm:w-full sm:max-w-sm h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-100">Analysis Logs</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-100 transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950/40">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by keyword..."
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar">
          {Object.keys(groupedHistory).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-600 font-mono space-y-2">
              <HistoryIcon size={24} className="text-zinc-800" />
              <p className="text-xs">LOG_DIR: empty</p>
            </div>
          ) : (
            Object.entries(groupedHistory).map(([groupName, items]) => (
              <div key={groupName} className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  {groupName}
                </h3>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-zinc-900/60 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-zinc-800 p-3 flex items-start justify-between cursor-pointer transition-all duration-200"
                      onClick={() => {
                        onSelectItem(item);
                        onClose();
                      }}
                    >
                      <div className="space-y-1 pr-6 overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-semibold font-mono px-1.5 py-0.2 rounded border text-zinc-400 bg-zinc-950 border-zinc-800 uppercase tracking-wider">
                            {item.language}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 truncate max-w-[240px]">
                          {item.codeSnippet.replace(/\s+/g, " ")}
                        </p>
                        {item.errorMessage && (
                          <p className="text-[10px] font-mono text-rose-500/70 truncate max-w-[240px]">
                            {item.errorMessage}
                          </p>
                        )}
                      </div>
                      <ChevronRightIcon
                        size={14}
                        className="text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 mt-2 transition-all"
                      />
                      {/* Delete item button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="absolute right-2 top-2 p-1 rounded bg-zinc-950/80 hover:bg-rose-950/30 border border-zinc-850 hover:border-rose-900/40 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <TrashIcon size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {historyList.length > 0 && (
          <div className="border-t border-zinc-850 p-4 bg-zinc-950">
            <button
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-900/30 bg-rose-950/10 hover:bg-rose-950/20 text-rose-400 py-2 text-xs font-semibold hover:border-rose-900/60 active:scale-[0.98] transition-all"
            >
              <TrashIcon size={12} /> Clear Log History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
