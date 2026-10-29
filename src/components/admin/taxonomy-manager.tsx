"use client";

import { FormEvent, useState } from "react";

type Item = { id: string; name: string; slug: string; description?: string | null };

export function TaxonomyManager({
  initialTags,
  initialCategories
}: {
  initialTags: Item[];
  initialCategories: Item[];
}) {
  const [tags, setTags] = useState(initialTags);
  const [categories, setCategories] = useState(initialCategories);
  const [status, setStatus] = useState<string>();

  const submit = async (e: FormEvent<HTMLFormElement>, type: "tag" | "category") => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const slug = String(
      form.get("slug") ||
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
    );

    try {
      const r = await fetch("/api/admin/taxonomy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, name, slug, description: form.get("description") || undefined })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus(d.error || "Could not add taxonomy.");
        return;
      }
      if (type === "tag") setTags((x) => [...x, d.record]);
      else setCategories((x) => [...x, d.record]);

      formElement.reset();
      setStatus(`${type === "tag" ? "Tag" : "Category"} added.`);
    } catch {
      setStatus("Network error adding taxonomy.");
    }
  };

  const panel = (type: "tag" | "category", items: Item[]) => (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="serif text-2xl font-bold">{type === "tag" ? "Tags" : "Categories"}</h2>
      <p className="mt-1 text-sm text-zinc-500">
        {type === "tag"
          ? "Fine-grained ideas used to guide recommendations."
          : "Broad sections that organize the publication."}
      </p>
      <form className="mt-5 grid gap-3" onSubmit={(e) => void submit(e, type)}>
        <input
          className="input"
          name="name"
          placeholder={type === "tag" ? "e.g. Systems thinking" : "e.g. Essays"}
          required
        />
        <input className="input" name="slug" placeholder="optional-url-slug" />
        {type === "category" && (
          <input className="input" name="description" placeholder="Optional description" />
        )}
        <button className="button w-fit">Add {type}</button>
      </form>
      <div className="mt-6 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span className="tag" key={item.id}>
              {item.name}
              <small className="ml-1 opacity-60">/{item.slug}</small>
            </span>
          ))
        ) : (
          <span className="text-sm text-zinc-500">No {type}s yet.</span>
        )}
      </div>
    </section>
  );

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        {panel("tag", tags)}
        {panel("category", categories)}
      </div>
      {status && (
        <p role="status" className="mt-4 text-sm text-zinc-600">
          {status}
        </p>
      )}
    </>
  );
}
