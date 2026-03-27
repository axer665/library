"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authStore } from "@/stores/authStore";

export default function RegisterPage() {
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [passwordConfirmation, setPasswordConfirmation] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  if (password !== passwordConfirmation) {
   setError("Пароли не совпадают");
   return;
  }
  setLoading(true);
  try {
   await authStore.register(name, email, password);
   router.push("/");
   router.refresh();
  } catch (err: unknown) {
   const msg = err instanceof Error ? err.message : "Ошибка регистрации";
   setError(msg);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="flex min-h-screen items-center justify-center bg-cream p-4">
   <div className="w-full max-w-sm rounded-xl border border-theme bg-white p-8 shadow-lg">
    <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">
     Регистрация
    </h1>
    <form onSubmit={handleSubmit} className="space-y-4">
     {error && (
      <p className="rounded-lg bg-error px-3 py-2 text-sm text-error">
       {error}
      </p>
     )}
     <div>
      <label className="mb-1 block text-sm font-medium text-ink">
       Имя
      </label>
      <input
       type="text"
       value={name}
       onChange={(e) => setName(e.target.value)}
       className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       required
      />
     </div>
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
       minLength={8}
      />
     </div>
     <div>
      <label className="mb-1 block text-sm font-medium text-ink">
       Подтверждение пароля
      </label>
      <input
       type="password"
       value={passwordConfirmation}
       onChange={(e) => setPasswordConfirmation(e.target.value)}
       className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       required
      />
     </div>
     <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
     >
      {loading ? "Регистрация..." : "Зарегистрироваться"}
     </button>
    </form>
    <p className="mt-4 text-center text-sm text-ink-muted">
     Уже есть аккаунт?{" "}
     <Link
      href="/login"
      className="font-medium text-accent hover:underline"
     >
      Войти
     </Link>
    </p>
   </div>
  </div>
 );
}
