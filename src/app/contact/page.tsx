"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<string>();
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    setPending(true);
    const form = new FormData(formElement);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form))
      });
      const data = await res.json().catch(() => ({}));
      setPending(false);

      if (!res.ok) {
        setStatus(data.error || "Could not send your note.");
        return;
      }

      formElement.reset();
      setStatus("Your message has been sent. Thank you.");
    } catch {
      setPending(false);
      setStatus("Network error sending your note.");
    }
  };

  return (
    <main className="shell grid gap-12 py-14 md:grid-cols-[.8fr_1.2fr]">
      <div>
        <p className="eyebrow">Say hello</p>
        <h1 className="serif mt-3 text-5xl font-bold">A good note is always welcome.</h1>
        <p className="mt-5 max-w-sm leading-7 text-zinc-600">
          Questions, corrections, collaborations, and considered disagreement all have a place here.
        </p>
      </div>

      <form className="space-y-4 rounded-xl border border-zinc-200 p-6" onSubmit={submit}>
        <label className="block text-sm font-medium">
          Name
          <input className="input mt-1" name="name" minLength={2} required />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input className="input mt-1" name="email" type="email" required />
        </label>
        <label className="block text-sm font-medium">
          Subject <span className="font-normal text-zinc-400">(optional)</span>
          <input className="input mt-1" name="subject" />
        </label>
        <label className="block text-sm font-medium">
          Message
          <textarea className="input mt-1 min-h-36" name="message" minLength={20} required />
        </label>
        <input className="hidden" aria-hidden="true" tabIndex={-1} name="website" autoComplete="off" />
        <button className="button" disabled={pending}>
          {pending ? "Sending…" : "Send note"}
        </button>
        {status && (
          <p role="status" className="text-sm text-zinc-600">
            {status}
          </p>
        )}
      </form>
    </main>
  );
}
