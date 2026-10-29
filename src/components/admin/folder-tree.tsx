"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode,
  FilePlus,
  FileUp,
  Folder,
  FolderOpen,
  FolderPlus,
  ImageIcon,
  ImagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload
} from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

export type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { children: number; posts: number; media: number };
};

export type PostTreeItem = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  folderId: string | null;
  updatedAt: string;
};

export type MediaTreeItem = {
  id: string;
  fileName: string;
  publicUrl: string;
  folderId: string | null;
  postId: string | null;
  sizeBytes: number;
  mimeType: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FolderTree({
  currentPostId,
  collapsed = false,
  onToggleCollapse,
  onSelectFolder
}: {
  currentPostId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectFolder?: (folderId: string | null) => void;
}) {
  const router = useRouter();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [posts, setPosts] = useState<PostTreeItem[]>([]);
  const [media, setMedia] = useState<MediaTreeItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [rootExpanded, setRootExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Hidden inputs for uploads
  const imageInputRef = useRef<HTMLInputElement>(null);
  const blgInputRef = useRef<HTMLInputElement>(null);
  const targetFolderIdRef = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/admin/folders");
      const data = await res.json();
      if (res.ok) {
        setFolders(data.folders || []);
        setPosts(data.posts || []);
        setMedia(data.media || []);

        // Auto-expand folder that contains current post
        if (currentPostId && data.posts) {
          const currentPost = (data.posts as PostTreeItem[]).find((p) => p.id === currentPostId);
          if (currentPost?.folderId) {
            setExpandedFolders((prev) => new Set([...prev, currentPost.folderId!]));
            setSelectedFolderId(currentPost.folderId);
          }
        }
      } else {
        setError(data.error || "Could not load files.");
      }
    } catch {
      setError("Network error loading files.");
    } finally {
      setLoading(false);
    }
  }, [currentPostId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const selectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    onSelectFolder?.(folderId);
  };

  // Create new folder
  const createFolder = async (parentId: string | null = selectedFolderId) => {
    const name = window.prompt(parentId ? "Enter subfolder name (e.g. images):" : "Enter new blog folder name:");
    if (!name || !name.trim()) return;

    try {
      const res = await fetch("/api/admin/folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not create folder.");
        return;
      }
      if (parentId) {
        setExpandedFolders((prev) => new Set([...prev, parentId]));
      }
      if (data.folder?.id) {
        setExpandedFolders((prev) => new Set([...prev, data.folder.id]));
        setSelectedFolderId(data.folder.id);
      }
      await loadData();
    } catch {
      alert("Error creating folder.");
    }
  };

  // Rename folder
  const renameFolder = async (folder: FolderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt("Rename folder:", folder.name);
    if (!newName || !newName.trim() || newName.trim() === folder.name) return;

    try {
      const res = await fetch("/api/admin/folders", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: folder.id, name: newName.trim() })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Could not rename folder.");
        return;
      }
      await loadData();
    } catch {
      alert("Error renaming folder.");
    }
  };

  // Delete folder
  const deleteFolder = async (folder: FolderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Permanently delete folder "${folder.name}"? Stories and images inside will be moved to project root.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/folders?id=${folder.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Could not delete folder.");
        return;
      }
      if (selectedFolderId === folder.id) {
        setSelectedFolderId(null);
      }
      await loadData();
    } catch {
      alert("Error deleting folder.");
    }
  };

  // Delete story (.blg)
  const deletePost = async (post: PostTreeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete story "${post.title || "Untitled"}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Could not delete story.");
        return;
      }
      if (currentPostId === post.id) {
        router.push("/admin/workspace/new");
      }
      await loadData();
    } catch {
      alert("Error deleting story.");
    }
  };

  // Delete image
  const deleteMedia = async (image: MediaTreeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete image "${image.fileName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/media?id=${image.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Could not delete image.");
        return;
      }
      await loadData();
    } catch {
      alert("Error deleting image.");
    }
  };

  // Create new .blg story in folder
  const createNewFile = (folderId: string | null = selectedFolderId) => {
    if (folderId) {
      router.push(`/admin/workspace/new?folderId=${folderId}`);
    } else {
      router.push("/admin/workspace/new");
    }
  };

  // Trigger Image Upload for specific folder
  const triggerImageUpload = (folderId: string | null, e?: React.MouseEvent) => {
    e?.stopPropagation();
    targetFolderIdRef.current = folderId;
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  // Handle Image Upload
  const handleImageUploaded = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const folderId = targetFolderIdRef.current;
    setUploadingTarget(folderId || "root");

    const form = new FormData();
    form.set("image", file);
    if (folderId) form.set("folderId", folderId);
    if (currentPostId) form.set("postId", currentPostId);

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = await res.json();
      setUploadingTarget(null);
      if (!res.ok) {
        alert(data.error || "Failed to upload image.");
        return;
      }
      if (folderId) {
        setExpandedFolders((prev) => new Set([...prev, folderId]));
      }
      await loadData();
    } catch {
      setUploadingTarget(null);
      alert("Network error uploading image.");
    }
  };

  // Trigger .blg File Upload from local machine
  const triggerBlgUpload = (folderId: string | null = selectedFolderId, e?: React.MouseEvent) => {
    e?.stopPropagation();
    targetFolderIdRef.current = folderId;
    if (blgInputRef.current) {
      blgInputRef.current.value = "";
      blgInputRef.current.click();
    }
  };

  // Handle .blg File Upload
  const handleBlgUploaded = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const folderId = targetFolderIdRef.current;
    setUploadingTarget(folderId || "root");

    try {
      const text = await file.text();
      let title = file.name.replace(/\.blg$/i, "").replace(/[-_]/g, " ");
      let content: unknown = { type: "doc", content: [{ type: "paragraph" }] };
      let excerpt = "";
      let slug = file.name
        .replace(/\.blg$/i, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-|-$/g, "");

      // Try parsing as JSON first
      try {
        const json = JSON.parse(text);
        if (json.content) content = json.content;
        if (json.title) title = json.title;
        if (json.slug) slug = json.slug;
        if (json.excerpt) excerpt = json.excerpt;
      } catch {
        // Plain text or markdown: build paragraphs
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length > 0) {
          const firstLine = lines[0].replace(/^#+\s*/, "").trim();
          if (firstLine) title = firstLine;
          content = {
            type: "doc",
            content: lines.map((l) => ({
              type: "paragraph",
              content: [{ type: "text", text: l }]
            }))
          };
        }
      }

      if (!slug) slug = `story-${Date.now().toString(36)}`;

      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          status: "DRAFT",
          folderId,
          tagIds: [],
          categoryIds: []
        })
      });

      setUploadingTarget(null);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not import story file.");
        return;
      }

      if (folderId) {
        setExpandedFolders((prev) => new Set([...prev, folderId]));
      }
      await loadData();

      if (data.post?.id) {
        router.push(`/admin/workspace/${data.post.id}`);
      }
    } catch {
      setUploadingTarget(null);
      alert("Error reading .blg file from disk.");
    }
  };

  // Insert image into active editor
  const insertImageIntoEditor = (image: MediaTreeItem, relPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("tekmonk:insert-image", {
        detail: {
          src: image.publicUrl,
          alt: image.fileName,
          title: relPath
        }
      })
    );
  };

  // Copy relative path to clipboard
  const copyRelativePath = (relPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(relPath);
    setCopiedPath(relPath);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Helper getters
  const getSubfolders = (parentId: string | null) =>
    folders.filter((f) => f.parentId === parentId);

  const getFolderPosts = (folderId: string | null) =>
    posts.filter((p) => p.folderId === folderId);

  const getFolderMedia = (folderId: string | null) =>
    media.filter((m) => m.folderId === folderId);

  // When panel is collapsed, render slim vertical icon strip
  if (collapsed) {
    return (
      <aside className="flex flex-col items-center justify-between rounded-xl border border-zinc-200 bg-white py-3 shadow-xs h-[calc(100vh-140px)] sticky top-20 select-none">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
          title="Expand project files panel"
          aria-label="Expand project files panel"
        >
          <PanelLeftOpen size={18} />
        </button>

        <div className="flex flex-col items-center gap-3">
          <FileCode size={18} className="text-zinc-400" />
          <span className="text-[11px] font-semibold text-zinc-400 [writing-mode:vertical-lr] rotate-180 tracking-wider uppercase">
            Project Files
          </span>
        </div>

        <div className="text-[11px] font-mono text-zinc-400">
          {posts.length}
        </div>
      </aside>
    );
  }

  // Recursive folder node renderer
  const renderFolderNode = (folder: FolderItem, level: number = 0, parentPath = "") => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const subfolders = getSubfolders(folder.id);
    const folderPosts = getFolderPosts(folder.id);
    const folderMedia = getFolderMedia(folder.id);
    const totalItems = subfolders.length + folderPosts.length + folderMedia.length;
    const currentPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;

    return (
      <div key={folder.id} className="select-none">
        <div
          onClick={() => {
            selectFolder(folder.id);
            toggleFolder(folder.id);
          }}
          className={`group flex items-center justify-between rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-zinc-100 cursor-pointer ${
            isSelected ? "bg-emerald-50 text-emerald-950 font-medium" : "text-zinc-700"
          }`}
          style={{ paddingLeft: `${4 + level * 12}px` }}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => toggleFolder(folder.id, e)}
              className="p-0.5 text-zinc-400 hover:text-zinc-700"
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {isExpanded ? (
              <FolderOpen size={14} className="shrink-0 text-amber-600" />
            ) : (
              <Folder size={14} className="shrink-0 text-amber-600" />
            )}
            <span className="truncate">{folder.name}</span>
            <span className="text-[10px] text-zinc-400 font-mono">({totalItems})</span>
          </div>

          {/* Action buttons directly in front of the folder */}
          <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
            {/* Upload image directly to this folder */}
            <button
              type="button"
              title="Upload image into this folder"
              onClick={(e) => triggerImageUpload(folder.id, e)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-emerald-700"
            >
              <ImagePlus size={13} />
            </button>
            {/* Upload .blg directly to this folder */}
            <button
              type="button"
              title="Upload .blg file from local machine into this folder"
              onClick={(e) => triggerBlgUpload(folder.id, e)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-emerald-700"
            >
              <FileUp size={13} />
            </button>
            {/* Add subfolder */}
            <button
              type="button"
              title="Add subfolder (e.g. images)"
              onClick={(e) => {
                e.stopPropagation();
                void createFolder(folder.id);
              }}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-amber-700"
            >
              <FolderPlus size={13} />
            </button>
            {/* Rename folder */}
            <button
              type="button"
              title="Rename folder"
              onClick={(e) => renameFolder(folder, e)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
            >
              <Pencil size={12} />
            </button>
            {/* Delete folder */}
            <button
              type="button"
              title="Delete folder"
              onClick={(e) => deleteFolder(folder, e)}
              className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-0.5">
            {uploadingTarget === folder.id && (
              <div
                style={{ paddingLeft: `${20 + level * 12}px` }}
                className="py-1 text-[11px] text-zinc-400 animate-pulse"
              >
                Uploading file…
              </div>
            )}
            {subfolders.map((sub) => renderFolderNode(sub, level + 1, currentPath))}
            {folderPosts.map((post) => renderPostNode(post, level + 1))}
            {folderMedia.map((m) => renderMediaNode(m, level + 1, currentPath))}
          </div>
        )}
      </div>
    );
  };

  // Render Post (.blg file)
  const renderPostNode = (post: PostTreeItem, level: number = 0) => {
    const isCurrent = currentPostId === post.id;
    const isPub = post.status === "PUBLISHED";
    const isSched = post.status === "SCHEDULED";

    return (
      <div
        key={post.id}
        style={{ paddingLeft: `${16 + level * 12}px` }}
        className={`group flex items-center justify-between rounded px-1.5 py-1 text-xs transition-colors hover:bg-zinc-100 ${
          isCurrent
            ? "border-l-2 border-emerald-700 bg-emerald-50 text-emerald-950 font-medium"
            : "text-zinc-600"
        }`}
      >
        <Link
          href={`/admin/workspace/${post.id}`}
          className="flex min-w-0 flex-1 items-center gap-1.5"
        >
          <FileCode size={13} className="shrink-0 text-zinc-400 group-hover:text-emerald-700" />
          <span className="truncate">{post.title || "untitled.blg"}</span>
          <span className="text-[10px] text-zinc-400 font-mono">.blg</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              isPub ? "bg-emerald-500" : isSched ? "bg-blue-500" : "bg-amber-400"
            }`}
            title={`Status: ${post.status}`}
          />
          {/* Delete story button */}
          <button
            type="button"
            title="Delete this story"
            onClick={(e) => deletePost(post, e)}
            className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 opacity-60 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Render Media Asset (Image in blog folder)
  const renderMediaNode = (img: MediaTreeItem, level: number = 0, folderPath = "") => {
    const relPath = folderPath ? `${img.fileName}` : img.fileName;

    return (
      <div
        key={img.id}
        style={{ paddingLeft: `${16 + level * 12}px` }}
        className="group flex items-center justify-between rounded px-1.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {/* Real visual thumbnail preview */}
          <img
            src={img.publicUrl}
            alt={img.fileName}
            className="h-5 w-5 rounded object-cover border border-zinc-200 shrink-0 bg-zinc-100"
          />
          <span className="truncate text-zinc-700">{img.fileName}</span>
          <span className="text-[10px] text-zinc-400 font-mono">({formatBytes(img.sizeBytes)})</span>
        </div>

        <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100">
          {/* Insert image into editor */}
          <button
            type="button"
            title="Insert into active story"
            onClick={(e) => insertImageIntoEditor(img, relPath, e)}
            className="rounded p-1 text-zinc-400 hover:bg-emerald-100 hover:text-emerald-800"
          >
            <Plus size={12} />
          </button>
          {/* Copy relative path */}
          <button
            type="button"
            title="Copy relative path"
            onClick={(e) => copyRelativePath(relPath, e)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
          >
            {copiedPath === relPath ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
          </button>
          {/* Delete image */}
          <button
            type="button"
            title="Delete image"
            onClick={(e) => deleteMedia(img, e)}
            className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  const rootFolders = getSubfolders(null);
  const rootPosts = getFolderPosts(null);
  const rootMedia = getFolderMedia(null);

  return (
    <aside className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden h-[calc(100vh-140px)] sticky top-20 select-none">
      {/* Hidden inputs for uploading files */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUploaded}
      />
      <input
        ref={blgInputRef}
        type="file"
        accept=".blg,.json,.md,.txt"
        className="hidden"
        onChange={handleBlgUploaded}
      />

      {/* Overleaf-style top toolbar: small, icon-only buttons */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/90 px-2 py-1.5">
        <div className="flex items-center gap-1">
          {/* New .blg Story */}
          <button
            type="button"
            onClick={() => createNewFile(selectedFolderId)}
            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 transition-colors cursor-pointer"
            title="New .blg story in selected folder"
            aria-label="New .blg story"
          >
            <FilePlus size={15} className="text-emerald-700" />
          </button>

          {/* New Blog Folder */}
          <button
            type="button"
            onClick={() => createFolder(selectedFolderId)}
            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 transition-colors cursor-pointer"
            title="New blog folder"
            aria-label="New blog folder"
          >
            <FolderPlus size={15} className="text-amber-600" />
          </button>

          {/* Upload .blg file from local machine */}
          <button
            type="button"
            onClick={() => triggerBlgUpload(selectedFolderId)}
            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 transition-colors cursor-pointer"
            title="Upload .blg file from local machine"
            aria-label="Upload .blg file"
          >
            <Upload size={15} className="text-sky-700" />
          </button>

          {/* Upload image to selected folder */}
          <button
            type="button"
            onClick={() => triggerImageUpload(selectedFolderId)}
            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950 transition-colors cursor-pointer"
            title="Upload image into selected folder"
            aria-label="Upload image"
          >
            <ImagePlus size={15} className="text-emerald-600" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh files */}
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors cursor-pointer"
            title="Refresh files"
            aria-label="Refresh files"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Collapse file tree panel */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors cursor-pointer"
            title="Collapse file tree"
            aria-label="Collapse file tree"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
      </div>

      {/* Project Root row with expand/collapse toggle */}
      <div className="p-1.5 border-b border-zinc-100 bg-zinc-50/50">
        <button
          type="button"
          onClick={() => {
            selectFolder(null);
            setRootExpanded(!rootExpanded);
          }}
          className={`flex w-full items-center justify-between rounded px-2 py-1 text-xs transition-colors hover:bg-zinc-100 ${
            selectedFolderId === null ? "bg-zinc-100 font-semibold text-zinc-900" : "text-zinc-600"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span
              onClick={(e) => {
                e.stopPropagation();
                setRootExpanded(!rootExpanded);
              }}
              className="text-zinc-400 hover:text-zinc-700 p-0.5"
            >
              {rootExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <FolderOpen size={14} className="text-zinc-500" />
            <span>Project Root</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {folders.length + posts.length + media.length} items
          </span>
        </button>
      </div>

      {/* Tree items container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {rootExpanded && (
          <>
            {rootFolders.map((f) => renderFolderNode(f, 0))}
            {rootPosts.map((p) => renderPostNode(p, 0))}
            {rootMedia.map((m) => renderMediaNode(m, 0))}

            {folders.length === 0 && posts.length === 0 && media.length === 0 && !loading && (
              <div className="p-4 text-center text-xs text-zinc-400">
                No files or blog folders yet.
                <div className="mt-2 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => createNewFile(null)}
                    className="text-emerald-800 underline font-medium"
                  >
                    Create a new .blg story
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerBlgUpload(null)}
                    className="text-sky-700 underline font-medium"
                  >
                    Upload .blg from local machine
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && <p className="p-2 text-xs text-red-600">{error}</p>}
      </div>

      {/* Footer bar showing active selection */}
      <div className="border-t border-zinc-100 bg-zinc-50/50 px-3 py-1.5 text-[11px] text-zinc-400 truncate flex items-center justify-between">
        <span className="truncate">
          {selectedFolderId
            ? `Active: /${folders.find((f) => f.id === selectedFolderId)?.name || ""}`
            : "Active: Project Root"}
        </span>
        {copiedPath && (
          <span className="text-[10px] text-emerald-600 font-medium shrink-0">
            Copied path!
          </span>
        )}
      </div>
    </aside>
  );
}
