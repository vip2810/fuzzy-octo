"use client";

import { motion } from "framer-motion";
import type { Artist } from "@/lib/data";

interface ArtistCardProps {
  artist: Artist;
  index: number;
}

export default function ArtistCard({ artist, index }: ArtistCardProps) {
  return (
    <motion.a
      href={`/artist/${artist.id}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className="group block rounded-2xl overflow-hidden bg-card-bg hover:bg-card-hover transition-colors"
    >
      <div className="aspect-square relative overflow-hidden">
        <img
          src={artist.image}
          alt={artist.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-xl font-bold text-white">{artist.name}</h2>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-400 line-clamp-2">
          {artist.description}
        </p>
      </div>
    </motion.a>
  );
}
