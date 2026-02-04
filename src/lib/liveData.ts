"use client";

import { useState, useEffect } from "react";
import yaml from "js-yaml";
import { getRepoConfig } from "./github";

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

const API_BASE = "https://api.github.com";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("github_token");
}

// No in-memory cache - always fetch fresh from GitHub API
async function fetchYaml<T>(path: string): Promise<{ data: T | null; error: string | null }> {
  const { owner, repo, branch } = getRepoConfig();

  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    // Cache-bust: append timestamp to bypass browser HTTP cache and GitHub CDN cache
    const url = `${API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}&_=${Date.now()}`;
    const res = await fetch(url, { headers, cache: "no-store" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.message || res.statusText;
      if (res.status === 401 || res.status === 403) {
        return { data: null, error: `Auth failed (${res.status}): ${msg}. Visit /admin to set your GitHub token.` };
      }
      if (res.status === 404) {
        return { data: null, error: `Not found: ${owner}/${repo}/${path} on branch ${branch}` };
      }
      return { data: null, error: `GitHub API error ${res.status}: ${msg}` };
    }

    const json = await res.json();
    if (!json.content) {
      return { data: null, error: "No content in GitHub API response" };
    }

    const binary = atob(json.content.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    const data = yaml.load(text) as T;

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Network error" };
  }
}

export function useLiveArtists(staticArtists: Artist[]): {
  artists: Artist[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
} {
  const [artists, setArtists] = useState<Artist[]>(staticArtists);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchYaml<{ artists: Artist[] }>("data/artists.yaml").then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err);
        setLoading(false);
        return;
      }
      if (data?.artists && Array.isArray(data.artists)) {
        setArtists(
          data.artists.map((a) => ({
            id: String(a.id || ""),
            name: String(a.name || ""),
            image: String(a.image || ""),
            description: String(a.description || ""),
          })).filter((a) => a.id && a.name)
        );
        setIsLive(true);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { artists, loading, error, isLive };
}

export function useLiveSongs(staticSongs: Song[]): {
  songs: Song[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
} {
  const [songs, setSongs] = useState<Song[]>(staticSongs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchYaml<{ songs: Song[] }>("data/songs.yaml").then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err);
        setLoading(false);
        return;
      }
      if (data?.songs && Array.isArray(data.songs)) {
        setSongs(
          data.songs.map((s) => ({
            id: String(s.id || ""),
            artistId: String(s.artistId || ""),
            title: String(s.title || ""),
            youtube: String(s.youtube || ""),
            order: Number(s.order) || 1,
          })).filter((s) => s.id && s.title)
        );
        setIsLive(true);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { songs, loading, error, isLive };
}

export function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
