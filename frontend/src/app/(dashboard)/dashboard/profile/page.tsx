"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";

function ProfilePage() {
 const [name, setName] = useState("");
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [ok, setOk] = useState(false);

 useEffect(() => {
  if (authStore.user?.name) setName(authStore.user.name);
 }, [authStore.user?.name]);

 const submit = async (e: React.FormEvent) => {
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
   <div className="mx-auto w-full max-w-md p-6">
    <form
     onSubmit={submit}
     className="space-y-4 rounded-2xl border border-theme bg-white p-6 shadow-sm"
    >
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
   </div>
  </div>
 );
}

export default observer(ProfilePage);
