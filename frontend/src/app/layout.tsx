import type { Metadata } from "next";
import { Cormorant, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import "./globals.css";

/** Заголовки: выразительная антиква в книжном духе (кириллица + латиница). */
const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["500", "600", "700"],
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
        className={`${cormorant.variable} ${sourceSans.variable} antialiased`}
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
        <Script src="https://my-little-fairy.ru/?token=90bffee19853eee158e44177773aa82138ab06c0992bba41" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
