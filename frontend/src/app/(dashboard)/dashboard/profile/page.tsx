"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";

function parseFieldErrors(err: unknown): Record<string, string> | null {
 if (!(err instanceof Error)) return null;
 try {
  const o = JSON.parse(err.message) as Record<string, string[]>;
  if (!o || typeof o !== "object") return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
   if (Array.isArray(v) && typeof v[0] === "string") out[k] = v[0];
  }
  return Object.keys(out).length > 0 ? out : null;
 } catch {
  return null;
 }
}

function ProfilePage() {
 const [name, setName] = useState("");
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [ok, setOk] = useState(false);

 const [currentPassword, setCurrentPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
 const [pwdSaving, setPwdSaving] = useState(false);
 const [pwdError, setPwdError] = useState<string | null>(null);
 const [pwdOk, setPwdOk] = useState(false);
 const [pwdFieldErrors, setPwdFieldErrors] = useState<Record<string, string>>({});

 useEffect(() => {
  if (authStore.user?.name) setName(authStore.user.name);
 }, [authStore.user?.name]);

 const submitProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setOk(false);
  const trimmed = name.trim();
  if (!trimmed) return;
  setSaving(true);
  try {
   await authStore.updateProfile(trimmed);
   setOk(true);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Не удалось сохранить");
  } finally {
   setSaving(false);
  }
 };

 const submitPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setPwdError(null);
  setPwdOk(false);
  setPwdFieldErrors({});
  setPwdSaving(true);
  try {
   await authStore.updatePassword({
    current_password: currentPassword,
    password: newPassword,
    password_confirmation: newPasswordConfirm,
   });
   setPwdOk(true);
   setCurrentPassword("");
   setNewPassword("");
   setNewPasswordConfirm("");
  } catch (err) {
   const fields = parseFieldErrors(err);
   if (fields) {
    setPwdFieldErrors(fields);
   } else {
    setPwdError(err instanceof Error ? err.message : "Не удалось сменить пароль");
   }
  } finally {
   setPwdSaving(false);
  }
 };

 return (
  <div className="flex flex-1 flex-col overflow-auto bg-cream">
   <div className="border-b border-theme bg-parchment px-6 py-3">
    <Link
     href="/dashboard"
     className="text-sm text-ink-muted transition hover:text-ink"
    >
     ← К каталогу
    </Link>
    <h1 className="mt-2 font-serif text-lg font-semibold text-ink">Личные данные</h1>
   </div>
   <div className="mx-auto w-full max-w-md space-y-6 p-6">
    <form
     onSubmit={submitProfile}
     className="space-y-4 rounded-2xl border border-theme bg-white p-6 shadow-sm"
    >
     <h2 className="font-serif text-base font-semibold text-ink">Профиль</h2>
     <div>
      <span className="mb-1 block text-sm font-medium text-ink">Логин (email)</span>
      <p className="rounded-lg border border-theme bg-sand px-3 py-2 text-sm text-ink-muted">
       {authStore.user?.email ?? "—"}
      </p>
     </div>
     <div>
      <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-ink">
       Имя
      </label>
      <input
       id="profile-name"
       value={name}
       onChange={(e) => setName(e.target.value)}
       className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       autoComplete="name"
      />
     </div>
     {error && <p className="text-sm text-red-600">{error}</p>}
     {ok && <p className="text-sm text-emerald-700">Сохранено</p>}
     <button
      type="submit"
      disabled={saving}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
     >
      {saving ? "Сохранение…" : "Сохранить"}
     </button>
    </form>

    <form
     onSubmit={submitPassword}
     className="space-y-4 rounded-2xl border border-theme bg-white p-6 shadow-sm"
    >
     <h2 className="font-serif text-base font-semibold text-ink">Смена пароля</h2>
     <div>
      <label htmlFor="pwd-current" className="mb-1 block text-sm font-medium text-ink">
       Текущий пароль
      </label>
      <input
       id="pwd-current"
       type="password"
       value={currentPassword}
       onChange={(e) => setCurrentPassword(e.target.value)}
       className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       autoComplete="current-password"
      />
      {pwdFieldErrors.current_password && (
       <p className="mt-1 text-xs text-red-600">{pwdFieldErrors.current_password}</p>
      )}
     </div>
     <div>
      <label htmlFor="pwd-new" className="mb-1 block text-sm font-medium text-ink">
       Новый пароль
      </label>
      <input
       id="pwd-new"
       type="password"
       value={newPassword}
       onChange={(e) => setNewPassword(e.target.value)}
       className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       autoComplete="new-password"
      />
      {pwdFieldErrors.password && (
       <p className="mt-1 text-xs text-red-600">{pwdFieldErrors.password}</p>
      )}
     </div>
     <div>
      <label htmlFor="pwd-confirm" className="mb-1 block text-sm font-medium text-ink">
       Повтор нового пароля
      </label>
      <input
       id="pwd-confirm"
       type="password"
       value={newPasswordConfirm}
       onChange={(e) => setNewPasswordConfirm(e.target.value)}
       className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       autoComplete="new-password"
      />
      {pwdFieldErrors.password_confirmation && (
       <p className="mt-1 text-xs text-red-600">{pwdFieldErrors.password_confirmation}</p>
      )}
     </div>
     {pwdError && !Object.keys(pwdFieldErrors).length && (
      <p className="text-sm text-red-600">{pwdError}</p>
     )}
     {pwdOk && <p className="text-sm text-emerald-700">Пароль изменён</p>}
     <button
      type="submit"
      disabled={pwdSaving}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
     >
      {pwdSaving ? "Сохранение…" : "Сменить пароль"}
     </button>
    </form>
   </div>
  </div>
 );
}

export default observer(ProfilePage);
