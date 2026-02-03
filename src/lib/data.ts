import fs from "fs";
import path from "path";
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

interface ArtistsFile {
  artists: Artist[];
}

interface SongsFile {
  songs: Song[];
}

function loadYaml<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "data", filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return yaml.load(content) as T;
}

export function getArtists(): Artist[] {
  return loadYaml<ArtistsFile>("artists.yaml").artists;
}

export function getArtist(id: string): Artist | undefined {
  return getArtists().find((a) => a.id === id);
}

export function getSongs(): Song[] {
  return loadYaml<SongsFile>("songs.yaml").songs;
}

export function getSongsByArtist(artistId: string): Song[] {
  return getSongs()
    .filter((s) => s.artistId === artistId)
    .sort((a, b) => a.order - b.order);
}

export function getSong(id: string): Song | undefined {
  return getSongs().find((s) => s.id === id);
}

export function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
