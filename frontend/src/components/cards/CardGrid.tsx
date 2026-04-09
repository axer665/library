"use client";

interface CardGridProps {
  children: React.ReactNode;
}

export function CardGrid({ children }: CardGridProps) {
  return (
    <div className="card-grid grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-8 p-6">
      {children}
    </div>
  );
}
