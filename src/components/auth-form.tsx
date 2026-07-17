"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
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
      mode === "login" ? { email, password } : { email, password, name };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Request failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          minLength={8}
          required
        />
      </label>
      {error && <p className="text-sm text-rose-400">{error}</p>}
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
