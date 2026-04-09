"use client";

import { use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { catalogStore } from "@/stores/catalogStore";
import { catalogPageSearch, parseCatalogListPage, CATALOG_PAGE_QUERY_KEY } from "@/lib/catalogConstants";
import DashboardPage from "../../../page";

export default function LocationArchivesRoutePage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const resolvedParams = use(params);
  const locationId = Number(resolvedParams.locationId);
  const searchParams = useSearchParams();
  const listPageFromUrl = parseCatalogListPage(searchParams.get(CATALOG_PAGE_QUERY_KEY));

  const [routeLoading, setRouteLoading] = useState(() => {
    if (!Number.isFinite(locationId)) return true;
    return !(
      catalogStore.selectedLocationId === locationId && catalogStore.archives.length > 0
    );
  });
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(locationId)) return;

    catalogStore.clearCatalogTransitionPending();

    const key = `archives:${locationId}:${listPageFromUrl}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    catalogStore.setLastCatalogUrl(
      `/dashboard/locations/${locationId}/archives${catalogPageSearch(listPageFromUrl)}`,
    );
    const warm =
      catalogStore.selectedLocationId === locationId &&
      catalogStore.archives.length > 0 &&
      catalogStore.archivesPage === listPageFromUrl;
    setRouteLoading(!warm);

    void (async () => {
      try {
        if (catalogStore.allLocationsMinimal.length === 0) {
          await catalogStore.ensureLocationIndex();
        }
        await catalogStore.loadArchives(locationId, { trackLoading: false, page: listPageFromUrl });
      } finally {
        setRouteLoading(false);
      }
    })();
  }, [locationId, listPageFromUrl]);

  return <DashboardPage forceView="archives" routeLoading={routeLoading} />;
}

