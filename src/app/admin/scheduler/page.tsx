import { getPrisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth-guards";
import { SchedulerRunButton } from "./scheduler-run-button";

export const dynamic = "force-dynamic";

/**
 * /admin/scheduler
 *
 * Shows SCHEDULED posts that are pending publication and provides a manual
 * "Run publisher now" button that calls GET /api/admin/publish-scheduled.
 */
export default async function AdminSchedulerPage() {
  const admin = await requireAdminPage();
  const prisma = getPrisma();

  // Fetch all currently-scheduled posts for this admin
  const scheduled = await prisma.post.findMany({
    where: { authorId: admin.id, status: "SCHEDULED" },
    orderBy: { scheduledFor: "asc" },
    select: { id: true, title: true, scheduledFor: true, status: true },
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Publishing automation</p>
          <h1 className="serif mt-2 text-4xl font-bold">Scheduler</h1>
        </div>
        {/* Client button handles the fetch + result display */}
        <SchedulerRunButton />
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="serif text-xl font-bold">
            Pending posts{" "}
            <span className="ml-1 text-base font-normal text-zinc-500">
              ({scheduled.length})
            </span>
          </h2>
        </div>

        {scheduled.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Scheduled for</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {scheduled.map((post) => {
                const overdue =
                  post.scheduledFor && post.scheduledFor <= new Date();
                return (
                  <tr
                    key={post.id}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">{post.title}</td>
                    <td className="px-5 py-4 text-zinc-600">
                      {post.scheduledFor
                        ? post.scheduledFor.toLocaleString()
                        : "—"}
                      {overdue && (
                        <span className="ml-2 text-xs font-semibold text-amber-600">
                          overdue
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="tag">{post.status.toLowerCase()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="p-7 text-sm text-zinc-500">
            No posts are currently scheduled.
          </p>
        )}
      </div>
    </>
  );
}
