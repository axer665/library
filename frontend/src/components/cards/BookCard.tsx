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
   onPointerDown={(e) => e.stopPropagation()}
   onClick={(e) => {
    e.stopPropagation();
    onClick(e);
   }}
   className="book-card__edit absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-ink-light shadow-md transition hover:bg-white hover:text-accent"
   title="Редактировать"
   aria-label="Редактировать книгу"
  >
   <svg
    className="book-card__edit-icon"
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
   >
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
  <div className="book-card card-3d relative">
   <div className="book-card__inner card-inner rounded-2xl">
    <div
     role="button"
     tabIndex={0}
     onKeyDown={(e) => e.key === "Enter" && handleClick()}
     onClick={handleClick}
     className="book-card__face book-card__face--front card-front card-surface card-surface--book group"
    >
     <div className="book-card__media relative flex-1 overflow-hidden rounded-t-[14px] bg-sand">
      {book.photo_path ? (
       <img
        className="book-card__img h-full w-full object-cover transition group-hover:scale-105"
        src={getPhotoUrl(book.photo_path)}
        alt={book.title}
       />
      ) : (
       <div className="book-card__placeholder flex h-full w-full items-center justify-center text-ink-light">
        <span className="book-card__placeholder-icon text-6xl" aria-hidden>
         📖
        </span>
       </div>
      )}
     </div>
     <div className="book-card__content flex flex-col gap-1 p-5">
      <h3 className="book-card__title truncate font-serif text-xl font-semibold text-ink">{book.title}</h3>
      <p className="book-card__author truncate text-base text-ink-muted">{book.author}</p>
      {book.year && <p className="book-card__year text-base text-ink-light">{book.year}</p>}
     </div>
    </div>

    <div
     role="button"
     tabIndex={0}
     onKeyDown={(e) => e.key === "Enter" && handleClick()}
     onClick={handleClick}
     className="book-card__face book-card__face--back card-back flex flex-col rounded-2xl border-2 border-theme bg-sand p-5"
    >
     <p className="book-card__back-title mb-2 font-serif text-sm font-semibold text-ink">Аннотация</p>
     <p className="book-card__annotation mb-4 flex-1 text-sm leading-relaxed text-ink">
      {book.annotation || "Аннотация отсутствует"}
     </p>
     <div className="book-card__details space-y-1 border-t border-theme pt-3 text-xs text-ink-muted">
      {book.publisher && (
       <p className="book-card__detail">
        <span className="book-card__detail-label font-medium text-ink-light">Издательство:</span>{" "}
        {book.publisher}
       </p>
      )}
      {book.year && (
       <p className="book-card__detail">
        <span className="book-card__detail-label font-medium text-ink-light">Год:</span> {book.year}
       </p>
      )}
     </div>
    </div>
   </div>
   {onEdit && <EditButton onClick={() => onEdit(book)} />}
  </div>
 );
}
