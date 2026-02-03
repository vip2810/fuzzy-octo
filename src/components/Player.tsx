"use client";

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <a
          href={`/artist/${artistId}`}
          className="text-accent hover:text-accent-light transition-colors text-sm"
        >
          &larr; Back to {artistName}
        </a>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-gray-400 mb-8">{artistName}</p>

      <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-accent/10">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-8 flex gap-4">
        <a
          href={`/artist/${artistId}`}
          className="px-6 py-3 rounded-xl bg-card-bg hover:bg-card-hover transition-colors text-white font-medium"
        >
          More from {artistName}
        </a>
      </div>
    </motion.div>
  );
}
