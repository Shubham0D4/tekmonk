import Image from "next/image";
import { requireAdminPage } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";
import { MediaGrid } from "./media-grid";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

/** Format bytes into a human-readable KB / MB string. */
function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * /admin/media
 *
 * Shows all media assets owned by the current admin with pagination (24/page).
 * The interactive delete and upload actions are handled by the client component
 * `MediaGrid`.
 */
export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const admin = await requireAdminPage();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const prisma = getPrisma();
  const [media, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: { ownerId: admin.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        publicUrl: true,
        fileName: true,
        sizeBytes: true,
        createdAt: true,
        alt: true,
      },
    }),
    prisma.mediaAsset.count({ where: { ownerId: admin.id } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Shape the data for the client component (serialise dates to strings)
  const assets = media.map((m) => ({
    ...m,
    sizeFormatted: formatSize(m.sizeBytes),
    createdAt: m.createdAt.toLocaleDateString(),
  }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Asset management</p>
          <h1 className="serif mt-2 text-4xl font-bold">Media Library</h1>
        </div>
      </div>

      {/* Client component owns the upload button and delete actions */}
      <MediaGrid
        assets={assets}
        total={total}
        page={page}
        totalPages={totalPages}
      />
    </>
  );
}
