"use client";

import { observer } from "mobx-react-lite";
import type { SearchFilters } from "@/stores/catalogStore";
import type { Location, Archive } from "@/stores/catalogStore";

interface SearchSidebarProps {
 filters: SearchFilters;
 locations: Location[];
 archives: Archive[];
 onFiltersChange: (filters: Partial<SearchFilters>) => void;
 onSearch: () => void;
}

export const SearchSidebar = observer(function SearchSidebar({
 filters,
 locations,
 archives,
 onFiltersChange,
 onSearch,
}: SearchSidebarProps) {

 return (
  <aside className="flex w-64 shrink-0 flex-col gap-4 border-r border-theme bg-parchment p-4">
   <h3 className="font-serif text-sm font-semibold text-ink">
    Фильтры поиска
   </h3>

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
    onClick={onSearch}
    className="mt-2 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
   >
    Найти
   </button>
  </aside>
 );
});
