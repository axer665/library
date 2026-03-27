"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authStore } from "@/stores/authStore";

export default function LoginPage() {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
   await authStore.login(email, password);
   router.push("/");
   router.refresh();
  } catch (err: unknown) {
   const msg = err instanceof Error ? err.message : "Ошибка входа";
   setError(msg);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="flex min-h-screen items-center justify-center bg-cream p-4">
   <div className="w-full max-w-sm rounded-xl border border-theme bg-white p-8 shadow-lg">
    <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">
     Вход в каталог
    </h1>
    <form onSubmit={handleSubmit} className="space-y-4">
     {error && (
      <p className="rounded-lg bg-error px-3 py-2 text-sm text-error">
       {error}
      </p>
     )}
     <div>
      <label className="mb-1 block text-sm font-medium text-ink">
       Email
      </label>
      <input
       type="email"
       value={email}
       onChange={(e) => setEmail(e.target.value)}
       className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       required
      />
     </div>
     <div>
      <label className="mb-1 block text-sm font-medium text-ink">
       Пароль
      </label>
      <input
       type="password"
       value={password}
       onChange={(e) => setPassword(e.target.value)}
       className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       required
      />
     </div>
     <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
     >
      {loading ? "Вход..." : "Войти"}
     </button>
    </form>
    <p className="mt-4 text-center text-sm text-ink-muted">
     Нет аккаунта?{" "}
     <Link
      href="/register"
      className="font-medium text-accent hover:underline"
     >
      Зарегистрироваться
     </Link>
    </p>
   </div>
  </div>
 );
}
