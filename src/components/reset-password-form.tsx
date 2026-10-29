"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  // better-auth appends ?token=... and optionally ?callbackURL=... to the reset link
  const token = params.get("token") ?? "";
  const callbackURL = params.get("callbackURL") ?? "/sign-in";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string>();
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(undefined);
    setIsError(false);

    if (newPassword !== confirm) {
      setIsError(true);
      setStatus("Passwords do not match.");
      return;
    }

    setPending(true);

    const result = await authClient.resetPassword({ token, newPassword });

    setPending(false);

    if (result.error) {
      setIsError(true);
      setStatus(result.error.message);
      return;
    }

    setStatus("Password updated! Redirecting to sign in…");
    setTimeout(() => router.push(callbackURL), 1500);
  };

  return (
    <main className="shell flex min-h-[70vh] items-center justify-center py-12">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 p-7 shadow-sm">
        <p className="eyebrow">TekMonk account</p>
        <h1 className="serif mt-2 text-4xl font-bold">Reset password</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Choose a new password for your account.
        </p>

        {!token && (
          <p className="mt-4 text-sm text-red-600">
            Invalid or missing reset token. Please request a new{" "}
            <Link className="text-emerald-800 underline" href="/forgot-password">
              password reset
            </Link>
            .
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium">
            New password
            <input
              className="input mt-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={!token}
            />
          </label>

          <label className="block text-sm font-medium">
            Confirm new password
            <input
              className="input mt-1"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={!token}
            />
          </label>

          <button className="button w-full" disabled={pending || !token}>
            {pending ? "Saving…" : "Set new password"}
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
