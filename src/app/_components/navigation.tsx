'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Platform" },
];

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950">
        <div
          className="aurora-bubble absolute -left-20 -top-20 h-64 w-64 rounded-full bg-purple-600/30"
          style={{
            '--duration': '20s',
            '--x1': '-10%',
            '--y1': '-15%',
            '--x2': '15%',
            '--y2': '10%',
            '--x3': '-8%',
            '--y3': '-12%',
          } as React.CSSProperties}
        />
        <div
          className="aurora-bubble absolute -right-20 -top-10 h-56 w-56 rounded-full bg-indigo-600/30"
          style={{
            '--duration': '25s',
            '--x1': '10%',
            '--y1': '-10%',
            '--x2': '-12%',
            '--y2': '8%',
            '--x3': '9%',
            '--y3': '-11%',
          } as React.CSSProperties}
        />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 text-sm shadow-lg shadow-purple-900/20 backdrop-blur-xl sm:px-8 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-3 text-white transition hover:opacity-90"
          >
            <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 text-base font-bold text-white shadow-lg shadow-purple-900/40">
              EB
            </span>
            <div className="flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                ECMO Bridge 2.0
              </p>
              <p className="text-base font-semibold leading-tight">
                Critical Care Network
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-10 text-sm font-medium text-white/70 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center transition ${
                  isActive(item.href)
                    ? "text-white"
                    : "hover:text-white"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 lg:flex">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full border border-purple-400/40 bg-gradient-to-r from-purple-500 via-purple-500/80 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-purple-900/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-900/40">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 border border-white/20 rounded-full shadow-sm shadow-purple-900/40",
                  },
                }}
              />
            </SignedIn>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 text-white/70 transition hover:border-white/30 hover:text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-white/10 bg-slate-950/95 p-4 text-sm text-white/80 shadow-xl shadow-purple-900/30 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-2 px-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-3 transition ${
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="mt-2 rounded-xl border border-purple-400/40 bg-gradient-to-r from-purple-500 via-purple-500/80 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-900/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-900/40">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-xs uppercase tracking-wide text-white/60">
                    Account
                  </span>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 border border-white/20 rounded-full shadow-sm shadow-purple-900/40",
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
