"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { catalogStore } from "@/stores/catalogStore";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { BrandLogo } from "@/components/BrandLogo";

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [navMounted, setNavMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ email: "", name: "", message: "" });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [heroScrollY, setHeroScrollY] = useState(0);
  const [heroReduceMotion, setHeroReduceMotion] = useState(false);

  useEffect(() => {
    setNavMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setHeroReduceMotion(mq.matches);
    const onMq = () => setHeroReduceMotion(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    const onScroll = () => setHeroScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroParallaxY = heroReduceMotion ? 0 : heroScrollY * 0.22;

  useEffect(() => {
    if (authStore.token) void authStore.syncUserFromApi();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const mode = searchParams.get("auth");
    if (mode === "login" || mode === "register" || mode === "forgot") {
      setAuthMode(mode);
      if (mode !== "forgot") setForgotSent(false);
    } else {
      setAuthMode(null);
      setForgotSent(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("email_verified") !== "1") return;
    if (typeof window === "undefined" || !localStorage.getItem("token")) return;
    void (async () => {
      await authStore.syncUserFromApi();
      router.replace("/dashboard");
      router.refresh();
    })();
  }, [searchParams, router]);

  const closeModal = () => {
    setAuthMode(null);
    setError("");
    setForgotSent(false);
    router.replace("/");
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    setFeedbackError("");
    setFeedbackSuccess(false);
    setFeedbackForm({ email: "", name: "", message: "" });
  };

  const onFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError("");
    const email = feedbackForm.email.trim();
    const name = feedbackForm.name.trim();
    const message = feedbackForm.message.trim();
    if (!email || !name || !message) {
      setFeedbackError("Заполните все поля.");
      return;
    }
    setFeedbackLoading(true);
    try {
      await api.feedback.submit({ email, name, message });
      setFeedbackSuccess(true);
      setFeedbackForm({ email: "", name: "", message: "" });
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : "Не удалось отправить сообщение");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const title = useMemo(() => {
    if (authMode === "register") return "Регистрация";
    if (authMode === "forgot") return "Восстановление пароля";
    return "Вход в каталог";
  }, [authMode]);

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

  const handleLogout = async () => {
    setMenuOpen(false);
    await authStore.logout();
    router.replace("/");
    router.refresh();
  };

  const onForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.forgotPassword({ email: forgotEmail });
      setForgotSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Не удалось отправить письмо";
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
              {!navMounted ? (
                <div className="h-10 w-[11.5rem]" aria-hidden />
              ) : authStore.isAuthenticated ? (
                <div className="relative flex justify-end" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-theme bg-white text-ink transition hover-border-accent hover:bg-accent-muted"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Меню аккаунта"
                  >
                    <MenuIcon />
                  </button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-50 mt-1 min-w-[14rem] rounded-xl border border-theme bg-white py-1 shadow-lg"
                    >
                      <Link
                        role="menuitem"
                        href="/dashboard/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2.5 text-left text-sm transition hover:bg-sand"
                      >
                        <span className="block truncate font-medium text-ink">
                          {authStore.user?.email ?? "Профиль"}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-muted">Личные данные</span>
                      </Link>
                      <div className="my-1 border-t border-theme" role="separator" />
                      <Link
                        role="menuitem"
                        href={catalogStore.lastCatalogUrl || "/dashboard"}
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 text-left text-sm text-ink transition hover:bg-sand"
                      >
                        Каталог
                      </Link>
                      <div className="my-1 border-t border-theme" role="separator" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-left text-sm text-ink transition hover:bg-sand"
                      >
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <section
            className="relative isolate min-h-[min(28rem,78vh)] overflow-hidden"
            aria-labelledby="landing-hero-heading"
          >
            <div
              className="pointer-events-none absolute left-1/2 top-[-18%] w-[100vw] will-change-transform"
              style={{
                height: "145%",
                transform: `translateX(-50%) translateY(${heroParallaxY}px) scale(1.04)`,
              }}
              aria-hidden
            >
              <Image
                src="/images/landing-hero-bookshelf.png"
                alt=""
                fill
                className="object-cover object-[55%_28%]"
                sizes="100vw"
                priority
                quality={88}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(250,248,245,0.91) 0%, rgba(245,240,232,0.8) 42%, rgba(250,248,245,0.93) 100%)",
                }}
              />
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(232,242,239,0.55) 0%, transparent 55%, rgba(232,220,208,0.35) 100%)",
                }}
              />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-14">
              <h1
                id="landing-hero-heading"
                className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-ink drop-shadow-sm"
              >
                Домашний книжный каталог
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-ink-muted drop-shadow-sm">
                Храните библиотеку структурировано, быстро находите книги и поддерживайте порядок в
                архивах через единый интерфейс.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm transition hover-bg-accent-hover"
                  onClick={() => {
                    setError("");
                    setAuthMode("register");
                  }}
                >
                  Начать работу
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-theme bg-white/80 px-5 py-3 text-sm font-medium text-ink shadow-sm backdrop-blur-sm transition hover:bg-sand"
                  onClick={() => {
                    setError("");
                    setAuthMode("login");
                  }}
                >
                  Уже есть аккаунт
                </button>
              </div>
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

        <footer className="border-t border-theme bg-parchment text-sm">
          <div className="mx-auto flex w-full max-w-6xl justify-center px-6 py-4">
            <button
              type="button"
              onClick={() => {
                setFeedbackOpen(true);
                setFeedbackError("");
                setFeedbackSuccess(false);
              }}
              className="cursor-pointer text-accent transition hover:underline"
            >
              Обратная связь
            </button>
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
              <p className="text-center text-sm">
                <button
                  type="button"
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    setError("");
                    setForgotSent(false);
                    setForgotEmail(loginForm.email);
                    setAuthMode("forgot");
                    router.replace("/?auth=forgot");
                  }}
                >
                  Забыли пароль?
                </button>
              </p>
              <p className="text-center text-sm text-ink-muted">
                Нет аккаунта?{" "}
                <button
                  type="button"
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    setError("");
                    setAuthMode("register");
                    router.replace("/?auth=register");
                  }}
                >
                  Зарегистрироваться
                </button>
              </p>
            </form>
          ) : authMode === "forgot" ? (
            forgotSent ? (
              <div className="space-y-4 text-sm text-ink-muted">
                <p>
                  Если указанный email зарегистрирован, мы отправили письмо со ссылкой для сброса пароля.
                  Проверьте входящие и папку «Спам».
                </p>
                <button
                  type="button"
                  className="w-full rounded-lg border border-theme px-4 py-2 font-medium text-ink transition hover-bg-sand"
                  onClick={() => {
                    setError("");
                    setForgotSent(false);
                    setAuthMode("login");
                    router.replace("/?auth=login");
                  }}
                >
                  Вернуться ко входу
                </button>
              </div>
            ) : (
              <form onSubmit={onForgotSubmit} className="space-y-4">
                <p className="text-sm text-ink-muted">
                  Укажите email аккаунта — пришлём ссылку для задания нового пароля.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
                >
                  {loading ? "Отправка…" : "Отправить ссылку"}
                </button>
                <p className="text-center text-sm text-ink-muted">
                  <button
                    type="button"
                    className="font-medium text-accent hover:underline"
                    onClick={() => {
                      setError("");
                      setAuthMode("login");
                      router.replace("/?auth=login");
                    }}
                  >
                    Назад ко входу
                  </button>
                </p>
              </form>
            )
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
                    router.replace("/?auth=login");
                  }}
                >
                  Войти
                </button>
              </p>
            </form>
          )}
        </Modal>
      )}

      {feedbackOpen && (
        <Modal title="Форма обратной связи" onClose={closeFeedback}>
          {feedbackSuccess ? (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                Спасибо, сообщение отправлено. Мы ответим на указанный email при необходимости.
              </p>
              <button
                type="button"
                onClick={closeFeedback}
                className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
              >
                Закрыть
              </button>
            </div>
          ) : (
            <form onSubmit={onFeedbackSubmit} className="space-y-4">
              <div className="rounded-lg border border-theme bg-parchment/80 px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
                Заметили сбой или некорректную работу сайта? Напишите об этом через эту форму —
                администрация рассмотрит обращение и поможет устранить проблему.
              </div>
              {feedbackError && (
                <p className="rounded-lg bg-error px-3 py-2 text-sm text-error">{feedbackError}</p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Имя</label>
                <input
                  type="text"
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Сообщение</label>
                <textarea
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  rows={5}
                  required
                  maxLength={5000}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
                >
                  {feedbackLoading ? "Отправка…" : "Отправить"}
                </button>
                <button
                  type="button"
                  onClick={closeFeedback}
                  className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-ink transition hover:bg-sand"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}

export default observer(HomePageInner);
