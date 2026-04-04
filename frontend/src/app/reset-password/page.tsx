"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token || !email) {
      setError("Неверная ссылка. Запросите письмо для сброса пароля ещё раз.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
      setError("");
      setTimeout(() => {
        router.replace("/?auth=login");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Не удалось сменить пароль";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 px-6 py-16 text-center">
        <p className="text-sm text-ink-muted">
          Ссылка неполная или устарела. Запросите новое письмо на странице входа.
        </p>
        <Link
          href="/?auth=forgot"
          className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
        >
          Запросить сброс пароля
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 px-6 py-16 text-center">
        <p className="text-sm text-ink">Пароль обновлён. Перенаправляем на вход…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-4 px-6 py-12">
      <h1 className="font-serif text-2xl font-semibold text-ink">Новый пароль</h1>
      <p className="text-sm text-ink-muted">Аккаунт: {email}</p>
      {error && <p className="rounded-lg bg-error px-3 py-2 text-sm text-error">{error}</p>}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Новый пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
          minLength={8}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Подтверждение</label>
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
        {loading ? "Сохранение…" : "Сохранить пароль"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        <Link href="/?auth=login" className="font-medium text-accent hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-theme bg-parchment px-6 py-4">
        <BrandLogo href="/" />
      </header>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <p className="text-sm text-ink-muted">Загрузка...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
