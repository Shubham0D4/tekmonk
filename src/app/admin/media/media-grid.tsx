"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Trash2 } from "lucide-react";

type Asset = {
  id: string;
  publicUrl: string;
  fileName: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  alt: string | null;
};

type Props = {
  assets: Asset[];
  total: number;
  page: number;
  totalPages: number;
};

/**
 * Client component that handles:
 * - Upload image (POST /api/admin/media)
 * - Delete image (DELETE /api/admin/media?id=…)
 * - Pagination links
 */
export function MediaGrid({ assets: initial, total, page, totalPages }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  /** Upload the selected file to POST /api/admin/media */
  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.set("image", file);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = (await res.json()) as {
        media?: Asset & { sizeBytes: number };
        error?: string;
      };
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      if (data.media) {
        const m = data.media;
        const sizeFormatted =
          m.sizeBytes >= 1_048_576
            ? `${(m.sizeBytes / 1_048_576).toFixed(1)} MB`
            : `${Math.round(m.sizeBytes / 1024)} KB`;
        setAssets((prev) => [{ ...m, sizeFormatted, createdAt: new Date().toLocaleDateString() }, ...prev]);
      }
    } catch {
      setUploadError("Network error.");
    } finally {
      setUploading(false);
    }
  }

  /** Delete an asset via DELETE /api/admin/media?id=… then remove from local state */
  async function handleDelete(id: string, fileName: string) {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  return (
    <div className="mt-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {total} asset{total !== 1 ? "s" : ""} total
        </p>
        <label className="button secondary cursor-pointer">
          <ImagePlus size={16} />
          {uploading ? "Uploading…" : "Upload image"}
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              // Reset so the same file can be re-selected
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {uploadError && (
        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
      )}

      {/* Grid */}
      {assets.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
            >
              {/* Image thumbnail */}
              <div className="relative aspect-square bg-zinc-100">
                <Image
                  src={asset.publicUrl}
                  alt={asset.alt ?? asset.fileName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              </div>

              {/* Metadata + delete */}
              <div className="p-2">
                <p
                  className="truncate text-xs font-medium text-zinc-800"
                  title={asset.fileName}
                >
                  {asset.fileName}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {asset.sizeFormatted} · {asset.createdAt}
                </p>
                <button
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                  disabled={isPending}
                  onClick={() => void handleDelete(asset.id, asset.fileName)}
                  type="button"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-zinc-500">
          No media assets yet. Upload your first image above.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="button secondary"
            >
              ← Previous
            </Link>
          )}
          <span className="flex items-center px-3 text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}`}
              className="button secondary"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
