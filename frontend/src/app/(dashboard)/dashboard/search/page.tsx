"use client";

import { useEffect, useId, useState } from "react";
import { observer } from "mobx-react-lite";
import { SearchView } from "@/components/SearchView";
import { Modal } from "@/components/Modal";
import { catalogStore } from "@/stores/catalogStore";
import type { Archive, Book } from "@/stores/catalogStore";
import { api } from "@/lib/api";

function SearchPage() {
 const bookFormDomId = useId().replace(/:/g, "");
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
 const [bookEditLocationId, setBookEditLocationId] = useState<number | null>(null);
 const [bookEditArchiveId, setBookEditArchiveId] = useState<number | null>(null);
 const [bookEditArchivesList, setBookEditArchivesList] = useState<Archive[]>([]);

 useEffect(() => {
  void catalogStore.ensureLocationIndex();
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
  const fromArch = book.archive_id ?? book.archive?.id ?? null;
  const fromLoc =
   book.archive?.location_id ??
   book.archive?.location?.id ??
   catalogStore.allLocationsMinimal[0]?.id ??
   null;
  setBookEditLocationId(fromLoc);
  setBookEditArchiveId(fromArch);
  setBookEditArchivesList([]);
  setModal("editBook");
 };

 useEffect(() => {
  if (modal !== "editBook" || !bookEditLocationId) {
   if (modal !== "editBook") setBookEditArchivesList([]);
   return;
  }
  let cancelled = false;
  void api.archives.listCompact(bookEditLocationId).then((list) => {
   if (!cancelled) setBookEditArchivesList(list);
  });
  return () => {
   cancelled = true;
  };
 }, [modal, bookEditLocationId]);

 const submitBook = async () => {
  const { author, title, publisher, annotation, year, photo } = bookForm;
  if (!author.trim() || !title.trim() || !publisher.trim() || !editingBook) return;
  if (bookEditArchiveId == null || bookEditLocationId == null) return;

  const fromArch =
   editingBook.archive_id ?? editingBook.archive?.id ?? null;
  const fromLoc =
   editingBook.archive?.location_id ?? editingBook.archive?.location?.id ?? undefined;

  const payload: {
   author: string;
   title: string;
   publisher: string;
   annotation?: string;
   year?: number;
   archive_id?: number;
  } = {
   author: author.trim(),
   title: title.trim(),
   publisher: publisher.trim(),
   annotation: annotation.trim() || undefined,
   year: year ? parseInt(year, 10) : undefined,
  };

  let move:
   | {
     fromArchiveId: number;
     fromLocationId?: number;
     toArchiveId: number;
     toLocationId?: number;
    }
   | undefined;

  if (fromArch != null && bookEditArchiveId !== fromArch) {
   payload.archive_id = bookEditArchiveId;
   move = {
    fromArchiveId: fromArch,
    fromLocationId: fromLoc,
    toArchiveId: bookEditArchiveId,
    toLocationId: bookEditLocationId,
   };
  }

  await catalogStore.updateBook(editingBook.id, payload, move);
  if (photo) await catalogStore.uploadBookPhoto(editingBook.id, photo);
  setModal(null);
  setEditingBook(null);
  setBookEditLocationId(null);
  setBookEditArchiveId(null);
  setBookEditArchivesList([]);
  await catalogStore.applySearch(catalogStore.searchPagination?.current_page ?? 1);
 };

 return (
  <>
   <SearchView onEditBook={handleEditBook} />

   {modal === "editBook" && editingBook && (
    <Modal
     title="Редактировать книгу"
     size="lg"
     onClose={() => {
      setModal(null);
      setEditingBook(null);
      setBookEditLocationId(null);
      setBookEditArchiveId(null);
      setBookEditArchivesList([]);
     }}
     footer={
      <div className="flex gap-2">
       <button
        type="submit"
        form={bookFormDomId}
        disabled={
         !bookForm.author.trim() ||
         !bookForm.title.trim() ||
         !bookForm.publisher.trim() ||
         bookEditArchiveId == null ||
         bookEditLocationId == null ||
         bookEditArchivesList.length === 0
        }
        className="flex-1 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
       >
        Сохранить
       </button>
       <button
        type="button"
        onClick={() => setModal(null)}
        className="cursor-pointer rounded-lg border border-theme px-4 py-2 text-sm font-medium text-ink transition hover:bg-sand"
       >
        Отмена
       </button>
      </div>
     }
    >
     <form
      id={bookFormDomId}
      onSubmit={(e) => {
       e.preventDefault();
       submitBook();
      }}
      className="space-y-4"
     >
      <div>
       <label className="mb-1 block text-sm font-medium text-ink-muted">
        Локация
       </label>
       <select
        value={bookEditLocationId ?? ""}
        onChange={(e) => {
         const v = e.target.value ? Number(e.target.value) : null;
         setBookEditLocationId(v);
         setBookEditArchiveId(null);
        }}
        className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
       >
        <option value="" disabled>
         Выберите локацию
        </option>
        {(catalogStore.allLocationsMinimal.length
         ? catalogStore.allLocationsMinimal
         : catalogStore.locations
        ).map((loc) => (
         <option key={loc.id} value={loc.id}>
          {loc.name}
         </option>
        ))}
       </select>
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink-muted">
        Архив
       </label>
       <select
        value={bookEditArchiveId ?? ""}
        onChange={(e) =>
         setBookEditArchiveId(e.target.value ? Number(e.target.value) : null)
        }
        className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
        disabled={!bookEditLocationId || bookEditArchivesList.length === 0}
       >
        <option value="" disabled>
         {bookEditArchivesList.length === 0 ? "Нет архивов" : "Выберите архив"}
        </option>
        {bookEditArchivesList.map((a) => (
         <option key={a.id} value={a.id}>
          {a.name}
         </option>
        ))}
       </select>
      </div>
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
     </form>
    </Modal>
   )}
  </>
 );
}

export default observer(SearchPage);
