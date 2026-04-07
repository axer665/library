"use client";

interface ModalProps {
 title: string;
 children: React.ReactNode;
 onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
 const titleId = `modal-title-${title.toLowerCase().replace(/\s+/g, "-")}`;

 return (
  <div
   className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
   onClick={(e) => e.target === e.currentTarget && onClose()}
  >
   <div
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    className="w-full max-w-md rounded-xl border border-theme bg-white shadow-xl"
    onClick={(e) => e.stopPropagation()}
   >
    <div className="flex items-center justify-between border-b border-theme px-6 py-4">
     <h3 id={titleId} className="font-serif text-lg font-semibold text-ink">
      {title}
     </h3>
     <button
      type="button"
      onClick={onClose}
      className="cursor-pointer rounded-lg p-1 text-ink-light transition hover:bg-sand hover:text-ink"
      aria-label="Закрыть"
     >
      ✕
     </button>
    </div>
    <div className="p-6">{children}</div>
   </div>
  </div>
 );
}
