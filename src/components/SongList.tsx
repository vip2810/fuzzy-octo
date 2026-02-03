"use client";

import { motion } from "framer-motion";
import type { Song } from "@/lib/data";

interface SongListProps {
  songs: Song[];
  artistName: string;
}

export default function SongList({ songs, artistName }: SongListProps) {
  return (
    <div className="space-y-3">
      {songs.map((song, index) => (
        <motion.a
          key={song.id}
          href={`/player/${song.id}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
          whileHover={{ x: 8 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-card-bg hover:bg-card-hover transition-colors group"
        >
          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-lg">
            {song.order}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {song.title}
            </h3>
            <p className="text-sm text-gray-400">{artistName}</p>
          </div>
          <span className="flex-shrink-0 text-accent opacity-0 group-hover:opacity-100 transition-opacity text-2xl">
            &#9654;
          </span>
        </motion.a>
      ))}
    </div>
  );
}
