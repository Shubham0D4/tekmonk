"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const links = [<Link key="stories" href="/blog" className="nav-link">Stories</Link>, <Link key="news" href="/news" className="nav-link">News</Link>, <Link key="contact" href="/contact" className="nav-link">Contact</Link>];
  return <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
    <div className="shell flex h-16 items-center justify-between gap-4">
      <Link href="/" className="serif text-2xl font-bold tracking-tight">TekMonk<span className="text-emerald-700">.</span></Link>
      <nav className="hidden items-center gap-6 md:flex">{links}<Link href="/search" aria-label="Search" className="nav-link"><Search size={18}/></Link></nav>
      <div className="hidden items-center gap-2 md:flex">
        {session ? <><Link href="/admin" className="button secondary">Write</Link><button className="button ghost" onClick={() => authClient.signOut()}>Sign out</button></> : <><Link href="/sign-in" className="button ghost">Sign in</Link><Link href="/sign-up" className="button">Join</Link></>}
      </div>
      <button className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    </div>
    {open && <div className="shell flex flex-col gap-4 border-t border-zinc-100 py-4 md:hidden" onClick={() => setOpen(false)}>{links}<Link href="/search" className="nav-link">Search</Link>{session ? <Link href="/admin" className="button w-fit">Write</Link> : <Link href="/sign-in" className="button w-fit">Sign in</Link>}</div>}
  </header>;
}
