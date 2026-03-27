"use client";

import type { Book } from "@/stores/catalogStore";
import { BookCard } from "@/components/cards/BookCard";
import { CardGrid } from "@/components/cards/CardGrid";

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
}

export function BookList({ books, onEdit }: BookListProps) {
  return (
    <CardGrid>
      {books.map((book) => (
        <BookCard key={book.id} book={book} onEdit={onEdit} />
      ))}
    </CardGrid>
  );
}
