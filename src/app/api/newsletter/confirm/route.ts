import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    redirect("/?subscribed=error");
  }

  try {
    // Decode the base64url token back to an email address.
    const email = Buffer.from(token, "base64url").toString("utf8");

    // Update the subscriber record — only if the email actually exists.
    await getPrisma().newsletterSubscriber.updateMany({
      where: { email: email.toLowerCase() },
      data: { confirmed: true }
    });
  } catch {
    // Invalid token or DB error — still redirect so the user sees a page.
    redirect("/?subscribed=error");
  }

  redirect("/?subscribed=1");
}
