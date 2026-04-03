"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authStore } from "@/stores/authStore";
import { Modal } from "@/components/Modal";
import { BrandLogo } from "@/components/BrandLogo";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });

  useEffect(() => {
    const mode = searchParams.get("auth");
    if (mode === "login" || mode === "register") {
      setAuthMode(mode);
    } else {
      setAuthMode(null);
    }
  }, [searchParams]);

  const closeModal = () => {
    setAuthMode(null);
    setError("");
    router.replace("/");
  };

  const title = useMemo(
    () => (authMode === "register" ? "Регистрация" : "Вход в каталог"),
    [authMode],
  );

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authStore.login(loginForm.email, loginForm.password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка входа";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (registerForm.password !== registerForm.passwordConfirmation) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      await authStore.register(registerForm.name, registerForm.email, registerForm.password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка регистрации";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-cream text-ink">
        <header className="border-b border-theme bg-parchment">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <BrandLogo href="/" />
            <nav aria-label="Навигация по сайту" className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-ink transition hover-bg-sand"
                onClick={() => {
                  setError("");
                  setAuthMode("login");
                }}
              >
                Войти
              </button>
              <button
                type="button"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
                onClick={() => {
                  setError("");
                  setAuthMode("register");
                }}
              >
                Регистрация
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-14">
            <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight">
              Домашний книжный каталог
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-ink-muted">
              Храните библиотеку структурировано, быстро находите книги и поддерживайте порядок в
              архивах через единый интерфейс.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition hover-bg-accent-hover"
                onClick={() => {
                  setError("");
                  setAuthMode("register");
                }}
              >
                Начать работу
              </button>
              <button
                type="button"
                className="rounded-lg border border-theme px-5 py-3 text-sm font-medium text-ink transition hover-bg-sand"
                onClick={() => {
                  setError("");
                  setAuthMode("login");
                }}
              >
                Уже есть аккаунт
              </button>
            </div>
          </section>

          <section className="border-y border-theme bg-white">
            <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
              <article className="rounded-xl border border-theme bg-parchment p-5">
                <h2 className="font-serif text-xl font-semibold">Локации</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Разделяйте фонд по кабинетам, залам или полкам, чтобы не терять контекст.
                </p>
              </article>
              <article className="rounded-xl border border-theme bg-parchment p-5">
                <h2 className="font-serif text-xl font-semibold">Архивы</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Группируйте книги по архивам внутри локаций и просматривайте статистику.
                </p>
              </article>
              <article className="rounded-xl border border-theme bg-parchment p-5">
                <h2 className="font-serif text-xl font-semibold">Поиск</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Находите нужную книгу по автору, названию, издательству и другим фильтрам.
                </p>
              </article>
            </div>
          </section>

          <section className="mx-auto w-full max-w-6xl px-6 py-12">
            <h2 className="font-serif text-3xl font-semibold">Для кого это полезно</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-xl border border-theme bg-white p-5">
                <h3 className="font-serif text-xl font-semibold">Школьные библиотеки</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Контролируйте фонд по кабинетам и быстро готовьте списки для учебного процесса.
                </p>
              </article>
              <article className="rounded-xl border border-theme bg-white p-5">
                <h3 className="font-serif text-xl font-semibold">Частные коллекции</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Держите личную библиотеку в порядке и легко находите редкие или забытые издания.
                </p>
              </article>
              <article className="rounded-xl border border-theme bg-white p-5">
                <h3 className="font-serif text-xl font-semibold">Небольшие архивы</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Ведите учёт архивных книг с понятной структурой и прозрачным доступом к данным.
                </p>
              </article>
            </div>
          </section>

          <section className="border-t border-theme bg-parchment">
            <div className="mx-auto w-full max-w-6xl px-6 py-12">
              <h2 className="font-serif text-3xl font-semibold">Как это работает</h2>
              <ol className="mt-6 grid gap-4 md:grid-cols-3">
                <li className="rounded-xl border border-theme bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Шаг 1</p>
                  <p className="mt-2 text-sm text-ink-muted">Создайте локации и добавьте в них архивы.</p>
                </li>
                <li className="rounded-xl border border-theme bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Шаг 2</p>
                  <p className="mt-2 text-sm text-ink-muted">
                    Заполните карточки книг и прикрепите фото обложек.
                  </p>
                </li>
                <li className="rounded-xl border border-theme bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Шаг 3</p>
                  <p className="mt-2 text-sm text-ink-muted">
                    Используйте поиск и фильтры для ежедневной работы.
                  </p>
                </li>
              </ol>
            </div>
          </section>
        </main>

        <footer className="h-16 border-t border-theme bg-white text-sm text-ink-light">
          <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6">
            <p>LibraryCatalog</p>
            <p>Каталог книг по локациям и архивам</p>
          </div>
        </footer>
      </div>

      {authMode && (
        <Modal title={title} onClose={closeModal}>
          {error && <p className="mb-4 rounded-lg bg-error px-3 py-2 text-sm text-error">{error}</p>}

          {authMode === "login" ? (
            <form onSubmit={onLoginSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Пароль</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
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
              <p className="text-center text-sm text-ink-muted">
                Нет аккаунта?{" "}
                <button
                  type="button"
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    setError("");
                    setAuthMode("register");
                  }}
                >
                  Зарегистрироваться
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={onRegisterSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Имя</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Пароль</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Подтверждение пароля</label>
                <input
                  type="password"
                  value={registerForm.passwordConfirmation}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({ ...prev, passwordConfirmation: e.target.value }))
                  }
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
              <p className="text-center text-sm text-ink-muted">
                Уже есть аккаунт?{" "}
                <button
                  type="button"
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    setError("");
                    setAuthMode("login");
                  }}
                >
                  Войти
                </button>
              </p>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
