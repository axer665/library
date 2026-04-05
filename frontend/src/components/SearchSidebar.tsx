"use client";

import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import type { SearchFilters } from "@/stores/catalogStore";
import type { Location, Archive } from "@/stores/catalogStore";

interface SearchSidebarProps {
 filters: SearchFilters;
 locations: Location[];
 archives: Archive[];
 onFiltersChange: (filters: Partial<SearchFilters>) => void;
 onSearch: () => void;
}

function ChevronRightIcon() {
 return (
  <svg
   xmlns="http://www.w3.org/2000/svg"
   width="20"
   height="20"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="2"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden
  >
   <path d="M9 18l6-6-6-6" />
  </svg>
 );
}

function ChevronLeftIcon() {
 return (
  <svg
   xmlns="http://www.w3.org/2000/svg"
   width="20"
   height="20"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="2"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden
  >
   <path d="M15 18l-6-6 6-6" />
  </svg>
 );
}

export const SearchSidebar = observer(function SearchSidebar({
 filters,
 locations,
 archives,
 onFiltersChange,
 onSearch,
}: SearchSidebarProps) {
 const [mobileOpen, setMobileOpen] = useState(false);

 const closeMobile = useCallback(() => setMobileOpen(false), []);

 const handleSearchClick = () => {
  onSearch();
  setMobileOpen(false);
 };

 useEffect(() => {
  if (!mobileOpen) return;
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") setMobileOpen(false);
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
 }, [mobileOpen]);

 useEffect(() => {
  const mq = window.matchMedia("(max-width: 760px)");
  const onWide = () => {
   if (!mq.matches) setMobileOpen(false);
  };
  mq.addEventListener("change", onWide);
  return () => mq.removeEventListener("change", onWide);
 }, []);

 useEffect(() => {
  const mq = window.matchMedia("(max-width: 760px)");
  if (mq.matches && mobileOpen) {
   document.body.style.overflow = "hidden";
  } else {
   document.body.style.overflow = "";
  }
  return () => {
   document.body.style.overflow = "";
  };
 }, [mobileOpen]);

 return (
  <>
   {mobileOpen && (
    <button
     type="button"
     className="fixed inset-0 z-[90] bg-ink/35 min-[761px]:hidden"
     aria-label="Закрыть фильтры"
     onClick={closeMobile}
    />
   )}

   {!mobileOpen && (
    <button
     type="button"
     className="fixed top-1/2 left-0 z-[95] flex -translate-y-1/2 items-center rounded-r-lg border border-l-0 border-theme bg-parchment py-3 pr-2 pl-1 text-ink shadow-md transition hover:bg-sand min-[761px]:hidden"
     aria-expanded={false}
     aria-controls="search-filters-panel"
     onClick={() => setMobileOpen(true)}
    >
     <span className="sr-only">Открыть фильтры поиска</span>
     <ChevronRightIcon />
    </button>
   )}

   <aside
    id="search-filters-panel"
    className={
     "search-sidebar flex w-64 shrink-0 flex-col gap-4 border-r border-theme bg-parchment p-4 " +
     "min-[761px]:relative min-[761px]:translate-x-0 " +
     "max-[760px]:fixed max-[760px]:top-0 max-[760px]:left-0 max-[760px]:z-[100] max-[760px]:h-full max-[760px]:max-h-dvh " +
     "max-[760px]:overflow-y-auto max-[760px]:shadow-xl max-[760px]:transition-transform max-[760px]:duration-300 max-[760px]:ease-out " +
     (mobileOpen ? "max-[760px]:translate-x-0" : "max-[760px]:-translate-x-full")
    }
   >
    <div className="flex items-start justify-between gap-2 min-[761px]:contents">
     <h3 className="font-serif text-sm font-semibold text-ink">
      Фильтры поиска
     </h3>
     <button
      type="button"
      className="shrink-0 rounded-lg border border-theme p-1.5 text-ink transition hover:bg-sand max-[760px]:inline-flex min-[761px]:hidden"
      aria-label="Свернуть фильтры"
      onClick={closeMobile}
     >
      <ChevronLeftIcon />
     </button>
    </div>

    <div>
     <label className="mb-1 block text-xs font-medium text-ink-muted">
      Поиск по тексту
     </label>
     <input
      type="text"
      value={filters.q ?? ""}
      onChange={(e) => onFiltersChange({ q: e.target.value })}
      placeholder="Автор, название, издательство..."
      className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
     />
    </div>

    <div>
     <label className="mb-1 block text-xs font-medium text-ink-muted">
      Автор
     </label>
     <input
      type="text"
      value={filters.author ?? ""}
      onChange={(e) => onFiltersChange({ author: e.target.value })}
      placeholder="ФИО автора"
      className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
     />
    </div>

    <div>
     <label className="mb-1 block text-xs font-medium text-ink-muted">
      Название книги
     </label>
     <input
      type="text"
      value={filters.title ?? ""}
      onChange={(e) => onFiltersChange({ title: e.target.value })}
      placeholder="Название"
      className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
     />
    </div>

    <div>
     <label className="mb-1 block text-xs font-medium text-ink-muted">
      Издательство
     </label>
     <input
      type="text"
      value={filters.publisher ?? ""}
      onChange={(e) => onFiltersChange({ publisher: e.target.value })}
      placeholder="Издательство"
      className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
     />
    </div>

    <div>
     <label className="mb-1 block text-xs font-medium text-ink-muted">
      Год издания
     </label>
     <input
      type="number"
      min={1000}
      max={2100}
      value={filters.year ?? ""}
      onChange={(e) => onFiltersChange({ year: e.target.value || undefined })}
      placeholder="Год"
      className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
     />
    </div>

    <div>
     <label className="mb-1 block text-xs font-medium text-ink-muted">
      Локация
     </label>
     <select
      value={filters.location_id ?? ""}
      onChange={(e) =>
       onFiltersChange({
        location_id: e.target.value ? Number(e.target.value) : undefined,
        archive_id: undefined,
       })
      }
      className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
     >
      <option value="">Все локации</option>
      {locations.map((loc) => (
       <option key={loc.id} value={loc.id}>
        {loc.name}
       </option>
      ))}
     </select>
    </div>

    {filters.location_id && (
     <div>
      <label className="mb-1 block text-xs font-medium text-ink-muted">
       Архив
      </label>
      <select
       value={filters.archive_id ?? ""}
       onChange={(e) =>
        onFiltersChange({
         archive_id: e.target.value ? Number(e.target.value) : undefined,
        })
       }
       className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
      >
       <option value="">Все архивы</option>
       {archives.map((arch) => (
        <option key={arch.id} value={arch.id}>
         {arch.name}
        </option>
       ))}
      </select>
     </div>
    )}

    <div className="flex items-center gap-2">
     <input
      type="checkbox"
      id="has_photo"
      checked={filters.has_photo ?? false}
      onChange={(e) => onFiltersChange({ has_photo: e.target.checked })}
      className="h-4 w-4 rounded border-theme"
     />
     <label htmlFor="has_photo" className="text-sm text-ink">
      Только с обложкой
     </label>
    </div>

    <button
     onClick={handleSearchClick}
     className="mt-2 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
    >
     Найти
    </button>
   </aside>
  </>
 );
});
