"use client";

import type { Book } from "@/stores/catalogStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function getPhotoUrl(path: string) {
 const base = API_URL.replace("/api", "");
 return `${base}/storage/${path}`;
}

function EditButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
 return (
  <button
   type="button"
   onClick={(e) => {
    e.stopPropagation();
    onClick(e);
   }}
   className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-ink-light shadow-md transition hover:bg-white hover:text-accent"
   title="Редактировать"
   aria-label="Редактировать книгу"
  >
   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
  </button>
 );
}

interface BookCardProps {
 book: Book;
 onClick?: () => void;
 onEdit?: (book: Book) => void;
}

export function BookCard({ book, onClick, onEdit }: BookCardProps) {
 const handleClick = onClick ?? (() => onEdit?.(book));

 return (
  <div className="card-3d relative">
   <div className="card-inner h-full min-h-[420px] rounded-2xl">
    <div
     role="button"
     tabIndex={0}
     onKeyDown={(e) => e.key === "Enter" && handleClick()}
     onClick={handleClick}
     className="card-front card-surface card-surface--book group"
    >
     <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-t-[14px] bg-sand">
      {book.photo_path ? (
       <img
        src={getPhotoUrl(book.photo_path)}
        alt={book.title}
        className="h-full w-full object-cover transition group-hover:scale-105"
       />
      ) : (
       <div className="flex h-full w-full items-center justify-center text-ink-light">
        <span className="text-6xl" aria-hidden>📖</span>
       </div>
      )}
     </div>
     <div className="flex flex-col gap-1 p-5">
      <h3 className="truncate font-serif text-xl font-semibold text-ink">
       {book.title}
      </h3>
      <p className="truncate text-base text-ink-muted">{book.author}</p>
      {book.year && (
       <p className="text-base text-ink-light">{book.year}</p>
      )}
     </div>
    </div>

    <div
     role="button"
     tabIndex={0}
     onKeyDown={(e) => e.key === "Enter" && handleClick()}
     onClick={handleClick}
     className="card-back flex flex-col rounded-2xl border-2 border-theme bg-sand p-5"
    >
     <p className="mb-2 font-serif text-sm font-semibold text-ink">
      Аннотация
     </p>
     <p className="mb-4 flex-1 text-sm leading-relaxed text-ink">
      {book.annotation || "Аннотация отсутствует"}
     </p>
     <div className="space-y-1 border-t border-theme pt-3 text-xs text-ink-muted">
      {book.publisher && (
       <p>
        <span className="font-medium text-ink-light">Издательство:</span> {book.publisher}
       </p>
      )}
      {book.year && (
       <p>
        <span className="font-medium text-ink-light">Год:</span> {book.year}
       </p>
      )}
     </div>
    </div>
   </div>
   {onEdit && <EditButton onClick={() => onEdit(book)} />}
  </div>
 );
}
