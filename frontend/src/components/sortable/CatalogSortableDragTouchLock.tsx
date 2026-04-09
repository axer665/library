"use client";

import { useEffect } from "react";
import { useDndMonitor } from "@dnd-kit/core";

/**
 * TouchSensor вешает слушатели на deepest event.target внутри карточки.
 * Пока идёт drag, переводим такие элементы в touch-action: none через html-класс,
 * иначе overflow-auto родителя продолжает скроллиться тем же жестом.
 */
export function CatalogSortableDragTouchLock() {
  useDndMonitor({
    onDragStart() {
      document.documentElement.classList.add("catalog-dnd-dragging");
    },
    onDragEnd() {
      document.documentElement.classList.remove("catalog-dnd-dragging");
    },
    onDragCancel() {
      document.documentElement.classList.remove("catalog-dnd-dragging");
    },
  });

  useEffect(
    () => () => {
      document.documentElement.classList.remove("catalog-dnd-dragging");
    },
    [],
  );

  return null;
}
