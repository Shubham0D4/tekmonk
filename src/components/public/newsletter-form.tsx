"use client";

import { FormEvent, useState } from "react";

/** Compact newsletter sign-up widget — suitable for footer or sidebar embeds. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>();
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setStatus(undefined);
    setIsError(false);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsError(true);
        setStatus(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: unknown }).error)
            : "Something went wrong. Please try again."
        );
      } else {
        setDone(true);
        setStatus("Thanks! Check your inbox to confirm your subscription.");
      }
    } catch {
      setIsError(true);
      setStatus("Could not reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-6 border-t border-zinc-200 pt-6">
      <p className="eyebrow mb-2">Stay in the loop</p>

      {done ? (
        <p role="status" className="text-sm text-zinc-600">
          {status}
        </p>
      ) : (
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={submit}
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            className="input flex-1 text-sm"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <button className="button whitespace-nowrap" disabled={pending}>
            {pending ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}

      {isError && status && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {status}
        </p>
      )}
    </div>
  );
}
