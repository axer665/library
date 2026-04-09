"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

  /* touch-pan-y: вертикальный скролл страницы с карточки; touch-none только во время drag. */
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`min-w-0 ${isDragging ? "touch-none" : "touch-pan-y"} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
