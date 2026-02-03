"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Song } from "@/lib/data";

interface SongListProps {
  songs: Song[];
  artistName: string;
}

export default function SongList({ songs, artistName }: SongListProps) {
  return (
    <div className="space-y-2">
      {songs.map((song, index) => (
        <motion.div
          key={song.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.06 }}
        >
          <Link
            href={`/player/${song.id}`}
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
  );
}
