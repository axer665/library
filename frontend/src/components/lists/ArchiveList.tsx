"use client";

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { useCatalogSortableSensors } from "@/components/sortable/useCatalogSortableSensors";
import type { Archive } from "@/stores/catalogStore";
import { ArchiveCard } from "@/components/cards/ArchiveCard";
import { CardGrid } from "@/components/cards/CardGrid";
import { CatalogSortableDragTouchLock } from "@/components/sortable/CatalogSortableDragTouchLock";
import { SortableCardItem } from "@/components/sortable/SortableCardItem";

interface ArchiveListProps {
  archives: Archive[];
  onSelect: (id: number) => void;
  onEdit?: (arch: Archive) => void;
  onReorder?: (orderedIds: number[]) => void;
}

export function ArchiveList({ archives, onSelect, onEdit, onReorder }: ArchiveListProps) {
  const sensors = useCatalogSortableSensors();

  const ids = archives.map((a) => a.id);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = archives.findIndex((a) => a.id === active.id);
    const newIndex = archives.findIndex((a) => a.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(archives, oldIndex, newIndex).map((a) => a.id));
  };

  if (!onReorder) {
    return (
      <CardGrid>
        {archives.map((arch) => (
          <ArchiveCard
            key={arch.id}
            archive={arch}
            onClick={() => onSelect(arch.id)}
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
          {archives.map((arch) => (
            <SortableCardItem key={arch.id} id={arch.id}>
              <ArchiveCard archive={arch} onClick={() => onSelect(arch.id)} onEdit={onEdit} />
            </SortableCardItem>
          ))}
        </CardGrid>
      </SortableContext>
    </DndContext>
  );
}
