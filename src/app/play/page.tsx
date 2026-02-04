"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveArtists, useLiveSongs, getYoutubeId, type Artist, type Song } from "@/lib/liveData";

function PlayerContent() {
  const params = useSearchParams();
  const songId = params.get("s");

  const { artists, loading: aLoading } = useLiveArtists([]);
  const { songs, loading: sLoading } = useLiveSongs([]);

  if (!songId) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">No song specified.</p>
        <Link href="/" className="text-accent hover:text-accent-light mt-4 inline-block">
          Go to Home
        </Link>
      </div>
    );
  }

  if (aLoading || sLoading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Loading song...</p>
      </div>
    );
  }

  const song = songs.find((s) => s.id === songId);
  if (!song) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Song not found.</p>
        <Link href="/" className="text-accent hover:text-accent-light">
          Go to Home
        </Link>
      </div>
    );
  }

  const artist = artists.find((a) => a.id === song.artistId);
  const artistName = artist?.name || "Unknown Artist";
  const youtubeId = getYoutubeId(song.youtube);

  if (!youtubeId) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Invalid YouTube URL for this song.</p>
        <Link href="/" className="text-accent hover:text-accent-light">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <Link
          href={`/artist/${song.artistId}`}
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
          Back to {artistName}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {song.title}
        </h1>
        <p className="text-gray-400 text-lg">{artistName}</p>
      </div>

      <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 shadow-2xl shadow-accent/5">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={song.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href={`/artist/${song.artistId}`}
          className="px-6 py-3 rounded-xl bg-card-bg border border-white/5 hover:border-accent/20 hover:bg-card-hover transition-all text-white font-medium"
        >
          More from {artistName}
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-300"
        >
          All Artists
        </Link>
      </div>
    </motion.div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <PlayerContent />
    </Suspense>
  );
}
