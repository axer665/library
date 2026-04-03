"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
 const router = useRouter();

 useEffect(() => {
  router.replace("/?auth=register");
 }, [router]);

 return (
  <div className="flex min-h-screen items-center justify-center bg-cream">
   <p className="text-sm text-ink-muted">Перенаправление...</p>
  </div>
 );
}
