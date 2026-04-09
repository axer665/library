"use client";

import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CATALOG_TOUCH_HOLD_MS } from "@/components/sortable/useCatalogSortableSensors";

/** Роза ветров — метка режима сортировки на таче (только подсказка, не перехватывает касания). */
function CompassRoseIcon() {
  return (
    <svg
      className="sortable-card-item__compass h-4 w-4 shrink-0 opacity-80"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.65" />
      <path fill="currentColor" d="M12 3.15 14.55 10.35 12 8.4 9.45 10.35z" />
      <path fill="currentColor" fillOpacity={0.3} d="M12 20.85 9.45 13.65 12 15.6 14.55 13.65z" />
      <path
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        d="M12 5.4v1.55M12 17.05v1.55M5.4 12h1.55M17.05 12h1.55"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity={0.5}
        d="M7.2 7.2l1.05 1.05M15.75 7.2l-1.05 1.05M7.2 16.8l1.05-1.05M15.75 16.8l-1.05-1.05"
      />
    </svg>
  );
}

/**
 * Сортировка: вся карточка — зона жеста.
 * Тач: TouchSensor (delay + tolerance) = удержание пальца ~без движения, иначе скролл.
 * Мышь: порог по смещению. Метка с розой — только на таче, подсказка про удержание.
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

  const [showTouchHint, setShowTouchHint] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setShowTouchHint(mq.matches);
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

  const holdSeconds = (CATALOG_TOUCH_HOLD_MS / 1000).toFixed(1).replace(".", ",");
  const holdHint = `Удерживайте карточку около ${holdSeconds} с без движения, затем ведите для сортировки`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-card-item relative min-w-0 rounded-2xl ${
        showTouchHint ? "sortable-card-item--coarse-touch" : ""
      } ${isDragging ? "ring-2 ring-accent/60" : ""} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      {...attributes}
      {...listeners}
    >
      {showTouchHint && (
        <span
          className="sortable-card-item__dnd-hint pointer-events-none absolute right-[calc(0.75rem+2.25rem+0.5rem)] top-3 z-[11] flex h-9 w-9 items-center justify-center rounded-lg border border-theme/60 bg-white/90 text-ink-light shadow-sm backdrop-blur-[2px]"
          title={holdHint}
        >
          <CompassRoseIcon />
          <span className="sr-only">{holdHint}</span>
        </span>
      )}
      {children}
    </div>
  );
}
