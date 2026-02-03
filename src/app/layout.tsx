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
        <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-white/5">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">
                🎤
              </span>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent">
                  Sri Lankan Karaoke
                </span>
              </div>
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-all"
            >
              Admin
            </Link>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
        <footer className="border-t border-white/5 mt-20">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-600">
            Sri Lankan Karaoke &mdash; Celebrating the golden voices of Sri
            Lanka
          </div>
        </footer>
      </body>
    </html>
  );
}
