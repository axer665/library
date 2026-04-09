"use client";

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * Сенсоры для сортировки карточек каталога.
 * Мышь/трекпад: перетаскивание только после заметного смещения (не с первого пикселя).
 * Касание: удержание без заметного движения — иначе жест считается скроллом (tolerance внутри delay).
 */
export function useCatalogSortableSensors() {
  return useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 12 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 280,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}
