"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { catalogStore } from "@/stores/catalogStore";
import { BrandLogo } from "@/components/BrandLogo";
import { api } from "@/lib/api";

function AppHeaderInner() {
 const router = useRouter();
 const pathname = usePathname();
 const isSearch = pathname === "/dashboard/search";
 const isCatalog = !isSearch && pathname.startsWith("/dashboard");
 const [mailSending, setMailSending] = useState(false);
 const [mailHint, setMailHint] = useState<string | null>(null);
 const mailHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = async () => {
    await authStore.logout();
    router.replace("/");
    router.refresh();
  };

  useEffect(() => {
    return () => {
      if (mailHintTimer.current) clearTimeout(mailHintTimer.current);
    };
  }, []);

  const handleTestMail = async () => {
    setMailHint(null);
    setMailSending(true);
    try {
      const { message } = await api.auth.sendTestMail();
      setMailHint(message);
    } catch (e: unknown) {
      setMailHint(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setMailSending(false);
      if (mailHintTimer.current) clearTimeout(mailHintTimer.current);
      mailHintTimer.current = setTimeout(() => setMailHint(null), 8000);
    }
  };

 return (
  <header className="flex h-14 shrink-0 items-center gap-4 border-b border-theme bg-parchment px-6">
   <BrandLogo href="/" compact />
   <button
    type="button"
    disabled={mailSending}
    onClick={handleTestMail}
    className="shrink-0 rounded-lg border border-theme bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover-border-accent hover:bg-accent-muted disabled:opacity-50"
    title="Отправить тестовое письмо на ваш email (проверка SMTP)"
   >
    {mailSending ? "Отправка…" : "Тест почты"}
   </button>
   {mailHint && (
    <span className="hidden max-w-[220px] truncate text-xs text-ink-muted sm:inline" role="status">
     {mailHint}
    </span>
   )}
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
