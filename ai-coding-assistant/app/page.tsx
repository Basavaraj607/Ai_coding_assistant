"use client";

import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import CodeAnalyzer from "./components/CodeAnalyzer";
import AnalysisResult from "./components/AnalysisResult";
import HistorySidebar from "./components/HistorySidebar";
import SettingsModal from "./components/SettingsModal";
import {
  TerminalIcon,
  HistoryIcon,
  SettingsIcon,
  LogoutIcon,
  UserIcon,
  SparklesIcon,
  BugIcon,
} from "./components/Icons";

interface UserSession {
  name: string;
  email: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  language: string;
  codeSnippet: string;
  errorMessage?: string;
  errorExplanation: string;
  correctedCode: string;
}

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [currentResult, setCurrentResult] = useState<HistoryItem | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Read local storage on mount
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      // 1. Session check
      const sessionStr = localStorage.getItem("coding_assistant_session");
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr) as UserSession;
          setUser(session);
          loadHistory(session.email);
        } catch (e) {
          console.error("Failed to parse user session", e);
        }
      }

      // 2. Api key check
      const savedKey = localStorage.getItem("gemini_api_key") || "";
      setApiKey(savedKey);
    }
  }, []);

  const loadHistory = (email: string) => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem(`history_${email.toLowerCase()}`) || "[]";
      try {
        setHistoryList(JSON.parse(historyStr) as HistoryItem[]);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  };

  const handleLoginSuccess = (sessionUser: UserSession) => {
    setUser(sessionUser);
    loadHistory(sessionUser.email);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("coding_assistant_session");
    }
    setUser(null);
    setHistoryList([]);
    setCurrentResult(null);
  };

  const handleKeySaved = (newKey: string) => {
    setApiKey(newKey);
  };

  const handleDeleteHistoryItem = (id: string) => {
    if (!user) return;
    const updated = historyList.filter((item) => item.id !== id);
    setHistoryList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`history_${user.email.toLowerCase()}`, JSON.stringify(updated));
    }
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
  };

  const handleClearHistory = () => {
    if (!user) return;
    setHistoryList([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`history_${user.email.toLowerCase()}`);
    }
    setCurrentResult(null);
  };

  const triggerAnalysis = async (payload: {
    code: string;
    errorMessage: string;
    language: string;
    image: string | null;
  }) => {
    if (!user) return;
    setIsLoading(true);

    try {
      let analysisOutput: {
        language: string;
        originalCode: string;
        errorExplanation: string;
        correctedCode: string;
      };

      // Call our secure backend API route
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: payload.code,
          errorMessage: payload.errorMessage,
          language: payload.language,
          image: payload.image,
          clientApiKey: apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "API_KEY_MISSING") {
          // Both client key and server environment variable are missing
          alert(
            "Running in Local Mock Mode.\n\nTo get actual AI diagnostics, click the gear icon in the sidebar to configure a Gemini API key, or define GEMINI_API_KEY in your local environment."
          );
          analysisOutput = getSmartMockResponse(payload.code, payload.errorMessage, payload.language);
        } else {
          throw new Error(data.message || "Diagnostics failed.");
        }
      } else {
        analysisOutput = data;
      }

      // Record results in history
      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        language: analysisOutput.language || payload.language,
        codeSnippet: analysisOutput.originalCode || payload.code || "Image Upload Code",
        errorMessage: payload.errorMessage || undefined,
        errorExplanation: analysisOutput.errorExplanation,
        correctedCode: analysisOutput.correctedCode,
      };

      const updatedHistory = [historyItem, ...historyList];
      setHistoryList(updatedHistory);
      setCurrentResult(historyItem);

      if (typeof window !== "undefined") {
        localStorage.setItem(`history_${user.email.toLowerCase()}`, JSON.stringify(updatedHistory));
      }
    } catch (err: any) {
      console.error(err);
      alert(`Diagnostics Error: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic local parsing to generate interesting mock explanations if no key
  const getSmartMockResponse = (codeText: string, errorText: string, lang: string) => {
    const defaultOriginal = codeText || "Captured Image Code";
    
    // Look for common Python issues
    if (lang === "python") {
      if (codeText.includes("print ") && !codeText.includes("print(")) {
        return {
          language: "python",
          originalCode: codeText,
          errorExplanation: `### Syntax Diagnostics
1. **Print Statement syntax**: In Python 3, \`print\` is a function, not a statement. It requires parentheses to envelop the string payload.
2. **Impact**: Running this script throws a \`SyntaxError: Missing parentheses in call to 'print'\`.
          
### Refactoring Steps
- Wrapped \`print\` arguments in parentheses.`,
          correctedCode: codeText.replace(/print\s+(["'][^"']*["'])/g, "print($1)"),
        };
      }
      if (codeText.includes("def ") && !codeText.includes(":")) {
        return {
          language: "python",
          originalCode: codeText,
          errorExplanation: `### Syntax Diagnostics
1. **Missing Colon**: Python function headers \`def name()\` require a trailing colon (\`:\`) to demarcate the start of the execution block.
2. **Impact**: Compiling this throws a \`SyntaxError: expected ':'\`.
          
### Refactoring Steps
- Appended a colon to the function definition header.`,
          correctedCode: codeText.replace(/(def\s+\w+\([^)]*\))/g, "$1:"),
        };
      }
    }

    // Look for common JS/TS issues
    if (lang === "javascript") {
      if (codeText.includes("const ") && codeText.includes(" = ") && codeText.includes("const ") && codeText.match(/const\s+(\w+)\s*=/g)?.length === 2) {
        // Mock redeclaration error
        return {
          language: "javascript",
          originalCode: codeText,
          errorExplanation: `### Scope Diagnostics
1. **Constant Redeclaration**: In JavaScript, variables declared with \`const\` are block-scoped and cannot be redeclared in the same scope block.
2. **Impact**: Results in a \`TypeError: Assignment to constant variable.\` or a redeclaration SyntaxError.
          
### Refactoring Steps
- Converted redeclared variables to \`let\` definitions to support reassignment.`,
          correctedCode: codeText.replace(/const\b/g, "let"),
        };
      }
    }

    // Generic Mock fallback
    return {
      language: lang,
      originalCode: defaultOriginal,
      errorExplanation: `### Diagnostics Report
1. **Detected Syntax Anomaly**: Detected formatting irregularities or compilation barriers in the input segment.
2. **Variable Alignment**: Validated code scopes and loop brackets.
3. **Execution Safety**: Refactored logic to eliminate typical execution crashes.
      
### Refactoring Steps
- Cleaned syntax layout structure.
- Resolved potential exceptions.`,
      correctedCode: codeText ? `${codeText}\n// Refactored logic checks out successfully.` : `// Fixed code snippet outputs`,
    };
  };

  // Protect SSR compilation issues
  if (!isClient) return null;

  // Unauthenticated screen
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-black text-zinc-200 overflow-hidden font-sans select-none">
      {/* Background radial highlight */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-emerald-950/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[45%] h-[45%] rounded-full bg-blue-950/5 blur-[100px]" />
      </div>

      {/* Sidebar - Compact Desktop Navigator */}
      <div className="w-16 h-full bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-6 justify-between shrink-0 z-20">
        <div className="flex flex-col items-center gap-6">
          {/* Brand Icon */}
          <div
            onClick={() => setCurrentResult(null)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-black shadow-lg shadow-emerald-500/10 hover:scale-[1.03] transition-all"
            title="SyntaxSentry Workspace"
          >
            <TerminalIcon size={20} />
          </div>

          <hr className="w-8 border-zinc-900" />

          {/* Action Tabs */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 transition-all"
            title="Analysis history logs"
          >
            <HistoryIcon size={18} />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 transition-all"
            title="Settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Profile & Logout */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 cursor-help"
            title={`Active: ${user.name} (${user.email})`}
          >
            <UserIcon size={16} />
          </div>

          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 hover:bg-rose-950/20 hover:text-rose-400 transition-all"
            title="Sign out"
          >
            <LogoutIcon size={16} />
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">
        {/* Workspace Top Header */}
        <header className="h-14 border-b border-zinc-900 px-8 flex items-center justify-between bg-zinc-950/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
              {currentResult ? "Diagnostics Report" : "Syntax Diagnostic Workspace"}
            </h2>
            {currentResult && (
              <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-500">
                LOG_ID: {currentResult.id}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            {currentResult && (
              <button
                onClick={() => setCurrentResult(null)}
                className="rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 px-3.5 py-1.5 text-zinc-400 hover:text-zinc-200 font-semibold transition-all"
              >
                Back to Workspace
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-full font-mono text-[10px]">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>SERVER: Online</span>
            </div>
          </div>
        </header>

        {/* Content body frame */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="max-w-5xl mx-auto">
            {currentResult ? (
              <AnalysisResult result={currentResult} />
            ) : (
              <div className="space-y-6">
                {/* Visual Intro Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-zinc-950 p-6 shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <BugIcon size={120} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2">
                    <SparklesIcon size={12} /> Realtime Code Guard
                  </div>
                  <h1 className="text-xl font-bold text-zinc-100 max-w-lg leading-tight">
                    Debug, compile, and optimize code files using multimodal Gemini intelligence.
                  </h1>
                  <p className="text-xs text-zinc-500 mt-2 max-w-md leading-relaxed">
                    Paste source scripts directly, drag-and-drop file logs, or trigger the camera feed to capture snapshots of visual displays for immediate error explanations.
                  </p>
                </div>

                {/* Input Panel */}
                <CodeAnalyzer
                  onAnalyze={triggerAnalysis}
                  isLoading={isLoading}
                  hasApiKey={!!apiKey}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Slide-out history sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onSelectItem={(item) => setCurrentResult(item)}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={handleKeySaved}
      />
    </div>
  );
}
