"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveSongs, type Song } from "@/lib/liveData";

interface LiveSongListProps {
  staticSongs: Song[];
  artistName: string;
  artistId: string;
}

export default function LiveSongList({
  staticSongs,
  artistName,
  artistId,
}: LiveSongListProps) {
  const { songs: allSongs, loading, error, isLive } = useLiveSongs(staticSongs);

  // Filter songs for this artist from live data
  const liveSongs = allSongs
    .filter((s) => s.artistId === artistId)
    .sort((a, b) => a.order - b.order);

  // Use live songs if available, otherwise fall back to static
  const displaySongs = isLive ? liveSongs : staticSongs;

  return (
    <div>
      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
          <div className="animate-spin w-3 h-3 border border-accent border-t-transparent rounded-full" />
          Loading live data...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
          <p className="text-red-400">{error}</p>
          <p className="text-gray-500 mt-1">
            Showing build-time data. <Link href="/admin" className="text-accent hover:underline">Log in to Admin</Link> to enable live updates.
          </p>
        </div>
      )}

      {isLive && !loading && (
        <div className="flex items-center gap-1 text-xs text-green-500 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Live &middot; {displaySongs.length} song{displaySongs.length !== 1 ? "s" : ""}
        </div>
      )}

      {displaySongs.length === 0 ? (
        <div className="text-center py-12 bg-card-bg/40 rounded-2xl border border-white/5">
          <p className="text-gray-500">No songs available yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displaySongs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
            >
              <Link
                href={`/play?s=${song.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card-bg/60 border border-white/5 hover:bg-card-hover hover:border-accent/20 transition-all duration-200 group"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-accent flex items-center justify-center font-bold text-sm border border-accent/10">
                  {song.order}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white group-hover:text-accent-light transition-colors truncate">
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-500">{artistName}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:bg-accent">
                  <svg
                    className="w-4 h-4 text-accent group-hover:text-white ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
