"use client";

import { useEffect, useState } from "react";
import { FolderTree } from "@/components/admin/folder-tree";
import { PostEditorForm } from "@/components/admin/post-editor-form";

type Taxon = { id: string; name: string; slug: string };
type FolderOption = { id: string; name: string };

type InitialPost = {
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

export function WorkspaceLayout({
  currentPostId,
  initial,
  tags,
  categories,
  folders,
  mediaMap = {}
}: {
  currentPostId?: string;
  initial: InitialPost;
  tags: Taxon[];
  categories: Taxon[];
  folders: FolderOption[];
  mediaMap?: Record<string, string>;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tekmonk_workspace_tree_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tekmonk_workspace_tree_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div
      className={`grid gap-6 transition-all duration-200 ${
        collapsed
          ? "xl:grid-cols-[52px_minmax(0,1fr)]"
          : "xl:grid-cols-[285px_minmax(0,1fr)]"
      }`}
    >
      <FolderTree
        currentPostId={currentPostId}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="min-w-0">
        <PostEditorForm
          initial={initial}
          tags={tags}
          categories={categories}
          folders={folders}
          mediaMap={mediaMap}
        />
      </div>
    </div>
  );
}

