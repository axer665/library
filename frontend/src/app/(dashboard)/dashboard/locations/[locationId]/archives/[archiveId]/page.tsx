"use client";

import { use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { catalogStore } from "@/stores/catalogStore";
import { catalogPageSearch, parseCatalogListPage, CATALOG_PAGE_QUERY_KEY } from "@/lib/catalogConstants";
import DashboardPage from "../../../../page";

export default function LocationArchiveBooksRoutePage({
  params,
}: {
  params: Promise<{ locationId: string; archiveId: string }>;
}) {
  const resolvedParams = use(params);
  const locationId = Number(resolvedParams.locationId);
  const archiveId = Number(resolvedParams.archiveId);
  const searchParams = useSearchParams();
  const listPageFromUrl = parseCatalogListPage(searchParams.get(CATALOG_PAGE_QUERY_KEY));

  const [routeLoading, setRouteLoading] = useState(() => {
    if (!Number.isFinite(locationId) || !Number.isFinite(archiveId)) return true;
    return !(
      catalogStore.selectedLocationId === locationId &&
      catalogStore.selectedArchiveId === archiveId &&
      catalogStore.books.length > 0
    );
  });
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(locationId) || !Number.isFinite(archiveId)) return;

    catalogStore.clearCatalogTransitionPending();

    const key = `books:${locationId}:${archiveId}:${listPageFromUrl}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    catalogStore.setLastCatalogUrl(
      `/dashboard/locations/${locationId}/archives/${archiveId}${catalogPageSearch(listPageFromUrl)}`,
    );
    const warm =
      catalogStore.selectedLocationId === locationId &&
      catalogStore.selectedArchiveId === archiveId &&
      catalogStore.books.length > 0 &&
      catalogStore.booksPage === listPageFromUrl;
    setRouteLoading(!warm);

    void (async () => {
      try {
        if (catalogStore.allLocationsMinimal.length === 0) {
          await catalogStore.ensureLocationIndex();
        }
        await catalogStore.selectLocationAndArchive(locationId, archiveId, {
          trackLoading: false,
          booksPage: listPageFromUrl,
          archivesPage: 1,
        });
      } finally {
        setRouteLoading(false);
      }
    })();
  }, [locationId, archiveId, listPageFromUrl]);

  return <DashboardPage forceView="books" routeLoading={routeLoading} />;
}

