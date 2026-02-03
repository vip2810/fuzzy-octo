"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isAuthenticated,
  setToken,
  clearToken,
  validateToken,
  getFileContent,
  updateFile,
  getRepoConfig,
  setRepoConfig,
  listBranches,
} from "@/lib/github";

interface Artist {
  id: string;
  name: string;
  image: string;
  description: string;
}

interface Song {
  id: string;
  artistId: string;
  title: string;
  youtube: string;
  order: number;
}

type Tab = "artists" | "songs" | "import" | "settings";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function artistsToYaml(artists: Artist[]): string {
  let yaml = "artists:\n";
  for (const a of artists) {
    yaml += `  - id: ${a.id}\n`;
    yaml += `    name: "${a.name}"\n`;
    yaml += `    image: ${a.image}\n`;
    yaml += `    description: "${a.description}"\n\n`;
  }
  return yaml;
}

function songsToYaml(songs: Song[]): string {
  let yaml = "songs:\n";
  for (const s of songs) {
    yaml += `  - id: ${s.id}\n`;
    yaml += `    artistId: ${s.artistId}\n`;
    yaml += `    title: "${s.title}"\n`;
    yaml += `    youtube: ${s.youtube}\n`;
    yaml += `    order: ${s.order}\n\n`;
  }
  return yaml;
}

function parseArtistsYaml(content: string): Artist[] {
  const artists: Artist[] = [];
  const blocks = content.split(/\n\s*-\s+id:\s*/).slice(1);
  for (const block of blocks) {
    const lines = ("id: " + block).split("\n").filter((l) => l.trim());
    const obj: Record<string, string> = {};
    for (const line of lines) {
      const match = line.match(/^\s*(\w+):\s*"?(.+?)"?\s*$/);
      if (match) obj[match[1]] = match[2].trim();
    }
    if (obj.id && obj.name) {
      artists.push({
        id: obj.id,
        name: obj.name,
        image: obj.image || "",
        description: obj.description || "",
      });
    }
  }
  return artists;
}

function parseSongsYaml(content: string): Song[] {
  const songs: Song[] = [];
  const blocks = content.split(/\n\s*-\s+id:\s*/).slice(1);
  for (const block of blocks) {
    const lines = ("id: " + block).split("\n").filter((l) => l.trim());
    const obj: Record<string, string> = {};
    for (const line of lines) {
      const match = line.match(/^\s*(\w+):\s*"?(.+?)"?\s*$/);
      if (match) obj[match[1]] = match[2].trim();
    }
    if (obj.id && obj.title) {
      songs.push({
        id: obj.id,
        artistId: obj.artistId || "",
        title: obj.title,
        youtube: obj.youtube || "",
        order: parseInt(obj.order || "1"),
      });
    }
  }
  return songs;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** Parse "Artist - Title" or "Title - Artist" or just "Title" from YouTube video titles */
function parseVideoTitle(raw: string): { artist: string; title: string } {
  // Remove common suffixes like (Official Video), [HD], (Lyrics), etc.
  let cleaned = raw
    .replace(/\s*[\(\[].*?(?:official|video|audio|lyrics|hd|hq|karaoke|live|4k|1080p|720p|sinhala|with lyrics).*?[\)\]]/gi, "")
    .replace(/\s*\|.*$/, "")
    .replace(/\s*-\s*(?:official|video|audio|lyrics|hd|hq|karaoke).*$/gi, "")
    .trim();

  // Try "Artist - Title" split
  const dashParts = cleaned.split(/\s*[-–—]\s*/);
  if (dashParts.length >= 2) {
    return {
      artist: dashParts[0].trim(),
      title: dashParts.slice(1).join(" - ").trim(),
    };
  }

  return { artist: "", title: cleaned };
}

// ─── Token Form ──────────────────────────────────────────────

function TokenForm({ onSuccess }: { onSuccess: () => void }) {
  const [token, setTokenValue] = useState("");
  const [owner, setOwner] = useState(() => getRepoConfig().owner);
  const [repo, setRepo] = useState(() => getRepoConfig().repo);
  const [branch, setBranch] = useState(() => getRepoConfig().branch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setToken(token);
    setRepoConfig({ owner, repo, branch });
    const valid = await validateToken();
    if (valid) {
      onSuccess();
    } else {
      clearToken();
      setError("Invalid token. Make sure it has repo access.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="bg-card-bg rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Admin Login</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Connect to your GitHub repo to manage karaoke content.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setTokenValue(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Repo Owner</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="vip2810" className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Repo Name</label>
              <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="fuzzy-octo" className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Branch</label>
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none" />
            <p className="text-xs text-gray-500 mt-1">Branch where data/ folder lives</p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading || !token} className="w-full py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold disabled:opacity-50">
            {loading ? "Validating..." : "Connect"}
          </button>
        </form>
        <div className="mt-6 p-4 rounded-xl bg-surface/30 border border-white/5">
          <p className="text-xs text-gray-400">
            <strong className="text-gray-300">How to get a token:</strong><br />
            GitHub &rarr; Settings &rarr; Developer settings &rarr; Personal access tokens &rarr; Tokens (classic) &rarr; Generate with <code className="text-accent">repo</code> scope.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Panel ──────────────────────────────────────────

function SettingsPanel({ onSave }: { onSave: () => void }) {
  const config = getRepoConfig();
  const [owner, setOwner] = useState(config.owner);
  const [repo, setRepo] = useState(config.repo);
  const [branch, setBranch] = useState(config.branch);
  const [ytKey, setYtKey] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("youtube_api_key") || "" : ""
  );
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingBranches(true);
      setBranches(await listBranches());
      setLoadingBranches(false);
    })();
  }, []);

  function handleSave() {
    setRepoConfig({ owner, repo, branch });
    if (ytKey) localStorage.setItem("youtube_api_key", ytKey);
    else localStorage.removeItem("youtube_api_key");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Repository Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Owner</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Repository</label>
              <input value={repo} onChange={(e) => setRepo(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Branch</label>
            {branches.length > 0 ? (
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none">
                {branches.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
            ) : (
              <input value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none" />
            )}
            {loadingBranches && <p className="text-xs text-gray-500 mt-1">Loading branches...</p>}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">YouTube API Key</h3>
        <p className="text-sm text-gray-400 mb-3">Required for the playlist import feature.</p>
        <input
          type="password"
          value={ytKey}
          onChange={(e) => setYtKey(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Google Cloud Console &rarr; APIs &amp; Services &rarr; Enable YouTube Data API v3 &rarr; Create API Key
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold">
          Save &amp; Reload Data
        </button>
        {saved && <span className="text-green-400 text-sm">Saved!</span>}
      </div>
      <div className="p-4 rounded-xl bg-surface/20 border border-white/5">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-400">Current:</strong> {config.owner}/{config.repo} @ {config.branch}
        </p>
      </div>
    </div>
  );
}

// ─── Artist Form ─────────────────────────────────────────────

function ArtistForm({
  artist,
  onSave,
  onCancel,
}: {
  artist?: Artist;
  onSave: (a: Artist) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(artist?.name || "");
  const [image, setImage] = useState(artist?.image || "");
  const [description, setDescription] = useState(artist?.description || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: artist?.id || slugify(name),
      name,
      image: image || `/images/artists/${slugify(name)}.svg`,
      description,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Image URL (leave empty for default)</label>
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-600 focus:border-accent focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none resize-none" />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold">
          {artist ? "Update" : "Add"} Artist
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-300">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Song Form ───────────────────────────────────────────────

function SongForm({
  song,
  artists,
  onSave,
  onCancel,
}: {
  song?: Song;
  artists: Artist[];
  onSave: (s: Song) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(song?.title || "");
  const [artistId, setArtistId] = useState(song?.artistId || artists[0]?.id || "");
  const [youtube, setYoutube] = useState(song?.youtube || "");
  const [order, setOrder] = useState(song?.order || 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ id: song?.id || slugify(title), artistId, title, youtube, order });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Song Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Artist</label>
        <select value={artistId} onChange={(e) => setArtistId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none">
          {artists.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">YouTube URL</label>
        <input value={youtube} onChange={(e) => setYoutube(e.target.value)} required placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-600 focus:border-accent focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Order</label>
        <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 1)} min={1} className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none" />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold">
          {song ? "Update" : "Add"} Song
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-300">Cancel</button>
      </div>
    </form>
  );
}

// ─── YouTube Playlist Import ─────────────────────────────────

interface PlaylistItem {
  videoId: string;
  rawTitle: string;
  parsedArtist: string;
  parsedTitle: string;
  thumbnail: string;
  selected: boolean;
  assignedArtistId: string;
}

function PlaylistImport({
  artists,
  existingSongs,
  onImport,
}: {
  artists: Artist[];
  existingSongs: Song[];
  onImport: (songs: Song[], newArtists: Artist[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playlistTitle, setPlaylistTitle] = useState("");

  function getYtKey(): string | null {
    return typeof window !== "undefined"
      ? localStorage.getItem("youtube_api_key")
      : null;
  }

  function matchArtist(name: string): string {
    if (!name) return "";
    const lower = name.toLowerCase().trim();
    for (const a of artists) {
      if (a.name.toLowerCase().includes(lower) || lower.includes(a.name.toLowerCase())) {
        return a.id;
      }
    }
    return "";
  }

  async function fetchPlaylist() {
    const apiKey = getYtKey();
    if (!apiKey) {
      setError("YouTube API Key not set. Go to Settings tab to add it.");
      return;
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      setError("Invalid playlist URL. Expected format: https://www.youtube.com/playlist?list=...");
      return;
    }

    setLoading(true);
    setError("");
    setItems([]);

    try {
      // Fetch playlist info
      const infoRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
      );
      const infoData = await infoRes.json();
      if (infoData.error) throw new Error(infoData.error.message);
      setPlaylistTitle(infoData.items?.[0]?.snippet?.title || "Playlist");

      // Fetch all items (paginated)
      const allItems: PlaylistItem[] = [];
      let pageToken = "";
      do {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ""}`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        for (const item of data.items || []) {
          const snippet = item.snippet;
          const videoId = snippet.resourceId?.videoId;
          if (!videoId || snippet.title === "Private video" || snippet.title === "Deleted video") continue;

          const existing = existingSongs.some(
            (s) => extractYoutubeId(s.youtube) === videoId
          );
          if (existing) continue;

          const parsed = parseVideoTitle(snippet.title);
          const matched = matchArtist(parsed.artist);

          allItems.push({
            videoId,
            rawTitle: snippet.title,
            parsedArtist: parsed.artist,
            parsedTitle: parsed.title,
            thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
            selected: true,
            assignedArtistId: matched,
          });
        }

        pageToken = data.nextPageToken || "";
      } while (pageToken);

      if (allItems.length === 0) {
        setError("No new videos found (all may already exist in your songs).");
      }

      setItems(allItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch playlist");
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(idx: number) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  }

  function setItemArtist(idx: number, artistId: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, assignedArtistId: artistId } : item));
  }

  function setItemTitle(idx: number, title: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, parsedTitle: title } : item));
  }

  function handleImport() {
    const selected = items.filter((i) => i.selected);
    if (selected.length === 0) return;

    // Collect new artists from unassigned items
    const newArtists: Artist[] = [];
    const artistMap = new Map<string, string>(); // parsedArtist -> id

    for (const item of selected) {
      if (!item.assignedArtistId && item.parsedArtist) {
        const existing = artistMap.get(item.parsedArtist.toLowerCase());
        if (!existing) {
          const id = slugify(item.parsedArtist);
          artistMap.set(item.parsedArtist.toLowerCase(), id);
          newArtists.push({
            id,
            name: item.parsedArtist,
            image: `/images/artists/${id}.svg`,
            description: `Sri Lankan artist`,
          });
        }
      }
    }

    const maxOrder = existingSongs.length > 0
      ? Math.max(...existingSongs.map((s) => s.order))
      : 0;

    const newSongs: Song[] = selected.map((item, idx) => {
      let artistId = item.assignedArtistId;
      if (!artistId && item.parsedArtist) {
        artistId = artistMap.get(item.parsedArtist.toLowerCase()) || "";
      }
      return {
        id: slugify(item.parsedTitle || item.rawTitle),
        artistId,
        title: item.parsedTitle || item.rawTitle,
        youtube: `https://www.youtube.com/watch?v=${item.videoId}`,
        order: maxOrder + idx + 1,
      };
    });

    onImport(newSongs, newArtists);
  }

  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-2">Import from YouTube Playlist</h3>
        <p className="text-sm text-gray-400 mb-4">
          Paste a public YouTube playlist link. Videos will be parsed to auto-detect artist and song title.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
          className="flex-1 px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
        />
        <button
          onClick={fetchPlaylist}
          disabled={loading || !url}
          className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Loading..." : "Fetch Playlist"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          Fetching playlist videos...
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">{playlistTitle}</h4>
              <p className="text-sm text-gray-400">{items.length} new videos found, {selectedCount} selected</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setItems((p) => p.map((i) => ({ ...i, selected: true })))} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors">
                Select All
              </button>
              <button onClick={() => setItems((p) => p.map((i) => ({ ...i, selected: false })))} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors">
                Deselect All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {items.map((item, idx) => (
              <div
                key={item.videoId}
                className={`rounded-xl p-3 border flex gap-3 transition-colors ${
                  item.selected
                    ? "bg-card-bg border-accent/20"
                    : "bg-card-bg/30 border-white/5 opacity-50"
                }`}
              >
                <label className="flex-shrink-0 flex items-start pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(idx)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                </label>
                {item.thumbnail && (
                  <img src={item.thumbnail} alt="" className="w-20 h-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-xs text-gray-500 truncate">{item.rawTitle}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Artist</label>
                      <select
                        value={item.assignedArtistId}
                        onChange={(e) => setItemArtist(idx, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-white/10 text-white text-sm focus:border-accent focus:outline-none"
                      >
                        <option value="">
                          {item.parsedArtist ? `+ New: ${item.parsedArtist}` : "-- Select --"}
                        </option>
                        {artists.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Title</label>
                      <input
                        value={item.parsedTitle}
                        onChange={(e) => setItemTitle(idx, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-white/10 text-white text-sm focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={selectedCount === 0}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold disabled:opacity-50"
          >
            Import {selectedCount} Song{selectedCount !== 1 ? "s" : ""} &amp; Save to GitHub
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("artists");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [artistsSha, setArtistsSha] = useState("");
  const [songsSha, setSongsSha] = useState("");
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showNewArtist, setShowNewArtist] = useState(false);
  const [showNewSong, setShowNewSong] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [artistsFile, songsFile] = await Promise.all([
        getFileContent("data/artists.yaml"),
        getFileContent("data/songs.yaml"),
      ]);
      setArtists(parseArtistsYaml(artistsFile.content));
      setArtistsSha(artistsFile.sha);
      setSongs(parseSongsYaml(songsFile.content));
      setSongsSha(songsFile.sha);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      setAuthed(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, [loadData]);

  function showMsg(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  }

  async function saveArtists(updated: Artist[]): Promise<string> {
    const yaml = artistsToYaml(updated);
    await updateFile("data/artists.yaml", yaml, artistsSha, "Update artists via dashboard");
    setArtists(updated);
    const fresh = await getFileContent("data/artists.yaml");
    setArtistsSha(fresh.sha);
    return fresh.sha;
  }

  async function saveSongs(updated: Song[]): Promise<string> {
    const yaml = songsToYaml(updated);
    await updateFile("data/songs.yaml", yaml, songsSha, "Update songs via dashboard");
    setSongs(updated);
    const fresh = await getFileContent("data/songs.yaml");
    setSongsSha(fresh.sha);
    return fresh.sha;
  }

  async function handleSaveArtist(artist: Artist) {
    setSaving(true);
    try {
      const idx = artists.findIndex((a) => a.id === artist.id);
      const updated = [...artists];
      if (idx >= 0) updated[idx] = artist;
      else updated.push(artist);
      setEditingArtist(null);
      setShowNewArtist(false);
      await saveArtists(updated);
      showMsg("Artist saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteArtist(id: string) {
    if (!confirm(`Delete artist "${id}" and all their songs?`)) return;
    setSaving(true);
    try {
      await saveArtists(artists.filter((a) => a.id !== id));
      await saveSongs(songs.filter((s) => s.artistId !== id));
      showMsg("Artist deleted!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSong(song: Song) {
    setSaving(true);
    try {
      const idx = songs.findIndex((s) => s.id === song.id);
      const updated = [...songs];
      if (idx >= 0) updated[idx] = song;
      else updated.push(song);
      setEditingSong(null);
      setShowNewSong(false);
      await saveSongs(updated);
      showMsg("Song saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSong(id: string) {
    if (!confirm(`Delete this song?`)) return;
    setSaving(true);
    try {
      await saveSongs(songs.filter((s) => s.id !== id));
      showMsg("Song deleted!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveSong(songId: string, direction: "up" | "down") {
    const songArtistId = songs.find((x) => x.id === songId)?.artistId;
    const artistSongs = songs.filter((s) => s.artistId === songArtistId).sort((a, b) => a.order - b.order);
    const idx = artistSongs.findIndex((s) => s.id === songId);
    if (direction === "up" && idx > 0) {
      const temp = artistSongs[idx].order;
      artistSongs[idx].order = artistSongs[idx - 1].order;
      artistSongs[idx - 1].order = temp;
    } else if (direction === "down" && idx < artistSongs.length - 1) {
      const temp = artistSongs[idx].order;
      artistSongs[idx].order = artistSongs[idx + 1].order;
      artistSongs[idx + 1].order = temp;
    }
    const updated = songs.map((s) => artistSongs.find((x) => x.id === s.id) || s);
    setSaving(true);
    try {
      await saveSongs(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handlePlaylistImport(newSongs: Song[], newArtists: Artist[]) {
    setSaving(true);
    try {
      if (newArtists.length > 0) {
        await saveArtists([...artists, ...newArtists]);
      }
      await saveSongs([...songs, ...newSongs]);
      showMsg(`Imported ${newSongs.length} songs${newArtists.length > 0 ? ` and ${newArtists.length} new artists` : ""}!`);
      setTab("songs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setSaving(false);
    }
  }

  if (!authed) {
    return <TokenForm onSuccess={() => { setAuthed(true); loadData(); }} />;
  }

  const config = getRepoConfig();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <button onClick={() => { clearToken(); setAuthed(false); }} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 text-sm">
          Logout
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        {config.owner}/{config.repo} @ <span className="text-accent">{config.branch}</span>
      </p>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
            {message}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
            <button onClick={() => setError("")} className="ml-4 underline">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-card-bg rounded-xl p-1">
        {(["artists", "songs", "import", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 rounded-lg font-semibold capitalize transition-colors text-sm ${
              tab === t ? "bg-accent text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "artists" ? `Artists (${artists.length})`
              : t === "songs" ? `Songs (${songs.length})`
              : t === "import" ? "Import"
              : "Settings"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          Loading data from GitHub...
        </div>
      ) : (
        <>
          {tab === "settings" && <SettingsPanel onSave={loadData} />}

          {tab === "import" && (
            <PlaylistImport
              artists={artists}
              existingSongs={songs}
              onImport={handlePlaylistImport}
            />
          )}

          {tab === "artists" && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => { setShowNewArtist(true); setEditingArtist(null); }} disabled={saving} className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold disabled:opacity-50">
                  + Add Artist
                </button>
              </div>

              {showNewArtist && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-card-bg rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">New Artist</h3>
                  <ArtistForm key="new" onSave={handleSaveArtist} onCancel={() => setShowNewArtist(false)} />
                </motion.div>
              )}

              <div className="space-y-3">
                {artists.map((artist) => (
                  <div key={artist.id} className="bg-card-bg rounded-xl p-4 border border-white/5 flex items-center gap-4">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-14 h-14 rounded-xl object-cover bg-surface"
                      onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><rect width="56" height="56" rx="12" fill="%23111128"/><text x="28" y="34" font-size="20" fill="%23e94560" text-anchor="middle" font-family="sans-serif">${artist.name.charAt(0)}</text></svg>`)}`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white">{artist.name}</h3>
                      <p className="text-sm text-gray-400 truncate">{artist.description}</p>
                      <p className="text-xs text-gray-500">{songs.filter((s) => s.artistId === artist.id).length} songs</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingArtist(artist); setShowNewArtist(false); }}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteArtist(artist.id)}
                        className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {editingArtist && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-card-bg rounded-2xl p-6 border border-accent/30">
                  <h3 className="text-lg font-bold text-white mb-4">Edit: {editingArtist.name}</h3>
                  <ArtistForm key={editingArtist.id} artist={editingArtist} onSave={handleSaveArtist} onCancel={() => setEditingArtist(null)} />
                </motion.div>
              )}
            </div>
          )}

          {tab === "songs" && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => { setShowNewSong(true); setEditingSong(null); }} disabled={saving || artists.length === 0} className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold disabled:opacity-50">
                  + Add Song
                </button>
              </div>

              {showNewSong && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-card-bg rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">New Song</h3>
                  <SongForm key="new" artists={artists} onSave={handleSaveSong} onCancel={() => setShowNewSong(false)} />
                </motion.div>
              )}

              {artists.map((artist) => {
                const artistSongs = songs.filter((s) => s.artistId === artist.id).sort((a, b) => a.order - b.order);
                if (artistSongs.length === 0) return null;
                return (
                  <div key={artist.id} className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-3">{artist.name}</h3>
                    <div className="space-y-2">
                      {artistSongs.map((song, idx) => (
                        <div key={song.id} className="bg-card-bg rounded-xl p-4 border border-white/5 flex items-center gap-4">
                          <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">{song.order}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white">{song.title}</h4>
                            <p className="text-xs text-gray-500 truncate">{song.youtube}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleMoveSong(song.id, "up")} disabled={idx === 0 || saving} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors flex items-center justify-center">&#8593;</button>
                            <button onClick={() => handleMoveSong(song.id, "down")} disabled={idx === artistSongs.length - 1 || saving} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors flex items-center justify-center">&#8595;</button>
                            <button onClick={() => { setEditingSong(song); setShowNewSong(false); }} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors">Edit</button>
                            <button onClick={() => handleDeleteSong(song.id)} className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 transition-colors">Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {editingSong && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-card-bg rounded-2xl p-6 border border-accent/30">
                  <h3 className="text-lg font-bold text-white mb-4">Edit: {editingSong.title}</h3>
                  <SongForm key={editingSong.id} song={editingSong} artists={artists} onSave={handleSaveSong} onCancel={() => setEditingSong(null)} />
                </motion.div>
              )}
            </div>
          )}
        </>
      )}

      {saving && (
        <div className="fixed bottom-6 right-6 bg-card-bg border border-accent/30 rounded-xl px-6 py-3 flex items-center gap-3 shadow-2xl z-50">
          <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
          <span className="text-white">Saving to GitHub...</span>
        </div>
      )}
    </div>
  );
}
