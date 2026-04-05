"use client";

interface ContentSkeletonProps {
 view: "locations" | "archives" | "books";
}

function SkeletonCard({ view }: { view: "locations" | "archives" | "books" }) {
 return (
  <div
   className={`content-skeleton__card content-skeleton__card--${view} animate-pulse overflow-hidden rounded-2xl border-2 border-theme bg-white`}
  >
   <div className="content-skeleton__head shrink-0 rounded-t-[14px] bg-sand" />
   <div className="content-skeleton__body flex flex-col gap-4 p-4">
    <div className="content-skeleton__line content-skeleton__line--wide h-4 max-w-[75%] rounded bg-sand" />
    <div className="content-skeleton__line content-skeleton__line--narrow h-4 max-w-[50%] rounded bg-sand" />
    <div className="content-skeleton__thumbs mt-4 flex gap-2">
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
 const count = isLocations ? 4 : 6;

 return (
  <div className="card-grid content-skeleton grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-8 p-6">
   {Array.from({ length: count }).map((_, i) => (
    <SkeletonCard key={i} view={view} />
   ))}
  </div>
 );
}
