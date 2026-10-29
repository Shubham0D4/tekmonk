-- Run this once in the Supabase SQL editor after creating the project.
-- Application writes are deliberately server-side only: the browser never receives
-- the service-role secret, and there are no client INSERT/UPDATE/DELETE policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-media',
  'blog-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- If a previous setup added broad client write policies, remove them manually.
-- Keep this bucket public only for published article images. Private author-only
-- assets should use a second private bucket and short-lived signed URLs.
