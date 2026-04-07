"use client";

import { use, useEffect, useRef, useState } from "react";
import { catalogStore } from "@/stores/catalogStore";
import DashboardPage from "../../../../page";

export default function LocationArchiveBooksRoutePage({
  params,
}: {
  params: Promise<{ locationId: string; archiveId: string }>;
}) {
  const resolvedParams = use(params);
  const locationId = Number(resolvedParams.locationId);
  const archiveId = Number(resolvedParams.archiveId);

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

    const key = `books:${locationId}:${archiveId}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    catalogStore.setLastCatalogUrl(`/dashboard/locations/${locationId}/archives/${archiveId}`);
    const warm =
      catalogStore.selectedLocationId === locationId &&
      catalogStore.selectedArchiveId === archiveId &&
      catalogStore.books.length > 0;
    setRouteLoading(!warm);

    void (async () => {
      try {
        if (catalogStore.locations.length === 0) {
          await catalogStore.loadLocations();
        }
        await catalogStore.selectLocationAndArchive(locationId, archiveId, { trackLoading: false });
      } finally {
        setRouteLoading(false);
      }
    })();
  }, [locationId, archiveId]);

  return <DashboardPage forceView="books" routeLoading={routeLoading} />;
}

