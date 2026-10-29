import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";

export class AuthenticationError extends Error {
  constructor(message = "Please sign in to continue.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class ConfigurationError extends Error {
  constructor(message = "Authentication is not configured. Add DATABASE_URL and BETTER_AUTH_SECRET to .env.local.") {
    super(message);
    this.name = "ConfigurationError";
  }
}

function assertAuthConfigured() {
  if (!env.DATABASE_URL || !env.BETTER_AUTH_SECRET) throw new ConfigurationError();
}

export async function currentUser() {
  assertAuthConfigured();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return getPrisma().user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  // A configured owner email is a narrow bootstrap path; setup instructions seed
  // this role explicitly. It is never inferred from a first public signup.
  if (env.ADMIN_EMAIL && user.email.toLowerCase() === env.ADMIN_EMAIL) {
    return getPrisma().user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  }
  throw new AuthorizationError();
}

export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/sign-in?next=/admin");
    redirect("/");
  }
}

export function apiError(error: unknown) {
  if (error instanceof ConfigurationError) return Response.json({ error: error.message }, { status: 503 });
  if (error instanceof AuthenticationError) return Response.json({ error: error.message }, { status: 401 });
  if (error instanceof AuthorizationError) return Response.json({ error: error.message }, { status: 403 });
  if (error instanceof Error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}
