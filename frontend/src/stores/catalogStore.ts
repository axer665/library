'use client';

import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '@/lib/api';

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
  archives: Archive[] = [];
  books: Book[] = [];
  searchResults: Book[] = [];
  searchFilters: SearchFilters = {};
  searchPagination: SearchPagination | null = null;
  filterArchives: Archive[] = [];
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

  async loadLocations() {
    runInAction(() => {
      this.loading = true;
    });
    try {
      const list = await api.locations.list();
      runInAction(() => {
        this.locations = list;
        if (this.selectedLocationId && !list.find((l) => l.id === this.selectedLocationId))
          this.selectedLocationId = null;
      });
      if (this.selectedLocationId) await this.loadArchives(this.selectedLocationId);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async loadArchives(
    locationId: number,
    options?: { clearBooksAndArchive?: boolean; trackLoading?: boolean },
  ) {
    const clearBooksAndArchive = options?.clearBooksAndArchive !== false;
    const trackLoading = options?.trackLoading !== false;
    runInAction(() => {
      this.selectedLocationId = locationId;
      if (clearBooksAndArchive) {
        this.selectedArchiveId = null;
        this.books = [];
      }
      if (trackLoading) this.loading = true;
    });
    try {
      const list = await api.archives.list(locationId);
      runInAction(() => {
        this.archives = list;
        if (this.selectedArchiveId && !list.find((a) => a.id === this.selectedArchiveId))
          this.selectedArchiveId = null;
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
    });
  }

  /** Переход к списку архивов: сброс книг/архива без глобального loading (оверлей — только routeLoading). */
  beginNavigateToArchivesList() {
    runInAction(() => {
      this.catalogTransitionPending = true;
      this.selectedArchiveId = null;
      this.books = [];
    });
  }

  backToArchives() {
    this.selectedArchiveId = null;
    this.books = [];
    if (this.selectedLocationId) this.loadArchives(this.selectedLocationId);
  }

  async selectLocationAndArchive(
    locationId: number,
    archiveId: number,
    options?: { trackLoading?: boolean },
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
      } else if (prevArch !== archiveId) {
        this.books = [];
      }
    });
    await this.loadArchives(locationId, { clearBooksAndArchive: false, trackLoading });
    await this.loadBooks(archiveId, { trackLoading });
  }

  async loadBooks(archiveId: number, options?: { trackLoading?: boolean }) {
    const trackLoading = options?.trackLoading !== false;
    runInAction(() => {
      this.selectedArchiveId = archiveId;
      if (trackLoading) this.loading = true;
    });
    try {
      const list = await api.books.list(archiveId);
      runInAction(() => (this.books = list));
    } finally {
      if (trackLoading) runInAction(() => (this.loading = false));
    }
  }

  selectLocation(id: number | null) {
    this.selectedLocationId = id;
    this.selectedArchiveId = null;
    this.archives = [];
    this.books = [];
    if (id) this.loadArchives(id);
  }

  async createLocation(name: string) {
    const loc = await api.locations.create(name);
    runInAction(() => this.locations.push(loc));
  }

  async createArchive(locationId: number, name: string) {
    const arch = await api.archives.create(locationId, name);
    runInAction(() => {
      this.archives.push(arch);
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
  }

  async createBook(archiveId: number, data: { author: string; title: string; publisher: string; annotation?: string; year?: number }) {
    const book = await api.books.create(archiveId, data);
    runInAction(() => {
      this.books.push(book);
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
      } else if (data.name !== undefined) {
        const ai = this.archives.findIndex((a) => a.id === id);
        if (ai >= 0) this.archives[ai] = { ...this.archives[ai], name: data.name };

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
      await this.loadBooks(this.selectedArchiveId, { trackLoading: false });
    }
  }

  async deleteLocation(id: number) {
    await api.locations.delete(id);
    runInAction(() => {
      this.locations = this.locations.filter((l) => l.id !== id);
      if (this.selectedLocationId === id) {
        this.selectedLocationId = this.locations[0]?.id ?? null;
        this.archives = [];
        this.books = [];
      }
    });
  }

  async deleteArchive(id: number) {
    await api.archives.delete(id);
    runInAction(() => {
      this.archives = this.archives.filter((a) => a.id !== id);
      const locId = this.selectedLocationId;
      if (locId != null) {
        const li = this.locations.findIndex((l) => l.id === locId);
        if (li >= 0) {
          const loc = this.locations[li];
          const filtered = (loc.archives ?? []).filter((a) => a.id !== id);
          const nextCount = Math.max(0, (loc.archives_count ?? loc.archives?.length ?? 0) - 1);
          this.locations[li] = { ...loc, archives: filtered, archives_count: nextCount };
        }
      }
      if (this.selectedArchiveId === id) {
        this.selectedArchiveId = this.archives[0]?.id ?? null;
        this.books = [];
      }
    });
  }

  async deleteBook(id: number) {
    await api.books.delete(id);
    runInAction(() => {
      this.books = this.books.filter((b) => b.id !== id);
      const archId = this.selectedArchiveId;
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
  }

  setSearchFilters(filters: Partial<SearchFilters>) {
    const next = { ...this.searchFilters, ...filters };
    if (filters.location_id !== undefined) {
      if (filters.location_id) {
        next.archive_id = undefined;
        api.archives.list(filters.location_id).then((list) =>
          runInAction(() => (this.filterArchives = list))
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
