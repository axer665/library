"use client";

import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
}

export function BrandLogo({ href = "/", compact = false }: BrandLogoProps) {
  const content = (
    <span className="inline-flex items-center">
      <svg
        width={compact ? 36 : 42}
        height={compact ? 36 : 42}
        viewBox="0 0 42 42"
        role="img"
        aria-label="Логотип Мой Книжный Каталог"
      >
        <rect x="1.5" y="1.5" width="39" height="39" rx="11" fill="#F5F0E8" stroke="#E0D8CE" strokeWidth="3" />
        <path d="M8 12.5c0-1.4 1.1-2.5 2.5-2.5H20v20h-9.5A2.5 2.5 0 0 0 8 32.5v-20Z" fill="#FFFFFF" />
        <path d="M34 12.5c0-1.4-1.1-2.5-2.5-2.5H22v20h9.5a2.5 2.5 0 0 1 2.5 2.5v-20Z" fill="#FFFFFF" />
        <path d="M21 10v20" stroke="#D6CEC3" strokeWidth="1.5" />
        <path d="M8 12.5c0-1.4 1.1-2.5 2.5-2.5H20v20h-9.5A2.5 2.5 0 0 0 8 32.5v-20Z" fill="none" stroke="#1A5F4A" strokeWidth="1.6" />
        <path d="M34 12.5c0-1.4-1.1-2.5-2.5-2.5H22v20h9.5a2.5 2.5 0 0 1 2.5 2.5v-20Z" fill="none" stroke="#1A5F4A" strokeWidth="1.6" />
        <text x="14" y="24.2" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10.5" fontWeight="700" fill="#1A5F4A">М</text>
        <text x="28.2" y="21.8" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9.6" fontWeight="700" fill="#1A5F4A">К</text>
        <text x="29.4" y="25.8" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9.6" fontWeight="700" fill="#8A8178">К</text>
      </svg>
    </span>
  );

  return (
    <Link
      href={href}
      className="rounded-lg transition hover:opacity-90"
      aria-label="Мой Книжный Каталог"
      title="Мой Книжный Каталог"
    >
      {content}
    </Link>
  );
}
