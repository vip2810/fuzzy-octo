"use client";

import { useState, useEffect } from "react";
import yaml from "js-yaml";

export interface Artist {
  id: string;
  name: string;
  image: string;
  description: string;
}

export interface Song {
  id: string;
  artistId: string;
  title: string;
  youtube: string;
  order: number;
}

const OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "vip2810";
const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || "fuzzy-octo";
const BRANCH = process.env.NEXT_PUBLIC_GITHUB_BRANCH || "claude/jamstack-karaoke-site-fCM6p";

const API_BASE = "https://api.github.com";

// Simple in-memory cache to avoid redundant API calls within a session
const cache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 60_000; // 1 minute

async function fetchYaml<T>(path: string): Promise<T | null> {
  const cacheKey = `${OWNER}/${REPO}/${BRANCH}/${path}`;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T;
  }

  try {
    const res = await fetch(
      `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
      { headers: { Accept: "application/vnd.github.v3+json" } }
    );
    if (!res.ok) return null;

    const json = await res.json();
    const binary = atob(json.content.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    const data = yaml.load(text) as T;

    cache[cacheKey] = { data, ts: Date.now() };
    return data;
  } catch {
    return null;
  }
}

export function useLiveArtists(staticArtists: Artist[]): {
  artists: Artist[];
  loading: boolean;
} {
  const [artists, setArtists] = useState<Artist[]>(staticArtists);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchYaml<{ artists: Artist[] }>("data/artists.yaml").then((data) => {
      if (cancelled) return;
      if (data?.artists && Array.isArray(data.artists) && data.artists.length > 0) {
        setArtists(
          data.artists.map((a) => ({
            id: String(a.id || ""),
            name: String(a.name || ""),
            image: String(a.image || ""),
            description: String(a.description || ""),
          })).filter((a) => a.id && a.name)
        );
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { artists, loading };
}

export function useLiveSongs(staticSongs: Song[]): {
  songs: Song[];
  loading: boolean;
} {
  const [songs, setSongs] = useState<Song[]>(staticSongs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchYaml<{ songs: Song[] }>("data/songs.yaml").then((data) => {
      if (cancelled) return;
      if (data?.songs && Array.isArray(data.songs) && data.songs.length > 0) {
        setSongs(
          data.songs.map((s) => ({
            id: String(s.id || ""),
            artistId: String(s.artistId || ""),
            title: String(s.title || ""),
            youtube: String(s.youtube || ""),
            order: Number(s.order) || 1,
          })).filter((s) => s.id && s.title)
        );
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { songs, loading };
}

export function useLiveData(
  staticArtists: Artist[],
  staticSongs: Song[]
): {
  artists: Artist[];
  songs: Song[];
  loading: boolean;
} {
  const { artists, loading: aLoading } = useLiveArtists(staticArtists);
  const { songs, loading: sLoading } = useLiveSongs(staticSongs);
  return { artists, songs, loading: aLoading || sLoading };
}

export function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
