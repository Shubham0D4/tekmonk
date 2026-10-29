"use client";

import { Bookmark, Heart } from "lucide-react";
import { useEffect, useState } from "react";

async function mutate(url: string) {
  const response = await fetch(url, { method: "POST" });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data === "object" && data && "error" in data ? String(data.error) : "Please sign in to interact.");
  return data as { liked?: boolean; bookmarked?: boolean; count?: number };
}

export function ArticleActions({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes); const [liked, setLiked] = useState(false); const [bookmarked, setBookmarked] = useState(false); const [message, setMessage] = useState<string>();
  // Fire a silent read-time beacon once, 30 seconds after the component mounts.
  // Cleans up automatically on unmount so the fetch never fires on navigation away.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch(`/api/posts/${postId}/read`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ durationSeconds: 30 })
      });
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [postId]);
  return <div className="sticky top-20 flex items-center justify-between border-y border-zinc-200 py-3 text-sm">
    <div className="flex items-center gap-1"><button className="button ghost" aria-pressed={liked} onClick={async () => { try { const result = await mutate(`/api/posts/${postId}/like`); setLiked(Boolean(result.liked)); setLikes(result.count ?? likes); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your reaction."); } }}><Heart size={19} fill={liked ? "currentColor" : "none"}/>{likes}</button>
      <button className="button ghost" aria-pressed={bookmarked} onClick={async () => { try { const result = await mutate(`/api/posts/${postId}/bookmark`); setBookmarked(Boolean(result.bookmarked)); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your bookmark."); } }}><Bookmark size={18} fill={bookmarked ? "currentColor" : "none"}/>{bookmarked ? "Saved" : "Save"}</button></div>
    {message && <span role="status" className="text-xs text-zinc-500">{message}</span>}
  </div>;
}
