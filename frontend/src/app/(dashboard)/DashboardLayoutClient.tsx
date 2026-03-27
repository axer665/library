"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { AppHeader } from "@/components/AppHeader";

const LOADING_UI = (
 <div className="flex min-h-screen items-center justify-center bg-cream">
  <div className="font-serif text-lg text-ink-muted">Загрузка...</div>
 </div>
);

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
 const router = useRouter();
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
  setMounted(true);
 }, []);

 useEffect(() => {
  if (mounted && !authStore.token) {
   router.replace("/login");
  }
 }, [mounted, router]);

 // First render must match dynamic loading fallback (avoids hydration mismatch when chunk loads before hydrate)
 if (!mounted) {
  return LOADING_UI;
 }

 if (!authStore.token) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-cream">
    <div className="font-serif text-lg text-ink-muted">Перенаправление...</div>
   </div>
  );
 }

 return (
  <div className="flex h-screen flex-col bg-cream">
   <AppHeader />
   <div className="flex flex-1 overflow-hidden">
    {children}
   </div>
  </div>
 );
}

export default observer(DashboardLayoutInner);
