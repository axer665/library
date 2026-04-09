"use client";

import { useEffect, useId, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { MainContent } from "@/components/MainContent";
import { Modal } from "@/components/Modal";
import { catalogStore } from "@/stores/catalogStore";
import type { Location, Archive, Book } from "@/stores/catalogStore";
import { api } from "@/lib/api";

function DashboardPage({
 forceView,
 routeLoading,
}: {
 forceView?: "locations" | "archives" | "books";
 routeLoading?: boolean;
}) {
 const router = useRouter();
 const bookFormDomId = useId().replace(/:/g, "");
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
 const [editArchiveLocationId, setEditArchiveLocationId] = useState<number | null>(null);
 const [bookEditLocationId, setBookEditLocationId] = useState<number | null>(null);
 const [bookEditArchiveId, setBookEditArchiveId] = useState<number | null>(null);
 const [bookEditArchivesList, setBookEditArchivesList] = useState<Archive[]>([]);

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
  setEditArchiveLocationId(null);
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
  setEditArchiveLocationId(catalogStore.selectedLocationId ?? null);
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
  const locId = catalogStore.selectedLocationId;
  const archId = catalogStore.selectedArchiveId;
  setBookEditLocationId(locId);
  setBookEditArchiveId(archId);
  setBookEditArchivesList(locId ? catalogStore.archives : []);
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
  if (editingArchive) {
   if (!name) return;
   const curLoc = catalogStore.selectedLocationId;
   const payload: { name: string; location_id?: number } = { name };
   if (
    editArchiveLocationId != null &&
    curLoc != null &&
    editArchiveLocationId !== curLoc
   ) {
    payload.location_id = editArchiveLocationId;
   }
   await catalogStore.updateArchive(editingArchive.id, payload);
   setModal(null);
   setEditingArchive(null);
   setEditArchiveLocationId(null);
   if (payload.location_id !== undefined) {
    router.push(`/dashboard/locations/${payload.location_id}/archives`);
   }
   return;
  }
  if (!name || !catalogStore.selectedLocationId) return;
  await catalogStore.createArchive(catalogStore.selectedLocationId, name);
  setModal(null);
  setEditingArchive(null);
 };

 const submitBook = async () => {
  const { author, title, publisher, annotation, year, photo } = bookForm;
  if (!author.trim() || !title.trim() || !publisher.trim()) return;
  if (editingBook && catalogStore.selectedArchiveId) {
   if (bookEditArchiveId == null || bookEditLocationId == null) return;
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
   if (bookEditArchiveId !== catalogStore.selectedArchiveId) {
    payload.archive_id = bookEditArchiveId;
    move = {
     fromArchiveId: catalogStore.selectedArchiveId,
     fromLocationId: catalogStore.selectedLocationId ?? undefined,
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
   if (move) {
    router.push(
     `/dashboard/locations/${bookEditLocationId}/archives/${bookEditArchiveId}`,
    );
   }
   return;
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
  setBookEditLocationId(null);
  setBookEditArchiveId(null);
 };

 const selectedLocationName = catalogStore.selectedLocationId
  ? catalogStore.locationName(catalogStore.selectedLocationId)
  : undefined;

 const selectedArchiveName = catalogStore.selectedArchiveId
  ? catalogStore.archiveName(catalogStore.selectedArchiveId)
  : undefined;

 const isRouteLoading = routeLoading ?? false;

 const derivedView = !catalogStore.selectedLocationId
  ? "locations"
  : !catalogStore.selectedArchiveId
   ? "archives"
   : "books";
 const mainView = forceView ?? derivedView;

 const listPagination =
  mainView === "locations"
   ? catalogStore.locationsPagination
   : mainView === "archives"
    ? catalogStore.archivesPagination
    : catalogStore.booksPagination;

 const handleListPageChange = (page: number) => {
  if (mainView === "locations") void catalogStore.loadLocations(page);
  else if (mainView === "archives" && catalogStore.selectedLocationId != null)
   void catalogStore.loadArchives(catalogStore.selectedLocationId, {
    clearBooksAndArchive: false,
    trackLoading: false,
    page,
   });
  else if (mainView === "books" && catalogStore.selectedArchiveId != null)
   void catalogStore.loadBooks(catalogStore.selectedArchiveId, { trackLoading: false, page });
 };

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
    selectedLocationName={selectedLocationName}
    selectedArchiveName={selectedArchiveName}
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
    onReorderLocations={(ids) => void catalogStore.reorderLocations(ids)}
    onReorderArchives={(ids) => void catalogStore.reorderArchives(ids)}
    onReorderBooks={(ids) => void catalogStore.reorderBooks(ids)}
    listPagination={listPagination}
    onListPageChange={handleListPageChange}
   />

   {(modal === "location" || modal === "editLocation") && (
    <Modal
     title={editingLocation ? "Редактировать локацию" : "Новая локация"}
     onClose={() => {
      setModal(null);
      setEditingLocation(null);
     }}
     footer={
      <div className="flex gap-2">
       <button
        type="button"
        onClick={submitLocation}
        disabled={!locationName.trim()}
        className="flex-1 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
       >
        {editingLocation ? "Сохранить" : "Создать"}
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
     </div>
    </Modal>
   )}

   {(modal === "archive" || modal === "editArchive") && (
    <Modal
     title={editingArchive ? "Редактировать архив" : "Новый архив"}
     onClose={() => {
      setModal(null);
      setEditingArchive(null);
      setEditArchiveLocationId(null);
     }}
     footer={
      <div className="flex gap-2">
       <button
        type="button"
        onClick={submitArchive}
        disabled={
         !archiveName.trim() ||
         (!!editingArchive && editArchiveLocationId === null)
        }
        className="flex-1 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
       >
        {editingArchive ? "Сохранить" : "Создать"}
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
     <div className="space-y-4">
      {editingArchive && (
       <div>
        <label className="mb-1 block text-sm font-medium text-ink-muted">
         Локация
        </label>
        <select
         value={editArchiveLocationId ?? ""}
         onChange={(e) =>
          setEditArchiveLocationId(e.target.value ? Number(e.target.value) : null)
         }
         className="w-full rounded-lg border border-theme px-3 py-2 text-sm text-ink"
        >
         {(catalogStore.allLocationsMinimal.length
          ? catalogStore.allLocationsMinimal
          : catalogStore.locations
         ).map((loc) => (
          <option key={loc.id} value={loc.id}>
           {loc.name}
          </option>
         ))}
        </select>
        <p className="mt-1 text-xs text-ink-muted">
         Можно перенести архив в другую локацию вместе со всеми книгами.
        </p>
       </div>
      )}
      <div>
       <label className="mb-1 block text-sm font-medium text-ink">Название</label>
       <input
        type="text"
        value={archiveName}
        onChange={(e) => setArchiveName(e.target.value)}
        placeholder="Например: Художественная литература"
        className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
        autoFocus={!editingArchive}
        onKeyDown={(e) => e.key === "Enter" && submitArchive()}
       />
      </div>
     </div>
    </Modal>
   )}

   {(modal === "book" || modal === "editBook") && (
    <Modal
     title={editingBook ? "Редактировать книгу" : "Новая книга"}
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
         (!!editingBook &&
          (bookEditArchiveId === null ||
           bookEditLocationId === null ||
           bookEditArchivesList.length === 0))
        }
        className="flex-1 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
       >
        {editingBook ? "Сохранить" : "Создать"}
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
      {editingBook && (
       <>
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
         <p className="mt-1 text-xs text-ink-muted">
          Книгу можно перенести в другой архив (в той же или другой локации).
         </p>
        </div>
       </>
      )}
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
     </form>
    </Modal>
   )}
  </>
 );
}

export default observer(DashboardPage);
