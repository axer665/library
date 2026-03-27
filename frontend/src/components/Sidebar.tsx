"use client";

interface Location {
 id: number;
 name: string;
 archives_count?: number;
}

interface Archive {
 id: number;
 name: string;
 books_count?: number;
}

interface SidebarProps {
 view: "locations" | "archives";
 locations?: Location[];
 archives?: Archive[];
 selectedLocationId?: number | null;
 selectedArchiveId?: number | null;
 selectedLocationName?: string;
 onSelectLocation?: (id: number) => void;
 onSelectArchive?: (id: number) => void;
 onAddLocation?: () => void;
 onAddArchive?: () => void;
 onBackToLocations?: () => void;
}

export function Sidebar({
 view,
 locations = [],
 archives = [],
 selectedLocationId,
 selectedArchiveId,
 selectedLocationName,
 onSelectLocation,
 onSelectArchive,
 onAddLocation,
 onAddArchive,
 onBackToLocations,
}: SidebarProps) {
 const items = view === "locations" ? locations : archives;
 const selectedId = view === "locations" ? selectedLocationId : selectedArchiveId;
 const onSelect = view === "locations" ? onSelectLocation : onSelectArchive;
 const onAdd = view === "locations" ? onAddLocation : onAddArchive;

 return (
  <aside className="flex w-64 shrink-0 flex-col border-r border-theme bg-parchment">
   {view === "archives" && onBackToLocations && (
    <button
     onClick={onBackToLocations}
     className="flex items-center gap-2 border-b border-theme px-4 py-3 text-sm text-ink-muted transition hover:bg-sand hover:text-ink"
    >
     <span>←</span>
     <span>Назад к локациям</span>
     {selectedLocationName && (
      <span className="truncate text-ink-light">
       ({selectedLocationName})
      </span>
     )}
    </button>
   )}
   <div className="flex flex-1 flex-col overflow-hidden p-3">
    <h2 className="mb-2 px-2 font-serif text-sm font-medium text-ink-muted">
     {view === "locations" ? "Локации" : "Архивы"}
    </h2>
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
     {items.map((item) => (
      <button
       key={item.id}
       onClick={() => onSelect?.(item.id)}
       className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
        selectedId === item.id
         ? "bg-accent text-white"
         : "text-ink hover:bg-sand"
       }`}
      >
       <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
       {"archives_count" in item && item.archives_count != null && (
        <span className="shrink-0 text-xs opacity-80">{item.archives_count}</span>
       )}
       {"books_count" in item && item.books_count != null && (
        <span className="shrink-0 text-xs opacity-80">{item.books_count}</span>
       )}
      </button>
     ))}
     <button
      onClick={onAdd}
      className="mt-1 flex items-center gap-2 rounded-lg border-2 border-dashed border-theme px-3 py-2.5 text-sm text-ink-light transition hover-border-accent hover:text-accent"
     >
      <span className="text-lg">+</span>
      <span>
       {view === "locations" ? "Добавить локацию" : "Добавить архив"}
      </span>
     </button>
    </div>
   </div>
  </aside>
 );
}
