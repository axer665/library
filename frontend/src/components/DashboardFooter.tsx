"use client";

import Link from "next/link";

export function DashboardFooter() {
  return (
    <footer className="shrink-0 border-t border-theme bg-parchment text-sm text-ink-muted">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 py-3">
        <Link
          href="/"
          className="transition hover:text-accent hover:underline"
        >
          Главная
        </Link>
        <span className="text-ink-light" aria-hidden>
          ·
        </span>
        <Link
          href="/dashboard/profile"
          className="transition hover:text-accent hover:underline"
        >
          Профиль
        </Link>
      </div>
    </footer>
  );
}
