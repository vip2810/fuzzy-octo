"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Artist } from "@/lib/data";
import { assetPath } from "@/lib/basePath";

interface ArtistCardProps {
  artist: Artist;
  index: number;
}

export default function ArtistCard({ artist, index }: ArtistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link
        href={`/artist/${artist.id}`}
        className="group block rounded-2xl overflow-hidden bg-card-bg/80 backdrop-blur-sm border border-white/5 hover:border-accent/20 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5"
      >
        <div className="aspect-square relative overflow-hidden">
          <img
            src={assetPath(artist.image)}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-lg font-bold text-white drop-shadow-lg">
              {artist.name}
            </h2>
          </div>
          {/* Play icon overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-14 h-14 rounded-full bg-accent/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-accent/30">
              <svg
                className="w-6 h-6 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {artist.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
