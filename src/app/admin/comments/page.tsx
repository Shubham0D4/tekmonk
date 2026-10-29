import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";
import { CommentModerationTable } from "./comment-moderation-table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

/**
 * /admin/comments
 *
 * Shows all comments across every post with moderation actions (pin/unpin,
 * delete). The interactive buttons live in the `CommentModerationTable` client
 * component; the server component fetches and paginates the data.
 */
export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  // Auth — any admin can moderate any comment
  await requireAdminPage();
  const { page: pageParam, filter } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const pinned = filter === "pinned";

  const prisma = getPrisma();
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: pinned ? { isPinned: true } : {},
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        body: true,
        isPinned: true,
        createdAt: true,
        author: { select: { name: true } },
        post: { select: { title: true, slug: true } },
      },
    }),
    prisma.comment.count({ where: pinned ? { isPinned: true } : {} }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Serialise dates for the client component
  const rows = comments.map((c) => ({
    id: c.id,
    body: c.body,
    isPinned: c.isPinned,
    createdAt: c.createdAt.toLocaleDateString(),
    authorName: c.author.name,
    postTitle: c.post.title,
    postSlug: c.post.slug,
  }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Moderation</p>
          <h1 className="serif mt-2 text-4xl font-bold">Comments</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2 border-b border-zinc-200">
        {(
          [
            { label: "All", value: undefined },
            { label: "Pinned", value: "pinned" },
          ] as const
        ).map(({ label, value }) => {
          const active = (filter ?? undefined) === value;
          return (
            <Link
              key={label}
              href={value ? `?filter=${value}` : "?"}
              className={`border-b-2 px-3 pb-2 text-sm font-medium transition-colors ${
                active
                  ? "border-emerald-700 text-emerald-800"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <CommentModerationTable
        rows={rows}
        total={total}
        page={page}
        totalPages={totalPages}
        filter={filter}
      />
    </>
  );
}
