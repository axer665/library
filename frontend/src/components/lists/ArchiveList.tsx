"use client";

import type { Archive } from "@/stores/catalogStore";
import { ArchiveCard } from "@/components/cards/ArchiveCard";
import { CardGrid } from "@/components/cards/CardGrid";

interface ArchiveListProps {
  archives: Archive[];
  onSelect: (id: number) => void;
  onEdit?: (arch: Archive) => void;
}

export function ArchiveList({ archives, onSelect, onEdit }: ArchiveListProps) {
  return (
    <CardGrid>
      {archives.map((arch) => (
        <ArchiveCard
          key={arch.id}
          archive={arch}
          onClick={() => onSelect(arch.id)}
          onEdit={onEdit}
        />
      ))}
    </CardGrid>
  );
}
