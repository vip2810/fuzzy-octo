import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sri Lankan Karaoke",
  description:
    "Karaoke collection of legendary Sri Lankan artists - sing along to your favorite Sinhala songs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-3xl">🎤</span>
              <span className="text-xl font-bold text-accent-light">
                Sri Lankan Karaoke
              </span>
            </Link>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-white/10 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            Sri Lankan Karaoke &mdash; Celebrating the golden voices of Sri
            Lanka
          </div>
        </footer>
      </body>
    </html>
  );
}
