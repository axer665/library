"use client";

import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Сортировка: вся карточка — зона жеста.
 * Тач: TouchSensor (delay + tolerance) — удержание почти без движения, иначе скролл.
 * Мышь: MouseSensor, порог по смещению.
 * Поведение `touch-action` на таче — см. SORTABLE_TOUCH.md.
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

  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setIsCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
      className={`sortable-card-item relative min-w-0 rounded-2xl ${
        isCoarsePointer ? "sortable-card-item--coarse-touch" : ""
      } ${isDragging ? "ring-2 ring-accent/60" : ""} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
