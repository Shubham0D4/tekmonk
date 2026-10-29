import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { NewsletterForm } from "@/components/public/newsletter-form";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "TekMonk - Notes for thoughtful builders", template: "%s | TekMonk" },
  description: "Essays, field notes, and practical ideas for people who build with care.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader />{children}<footer className="mt-20 border-t border-zinc-200 py-10"><div className="shell"><NewsletterForm /><div className="mt-6 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} TekMonk</span><span>Written with attention.</span></div></div></footer></body></html>;
}
