import { getArtists } from "@/lib/data";
import ArtistCard from "@/components/ArtistCard";

export default function HomePage() {
  const artists = getArtists();

  return (
    <div>
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Sri Lankan Karaoke
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Sing along to the golden voices of Sri Lanka. Choose your favorite
          artist and enjoy.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Artists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {artists.map((artist, index) => (
            <ArtistCard key={artist.id} artist={artist} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
