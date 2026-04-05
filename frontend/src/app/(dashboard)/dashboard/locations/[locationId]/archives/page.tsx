"use client";

import { use, useEffect, useRef, useState } from "react";
import { catalogStore } from "@/stores/catalogStore";
import DashboardPage from "../../../page";

export default function LocationArchivesRoutePage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const resolvedParams = use(params);
  const locationId = Number(resolvedParams.locationId);

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

    const key = `archives:${locationId}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    catalogStore.setLastCatalogUrl(`/dashboard/locations/${locationId}/archives`);
    const warm =
      catalogStore.selectedLocationId === locationId && catalogStore.archives.length > 0;
    setRouteLoading(!warm);

    void catalogStore.loadArchives(locationId, { trackLoading: false }).finally(() => {
      // Покажем контент, когда MobX закончит загрузку
      setRouteLoading(false);
    });
  }, [locationId]);

  return <DashboardPage forceView="archives" routeLoading={routeLoading} />;
}

