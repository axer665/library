"use client";

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { useCatalogSortableSensors } from "@/components/sortable/useCatalogSortableSensors";
import type { Book } from "@/stores/catalogStore";
import { BookCard } from "@/components/cards/BookCard";
import { CardGrid } from "@/components/cards/CardGrid";
import { SortableCardItem } from "@/components/sortable/SortableCardItem";

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onReorder?: (orderedIds: number[]) => void;
}

export function BookList({ books, onEdit, onReorder }: BookListProps) {
  const sensors = useCatalogSortableSensors();

  const ids = books.map((b) => b.id);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = books.findIndex((b) => b.id === active.id);
    const newIndex = books.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(books, oldIndex, newIndex).map((b) => b.id));
  };

  if (!onReorder) {
    return (
      <CardGrid>
        {books.map((book) => (
          <BookCard key={book.id} book={book} onEdit={onEdit} />
        ))}
      </CardGrid>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <CardGrid>
          {books.map((book) => (
            <SortableCardItem key={book.id} id={book.id}>
              <BookCard book={book} onEdit={onEdit} />
            </SortableCardItem>
          ))}
        </CardGrid>
      </SortableContext>
    </DndContext>
  );
}
