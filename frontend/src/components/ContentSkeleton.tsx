"use client";

interface ContentSkeletonProps {
 view: "locations" | "archives" | "books";
}

function SkeletonCard({ minHeightClass }: { minHeightClass: string }) {
 return (
  <div className={`animate-pulse overflow-hidden rounded-2xl border-2 border-theme bg-white ${minHeightClass}`}>
   <div className="h-20 shrink-0 rounded-t-[14px] bg-sand" />
   <div className="flex flex-col gap-4 p-4">
    <div className="h-4 max-w-[75%] rounded bg-sand" />
    <div className="h-4 max-w-[50%] rounded bg-sand" />
    <div className="mt-4 flex gap-2">
     <div className="h-16 w-16 shrink-0 rounded bg-sand" />
     <div className="h-16 w-16 shrink-0 rounded bg-sand" />
     <div className="h-16 w-16 shrink-0 rounded bg-sand" />
    </div>
   </div>
  </div>
 );
}

export function ContentSkeleton({ view }: ContentSkeletonProps) {
 const isLocations = view === "locations";
 const isArchives = view === "archives";
 const cardHeightClass = isLocations ? "min-h-[420px]" : isArchives ? "min-h-[420px]" : "min-h-[420px]";
 const count = isLocations ? 4 : 6;

 return (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-8 p-6">
   {Array.from({ length: count }).map((_, i) => (
    <SkeletonCard key={i} minHeightClass={cardHeightClass} />
   ))}
  </div>
 );
}
