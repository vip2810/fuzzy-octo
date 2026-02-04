"use client";

import { useLiveArtists, type Artist } from "@/lib/liveData";
import ArtistCard from "./ArtistCard";

interface LiveArtistGridProps {
  staticArtists: Artist[];
}

export default function LiveArtistGrid({ staticArtists }: LiveArtistGridProps) {
  const { artists } = useLiveArtists(staticArtists);

  return (
    <>
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
    </>
  );
}
