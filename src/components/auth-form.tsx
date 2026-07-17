"use client";

import { useState } from "react";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const payload =
      mode === "login"
        ? { email: email.trim(), password }
        : { email: email.trim(), password, name: name.trim() };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(data.error ?? "Request failed");
        return;
      }

      // Full navigation ensures the new session cookie is sent on the next page load.
      window.location.assign("/dashboard");
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <label className="block text-sm">
          <span className="mb-1 block text-slate-300">Name</span>
          <input
            className="holo-input w-full px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </label>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-slate-300">Email</span>
        <input
          type="email"
          className="holo-input w-full px-3 py-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-300">Password</span>
        <input
          type="password"
          className="holo-input w-full px-3 py-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : 1}
          required
        />
        {mode === "signup" ? (
          <span className="mt-1 block text-xs text-slate-500">At least 8 characters</span>
        ) : null}
      </label>
      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-200" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="holo-btn-primary w-full px-4 py-2 disabled:cursor-not-allowed"
      >
        {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
