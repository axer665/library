import type { Metadata } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Библиотека-Каталогизатор",
  description: "Каталог книг: локации, архивы, книги",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${literata.variable} ${sourceSans.variable} antialiased`}
      >
        <Script
          id="disable-react-devtools"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  if (typeof window === "undefined") return;
  function noop() {}
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
    supportsFiber: true,
    inject: noop,
    onCommitFiberRoot: noop,
    onCommitFiberUnmount: noop,
    renderers: new Map(),
  };
})();`.trim(),
          }}
        />
        {children}
      </body>
    </html>
  );
}
