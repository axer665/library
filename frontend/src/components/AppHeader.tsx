"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { catalogStore } from "@/stores/catalogStore";

function AppHeaderInner() {
 const router = useRouter();
 const pathname = usePathname();
 const isSearch = pathname === "/dashboard/search";
 const isCatalog = !isSearch && pathname.startsWith("/dashboard");

 const handleLogout = () => {
  authStore.logout();
  router.push("/login");
  router.refresh();
 };

 return (
  <header className="flex h-14 shrink-0 items-center gap-4 border-b border-theme bg-parchment px-6">
   <h1 className="font-serif text-lg font-semibold text-ink">
    Библиотека-Каталогизатор
   </h1>
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
   <div className="flex flex-1 items-center justify-end gap-4">
    <span className="text-sm text-ink-muted">
     {authStore.user?.name}
    </span>
    <button
     onClick={handleLogout}
     className="flex h-9 w-9 items-center justify-center rounded-lg border border-theme bg-white text-sm font-medium text-ink transition hover-border-accent hover:bg-accent-muted"
     title="Выйти"
    >
     {authStore.user?.name?.charAt(0).toUpperCase() || "?"}
    </button>
   </div>
  </header>
 );
}

export const AppHeader = observer(AppHeaderInner);
