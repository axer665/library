'use client';

import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '@/lib/api';
import { CATALOG_LIST_PER_PAGE } from '@/lib/catalogConstants';

export interface BookPreview {
  id: number;
  title: string;
  photo_path?: string;
}

export interface ArchivePreview {
  id: number;
  name: string;
  books?: BookPreview[];
}

export interface Location {
  id: number;
  name: string;
  archives_count?: number;
  archives?: ArchivePreview[];
}

export interface Archive {
  id: number;
  name: string;
  books_count?: number;
}

export interface Book {
  id: number;
  author: string;
  title: string;
  publisher: string;
  annotation?: string;
  year?: number;
  photo_path?: string;
  archive_id?: number;
  archive?: {
    id?: number;
    name?: string;
    location_id?: number;
    location?: { id?: number; name?: string };
  };
}

export interface SearchFilters {
  q?: string;
  author?: string;
  title?: string;
  publisher?: string;
  year?: string;
  location_id?: number;
  archive_id?: number;
  has_photo?: boolean;
}

export interface SearchPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

class CatalogStore {
  locations: Location[] = [];
  /** Все локации { id, name } — для поиска, крошек и модалок без загрузки сотен карточек. */
  allLocationsMinimal: Array<{ id: number; name: string }> = [];
  /** Названия архивов (в т.ч. вне текущей страницы списка) — для крошек и форм. */
  archiveNameById: Record<number, string> = {};
  archives: Archive[] = [];
  books: Book[] = [];
  searchResults: Book[] = [];
  searchFilters: SearchFilters = {};
  searchPagination: SearchPagination | null = null;
  filterArchives: Archive[] = [];
  locationsPage = 1;
  locationsPagination: SearchPagination | null = null;
  archivesPage = 1;
  archivesPagination: SearchPagination | null = null;
  booksPage = 1;
  booksPagination: SearchPagination | null = null;
  selectedLocationId: number | null = null;
  selectedArchiveId: number | null = null;
  loading = false;
  searchLoading = false;
  lastCatalogUrl = "/dashboard";
  /** Между кликом по крошкам и сменой URL списки могут быть пустыми — не показывать пустые заглушки. */
  catalogTransitionPending = false;

  constructor() {
    makeAutoObservable(this);
  }

  get locationsForSearch(): Location[] {
    return this.allLocationsMinimal.map((r) => ({ id: r.id, name: r.name }));
  }

  locationName(id: number): string | undefined {
    return this.allLocationsMinimal.find((l) => l.id === id)?.name ?? this.locations.find((l) => l.id === id)?.name;
  }

  archiveName(id: number): string | undefined {
    return this.archives.find((a) => a.id === id)?.name ?? this.archiveNameById[id];
  }

  async ensureLocationIndex() {
    if (this.allLocationsMinimal.length > 0) return;
    await this.refreshLocationIndex();
  }

  async refreshLocationIndex() {
    const rows = await api.locations.listCompact();
    runInAction(() => {
      this.allLocationsMinimal = rows;
    });
  }

  async loadLocations(page?: number, options?: { refreshIndex?: boolean }) {
    const p = page ?? this.locationsPage;
    runInAction(() => {
      this.loading = true;
      this.locationsPage = p;
    });
    try {
      if (options?.refreshIndex !== false) await this.ensureLocationIndex();
      const res = await api.locations.list(p, CATALOG_LIST_PER_PAGE);
      runInAction(() => {
        this.locations = res.data;
        this.locationsPagination = res.meta;
        this.locationsPage = res.meta.current_page;
        if (this.selectedLocationId && !res.data.find((l) => l.id === this.selectedLocationId)) {
          // Выбранная локация может быть на другой странице списка карточек.
          if (!this.allLocationsMinimal.some((l) => l.id === this.selectedLocationId)) {
            this.selectedLocationId = null;
          }
        }
      });
      if (this.selectedLocationId)
        await this.loadArchives(this.selectedLocationId, {
          clearBooksAndArchive: false,
          trackLoading: false,
        });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async loadArchives(
    locationId: number,
    options?: {
      clearBooksAndArchive?: boolean;
      trackLoading?: boolean;
      page?: number;
    },
  ) {
    const clearBooksAndArchive = options?.clearBooksAndArchive !== false;
    const trackLoading = options?.trackLoading !== false;
    const page = options?.page ?? this.archivesPage;
    runInAction(() => {
      this.selectedLocationId = locationId;
      this.archivesPage = page;
      if (clearBooksAndArchive) {
        this.selectedArchiveId = null;
        this.books = [];
      }
      if (trackLoading) this.loading = true;
    });
    try {
      const res = await api.archives.list(locationId, page, CATALOG_LIST_PER_PAGE);
      runInAction(() => {
        this.archives = res.data;
        this.archivesPagination = res.meta;
        this.archivesPage = res.meta.current_page;
        for (const a of res.data) {
          this.archiveNameById[a.id] = a.name;
        }
      });
    } finally {
      if (trackLoading) runInAction(() => (this.loading = false));
    }
  }

  backToLocations() {
    this.selectedLocationId = null;
    this.selectedArchiveId = null;
    this.archives = [];
    this.books = [];
    this.archivesPagination = null;
    this.booksPagination = null;
    this.archivesPage = 1;
    this.booksPage = 1;
  }

  setLastCatalogUrl(url: string) {
    this.lastCatalogUrl = url;
  }

  clearCatalogTransitionPending() {
    runInAction(() => {
      this.catalogTransitionPending = false;
    });
  }

  /** Сброс выбора перед переходом на /dashboard (без глобального loading — его выставит loadLocations). */
  beginNavigateToDashboard() {
    runInAction(() => {
      this.catalogTransitionPending = true;
      this.selectedLocationId = null;
      this.selectedArchiveId = null;
      this.archives = [];
      this.books = [];
      this.archivesPagination = null;
      this.booksPagination = null;
      this.archivesPage = 1;
      this.booksPage = 1;
    });
  }

  /** Переход к списку архивов: сброс книг/архива без глобального loading (оверлей — только routeLoading). */
  beginNavigateToArchivesList() {
    runInAction(() => {
      this.catalogTransitionPending = true;
      this.selectedArchiveId = null;
      this.books = [];
      this.booksPagination = null;
      this.booksPage = 1;
    });
  }

  backToArchives() {
    this.selectedArchiveId = null;
    this.books = [];
    this.booksPagination = null;
    this.booksPage = 1;
    if (this.selectedLocationId) this.loadArchives(this.selectedLocationId);
  }

  async selectLocationAndArchive(
    locationId: number,
    archiveId: number,
    options?: { trackLoading?: boolean; booksPage?: number; archivesPage?: number },
  ) {
    const trackLoading = options?.trackLoading !== false;
    const prevLoc = this.selectedLocationId;
    const prevArch = this.selectedArchiveId;
    runInAction(() => {
      this.selectedLocationId = locationId;
      this.selectedArchiveId = archiveId;
      if (prevLoc !== locationId) {
        this.archives = [];
        this.books = [];
        this.archivesPage = options?.archivesPage ?? 1;
        this.booksPage = options?.booksPage ?? 1;
      } else if (prevArch !== archiveId) {
        this.books = [];
        this.booksPage = options?.booksPage ?? 1;
        if (options?.archivesPage != null) this.archivesPage = options.archivesPage;
      } else {
        if (options?.booksPage != null) this.booksPage = options.booksPage;
        if (options?.archivesPage != null) this.archivesPage = options.archivesPage;
      }
    });
    await this.loadArchives(locationId, {
      clearBooksAndArchive: false,
      trackLoading,
      page: this.archivesPage,
    });
    if (!this.archiveName(archiveId)) {
      const rows = await api.archives.listCompact(locationId);
      runInAction(() => {
        for (const r of rows) {
          this.archiveNameById[r.id] = r.name;
        }
      });
    }
    await this.loadBooks(archiveId, { trackLoading, page: this.booksPage });
  }

  async loadBooks(archiveId: number, options?: { trackLoading?: boolean; page?: number }) {
    const trackLoading = options?.trackLoading !== false;
    const page = options?.page ?? this.booksPage;
    runInAction(() => {
      this.selectedArchiveId = archiveId;
      this.booksPage = page;
      if (trackLoading) this.loading = true;
    });
    try {
      const res = await api.books.list(archiveId, page, CATALOG_LIST_PER_PAGE);
      runInAction(() => {
        this.books = res.data;
        this.booksPagination = res.meta;
        this.booksPage = res.meta.current_page;
      });
    } finally {
      if (trackLoading) runInAction(() => (this.loading = false));
    }
  }

  selectLocation(id: number | null) {
    this.selectedLocationId = id;
    this.selectedArchiveId = null;
    this.archives = [];
    this.books = [];
    this.archivesPagination = null;
    this.booksPagination = null;
    this.archivesPage = 1;
    this.booksPage = 1;
    if (id) this.loadArchives(id, { page: 1 });
  }

  async createLocation(name: string) {
    await api.locations.create(name);
    await this.refreshLocationIndex();
    await this.loadLocations(this.locationsPage, { refreshIndex: false });
  }

  async createArchive(locationId: number, name: string) {
    const arch = await api.archives.create(locationId, name);
    runInAction(() => {
      this.archiveNameById[arch.id] = arch.name;
      const li = this.locations.findIndex((l) => l.id === locationId);
      if (li >= 0) {
        const loc = this.locations[li];
        const nextCount = (loc.archives_count ?? loc.archives?.length ?? 0) + 1;
        const prevPreview = loc.archives ?? [];
        const preview: ArchivePreview = { id: arch.id, name: arch.name, books: [] };
        const merged = [preview, ...prevPreview].slice(0, 3);
        this.locations[li] = { ...loc, archives_count: nextCount, archives: merged };
      }
    });
    await this.loadArchives(locationId, {
      clearBooksAndArchive: false,
      trackLoading: false,
      page: this.archivesPage,
    });
    return arch;
  }

  async createBook(archiveId: number, data: { author: string; title: string; publisher: string; annotation?: string; year?: number }) {
    const book = await api.books.create(archiveId, data);
    runInAction(() => {
      const ai = this.archives.findIndex((a) => a.id === archiveId);
      if (ai >= 0) {
        const a = this.archives[ai];
        this.archives[ai] = { ...a, books_count: (a.books_count ?? 0) + 1 };
      }
      const locId = this.selectedLocationId;
      if (locId != null) {
        const li = this.locations.findIndex((l) => l.id === locId);
        if (li >= 0) {
          const loc = this.locations[li];
          const nextArchives = loc.archives?.map((ar) => {
            if (ar.id !== archiveId) return ar;
            const prevBooks = ar.books ?? [];
            const preview: BookPreview = {
              id: book.id,
              title: book.title,
              photo_path: book.photo_path,
            };
            return { ...ar, books: [preview, ...prevBooks].slice(0, 5) };
          });
          if (nextArchives) {
            this.locations[li] = { ...loc, archives: nextArchives };
          }
        }
      }
    });
    await this.loadBooks(archiveId, { trackLoading: false, page: this.booksPage });
    return book;
  }

  async uploadBookPhoto(bookId: number, file: File) {
    const updated = await api.books.uploadPhoto(bookId, file) as Book;
    runInAction(() => {
      const i = this.books.findIndex((b) => b.id === bookId);
      if (i >= 0) this.books[i] = { ...this.books[i], ...updated };
    });
  }

  async updateLocation(id: number, name: string) {
    await api.locations.update(id, name);
    runInAction(() => {
      const mi = this.allLocationsMinimal.findIndex((l) => l.id === id);
      if (mi >= 0) this.allLocationsMinimal[mi] = { ...this.allLocationsMinimal[mi], name };
      const i = this.locations.findIndex((l) => l.id === id);
      if (i >= 0) this.locations[i] = { ...this.locations[i], name };
    });
  }

  private removeBookFromLocationArchivePreview(
    locationId: number,
    archiveId: number,
    bookId: number,
  ) {
    const li = this.locations.findIndex((l) => l.id === locationId);
    if (li < 0) return;
    const loc = this.locations[li];
    const next = loc.archives?.map((ar) => {
      if (ar.id !== archiveId) return ar;
      return { ...ar, books: (ar.books ?? []).filter((b) => b.id !== bookId) };
    });
    if (next) this.locations[li] = { ...loc, archives: next };
  }

  private addBookToLocationArchivePreview(
    locationId: number,
    archiveId: number,
    preview: BookPreview,
  ) {
    const li = this.locations.findIndex((l) => l.id === locationId);
    if (li < 0) return;
    const loc = this.locations[li];
    if (!(loc.archives ?? []).some((a) => a.id === archiveId)) return;
    const next = loc.archives?.map((ar) => {
      if (ar.id !== archiveId) return ar;
      const books = [preview, ...(ar.books ?? []).filter((b) => b.id !== preview.id)].slice(0, 5);
      return { ...ar, books };
    });
    if (next) this.locations[li] = { ...loc, archives: next };
  }

  async updateArchive(id: number, data: { name?: string; location_id?: number }) {
    const oldLocId = this.selectedLocationId;
    const archRow = this.archives.find((a) => a.id === id);
    const updated = (await api.archives.update(id, data)) as { id: number; name: string };
    const targetLocId = data.location_id;
    const moved =
      targetLocId !== undefined && oldLocId != null && targetLocId !== oldLocId;
    const nameFinal = data.name ?? archRow?.name ?? updated.name;

    runInAction(() => {
      if (moved && oldLocId != null) {
        const oldLocIdx = this.locations.findIndex((l) => l.id === oldLocId);
        if (oldLocIdx >= 0) {
          const loc = this.locations[oldLocIdx];
          const prevArch = (loc.archives ?? []).find((a) => a.id === id);
          const nextArchives = (loc.archives ?? []).filter((a) => a.id !== id);
          const nextCount = Math.max(0, (loc.archives_count ?? loc.archives?.length ?? 0) - 1);
          this.locations[oldLocIdx] = {
            ...loc,
            archives: nextArchives,
            archives_count: nextCount,
          };

          const newLocIdx = this.locations.findIndex((l) => l.id === targetLocId!);
          if (newLocIdx >= 0) {
            const nloc = this.locations[newLocIdx];
            const preview: ArchivePreview = {
              id,
              name: nameFinal,
              books: prevArch?.books ?? [],
            };
            const merged = [preview, ...(nloc.archives ?? [])].slice(0, 3);
            const nextCountNew = (nloc.archives_count ?? nloc.archives?.length ?? 0) + 1;
            this.locations[newLocIdx] = {
              ...nloc,
              archives: merged,
              archives_count: nextCountNew,
            };
          }
        }

        if (this.selectedArchiveId === id) {
          this.selectedArchiveId = null;
          this.books = [];
        }
        this.archiveNameById[id] = nameFinal;
      } else if (data.name !== undefined) {
        const ai = this.archives.findIndex((a) => a.id === id);
        if (ai >= 0) this.archives[ai] = { ...this.archives[ai], name: data.name };
        this.archiveNameById[id] = data.name;

        if (oldLocId != null) {
          const li = this.locations.findIndex((l) => l.id === oldLocId);
          if (li >= 0) {
            const loc = this.locations[li];
            const nextArchives = (loc.archives ?? []).map((a) =>
              a.id === id ? { ...a, name: data.name! } : a,
            );
            this.locations[li] = { ...loc, archives: nextArchives };
          }
        }
      }
    });

    if (oldLocId != null) {
      await this.loadArchives(oldLocId, {
        clearBooksAndArchive: false,
        trackLoading: false,
        page: this.archivesPage,
      });
    }
  }

  async updateBook(
    id: number,
    data: {
      author?: string;
      title?: string;
      publisher?: string;
      annotation?: string;
      year?: number;
      archive_id?: number;
    },
    move?: {
      fromArchiveId: number;
      fromLocationId?: number;
      toArchiveId: number;
      toLocationId?: number;
    },
  ) {
    await api.books.update(id, data);
    const moved = !!move && move.fromArchiveId !== move.toArchiveId;

    runInAction(() => {
      const localBook = this.books.find((b) => b.id === id);
      const srIdx = this.searchResults.findIndex((b) => b.id === id);
      const srBook = srIdx >= 0 ? this.searchResults[srIdx] : undefined;
      if (srIdx >= 0 && srBook) {
        this.searchResults[srIdx] = {
          ...srBook,
          ...data,
          year: data.year !== undefined ? data.year : srBook.year,
        };
      }

      if (moved && move) {
        const title = (data.title ?? localBook?.title ?? srBook?.title) || '';
        const preview: BookPreview = {
          id,
          title,
          photo_path: localBook?.photo_path ?? this.searchResults[srIdx]?.photo_path,
        };

        const oldAi = this.archives.findIndex((a) => a.id === move.fromArchiveId);
        if (oldAi >= 0) {
          const a = this.archives[oldAi];
          this.archives[oldAi] = {
            ...a,
            books_count: Math.max(0, (a.books_count ?? 0) - 1),
          };
        }
        const newAi = this.archives.findIndex((a) => a.id === move.toArchiveId);
        if (newAi >= 0) {
          const a = this.archives[newAi];
          this.archives[newAi] = { ...a, books_count: (a.books_count ?? 0) + 1 };
        }

        if (move.fromLocationId != null) {
          this.removeBookFromLocationArchivePreview(
            move.fromLocationId,
            move.fromArchiveId,
            id,
          );
        }
        if (move.toLocationId != null) {
          this.addBookToLocationArchivePreview(move.toLocationId, move.toArchiveId, preview);
        }
      }
    });

    if (this.selectedArchiveId != null) {
      await this.loadBooks(this.selectedArchiveId, {
        trackLoading: false,
        page: this.booksPage,
      });
    }
  }

  async deleteLocation(id: number) {
    await api.locations.delete(id);
    await this.refreshLocationIndex();
    const wasOnly = this.locations.length === 1;
    const pageBefore = this.locationsPage;
    let nextPage = pageBefore;
    if (wasOnly && pageBefore > 1) nextPage = pageBefore - 1;
    const wasSel = this.selectedLocationId === id;
    runInAction(() => {
      if (wasSel) {
        this.selectedLocationId = null;
        this.selectedArchiveId = null;
        this.archives = [];
        this.books = [];
        this.archivesPagination = null;
        this.booksPagination = null;
        this.archivesPage = 1;
        this.booksPage = 1;
      }
    });
    await this.loadLocations(nextPage, { refreshIndex: false });
  }

  async deleteArchive(id: number) {
    await api.archives.delete(id);
    const locId = this.selectedLocationId;
    const wasOnly = this.archives.length === 1;
    let nextPage = this.archivesPage;
    if (wasOnly && nextPage > 1) nextPage -= 1;
    const clearBooks = this.selectedArchiveId === id;
    runInAction(() => {
      if (locId != null) {
        const li = this.locations.findIndex((l) => l.id === locId);
        if (li >= 0) {
          const loc = this.locations[li];
          const filtered = (loc.archives ?? []).filter((a) => a.id !== id);
          const nextCount = Math.max(0, (loc.archives_count ?? loc.archives?.length ?? 0) - 1);
          this.locations[li] = { ...loc, archives: filtered, archives_count: nextCount };
        }
      }
      if (clearBooks) {
        this.selectedArchiveId = null;
        this.books = [];
        this.booksPagination = null;
        this.booksPage = 1;
      }
      delete this.archiveNameById[id];
    });
    if (locId)
      await this.loadArchives(locId, {
        clearBooksAndArchive: false,
        trackLoading: false,
        page: nextPage,
      });
  }

  async deleteBook(id: number) {
    await api.books.delete(id);
    const archId = this.selectedArchiveId;
    const wasOnly = this.books.length === 1;
    let nextPage = this.booksPage;
    if (wasOnly && nextPage > 1) nextPage -= 1;
    runInAction(() => {
      if (archId != null) {
        const ai = this.archives.findIndex((a) => a.id === archId);
        if (ai >= 0) {
          const a = this.archives[ai];
          this.archives[ai] = { ...a, books_count: Math.max(0, (a.books_count ?? 0) - 1) };
        }
      }
      const locId = this.selectedLocationId;
      if (locId != null && archId != null) {
        const li = this.locations.findIndex((l) => l.id === locId);
        if (li >= 0) {
          const loc = this.locations[li];
          const nextArchives = loc.archives?.map((ar) => {
            if (ar.id !== archId) return ar;
            const books = (ar.books ?? []).filter((b) => b.id !== id);
            return { ...ar, books };
          });
          if (nextArchives) {
            this.locations[li] = { ...loc, archives: nextArchives };
          }
        }
      }
    });
    if (archId != null)
      await this.loadBooks(archId, { trackLoading: false, page: nextPage });
  }

  async reorderLocations(orderedIds: number[]) {
    const prev = this.locations.slice();
    const map = new Map(prev.map((l) => [l.id, l]));
    runInAction(() => {
      this.locations = orderedIds
        .map((id) => map.get(id))
        .filter((x): x is Location => x != null);
    });
    const pag = this.locationsPagination;
    const usePage = pag != null && pag.last_page > 1;
    try {
      await api.locations.reorder(
        orderedIds,
        usePage ? { page: this.locationsPage, per_page: pag.per_page } : undefined,
      );
      await this.loadLocations(this.locationsPage, { refreshIndex: false });
    } catch {
      runInAction(() => {
        this.locations = prev;
      });
    }
  }

  async reorderArchives(orderedIds: number[]) {
    const locId = this.selectedLocationId;
    if (!locId) return;
    const prev = this.archives.slice();
    const map = new Map(prev.map((a) => [a.id, a]));
    runInAction(() => {
      this.archives = orderedIds
        .map((id) => map.get(id))
        .filter((x): x is Archive => x != null);
    });
    const pag = this.archivesPagination;
    const usePage = pag != null && pag.last_page > 1;
    try {
      await api.archives.reorder(
        locId,
        orderedIds,
        usePage ? { page: this.archivesPage, per_page: pag.per_page } : undefined,
      );
      await this.loadArchives(locId, {
        clearBooksAndArchive: false,
        trackLoading: false,
        page: this.archivesPage,
      });
    } catch {
      runInAction(() => {
        this.archives = prev;
      });
    }
  }

  async reorderBooks(orderedIds: number[]) {
    const archId = this.selectedArchiveId;
    if (!archId) return;
    const prev = this.books.slice();
    const map = new Map(prev.map((b) => [b.id, b]));
    runInAction(() => {
      this.books = orderedIds
        .map((id) => map.get(id))
        .filter((x): x is Book => x != null);
    });
    const pag = this.booksPagination;
    const usePage = pag != null && pag.last_page > 1;
    try {
      await api.books.reorder(
        archId,
        orderedIds,
        usePage ? { page: this.booksPage, per_page: pag.per_page } : undefined,
      );
      await this.loadBooks(archId, { trackLoading: false, page: this.booksPage });
    } catch {
      runInAction(() => {
        this.books = prev;
      });
    }
  }

  setSearchFilters(filters: Partial<SearchFilters>) {
    const next = { ...this.searchFilters, ...filters };
    if (filters.location_id !== undefined) {
      if (filters.location_id) {
        next.archive_id = undefined;
        api.archives.listCompact(filters.location_id).then((list) =>
          runInAction(() => {
            this.filterArchives = list;
            for (const a of list) {
              this.archiveNameById[a.id] = a.name;
            }
          })
        );
      } else {
        next.archive_id = undefined;
      }
    }
    runInAction(() => {
      this.searchFilters = next;
      if (filters.location_id !== undefined && !filters.location_id) {
        this.filterArchives = [];
      }
    });
  }

  async search(params: Record<string, string | number | undefined> = {}, page = 1) {
    runInAction(() => {
      this.searchLoading = true;
    });
    try {
      const res = await api.search.books({
        ...params,
        page,
        per_page: params.per_page ?? 12,
      });
      runInAction(() => {
        this.searchResults = res.data;
        this.searchPagination = res.meta;
      });
    } finally {
      runInAction(() => (this.searchLoading = false));
    }
  }

  async applySearch(page = 1) {
    const params: Record<string, string | number | undefined> = {
      per_page: 12,
    };
    const f = this.searchFilters;
    if (f.q) params.q = f.q;
    if (f.author) params.author = f.author;
    if (f.title) params.title = f.title;
    if (f.publisher) params.publisher = f.publisher;
    if (f.year) params.year = f.year;
    if (f.location_id) params.location_id = f.location_id;
    if (f.archive_id) params.archive_id = f.archive_id;
    if (f.has_photo !== undefined) params.has_photo = f.has_photo ? 1 : 0;
    await this.search(params, page);
  }
}

export const catalogStore = new CatalogStore();
