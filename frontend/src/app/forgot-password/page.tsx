"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?auth=forgot");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <p className="text-sm text-ink-muted">Перенаправление...</p>
    </div>
  );
}
