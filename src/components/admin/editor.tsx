"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2
} from "lucide-react";
import { useEffect } from "react";

type Props = {
  value: unknown;
  onChange: (value: unknown) => void;
  onImageRequest: () => void;
};

function ToolbarButton({
  label,
  active,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={active ? "active" : ""}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, onImageRequest }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Start with the idea you cannot stop turning over…" })
    ],
    content: value as never,
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON()),
    editorProps: { attributes: { class: "focus:outline-none" } }
  });

  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value as never);
    }
  }, [editor, value]);

  // Listen for image insertion from the folder tree
  useEffect(() => {
    const handleInsert = (e: Event) => {
      const custom = e as CustomEvent<{ src: string; alt?: string; title?: string }>;
      if (editor && custom.detail?.src) {
        editor
          .chain()
          .focus()
          .setImage({
            src: custom.detail.src,
            alt: custom.detail.alt || "",
            title: custom.detail.title || ""
          })
          .run();
      }
    };
    window.addEventListener("tekmonk:insert-image", handleInsert);
    return () => window.removeEventListener("tekmonk:insert-image", handleInsert);
  }, [editor]);

  const wordCount = editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0;

  if (!editor) return <div className="editor animate-pulse" />;

  const promptLink = () => {
    const href = window.prompt("Paste a safe URL (https, http, or mailto):", editor.getAttributes("link").href || "");
    if (href === null) return;
    if (!/^(https?:|mailto:)/i.test(href)) {
      window.alert("Use a full http(s) or mailto URL.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div>
      <div className="toolbar">
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={16} />
        </ToolbarButton>
        <span className="mx-1 border-l border-zinc-200" />
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={promptLink}>
          <Link2 size={16} />
        </ToolbarButton>
        <span className="mx-1 border-l border-zinc-200" />
        <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={onImageRequest}>
          <ImagePlus size={16} />
        </ToolbarButton>
      </div>
      <div className="editor">
        <EditorContent editor={editor} />
      </div>
      <p className="mt-2 text-right text-xs text-zinc-500">
        {wordCount} words · {Math.max(1, Math.ceil(wordCount / 220))} min read
      </p>
    </div>
  );
}
