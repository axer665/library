"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DragHandleIcon() {
  return (
    <svg
      className="sortable-card-item__handle-icon h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="17" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
    </svg>
  );
}

/**
 * Слой сортировки: ref и transform на обёртке; listeners только на ручке —
 * иначе на мобильных перехватываются touch-события всей карточки и ломается скролл.
 */
export function SortableCardItem({
  id,
  children,
}: {
  id: number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.92 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative min-w-0 ${isDragging ? "touch-none" : ""}`}
    >
      <button
        type="button"
        className={`sortable-card-item__handle touch-none absolute left-2 top-2 z-30 flex min-h-11 min-w-11 cursor-grab items-center justify-center rounded-lg border border-theme/80 bg-white/95 text-ink-light shadow-sm backdrop-blur-sm transition hover:border-accent/50 hover:bg-white hover:text-accent active:cursor-grabbing ${isDragging ? "cursor-grabbing" : ""}`}
        title="Перетащить для сортировки"
        aria-label="Перетащить для изменения порядка"
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon />
      </button>
      {children}
    </div>
  );
}
