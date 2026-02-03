"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface PlayerProps {
  youtubeId: string;
  title: string;
  artistName: string;
  artistId: string;
}

export default function Player({
  youtubeId,
  title,
  artistName,
  artistId,
}: PlayerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <Link
          href={`/artist/${artistId}`}
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
          {title}
        </h1>
        <p className="text-gray-400 text-lg">{artistName}</p>
      </div>

      <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 shadow-2xl shadow-accent/5">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href={`/artist/${artistId}`}
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
