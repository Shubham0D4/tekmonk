import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

const handlers = toNextJsHandler(auth);
const configured = () => Boolean(env.DATABASE_URL && env.BETTER_AUTH_SECRET);
const unavailable = () => Response.json({ error: "Authentication is not configured. Add DATABASE_URL and BETTER_AUTH_SECRET to .env.local." }, { status: 503 });
export async function GET(request: Request) { return configured() ? handlers.GET(request) : unavailable(); }
export async function POST(request: Request) { return configured() ? handlers.POST(request) : unavailable(); }
