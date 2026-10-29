"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>();
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setStatus(undefined);
    setIsError(false);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password"
    });

    setPending(false);

    if (result.error) {
      setIsError(true);
      setStatus(result.error.message);
      return;
    }

    // Always show the generic message — don't leak whether the email exists.
    setStatus("If that address is registered, a reset link is on its way.");
  };

  return (
    <main className="shell flex min-h-[70vh] items-center justify-center py-12">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 p-7 shadow-sm">
        <p className="eyebrow">TekMonk account</p>
        <h1 className="serif mt-2 text-4xl font-bold">Forgot password?</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium">
            Email
            <input
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
            />
          </label>

          <button className="button w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>

        {status && (
          <p
            role="status"
            className={`mt-4 text-sm ${isError ? "text-red-600" : "text-zinc-600"}`}
          >
            {status}
          </p>
        )}

        <p className="mt-5 text-center text-sm text-zinc-500">
          <Link className="text-emerald-800 underline" href="/sign-in">
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
