"use client";

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { MainContent } from "@/components/MainContent";
import { Modal } from "@/components/Modal";
import { catalogStore } from "@/stores/catalogStore";
import type { Location, Archive, Book } from "@/stores/catalogStore";

function DashboardPage({
 forceView,
 routeLoading,
}: {
 forceView?: "locations" | "archives" | "books";
 routeLoading?: boolean;
}) {
 const router = useRouter();
 const [modal, setModal] = useState<"location" | "archive" | "book" | "editLocation" | "editArchive" | "editBook" | null>(null);
 const [locationName, setLocationName] = useState("");
 const [archiveName, setArchiveName] = useState("");
 const [bookForm, setBookForm] = useState({
  author: "",
  title: "",
  publisher: "",
  annotation: "",
  year: "",
  photo: null as File | null,
 });
 const [editingLocation, setEditingLocation] = useState<Location | null>(null);
 const [editingArchive, setEditingArchive] = useState<Archive | null>(null);
 const [editingBook, setEditingBook] = useState<Book | null>(null);

 // Скелетон только если списка локаций ещё нет (первый заход / F5). При возврате из поиска — без мерцания.
 const [initialLoading, setInitialLoading] = useState(() => {
  if (forceView) return false;
  return catalogStore.locations.length === 0;
 });
 const startedRef = useRef(false);

 useEffect(() => {
  // Если мы пришли на /dashboard/locations/:id/... — загрузку сделают route-обёртки.
  if (forceView && forceView !== "locations") return;

  catalogStore.clearCatalogTransitionPending();

  if (!forceView) catalogStore.setLastCatalogUrl("/dashboard");
  if (startedRef.current) return;
  startedRef.current = true;

  void (async () => {
   const needLocations = catalogStore.locations.length === 0;
   if (needLocations) setInitialLoading(true);
   if (!forceView) catalogStore.backToLocations();
   if (needLocations) await catalogStore.loadLocations();
   setInitialLoading(false);
  })();
 }, [forceView]);

 const handleSelectLocation = (id: number) => {
  router.push(`/dashboard/locations/${id}/archives`);
 };

 const handleSelectArchive = (id: number) => {
  if (catalogStore.selectedLocationId) {
   router.push(`/dashboard/locations/${catalogStore.selectedLocationId}/archives/${id}`);
  }
 };

 const handleArchiveClick = (locationId: number, archiveId: number) => {
  router.push(`/dashboard/locations/${locationId}/archives/${archiveId}`);
 };

 const handleAddLocation = () => {
  setLocationName("");
  setEditingLocation(null);
  setModal("location");
 };

 const handleAddArchive = () => {
  setArchiveName("");
  setEditingArchive(null);
  setModal("archive");
 };

 const handleAddBook = () => {
  setBookForm({ author: "", title: "", publisher: "", annotation: "", year: "", photo: null });
  setEditingBook(null);
  setModal("book");
 };

 const handleEditLocation = (loc: Location) => {
  setEditingLocation(loc);
  setLocationName(loc.name);
  setModal("editLocation");
 };

 const handleEditArchive = (arch: Archive) => {
  setEditingArchive(arch);
  setArchiveName(arch.name);
  setModal("editArchive");
 };

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

 const submitLocation = async () => {
  const name = locationName.trim();
  if (!name) return;
  if (editingLocation) {
   await catalogStore.updateLocation(editingLocation.id, name);
  } else {
   await catalogStore.createLocation(name);
  }
  setModal(null);
  setEditingLocation(null);
 };

 const submitArchive = async () => {
  const name = archiveName.trim();
  if (!name || !catalogStore.selectedLocationId) return;
  if (editingArchive) {
   await catalogStore.updateArchive(editingArchive.id, { name });
  } else {
   await catalogStore.createArchive(catalogStore.selectedLocationId, name);
  }
  setModal(null);
  setEditingArchive(null);
 };

 const submitBook = async () => {
  const { author, title, publisher, annotation, year, photo } = bookForm;
  if (!author.trim() || !title.trim() || !publisher.trim()) return;
  if (editingBook && catalogStore.selectedArchiveId) {
   await catalogStore.updateBook(editingBook.id, {
    author: author.trim(),
    title: title.trim(),
    publisher: publisher.trim(),
    annotation: annotation.trim() || undefined,
    year: year ? parseInt(year, 10) : undefined,
   });
   if (photo) await catalogStore.uploadBookPhoto(editingBook.id, photo);
  } else if (!editingBook && catalogStore.selectedArchiveId) {
   const book = await catalogStore.createBook(catalogStore.selectedArchiveId, {
    author: author.trim(),
    title: title.trim(),
    publisher: publisher.trim(),
    annotation: annotation.trim() || undefined,
    year: year ? parseInt(year, 10) : undefined,
   });
   if (photo) await catalogStore.uploadBookPhoto(book.id, photo);
  }
  setModal(null);
  setEditingBook(null);
 };

 const selectedLocationName = catalogStore.selectedLocationId
  ? catalogStore.locations.find((l) => l.id === catalogStore.selectedLocationId)?.name
  : undefined;

 const selectedArchiveName = catalogStore.selectedArchiveId
  ? catalogStore.archives.find((a) => a.id === catalogStore.selectedArchiveId)?.name
  : undefined;

 const isRouteLoading = routeLoading ?? false;

 const selectedLocationNameForUi = isRouteLoading ? undefined : selectedLocationName;
 const selectedArchiveNameForUi = isRouteLoading ? undefined : selectedArchiveName;

 const derivedView = !catalogStore.selectedLocationId
  ? "locations"
  : !catalogStore.selectedArchiveId
   ? "archives"
   : "books";
 const mainView = forceView ?? derivedView;

 return (
  <>
   <MainContent
    view={mainView}
    loading={
     catalogStore.loading ||
     isRouteLoading ||
     initialLoading ||
     catalogStore.catalogTransitionPending
    }
    locations={catalogStore.locations}
    archives={catalogStore.archives}
    books={catalogStore.books}
    selectedLocationName={selectedLocationNameForUi}
    selectedArchiveName={selectedArchiveNameForUi}
    onSelectLocation={handleSelectLocation}
    onSelectArchive={handleSelectArchive}
    onArchiveClick={handleArchiveClick}
    onAddLocation={handleAddLocation}
    onAddArchive={catalogStore.selectedLocationId ? handleAddArchive : undefined}
    onAddBook={catalogStore.selectedArchiveId ? handleAddBook : undefined}
    onBackToLocations={() => {
     // Чтобы не показывать "Пока нет ..." между сбросом store и началом запроса в route-обёртке
     catalogStore.beginNavigateToDashboard();
     router.push(`/dashboard`);
    }}
    onBackToArchives={() => {
     const locId = catalogStore.selectedLocationId;
     // Чтобы не показывать "В этой локации пока нет архивов..." до того,
     // как route-обёртка успеет загрузить список.
     catalogStore.beginNavigateToArchivesList();
     if (locId) router.push(`/dashboard/locations/${locId}/archives`);
     else router.push(`/dashboard`);
    }}
    onEditLocation={handleEditLocation}
    onEditArchive={handleEditArchive}
    onEditBook={handleEditBook}
   />

   {(modal === "location" || modal === "editLocation") && (
    <Modal
     title={editingLocation ? "Редактировать локацию" : "Новая локация"}
     onClose={() => {
      setModal(null);
      setEditingLocation(null);
     }}
    >
     <div className="space-y-4">
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Название</label>
       <input
        type="text"
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
        placeholder="Например: Главный склад"
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && submitLocation()}
       />
      </div>
      <div className="flex gap-2">
       <button
        onClick={submitLocation}
        disabled={!locationName.trim()}
        className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
       >
        {editingLocation ? "Сохранить" : "Создать"}
       </button>
       <button
        onClick={() => setModal(null)}
        className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-ink transition hover:bg-sand"
       >
        Отмена
       </button>
      </div>
     </div>
    </Modal>
   )}

   {(modal === "archive" || modal === "editArchive") && (
    <Modal
     title={editingArchive ? "Редактировать архив" : "Новый архив"}
     onClose={() => {
      setModal(null);
      setEditingArchive(null);
     }}
    >
     <div className="space-y-4">
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Название</label>
       <input
        type="text"
        value={archiveName}
        onChange={(e) => setArchiveName(e.target.value)}
        placeholder="Например: Художественная литература"
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && submitArchive()}
       />
      </div>
      <div className="flex gap-2">
       <button
        onClick={submitArchive}
        disabled={!archiveName.trim()}
        className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
       >
        {editingArchive ? "Сохранить" : "Создать"}
       </button>
       <button
        onClick={() => setModal(null)}
        className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-ink transition hover:bg-sand"
       >
        Отмена
       </button>
      </div>
     </div>
    </Modal>
   )}

   {(modal === "book" || modal === "editBook") && (
    <Modal
     title={editingBook ? "Редактировать книгу" : "Новая книга"}
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
        placeholder="ФИО автора"
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
        placeholder="Название книги"
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
        placeholder="Название издательства"
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
        required
       />
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Год издания</label>
       <input
        type="number"
        min={1000}
        max={2100}
        value={bookForm.year}
        onChange={(e) => setBookForm((p) => ({ ...p, year: e.target.value }))}
        placeholder="2024"
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       />
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Аннотация</label>
       <textarea
        value={bookForm.annotation}
        onChange={(e) => setBookForm((p) => ({ ...p, annotation: e.target.value }))}
        placeholder="Краткое описание"
        rows={3}
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
       />
      </div>
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">
        Обложка книги {editingBook && "(оставьте пустым, чтобы не менять)"}
       </label>
       <input
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/gif"
        onChange={(e) => setBookForm((p) => ({ ...p, photo: e.target.files?.[0] ?? null }))}
        className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink file:mr-2 file:rounded file:border-0 file:bg-accent-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent"
       />
       {bookForm.photo && (
        <p className="mt-1 text-xs text-ink-muted">Выбрано: {bookForm.photo.name}</p>
       )}
      </div>
      <div className="flex gap-2">
       <button
        type="submit"
        disabled={!bookForm.author.trim() || !bookForm.title.trim() || !bookForm.publisher.trim()}
        className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:opacity-50"
       >
        {editingBook ? "Сохранить" : "Создать"}
       </button>
       <button
        type="button"
        onClick={() => setModal(null)}
        className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-ink transition hover:bg-sand"
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

export default observer(DashboardPage);
