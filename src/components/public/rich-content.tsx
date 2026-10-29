/* eslint-disable @next/next/no-img-element -- editor media can be an allowed external URL, so it cannot safely use a fixed Next image allow-list. */
import type { ReactNode } from "react";

type Node = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: Node[];
};

const safeUrl = (value: unknown) =>
  typeof value === "string" && /^(https?:|mailto:)/i.test(value) ? value : undefined;

function resolveImageUrl(src: unknown, mediaMap?: Record<string, string>): string | undefined {
  if (typeof src !== "string" || !src.trim()) return undefined;
  const val = src.trim();
  // Safe absolute URLs
  if (/^(https?:|\/|data:image\/)/i.test(val)) return val;
  // Disallow scripts
  if (/^(javascript:|vbscript:)/i.test(val)) return undefined;

  // Resolve relative paths against mediaMap
  if (mediaMap) {
    if (mediaMap[val]) return mediaMap[val];
    const stripped = val.replace(/^(\.\/|\/)/, "");
    if (mediaMap[stripped]) return mediaMap[stripped];
    const baseName = stripped.split("/").pop();
    if (baseName && mediaMap[baseName]) return mediaMap[baseName];
  }

  return val;
}

function textWithMarks(node: Node, key: string): ReactNode {
  let value: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") value = <strong key={`${key}-b`}>{value}</strong>;
    if (mark.type === "italic") value = <em key={`${key}-i`}>{value}</em>;
    if (mark.type === "underline") value = <u key={`${key}-u`}>{value}</u>;
    if (mark.type === "strike") value = <s key={`${key}-s`}>{value}</s>;
    if (mark.type === "code")
      value = (
        <code key={`${key}-c`} className="rounded bg-zinc-100 px-1 py-0.5 text-[.86em]">
          {value}
        </code>
      );
    if (mark.type === "link") {
      const href = safeUrl(mark.attrs?.href);
      value = href ? (
        <a
          key={`${key}-l`}
          href={href}
          rel="noreferrer noopener"
          target={href.startsWith("http") ? "_blank" : undefined}
        >
          {value}
        </a>
      ) : (
        value
      );
    }
  }
  return value;
}

function render(node: Node, key: string, mediaMap?: Record<string, string>): ReactNode {
  const children = node.content?.map((child, index) => render(child, `${key}-${index}`, mediaMap));
  if (node.type === "text") return textWithMarks(node, key);
  if (node.type === "paragraph")
    return (
      <p id={typeof node.attrs?.id === "string" ? node.attrs.id : undefined} key={key}>
        {children}
      </p>
    );
  if (node.type === "heading") {
    const level = Number(node.attrs?.level);
    if (level === 1) return <h1 key={key}>{children}</h1>;
    if (level === 3) return <h3 key={key}>{children}</h3>;
    return <h2 key={key}>{children}</h2>;
  }
  if (node.type === "bulletList") return <ul key={key}>{children}</ul>;
  if (node.type === "orderedList") return <ol key={key}>{children}</ol>;
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "blockquote") return <blockquote key={key}>{children}</blockquote>;
  if (node.type === "codeBlock")
    return (
      <pre key={key}>
        <code>{children}</code>
      </pre>
    );
  if (node.type === "horizontalRule") return <hr key={key} className="my-8 border-zinc-200" />;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "image") {
    const src = resolveImageUrl(node.attrs?.src, mediaMap);
    return src ? (
      <figure key={key}>
        <img
          src={src}
          alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
          loading="lazy"
        />
        {typeof node.attrs?.title === "string" && node.attrs.title && (
          <figcaption>{node.attrs.title}</figcaption>
        )}
      </figure>
    ) : null;
  }
  if (node.type === "doc") return <>{children}</>;
  return children ? <div key={key}>{children}</div> : null;
}

export function RichContent({
  content,
  mediaMap
}: {
  content: unknown;
  mediaMap?: Record<string, string>;
}) {
  if (!content || typeof content !== "object")
    return <p className="text-zinc-500">This story has no readable content yet.</p>;
  return <div className="article-prose">{render(content as Node, "root", mediaMap)}</div>;
}
