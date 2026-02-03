import Link from "next/link";
import { getArtists, getArtist, getSongsByArtist } from "@/lib/data";
import { assetPath } from "@/lib/basePath";
import SongList from "@/components/SongList";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getArtists().map((artist) => ({ id: artist.id }));
}

interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const artist = getArtist(id);

  if (!artist) {
    notFound();
  }

  const songs = getSongsByArtist(id);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-light transition-colors text-sm group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          All Artists
        </Link>
      </div>

      {/* Artist Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="flex-shrink-0">
          <div className="w-48 h-48 rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-accent/5">
            <img
              src={assetPath(artist.image)}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="inline-block px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-3 w-fit">
            Artist
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            {artist.name}
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
            {artist.description}
          </p>
          <p className="text-sm text-gray-500 mt-3">
            {songs.length} song{songs.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {/* Songs */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent to-accent-light" />
          <h2 className="text-xl font-bold text-white">Songs</h2>
        </div>
        {songs.length > 0 ? (
          <SongList songs={songs} artistName={artist.name} />
        ) : (
          <div className="text-center py-12 bg-card-bg/40 rounded-2xl border border-white/5">
            <p className="text-gray-500">No songs available yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
