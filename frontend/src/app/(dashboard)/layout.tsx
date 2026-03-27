"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { useCtrlKey } from "@/hooks/useCtrlKey";
import { AppHeader } from "@/components/AppHeader";

const LOADING = (
 <div className="flex min-h-screen items-center justify-center bg-cream">
  <div className="font-serif text-lg text-ink-muted">Загрузка...</div>
 </div>
);

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
 const router = useRouter();
 const [mounted, setMounted] = useState(false);
 useCtrlKey();

 useEffect(() => {
  setMounted(true);
 }, []);

 useEffect(() => {
  if (mounted && !authStore.token) {
   router.replace("/login");
  }
 }, [mounted, router]);

 if (!mounted) return LOADING;
 if (!authStore.token) return LOADING;

 return (
  <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
   <AppHeader />
   <div className="flex flex-1 overflow-hidden">{children}</div>
  </div>
 );
}

export default observer(DashboardLayoutInner);
