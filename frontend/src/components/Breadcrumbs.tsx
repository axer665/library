"use client";

export interface BreadcrumbItem {
 label: string;
 onClick?: () => void;
}

interface BreadcrumbsProps {
 items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
 if (items.length === 0) return null;

 const segmentClass =
  "min-w-0 max-w-[150px] cursor-default truncate " +
  "max-[760px]:max-w-[min(100%,12.5rem)] " +
  "max-[760px]:rounded-lg max-[760px]:border max-[760px]:border-theme max-[760px]:bg-white/80 max-[760px]:px-2 max-[760px]:py-1";

 return (
  <nav
   aria-label="Хлебные крошки"
   className="flex min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-sm max-[760px]:gap-1.5"
  >
   {items.map((item, i) => {
    const isLast = i === items.length - 1;
    const isClickable = !!item.onClick && !isLast;

    return (
     <span key={i} className="flex min-w-0 max-w-full items-center gap-1.5">
      {i > 0 && (
       <span
        className="shrink-0 text-ink-light max-[760px]:hidden"
        aria-hidden
       >
        /
       </span>
      )}
      {isClickable ? (
       <button
        type="button"
        onClick={item.onClick}
        title={item.label}
        className={`${segmentClass} cursor-pointer text-left text-ink-muted transition hover:text-accent max-[760px]:hover:border-accent`}
       >
        {item.label}
       </button>
      ) : (
       <span
        title={item.label}
        className={`${segmentClass} ${
         isLast
          ? "font-medium text-ink max-[760px]:border-accent/50 max-[760px]:bg-parchment"
          : "text-ink-muted"
        }`}
       >
        {item.label}
       </span>
      )}
     </span>
    );
   })}
  </nav>
 );
}
