import { getArtists, getArtist, getSongsByArtist } from "@/lib/data";
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
        <a
          href="/"
          className="text-accent hover:text-accent-light transition-colors text-sm"
        >
          &larr; Back to Artists
        </a>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="flex-shrink-0">
          <img
            src={artist.image}
            alt={artist.name}
            className="w-48 h-48 rounded-2xl object-cover shadow-lg"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-white mb-3">{artist.name}</h1>
          <p className="text-gray-400 text-lg">{artist.description}</p>
          <p className="text-sm text-gray-500 mt-2">
            {songs.length} song{songs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Songs</h2>
        {songs.length > 0 ? (
          <SongList songs={songs} artistName={artist.name} />
        ) : (
          <p className="text-gray-500">No songs available yet.</p>
        )}
      </section>
    </div>
  );
}
