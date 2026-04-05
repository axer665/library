"use client";

import type { Archive } from "@/stores/catalogStore";

function EditButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
 return (
  <button
   type="button"
   onClick={(e) => {
    e.stopPropagation();
    onClick(e);
   }}
   className="archive-card__edit absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-ink-light shadow-md transition hover:bg-white hover:text-accent"
   title="Редактировать"
   aria-label="Редактировать архив"
  >
   <svg
    className="archive-card__edit-icon"
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

interface ArchiveCardProps {
 archive: Archive;
 onClick?: () => void;
 onEdit?: (arch: Archive) => void;
}

export function ArchiveCard({ archive, onClick, onEdit }: ArchiveCardProps) {
 return (
  <div className="archive-card card-3d relative">
   <div className="archive-card__inner card-inner h-full min-h-[420px] rounded-2xl">
    <div
     role={onClick ? "button" : undefined}
     tabIndex={onClick ? 0 : undefined}
     onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
     onClick={onClick}
     className="archive-card__face archive-card__face--front card-front card-surface card-surface--archive group"
    >
     <div className="archive-card__hero flex min-h-[180px] flex-1 items-center justify-center rounded-t-[14px] bg-sand">
      <span className="archive-card__hero-icon text-7xl" aria-hidden>
       📁
      </span>
     </div>
     <div className="archive-card__content flex flex-col gap-1 p-5">
      <h3 className="archive-card__title truncate font-serif text-xl font-semibold text-ink">{archive.name}</h3>
      {"books_count" in archive && archive.books_count != null && (
       <p className="archive-card__meta text-base text-ink-light">Книг: {archive.books_count}</p>
      )}
     </div>
    </div>

    <div
     role={onClick ? "button" : undefined}
     tabIndex={onClick ? 0 : undefined}
     onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
     onClick={onClick}
     className="archive-card__face archive-card__face--back card-back flex flex-col justify-center rounded-2xl border-2 border-theme bg-sand p-5"
    >
     <p className="archive-card__back-title mb-3 font-serif text-sm font-semibold text-ink">{archive.name}</p>
     {"books_count" in archive && archive.books_count != null && (
      <p className="archive-card__back-count mb-4 text-2xl font-serif font-medium text-accent">
       {archive.books_count} {archive.books_count === 1 ? "книга" : "книг"} в архиве
      </p>
     )}
     <p className="archive-card__back-hint text-sm text-ink-muted">
      Нажмите на карточку, чтобы открыть каталог и просмотреть все книги
     </p>
    </div>
   </div>
   {onEdit && <EditButton onClick={() => onEdit(archive)} />}
  </div>
 );
}
