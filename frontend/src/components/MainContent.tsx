"use client";

import type { Location, Archive, Book } from "@/stores/catalogStore";
import { LocationList } from "@/components/lists/LocationList";
import { ArchiveList } from "@/components/lists/ArchiveList";
import { BookList } from "@/components/lists/BookList";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface MainContentProps {
 view: "locations" | "archives" | "books";
 loading?: boolean;
 locations?: Location[];
 archives?: Archive[];
 books?: Book[];
 selectedLocationName?: string;
 selectedArchiveName?: string;
 onSelectLocation?: (id: number) => void;
 onSelectArchive?: (id: number) => void;
 onArchiveClick?: (locationId: number, archiveId: number) => void;
 onAddLocation?: () => void;
 onAddArchive?: () => void;
 onAddBook?: () => void;
 onBackToLocations?: () => void;
 onBackToArchives?: () => void;
 onEditLocation?: (loc: Location) => void;
 onEditArchive?: (arch: Archive) => void;
 onEditBook?: (book: Book) => void;
 onReorderLocations?: (orderedIds: number[]) => void;
 onReorderArchives?: (orderedIds: number[]) => void;
 onReorderBooks?: (orderedIds: number[]) => void;
}

export function MainContent({
 view,
 loading = false,
 locations = [],
 archives = [],
 books = [],
 selectedLocationName,
 selectedArchiveName,
 onSelectLocation,
 onSelectArchive,
 onArchiveClick,
 onAddLocation,
 onAddArchive,
 onAddBook,
 onBackToLocations,
 onBackToArchives,
 onEditLocation,
 onEditArchive,
 onEditBook,
 onReorderLocations,
 onReorderArchives,
 onReorderBooks,
}: MainContentProps) {
 // Скелетон только если нет данных для текущего вида — иначе при client-навигации мерцает весь экран.
 const hasMeaningfulList =
  view === "locations"
   ? locations.length > 0
   : view === "archives"
    ? archives.length > 0
    : books.length > 0;
 const showBlockingLoading = loading && !hasMeaningfulList;

 const showEmptyAddLocations =
  view === "locations" && !loading && locations.length === 0;
 const showEmptyAddArchives =
  view === "archives" && !loading && archives.length === 0;
 const showEmptyAddBook = view === "books" && !loading && books.length === 0;

 const headerAction =
  view === "locations" ? (
   <button
    onClick={onAddLocation}
    className="ml-3 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
   >
    <span>+</span>
    <span>Добавить локацию</span>
   </button>
  ) : view === "archives" ? (
   <button
    onClick={onAddArchive}
    className="ml-3 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
   >
    <span>+</span>
    <span>Добавить архив</span>
   </button>
  ) : (
   <button
    onClick={onAddBook}
    className="ml-3 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
   >
    <span>+</span>
    <span>Добавить книгу</span>
   </button>
  );

 const breadcrumbs =
  view === "locations"
   ? [{ label: "Локации" }]
   : view === "archives"
    ? [
      { label: "Локации", onClick: onBackToLocations },
      {
       label: selectedLocationName
        ? `Архивы (${selectedLocationName})`
        : "Архивы",
      },
     ]
    : [
      { label: "Локации", onClick: onBackToLocations },
      {
       label: selectedLocationName
        ? `Архивы (${selectedLocationName})`
        : "Архивы",
       onClick: onBackToArchives,
      },
      {
       label: selectedArchiveName
        ? `Книги (${selectedArchiveName})`
        : "Книги",
      },
     ];

 const list =
  view === "locations" ? (
   <LocationList
    locations={locations}
    onSelect={(id) => onSelectLocation?.(id)}
    onArchiveClick={onArchiveClick}
    onEdit={onEditLocation}
    onReorder={onReorderLocations}
   />
  ) : view === "archives" ? (
   <ArchiveList
    archives={archives}
    onSelect={(id) => onSelectArchive?.(id)}
    onEdit={onEditArchive}
    onReorder={onReorderArchives}
   />
  ) : (
   <BookList
    books={books}
    onEdit={(book) => onEditBook?.(book)}
    onReorder={onReorderBooks}
   />
  );

 const content =
  showEmptyAddLocations ? (
   <div className="flex flex-1 flex-col items-center justify-center p-8">
    <p className="mb-4 font-serif text-lg text-ink-muted">Пока нет локаций</p>
    <button
     onClick={onAddLocation}
     className="flex items-center gap-2 rounded-xl border-2 border-dashed border-theme bg-parchment px-6 py-4 text-ink-muted transition hover-border-accent hover:bg-accent-muted hover:text-accent"
    >
     <span className="text-2xl">+</span>
     <span className="font-medium">Добавить локацию</span>
    </button>
   </div>
  ) : showEmptyAddArchives ? (
   <div className="flex flex-1 flex-col items-center justify-center p-8">
    <p className="mb-4 font-serif text-lg text-ink-muted">
     В этой локации пока нет архивов
    </p>
    <button
     onClick={onAddArchive}
     className="flex items-center gap-2 rounded-xl border-2 border-dashed border-theme bg-parchment px-6 py-4 text-ink-muted transition hover-border-accent hover:bg-accent-muted hover:text-accent"
    >
     <span className="text-2xl">+</span>
     <span className="font-medium">Добавить архив</span>
    </button>
   </div>
  ) : showEmptyAddBook ? (
   <div className="flex flex-1 flex-col items-center justify-center p-8">
    <p className="mb-4 font-serif text-lg text-ink-muted">
     В этом архиве пока нет книг
    </p>
    <button
     onClick={onAddBook}
     className="flex items-center gap-2 rounded-xl border-2 border-dashed border-theme bg-parchment px-6 py-4 text-ink-muted transition hover-border-accent hover:bg-accent-muted hover:text-accent"
    >
     <span className="text-2xl">+</span>
     <span className="font-medium">Добавить книгу</span>
    </button>
   </div>
  ) : (
   list
  );

 return (
  <main className="flex flex-1 flex-col overflow-hidden bg-cream">
   <div className="flex items-center justify-between border-b border-theme bg-parchment px-6 py-3">
    <div className="flex items-center gap-4">
     <Breadcrumbs items={breadcrumbs} />
    </div>
    {headerAction}
   </div>
   <div className="relative flex-1 overflow-hidden">
    <div
     className={`absolute inset-0 overflow-auto transition-opacity duration-300 ${
      showBlockingLoading ? "z-10 opacity-100" : "z-0 pointer-events-none opacity-0"
     }`}
    >
     <ContentSkeleton view={view} />
    </div>
    <div
     className={`absolute inset-0 overflow-auto transition-opacity duration-300 ${
      showBlockingLoading ? "z-0 pointer-events-none opacity-0" : "z-10 opacity-100"
     }`}
    >
     {content}
    </div>
   </div>
  </main>
 );
}
