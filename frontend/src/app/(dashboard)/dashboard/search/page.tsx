"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { SearchView } from "@/components/SearchView";
import { Modal } from "@/components/Modal";
import { catalogStore } from "@/stores/catalogStore";
import type { Book } from "@/stores/catalogStore";

function SearchPage() {
 const [modal, setModal] = useState<"editBook" | null>(null);
 const [editingBook, setEditingBook] = useState<Book | null>(null);
 const [bookForm, setBookForm] = useState({
  author: "",
  title: "",
  publisher: "",
  annotation: "",
  year: "",
  photo: null as File | null,
 });

 useEffect(() => {
  catalogStore.loadLocations();
 }, []);

 const handleEditBook = (book: Book) => {
  setEditingBook(book);
  setBookForm({
   author: book.author,
   title: book.title,
   publisher: book.publisher,
   annotation: book.annotation || "",
   year: book.year ? String(book.year) : "",
   photo: null,
  });
  setModal("editBook");
 };

 const submitBook = async () => {
  const { author, title, publisher, annotation, year, photo } = bookForm;
  if (!author.trim() || !title.trim() || !publisher.trim() || !editingBook) return;
  await catalogStore.updateBook(editingBook.id, {
   author: author.trim(),
   title: title.trim(),
   publisher: publisher.trim(),
   annotation: annotation.trim() || undefined,
   year: year ? parseInt(year, 10) : undefined,
  });
  if (photo) await catalogStore.uploadBookPhoto(editingBook.id, photo);
  setModal(null);
  setEditingBook(null);
  await catalogStore.applySearch(catalogStore.searchPagination?.current_page ?? 1);
 };

 return (
  <>
   <SearchView onEditBook={handleEditBook} />

   {modal === "editBook" && editingBook && (
    <Modal
     title="Редактировать книгу"
     onClose={() => {
      setModal(null);
      setEditingBook(null);
     }}
    >
     <form
      onSubmit={(e) => {
       e.preventDefault();
       submitBook();
      }}
      className="space-y-4"
     >
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Автор *</label>
       <input
        type="text"
        value={bookForm.author}
        onChange={(e) => setBookForm((p) => ({ ...p, author: e.target.value }))}
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
        required
       />
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Название *</label>
       <input
        type="text"
        value={bookForm.title}
        onChange={(e) => setBookForm((p) => ({ ...p, title: e.target.value }))}
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
        required
       />
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Издательство *</label>
       <input
        type="text"
        value={bookForm.publisher}
        onChange={(e) => setBookForm((p) => ({ ...p, publisher: e.target.value }))}
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
        required
       />
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Год</label>
       <input
        type="number"
        min={1000}
        max={2100}
        value={bookForm.year}
        onChange={(e) => setBookForm((p) => ({ ...p, year: e.target.value }))}
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       />
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Аннотация</label>
       <textarea
        value={bookForm.annotation}
        onChange={(e) => setBookForm((p) => ({ ...p, annotation: e.target.value }))}
        rows={3}
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       />
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">
        Обложка (оставьте пустым, чтобы не менять)
       </label>
       <input
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/gif"
        onChange={(e) => setBookForm((p) => ({ ...p, photo: e.target.files?.[0] ?? null }))}
        className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
       />
      </div>
      <div className="flex gap-2">
       <button
        type="submit"
        className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover-bg-accent-hover"
       >
        Сохранить
       </button>
       <button
        type="button"
        onClick={() => setModal(null)}
        className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-ink"
       >
        Отмена
       </button>
      </div>
     </form>
    </Modal>
   )}
  </>
 );
}

export default observer(SearchPage);
