/** Единый размер страницы для списков локаций / архивов / книг в каталоге */
export const CATALOG_LIST_PER_PAGE = 10;

/** Query-параметр страницы в URL каталога, напр. `/dashboard?p=2` */
export const CATALOG_PAGE_QUERY_KEY = 'p';

export function parseCatalogListPage(raw: string | null | undefined): number {
  const n = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

/** Суффикс для router: пусто при странице 1, иначе `?p=n` */
export function catalogPageSearch(page: number): string {
  return page > 1 ? `?${CATALOG_PAGE_QUERY_KEY}=${page}` : '';
}
