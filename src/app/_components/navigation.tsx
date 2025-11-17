'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 z-50 w-full bg-gradient-to-b from-black/70 via-black/40 to-transparent pb-4 pt-3 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-5 rounded-full border border-white/10 bg-black/80 px-6 py-3 shadow-2xl shadow-purple-900/40">
        <Link href="/" className="group flex items-center gap-3 rounded-full border border-white/10 bg-black/50 px-4 py-2">
          <Image src="/logo.ico" alt="ECMO Bridge" width={36} height={36} className="transition-transform duration-300 group-hover:scale-110" />
          <div>
            <span className="block text-xs uppercase tracking-[0.35em] text-purple-200/70">
              ECMO Bridge
            </span>
            <span className="text-lg font-semibold text-white">Care Coordination</span>
          </div>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 p-1 text-sm font-medium text-purple-50/80 shadow-inner shadow-purple-900/40">
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-5 py-2 transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/40"
                    : "text-purple-100/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 rounded-full bg-black/40 px-3 py-1">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 ring-2 ring-purple-500/60 hover:ring-purple-400 transition-all duration-300",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
