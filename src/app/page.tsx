import { getArtists } from "@/lib/data";
import ArtistCard from "@/components/ArtistCard";

export default function HomePage() {
  const artists = getArtists();

  return (
    <div>
      {/* Hero Section */}
      <section className="text-center mb-16 pt-8">
        <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
          Sinhala Classics Collection
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-5 leading-tight">
          Sri Lankan{" "}
          <span className="bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent">
            Karaoke
          </span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
          Sing along to the golden voices of Sri Lanka. Choose your favorite
          artist and enjoy the timeless melodies.
        </p>
      </section>

      {/* Artists Grid */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-accent to-accent-light" />
          <h2 className="text-2xl font-bold text-white">Artists</h2>
          <span className="ml-2 text-sm text-gray-500">
            {artists.length} artists
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {artists.map((artist, index) => (
            <ArtistCard key={artist.id} artist={artist} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
