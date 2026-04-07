"use client";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  /** Блок под прокручиваемой областью (кнопки действий) */
  footer?: React.ReactNode;
  /** md — типичные диалоги; lg — широкие формы */
  size?: "md" | "lg";
}

export function Modal({ title, children, onClose, footer, size = "md" }: ModalProps) {
  const titleId = `modal-title-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const maxW = size === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full flex-col overflow-hidden rounded-xl border border-theme bg-white shadow-xl ${maxW}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-theme px-6 py-4">
          <h3 id={titleId} className="min-w-0 flex-1 font-serif text-lg font-semibold text-ink">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer shrink-0 rounded-lg p-1 text-ink-light transition hover:bg-sand hover:text-ink"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-6 py-4">
          {children}
        </div>
        {footer != null ? (
          <div className="shrink-0 border-t border-theme bg-white px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
