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

 return (
  <nav aria-label="Хлебные крошки" className="flex items-center gap-1.5 text-sm">
   {items.map((item, i) => {
    const isLast = i === items.length - 1;
    const isClickable = !!item.onClick && !isLast;

    return (
     <span key={i} className="flex items-center gap-1.5">
      {i > 0 && (
       <span className="text-ink-light" aria-hidden>
        /
       </span>
      )}
      {isClickable ? (
       <button
        type="button"
        onClick={item.onClick}
        className="text-ink-muted transition hover:text-accent"
       >
        {item.label}
       </button>
      ) : (
       <span
        className={
         isLast
          ? "font-medium text-ink"
          : "text-ink-muted"
        }
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
