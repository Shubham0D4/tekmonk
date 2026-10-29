import "server-only";

const optional = (name: string) => process.env[name]?.trim() || undefined;

export const env = {
  DATABASE_URL: optional("DATABASE_URL"),
  DIRECT_URL: optional("DIRECT_URL"),
  BETTER_AUTH_SECRET: optional("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: optional("BETTER_AUTH_URL"),
  NEXT_PUBLIC_SITE_URL: optional("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: optional("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: optional("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_STORAGE_BUCKET: optional("SUPABASE_STORAGE_BUCKET") ?? "blog-media",
  SMTP_HOST: optional("SMTP_HOST"),
  SMTP_PORT: optional("SMTP_PORT"),
  SMTP_USER: optional("SMTP_USER"),
  SMTP_PASS: optional("SMTP_PASS"),
  SMTP_FROM: optional("SMTP_FROM"),
  ADMIN_EMAIL: optional("ADMIN_EMAIL")?.toLowerCase()
} as const;

export function requireServerEnv<Name extends keyof typeof env>(name: Name): NonNullable<(typeof env)[Name]> {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required server configuration: ${name}. Add it to .env.local.`);
  }
  return value as NonNullable<(typeof env)[Name]>;
}

export function siteUrl(path = ""): string {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
}
