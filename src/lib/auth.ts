import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/lib/env";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
  // A non-production build must not need deployment secrets. The auth route
  // explicitly returns a configuration error until BETTER_AUTH_SECRET exists.
  secret: env.BETTER_AUTH_SECRET ?? "tekmonk-build-only-secret-not-for-production",
  baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_SITE_URL,
  trustedOrigins: [env.NEXT_PUBLIC_SITE_URL],
  advanced: { database: { joins: true } },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 4 },
      "/request-password-reset": { window: 60, max: 3 }
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === "production",
    sendResetPassword: async ({ user, url }) => sendPasswordResetEmail({ to: user.email, name: user.name, url })
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => sendVerificationEmail({ to: user.email, name: user.name, url })
  },
  plugins: [nextCookies()]
});
