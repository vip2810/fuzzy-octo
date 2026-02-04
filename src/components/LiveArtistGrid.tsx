"use client";

import Link from "next/link";
import { useLiveArtists, type Artist } from "@/lib/liveData";
import ArtistCard from "./ArtistCard";

interface LiveArtistGridProps {
  staticArtists: Artist[];
}

export default function LiveArtistGrid({ staticArtists }: LiveArtistGridProps) {
  const { artists, loading, error, isLive } = useLiveArtists(staticArtists);

  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-accent to-accent-light" />
        <h2 className="text-2xl font-bold text-white">Artists</h2>
        <span className="ml-2 text-sm text-gray-500">
          {artists.length} artist{artists.length !== 1 ? "s" : ""}
        </span>
        {loading && (
          <div className="ml-auto animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
        )}
        {isLive && !loading && (
          <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Live
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
          <p className="text-red-400 mb-1">Could not load live data from GitHub:</p>
          <p className="text-red-300/70 text-xs">{error}</p>
          <p className="text-gray-500 text-xs mt-2">
            Showing build-time data. <Link href="/admin" className="text-accent hover:underline">Log in to Admin</Link> to enable live updates.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {artists.map((artist, index) => (
          <ArtistCard key={artist.id} artist={artist} index={index} />
        ))}
      </div>
    </>
  );
}
