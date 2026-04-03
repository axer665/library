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
  description: "Удобный домашний каталог книг. Удобный каталог для вашей домашней библиотеки, для личной и семейной коллекции.",
  keywords: [
    "удобный домашний каталог книг",
    "удобный каталог для домашней библиотеки",
    "удобный каталог личной библиотеки",
    "каталог книг для дома",
    "семейная библиотека",
  ],
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
