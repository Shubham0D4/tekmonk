import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/content";
import { siteUrl } from "@/lib/env";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const posts=await listPublishedPosts({pageSize:24}).catch(()=>({posts:[]})); return [{url:siteUrl("/"),lastModified:new Date(),changeFrequency:"weekly",priority:1},{url:siteUrl("/blog"),lastModified:new Date(),changeFrequency:"daily",priority:.8},{url:siteUrl("/news"),lastModified:new Date(),changeFrequency:"daily",priority:.9},...posts.posts.map(post=>({url:siteUrl(`/blog/${post.slug}`),lastModified:post.updatedAt,changeFrequency:"monthly" as const,priority:.7}))]; }
