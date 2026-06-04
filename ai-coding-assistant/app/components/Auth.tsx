"use client";

import React, { useState } from "react";
import { UserIcon, MailIcon, LockIcon, TerminalIcon, EyeIcon, EyeOffIcon, SparklesIcon } from "./Icons";

interface AuthProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "bg-zinc-800", pct: "w-0" };
    if (password.length < 6) return { label: "Weak", color: "bg-rose-500", pct: "w-1/3" };
    if (password.length < 10) return { label: "Fair", color: "bg-amber-500", pct: "w-2/3" };
    return { label: "Strong", color: "bg-emerald-500", pct: "w-full" };
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password || (mode === "register" && !name)) {
      setMessage({ text: "Please fill out all fields.", type: "error" });
      return;
    }

    if (typeof window === "undefined") return;

    const savedUsersStr = localStorage.getItem("coding_assistant_users") || "[]";
    const users = JSON.parse(savedUsersStr) as Array<{ name: string; email: string; password: string }>;

    if (mode === "register") {
      const userExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        setMessage({ text: "An account with this email already exists.", type: "error" });
        return;
      }

      const newUser = { name, email: email.toLowerCase(), password };
      users.push(newUser);
      localStorage.setItem("coding_assistant_users", JSON.stringify(users));

      setMessage({ text: "Account created successfully! Switching to Login.", type: "success" });
      setTimeout(() => {
        setMode("login");
        setMessage(null);
        setPassword("");
      }, 1500);
    } else {
      const matchedUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!matchedUser) {
        setMessage({ text: "Invalid email or password. Please try again.", type: "error" });
        return;
      }

      // Save user session
      const sessionUser = { name: matchedUser.name, email: matchedUser.email };
      localStorage.setItem("coding_assistant_session", JSON.stringify(sessionUser));
      onLoginSuccess(sessionUser);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setMessage(null);
    setName("");
    setEmail("");
    setPassword("");
  };

  const strength = getPasswordStrength();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-emerald-950/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-blue-950/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-fade-in z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-black shadow-lg shadow-emerald-500/20 mb-3">
            <TerminalIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
            SyntaxSentry
          </h1>
          <p className="text-xs text-zinc-500 mt-1">AI-Powered Debugging & Diagnostics Workspace</p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl glass-panel border border-zinc-800 p-8 shadow-2xl shadow-black/80">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-zinc-100">
              {mode === "login" ? "Sign In" : "Create Account"}
            </h2>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-full font-mono">
              <SparklesIcon size={10} /> v1.0.0
            </span>
          </div>

          {message && (
            <div
              className={`rounded-xl p-3 text-xs mb-5 border ${
                message.type === "error"
                  ? "bg-rose-950/20 border-rose-900/40 text-rose-300"
                  : "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
              } animate-fade-in`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative rounded-lg bg-zinc-900/60 border border-zinc-800/80 focus-within:border-emerald-500 focus-within:bg-zinc-900 transition-all duration-200">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <UserIcon size={15} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative rounded-lg bg-zinc-900/60 border border-zinc-800/80 focus-within:border-emerald-500 focus-within:bg-zinc-900 transition-all duration-200">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <MailIcon size={15} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative rounded-lg bg-zinc-900/60 border border-zinc-800/80 focus-within:border-emerald-500 focus-within:bg-zinc-900 transition-all duration-200">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <LockIcon size={15} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-2.5 pl-10 pr-10 text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>

              {/* Password strength indicator for registration */}
              {mode === "register" && password && (
                <div className="pt-1.5 space-y-1 animate-fade-in">
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-zinc-400">{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.pct} ${strength.color} transition-all duration-300`} />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold py-2.5 text-sm shadow-lg shadow-emerald-950/20 hover:shadow-emerald-500/10 active:scale-[0.99] transition-all mt-6"
            >
              {mode === "login" ? "Sign In" : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-zinc-900 pt-5">
            <button
              onClick={toggleMode}
              className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-medium"
            >
              {mode === "login" ? (
                <>
                  Don't have an account? <span className="underline">Create Account</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="underline">Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
