"use client";

import type { Location } from "@/stores/catalogStore";
import { LocationCard } from "@/components/cards/LocationCard";
import { CardGrid } from "@/components/cards/CardGrid";

interface LocationListProps {
  locations: Location[];
  onSelect: (id: number) => void;
  onArchiveClick?: (locationId: number, archiveId: number) => void;
  onEdit?: (loc: Location) => void;
}

export function LocationList({ locations, onSelect, onArchiveClick, onEdit }: LocationListProps) {
  return (
    <CardGrid>
      {locations.map((loc) => (
        <LocationCard
          key={loc.id}
          location={loc}
          onClick={() => onSelect(loc.id)}
          onArchiveClick={onArchiveClick}
          onEdit={onEdit}
        />
      ))}
    </CardGrid>
  );
}
