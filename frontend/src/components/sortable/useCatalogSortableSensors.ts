"use client";

import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * Сенсоры для сортировки: перетаскивание только с ручки (`SortableCardItem`),
 * поэтому достаточно порога по расстоянию — скролл по карточке не перехватывается.
 */
export function useCatalogSortableSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}
