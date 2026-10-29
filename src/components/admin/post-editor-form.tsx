"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ImagePlus, Save, Send, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/editor";
import { RichContent } from "@/components/public/rich-content";

type Taxon = { id: string; name: string; slug: string };
type FolderOption = { id: string; name: string };

type Initial = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  seoTitle: string;
  seoDescription: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledFor?: string;
  folderId?: string | null;
  featuredImageId?: string | null;
  tagIds: string[];
  categoryIds: string[];
};

const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };

export function PostEditorForm({
  initial,
  tags,
  categories,
  folders = [],
  mediaMap = {}
}: {
  initial: Initial;
  tags: Taxon[];
  categories: Taxon[];
  folders?: FolderOption[];
  mediaMap?: Record<string, string>;
}) {
  const [data, setData] = useState<Initial>(initial);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState("Saved");
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  const valid = useMemo(() => Boolean(data.title.trim() && data.slug.trim()), [data.title, data.slug]);

  async function save(publish: boolean) {
    if (!valid) {
      setState("Add a title and URL slug before saving.");
      return;
    }
    setSaving(true);
    setState("Saving…");

    const targetStatus = publish ? "PUBLISHED" : data.status;
    const payload = {
      ...data,
      status: targetStatus,
      scheduledFor: data.scheduledFor || null
    };

    try {
      const response = await fetch(data.id ? `/api/admin/posts/${data.id}` : "/api/admin/posts", {
        method: data.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      setSaving(false);

      if (!response.ok) {
        setState(result.error || "Save failed. Your edits are still here.");
        return;
      }

      const id = (result.post as { id?: string } | undefined)?.id;
      setData((current) => ({
        ...current,
        id: id || current.id,
        status: targetStatus
      }));

      if (id && !data.id) {
        window.history.replaceState({}, "", `/admin/workspace/${id}`);
      }

      setState(publish ? "Published" : "Saved just now");
    } catch {
      setSaving(false);
      setState("Network error saving story.");
    }
  }

  async function deleteStory() {
    if (!data.id) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${data.title || "Untitled story"}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setSaving(true);
    setState("Deleting story…");

    try {
      const response = await fetch(`/api/admin/posts/${data.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setState(result.error || "Could not delete story.");
        setSaving(false);
        return;
      }
      window.location.href = "/admin/workspace/new";
    } catch {
      setSaving(false);
      setState("Network error deleting story.");
    }
  }

  // Debounced auto-save for unsaved drafts
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (state === "Unsaved" && valid) void save(false);
    }, 1500);
    return () => window.clearTimeout(timer);
  });

  const update = <K extends keyof Initial>(key: K, value: Initial[K]) => {
    setData((current) => ({ ...current, [key]: value }));
    setState("Unsaved");
  };

  const select = (key: "tagIds" | "categoryIds", id: string) => {
    update(
      key,
      data[key].includes(id) ? data[key].filter((item) => item !== id) : [...data[key], id]
    );
  };

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (!image) return;
    setUploading(true);
    const form = new FormData();
    form.set("image", image);
    if (data.folderId) form.set("folderId", data.folderId);
    if (data.id) form.set("postId", data.id);

    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      setUploading(false);

      if (!response.ok) {
        setState(result.error || "Image upload failed.");
        return;
      }

      const url = (result.media as { publicUrl?: string; id?: string } | undefined)?.publicUrl;
      if (!url) return;

      const content =
        data.content && typeof data.content === "object"
          ? (structuredClone(data.content) as { type: string; content?: unknown[] })
          : emptyDoc;

      const list = Array.isArray(content.content) ? content.content : [];
      content.content = [...list, { type: "image", attrs: { src: url, alt: image.name, title: image.name } }];

      update("content", content);
      update("featuredImageId", (result.media as { id: string }).id);
      setState("Image inserted. Save to persist.");
    } catch {
      setUploading(false);
      setState("Image upload failed.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-500">{state}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="button secondary"
              type="button"
              onClick={() => setPreview(!preview)}
            >
              {preview ? (
                <>
                  <EyeOff size={16} /> Edit
                </>
              ) : (
                <>
                  <Eye size={16} /> Preview
                </>
              )}
            </button>

            {data.id && (
              <button
                className="button secondary text-red-600 hover:bg-red-50 hover:border-red-300"
                type="button"
                disabled={saving}
                onClick={deleteStory}
                title="Permanently delete story"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}

            <button
              className="button secondary"
              type="button"
              disabled={saving}
              onClick={() => void save(false)}
            >
              <Save size={16} /> Save
            </button>
            <button
              className="button"
              type="button"
              disabled={saving}
              onClick={() => void save(true)}
            >
              <Send size={16} /> Publish
            </button>
          </div>
        </div>

        <input
          aria-label="Story title"
          className="serif w-full border-0 bg-transparent text-4xl font-bold outline-none placeholder:text-zinc-300 sm:text-5xl"
          value={data.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Untitled story"
        />

        {preview ? (
          /* Rendered Overleaf-style article preview with RichContent & mediaMap */
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 sm:p-10 shadow-sm">
            <div className="mx-auto max-w-2xl">
              <div className="flex flex-wrap gap-2">
                {data.tagIds.map((id) => {
                  const tag = tags.find((t) => t.id === id);
                  return tag ? (
                    <span key={id} className="tag">
                      {tag.name}
                    </span>
                  ) : null;
                })}
              </div>

              <h1 className="serif mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                {data.title || "Untitled story"}
              </h1>

              {data.excerpt && (
                <p className="mt-4 text-xl leading-8 text-zinc-600">{data.excerpt}</p>
              )}

              <div className="mt-6 flex items-center gap-3 border-b border-zinc-200 pb-4 text-xs text-zinc-400">
                <span>
                  Status: <strong className="text-zinc-700">{data.status}</strong>
                </span>
                {data.scheduledFor && <span>Scheduled: {data.scheduledFor}</span>}
              </div>

              <div className="mt-8">
                <RichContent content={data.content} mediaMap={mediaMap} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <RichTextEditor
              value={data.content || emptyDoc}
              onChange={(value) => update("content", value)}
              onImageRequest={() => document.getElementById("editor-image")?.click()}
            />
            <input
              id="editor-image"
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={upload}
            />
            {uploading && <p className="mt-2 text-sm text-zinc-500">Uploading image…</p>}
          </div>
        )}
      </section>

      <aside className="space-y-5">
        {/* Publishing Controls */}
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs">
          <h2 className="font-semibold text-zinc-900">Publishing</h2>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Status
            <select
              className="input mt-1"
              value={data.status}
              onChange={(e) => update("status", e.target.value as Initial["status"])}
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          {data.status === "SCHEDULED" && (
            <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-zinc-500">
              Publication date
              <input
                className="input mt-1"
                type="datetime-local"
                value={data.scheduledFor || ""}
                onChange={(e) => update("scheduledFor", e.target.value)}
              />
            </label>
          )}
        </section>

        {/* Story Details & Folder Organization */}
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs">
          <h2 className="font-semibold text-zinc-900">Story Organization</h2>

          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Blog Folder
            <select
              className="input mt-1"
              value={data.folderId || ""}
              onChange={(e) => update("folderId", e.target.value || null)}
            >
              <option value="">Project Root (No folder)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  📁 {folder.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            URL slug
            <input
              className="input mt-1"
              value={data.slug}
              onChange={(e) =>
                update(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-|-$/g, "")
                )
              }
            />
          </label>

          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Summary / Excerpt
            <textarea
              className="input mt-1 min-h-20"
              value={data.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              maxLength={360}
            />
          </label>

          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            SEO title
            <input
              className="input mt-1"
              value={data.seoTitle}
              onChange={(e) => update("seoTitle", e.target.value)}
              maxLength={70}
            />
          </label>

          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-zinc-500">
            Meta description
            <textarea
              className="input mt-1 min-h-18"
              value={data.seoDescription}
              onChange={(e) => update("seoDescription", e.target.value)}
              maxLength={160}
            />
          </label>
        </section>

        {/* Taxonomy */}
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs">
          <h2 className="font-semibold text-zinc-900">Taxonomy</h2>
          <p className="mt-1 text-xs text-zinc-500">Use tags for themes and categories for sections.</p>

          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-zinc-400">Tags</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                type="button"
                className={`tag cursor-pointer ${
                  data.tagIds.includes(tag.id) ? "ring-2 ring-emerald-600 bg-emerald-50 text-emerald-900" : "opacity-65"
                }`}
                key={tag.id}
                onClick={() => select("tagIds", tag.id)}
              >
                {data.tagIds.includes(tag.id) && "✓ "}
                {tag.name}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-zinc-400">Categories</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                type="button"
                className={`tag cursor-pointer ${
                  data.categoryIds.includes(category.id) ? "ring-2 ring-emerald-600 bg-emerald-50 text-emerald-900" : "opacity-65"
                }`}
                key={category.id}
                onClick={() => select("categoryIds", category.id)}
              >
                {data.categoryIds.includes(category.id) && "✓ "}
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <label className="button secondary w-full cursor-pointer">
          <ImagePlus size={16} />
          {uploading ? "Uploading…" : "Upload & insert image"}
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={upload}
          />
        </label>
      </aside>
    </div>
  );
}
