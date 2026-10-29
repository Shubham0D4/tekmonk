"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pin, PinOff, Trash2 } from "lucide-react";

type Row = {
  id: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  authorName: string;
  postTitle: string;
  postSlug: string;
};

type Props = {
  rows: Row[];
  total: number;
  page: number;
  totalPages: number;
  filter?: string;
};

/**
 * Client component that renders the comment table with interactive
 * pin/unpin (PATCH) and delete (DELETE) actions.
 */
export function CommentModerationTable({
  rows: initial,
  total,
  page,
  totalPages,
  filter,
}: Props) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [isPending, startTransition] = useTransition();

  /** Toggle the pinned state of a comment */
  function handlePin(id: string, currentlyPinned: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPinned: !currentlyPinned }),
      });
      if (res.ok) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isPinned: !currentlyPinned } : r
          )
        );
      }
    });
  }

  /** Delete a comment after confirmation */
  function handleDelete(id: string) {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="mt-8 text-sm text-zinc-500">
        {filter === "pinned"
          ? "No pinned comments yet."
          : "No comments to moderate."}
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Post</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Comment</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-center">Pinned</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-100 last:border-0"
              >
                {/* Post link */}
                <td className="px-4 py-3">
                  <Link
                    href={`/blog/${row.postSlug}`}
                    className="font-medium hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {row.postTitle.length > 40
                      ? `${row.postTitle.slice(0, 40)}…`
                      : row.postTitle}
                  </Link>
                </td>

                {/* Author */}
                <td className="px-4 py-3 text-zinc-600">{row.authorName}</td>

                {/* Body (truncated to 100 chars) */}
                <td className="px-4 py-3 text-zinc-700">
                  {row.body.length > 100
                    ? `${row.body.slice(0, 100)}…`
                    : row.body}
                </td>

                {/* Date */}
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                  {row.createdAt}
                </td>

                {/* Pinned indicator */}
                <td className="px-4 py-3 text-center">
                  {row.isPinned ? (
                    <span className="text-emerald-700">✓</span>
                  ) : (
                    <span className="text-zinc-300">–</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title={row.isPinned ? "Unpin" : "Pin"}
                      disabled={isPending}
                      onClick={() => handlePin(row.id, row.isPinned)}
                      className="flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                    >
                      {row.isPinned ? (
                        <>
                          <PinOff size={12} /> Unpin
                        </>
                      ) : (
                        <>
                          <Pin size={12} /> Pin
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      title="Delete comment"
                      disabled={isPending}
                      onClick={() => handleDelete(row.id)}
                      className="flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}${filter ? `&filter=${filter}` : ""}`}
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
              href={`?page=${page + 1}${filter ? `&filter=${filter}` : ""}`}
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
