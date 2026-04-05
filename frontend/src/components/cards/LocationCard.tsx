"use client";

import type { Location, ArchivePreview, BookPreview } from "@/stores/catalogStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function getPhotoUrl(path: string) {
 const base = API_URL.replace("/api", "");
 return `${base}/storage/${path}`;
}

/** Помещение / зона хранения (не геометка на карте). */
function LocationCardIcon() {
 return (
  <svg
   className="location-card__icon-svg h-9 w-9 shrink-0 sm:h-10 sm:w-10"
   xmlns="http://www.w3.org/2000/svg"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.6"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden
  >
   <path d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
   <path d="M9 21.5v-7h6v7" />
  </svg>
 );
}

function EditButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
 return (
  <button
   type="button"
   onClick={(e) => {
    e.stopPropagation();
    onClick(e);
   }}
   className="location-card__edit absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-ink-light shadow-md transition hover:bg-white hover:text-accent"
   title="Редактировать"
   aria-label="Редактировать локацию"
  >
   <svg
    className="location-card__edit-icon"
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

function BookSquare({ book }: { book: BookPreview }) {
 return (
  <div
   className="location-card__book-thumb h-12 w-12 shrink-0 overflow-hidden rounded bg-sand transition hover:ring-2 hover-ring-accent hover:ring-offset-1"
   title={book.title}
   onClick={(e) => e.stopPropagation()}
  >
   {book.photo_path ? (
    <img
     className="location-card__book-thumb-img h-full w-full object-cover"
     src={getPhotoUrl(book.photo_path)}
     alt={book.title}
    />
   ) : (
    <div className="location-card__book-thumb-placeholder flex h-full w-full items-center justify-center text-[10px] text-ink-light">
     📖
    </div>
   )}
  </div>
 );
}

function ArchiveBlock({
 archive,
 onArchiveClick,
}: {
 archive: ArchivePreview;
 onArchiveClick: (e: React.MouseEvent) => void;
}) {
 const books = archive.books ?? [];
 const hasBooks = books.length > 0;
 return (
  <button
   type="button"
   onClick={onArchiveClick}
   aria-label={`Открыть архив ${archive.name}`}
   className="location-card__archive-block flex shrink-0 flex-col overflow-hidden rounded-lg border border-theme bg-parchment transition hover-border-accent hover:bg-accent-muted hover:shadow-sm"
  >
   <div className="location-card__archive-block-header shrink-0 rounded-t-lg border-b border-theme bg-sand px-2 py-1.5">
    <span className="location-card__archive-block-name truncate text-xs font-medium text-ink">{archive.name}</span>
   </div>
   <div className="location-card__archive-block-body flex flex-wrap items-center gap-1.5 overflow-hidden p-2">
    {hasBooks ? (
     books.slice(0, 5).map((book) => (
      <BookSquare key={book.id} book={book} />
     ))
    ) : (
     <span className="location-card__archive-block-empty text-[10px] text-ink-light">Нет книг</span>
    )}
   </div>
  </button>
 );
}

interface LocationCardProps {
 location: Location;
 onClick?: () => void;
 onArchiveClick?: (locationId: number, archiveId: number) => void;
 onEdit?: (loc: Location) => void;
}

export function LocationCard({ location, onClick, onArchiveClick, onEdit }: LocationCardProps) {
 const archives = location.archives ?? [];

 const handleArchiveClick = (archId: number) => (e: React.MouseEvent) => {
  e.stopPropagation();
  onArchiveClick?.(location.id, archId);
 };

 return (
  <div className="location-card card-3d relative">
   <div className="location-card__inner card-inner rounded-2xl">
    <div
     role={onClick ? "button" : undefined}
     tabIndex={onClick ? 0 : undefined}
     onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
     onClick={onClick}
     className="location-card__face location-card__face--front card-front card-surface card-surface--location group"
    >
     <div className="location-card__header flex items-center gap-3 rounded-t-[14px] border-b border-theme bg-sand p-4">
      <span className="location-card__icon flex shrink-0 text-accent" aria-hidden>
       <LocationCardIcon />
      </span>
      <div className="location-card__title-group min-w-0 flex-1">
       <h3 className="location-card__title truncate font-serif text-xl font-semibold text-ink">{location.name}</h3>
       {"archives_count" in location && location.archives_count != null && (
        <p className="location-card__meta text-sm text-ink-light">
         Архивов: {location.archives_count}
        </p>
       )}
      </div>
     </div>

     <div className="location-card__body flex flex-col gap-2 p-3">
      {archives.slice(0, 3).map((arch) => (
       <ArchiveBlock key={arch.id} archive={arch} onArchiveClick={handleArchiveClick(arch.id)} />
      ))}
      {archives.length === 0 && (
       <p className="location-card__empty py-2 text-center text-sm text-ink-light">Нет архивов</p>
      )}
     </div>
    </div>

    <div
     role={onClick ? "button" : undefined}
     tabIndex={onClick ? 0 : undefined}
     onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
     onClick={onClick}
     className="location-card__face location-card__face--back card-back flex flex-col rounded-2xl border-2 border-theme bg-sand p-4"
    >
     <p className="location-card__back-title mb-2 font-serif text-sm font-semibold text-ink">Архивы в локации</p>
     {"archives_count" in location && location.archives_count != null && (
      <p className="location-card__back-meta mb-3 text-xs text-ink-light">
       Всего: {location.archives_count} {location.archives_count === 1 ? "архив" : "архивов"}
      </p>
     )}
     <ul className="location-card__list flex flex-col gap-2">
      {archives.length > 0 ? (
       archives.slice(0, 3).map((arch) => {
        const bookCount = arch.books?.length ?? 0;
        return (
         <li
          key={arch.id}
          className="location-card__list-item flex items-center justify-between gap-2 rounded bg-parchment px-2 py-1.5"
         >
          <span className="location-card__archive-name truncate text-sm font-medium text-ink">{arch.name}</span>
          {bookCount > 0 && (
           <span className="location-card__book-count shrink-0 text-xs text-ink-light">
            {bookCount} {bookCount === 1 ? "книга" : "книг"}
           </span>
          )}
         </li>
        );
       })
      ) : (
       <li className="location-card__list-empty text-sm text-ink-light">Нет архивов</li>
      )}
     </ul>
    </div>
   </div>
   {onEdit && <EditButton onClick={() => onEdit(location)} />}
  </div>
 );
}
