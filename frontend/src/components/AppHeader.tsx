"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { catalogStore } from "@/stores/catalogStore";
import { BrandLogo } from "@/components/BrandLogo";

function MenuIcon() {
 return (
  <svg
   xmlns="http://www.w3.org/2000/svg"
   width="22"
   height="22"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="2"
   strokeLinecap="round"
   aria-hidden
  >
   <line x1="4" y1="6" x2="20" y2="6" />
   <line x1="4" y1="12" x2="20" y2="12" />
   <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
 );
}

function AppHeaderInner() {
 const router = useRouter();
 const pathname = usePathname();
 const [menuOpen, setMenuOpen] = useState(false);
 const menuRef = useRef<HTMLDivElement>(null);

 const isSearch = pathname === "/dashboard/search";
 const isProfile = pathname === "/dashboard/profile";
 const isCatalog = !isSearch && !isProfile && pathname.startsWith("/dashboard");

 useEffect(() => {
  if (!menuOpen) return;
  const onDown = (e: MouseEvent) => {
   if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
    setMenuOpen(false);
   }
  };
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") setMenuOpen(false);
  };
  document.addEventListener("mousedown", onDown);
  document.addEventListener("keydown", onKey);
  return () => {
   document.removeEventListener("mousedown", onDown);
   document.removeEventListener("keydown", onKey);
  };
 }, [menuOpen]);

 const handleLogout = async () => {
  setMenuOpen(false);
  await authStore.logout();
  router.replace("/");
  router.refresh();
 };

 const verified = authStore.isEmailVerified;

 return (
  <header className="flex h-14 shrink-0 items-center gap-4 border-b border-theme bg-parchment px-6">
   <BrandLogo href="/" compact />
   {verified && (
    <nav className="flex gap-2">
     <Link
      href={catalogStore.lastCatalogUrl || "/dashboard"}
      aria-current={isCatalog ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
       isCatalog
        ? "bg-accent-muted text-accent"
        : "text-ink-muted hover:bg-sand"
      }`}
     >
      Каталог
     </Link>
     <Link
      href="/dashboard/search"
      aria-current={isSearch ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
       isSearch
        ? "bg-accent-muted text-accent"
        : "text-ink-muted hover:bg-sand"
      }`}
     >
      Поиск
     </Link>
    </nav>
   )}
   <div className="relative flex flex-1 items-center justify-end" ref={menuRef}>
    <button
     type="button"
     onClick={() => setMenuOpen((o) => !o)}
     className="flex h-9 w-9 items-center justify-center rounded-lg border border-theme bg-white text-ink transition hover-border-accent hover:bg-accent-muted"
     aria-expanded={menuOpen}
     aria-haspopup="menu"
     aria-label="Меню аккаунта"
    >
     <MenuIcon />
    </button>
    {menuOpen && (
     <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-1 min-w-[14rem] rounded-xl border border-theme bg-white py-1 shadow-lg"
     >
      <Link
       role="menuitem"
       href="/dashboard/profile"
       onClick={() => setMenuOpen(false)}
       className="block px-3 py-2.5 text-left text-sm transition hover:bg-sand"
      >
       <span className="block truncate font-medium text-ink">{authStore.user?.email ?? "Профиль"}</span>
       <span className="mt-0.5 block text-xs text-ink-muted">Личные данные</span>
      </Link>
      <div className="my-1 border-t border-theme" role="separator" />
      <button
       type="button"
       role="menuitem"
       onClick={handleLogout}
       className="w-full px-3 py-2 text-left text-sm text-ink transition hover:bg-sand"
      >
       Выйти
      </button>
     </div>
    )}
   </div>
  </header>
 );
}

export const AppHeader = observer(AppHeaderInner);
