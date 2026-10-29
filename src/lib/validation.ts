import { z } from "zod";

export const postSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  excerpt: z.string().trim().max(360).optional().nullable(),
  content: z.unknown(),
  seoTitle: z.string().trim().max(70).optional().nullable(),
  seoDescription: z.string().trim().max(160).optional().nullable(),
  folderId: z.string().cuid().optional().nullable(),
  featuredImageId: z.string().cuid().optional().nullable(),
  tagIds: z.array(z.string().cuid()).max(12),
  categoryIds: z.array(z.string().cuid()).max(4),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  scheduledFor: z.coerce.date().optional().nullable()
}).superRefine((value, ctx) => {
  if (value.status === "SCHEDULED" && !value.scheduledFor) {
    ctx.addIssue({ code: "custom", message: "Scheduled posts need a publication date.", path: ["scheduledFor"] });
  }
});

export const commentSchema = z.object({
  postId: z.string().cuid(),
  body: z.string().trim().min(1).max(2000),
  parentId: z.string().cuid().optional(),
  paragraphAnchor: z.string().trim().max(160).optional()
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().max(180).optional(),
  message: z.string().trim().min(20).max(5000),
  website: z.string().max(0).optional()
});

export const folderSchema = z.object({
  name: z.string().trim().min(1).max(100).regex(/^[^/\\]+$/, "Folder names cannot contain slashes."),
  parentId: z.string().cuid().optional().nullable()
});
