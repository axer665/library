"use client";

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { useCatalogSortableSensors } from "@/components/sortable/useCatalogSortableSensors";
import type { Location } from "@/stores/catalogStore";
import { LocationCard } from "@/components/cards/LocationCard";
import { CardGrid } from "@/components/cards/CardGrid";
import { CatalogSortableDragTouchLock } from "@/components/sortable/CatalogSortableDragTouchLock";
import { SortableCardItem } from "@/components/sortable/SortableCardItem";

interface LocationListProps {
  locations: Location[];
  onSelect: (id: number) => void;
  onArchiveClick?: (locationId: number, archiveId: number) => void;
  onEdit?: (loc: Location) => void;
  onReorder?: (orderedIds: number[]) => void;
}

export function LocationList({
  locations,
  onSelect,
  onArchiveClick,
  onEdit,
  onReorder,
}: LocationListProps) {
  const sensors = useCatalogSortableSensors();

  const ids = locations.map((l) => l.id);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = locations.findIndex((l) => l.id === active.id);
    const newIndex = locations.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(locations, oldIndex, newIndex).map((l) => l.id));
  };

  if (!onReorder) {
    return (
      <CardGrid>
        {locations.map((loc) => (
          <LocationCard
            key={loc.id}
            location={loc}
            onClick={() => onSelect(loc.id)}
            onArchiveClick={onArchiveClick}
            onEdit={onEdit}
          />
        ))}
      </CardGrid>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <CatalogSortableDragTouchLock />
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <CardGrid>
          {locations.map((loc) => (
            <SortableCardItem key={loc.id} id={loc.id}>
              <LocationCard
                location={loc}
                onClick={() => onSelect(loc.id)}
                onArchiveClick={onArchiveClick}
                onEdit={onEdit}
              />
            </SortableCardItem>
          ))}
        </CardGrid>
      </SortableContext>
    </DndContext>
  );
}
