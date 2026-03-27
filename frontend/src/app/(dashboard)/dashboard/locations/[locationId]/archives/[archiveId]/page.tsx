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

  const [routeLoading, setRouteLoading] = useState(true);
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(locationId) || !Number.isFinite(archiveId)) return;
    const key = `books:${locationId}:${archiveId}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    catalogStore.setLastCatalogUrl(`/dashboard/locations/${locationId}/archives/${archiveId}`);
    setRouteLoading(true);
    catalogStore.selectedLocationId = locationId;
    catalogStore.selectedArchiveId = archiveId;
    catalogStore.archives = [];
    catalogStore.books = [];

    void catalogStore.selectLocationAndArchive(locationId, archiveId).finally(() => {
      setRouteLoading(false);
    });
  }, [locationId, archiveId]);

  return <DashboardPage forceView="books" routeLoading={routeLoading} />;
}

