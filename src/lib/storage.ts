import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { env, requireServerEnv } from "@/lib/env";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxBytes = 5 * 1024 * 1024;

function supabaseAdmin() {
  return createClient(requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"), requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function assertValidImage(file: File) {
  if (!allowedTypes.has(file.type)) throw new Error("Only JPEG, PNG, WebP, and GIF images are supported.");
  if (file.size === 0 || file.size > maxBytes) throw new Error("Images must be between 1 byte and 5 MB.");
}

export async function uploadImage(file: File, ownerId: string) {
  assertValidImage(file);
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const storagePath = `${ownerId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const client = supabaseAdmin();
  const bucketName = env.SUPABASE_STORAGE_BUCKET;

  let { error } = await client.storage.from(bucketName).upload(storagePath, file, {
    contentType: file.type,
    upsert: false
  });

  // Self-heal if bucket was deleted or not yet created
  if (error && error.message?.toLowerCase().includes("bucket not found")) {
    await client.storage.createBucket(bucketName, { public: true }).catch(() => {});
    const retry = await client.storage.from(bucketName).upload(storagePath, file, {
      contentType: file.type,
      upsert: false
    });
    error = retry.error;
  }

  if (error) throw new Error(`Media upload failed: ${error.message}`);
  const { data } = client.storage.from(bucketName).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

export async function deleteImage(storagePath: string) {
  const { error } = await supabaseAdmin().storage.from(env.SUPABASE_STORAGE_BUCKET).remove([storagePath]);
  if (error) throw new Error(`Media deletion failed: ${error.message}`);
}
