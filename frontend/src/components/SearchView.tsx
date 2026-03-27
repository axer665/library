"use client";

import { observer } from "mobx-react-lite";
import { SearchSidebar } from "@/components/SearchSidebar";
import { BookList } from "@/components/lists/BookList";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { catalogStore } from "@/stores/catalogStore";
import type { Book } from "@/stores/catalogStore";

interface SearchViewProps {
 onEditBook: (book: Book) => void;
}

export const SearchView = observer(function SearchView({ onEditBook }: SearchViewProps) {
 const {
  searchFilters,
  searchResults,
  searchPagination,
  searchLoading,
  locations,
  filterArchives,
 } = catalogStore;

 const handleSearch = () => catalogStore.applySearch(1);

 const handlePageChange = (page: number) => catalogStore.applySearch(page);

 return (
  <div className="flex flex-1 overflow-hidden bg-cream">
   <SearchSidebar
    filters={searchFilters}
    locations={locations}
    archives={filterArchives}
    onFiltersChange={(f) => catalogStore.setSearchFilters(f)}
    onSearch={handleSearch}
   />

   <div className="relative flex flex-1 flex-col overflow-hidden">
    <div className="flex items-center justify-between border-b border-theme bg-parchment px-6 py-3">
     <h2 className="font-serif text-base font-medium text-ink">
      Поиск книг
      {searchPagination && (
       <span className="ml-2 text-sm font-normal text-ink-muted">
        (найдено: {searchPagination.total})
       </span>
      )}
     </h2>
    </div>

    <div className="relative flex-1 overflow-hidden">
     <div
      className={`absolute inset-0 overflow-auto transition-opacity duration-300 ${
       searchLoading ? "z-10 opacity-100" : "z-0 pointer-events-none opacity-0"
      }`}
     >
      <ContentSkeleton view="books" />
     </div>
     <div
      className={`absolute inset-0 overflow-auto transition-opacity duration-300 ${
       searchLoading ? "z-0 pointer-events-none opacity-0" : "z-10 opacity-100"
      }`}
     >
      {searchResults.length === 0 ? (
       <div className="flex flex-1 flex-col items-center justify-center p-12">
        <p className="font-serif text-lg text-ink-muted">
         {searchPagination ? "Ничего не найдено" : "Задайте фильтры и нажмите «Найти»"}
        </p>
       </div>
      ) : (
       <>
        <div className="p-6">
         <BookList books={searchResults} onEdit={onEditBook} />
        </div>

        {searchPagination && searchPagination.last_page > 1 && (
         <div className="flex items-center justify-center gap-2 border-t border-theme bg-parchment px-6 py-3">
          <button
           onClick={() => handlePageChange(searchPagination.current_page - 1)}
           disabled={searchPagination.current_page <= 1}
           className="rounded-lg border border-theme px-3 py-1.5 text-sm text-ink transition hover:bg-sand disabled:opacity-50"
          >
           ← Назад
          </button>
          <span className="text-sm text-ink-muted">
           {searchPagination.current_page} / {searchPagination.last_page}
          </span>
          <button
           onClick={() => handlePageChange(searchPagination.current_page + 1)}
           disabled={searchPagination.current_page >= searchPagination.last_page}
           className="rounded-lg border border-theme px-3 py-1.5 text-sm text-ink transition hover:bg-sand disabled:opacity-50"
          >
           Вперёд →
          </button>
         </div>
        )}
       </>
      )}
     </div>
    </div>
   </div>
  </div>
 );
});
