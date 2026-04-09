"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { useCtrlKey } from "@/hooks/useCtrlKey";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooterWithFeedback } from "@/components/SiteFooterWithFeedback";
import { api } from "@/lib/api";

const LOADING = (
 <div className="flex min-h-screen items-center justify-center bg-cream">
  <div className="font-serif text-lg text-ink-muted">Загрузка...</div>
 </div>
);

function EmailVerificationBlock() {
 const router = useRouter();
 const [sending, setSending] = useState(false);
 const [hint, setHint] = useState<string | null>(null);

 const onResend = async () => {
  setHint(null);
  setSending(true);
  try {
   const { message } = await api.auth.resendVerification();
   setHint(message);
  } catch (e: unknown) {
   setHint(e instanceof Error ? e.message : "Не удалось отправить письмо");
  } finally {
   setSending(false);
  }
 };

 return (
  <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-center text-zinc-100">
   <div className="max-w-md space-y-3">
    <h1 className="font-serif text-2xl font-semibold text-white">Подтвердите email</h1>
    <p className="text-sm text-zinc-400">
     Мы отправили письмо на <span className="text-zinc-200">{authStore.user?.email}</span>. Перейдите по
     ссылке в письме, чтобы открыть каталог. Проверьте папку «Спам», если письма нет во входящих.
    </p>
   </div>
   {hint && <p className="max-w-md text-sm text-emerald-400">{hint}</p>}
   <div className="flex flex-wrap items-center justify-center gap-3">
    <button
     type="button"
     disabled={sending}
     onClick={onResend}
     className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
    >
     {sending ? "Отправка…" : "Отправить письмо снова"}
    </button>
    <button
     type="button"
     onClick={async () => {
      await authStore.logout();
      router.replace("/");
      router.refresh();
     }}
     className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
    >
     Выйти
    </button>
   </div>
  </div>
 );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
 const router = useRouter();
 const pathname = usePathname();
 const [mounted, setMounted] = useState(false);
 useCtrlKey();

 useEffect(() => {
  setMounted(true);
 }, []);

 useEffect(() => {
  const isProtectedDashboardRoute = pathname.startsWith("/dashboard");
  if (mounted && isProtectedDashboardRoute && !authStore.token) {
   router.replace("/login");
  }
 }, [mounted, pathname, router]);

 const wasOnDashboardRef = useRef(false);

 // me() только при входе на /dashboard/* с другого раздела или пока user ещё нет — не при каждом Link внутри каталога/поиска.
 useEffect(() => {
  if (!mounted || !authStore.token) return;
  const onDash = pathname.startsWith("/dashboard");
  if (onDash) {
   const firstEnter = !wasOnDashboardRef.current;
   wasOnDashboardRef.current = true;
   if (firstEnter || !authStore.user) {
    void authStore.syncUserFromApi();
   }
  } else {
   wasOnDashboardRef.current = false;
  }
 }, [mounted, pathname, authStore.token, authStore.user]);

 // Главная `/` и прочие не-/dashboard маршруты группы — без полноэкранной «Загрузка…» (контент сам решает навигацию).
 if (!pathname.startsWith("/dashboard")) {
  return <>{children}</>;
 }

 if (!mounted) return LOADING;
 if (!authStore.token) return LOADING;
 // Пока нет user после F5 — ждём первый me(); фоновые sync не подменяют весь экран.
 if (authStore.token && !authStore.user) return LOADING;

 const needsEmailVerification = authStore.user && !authStore.user.email_verified_at;

 return (
  <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
   <AppHeader />
   {needsEmailVerification ? <EmailVerificationBlock /> : (
    <>
     <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
     <SiteFooterWithFeedback />
    </>
   )}
  </div>
 );
}

export default observer(DashboardLayoutInner);
