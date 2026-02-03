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
import type { RepoConfig } from "@/lib/github";

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

type Tab = "artists" | "songs" | "settings";

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
    yaml += `    name: ${a.name}\n`;
    yaml += `    image: ${a.image}\n`;
    yaml += `    description: ${a.description}\n\n`;
  }
  return yaml;
}

function songsToYaml(songs: Song[]): string {
  let yaml = "songs:\n";
  for (const s of songs) {
    yaml += `  - id: ${s.id}\n`;
    yaml += `    artistId: ${s.artistId}\n`;
    yaml += `    title: ${s.title}\n`;
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
      const match = line.match(/^\s*(\w+):\s*(.+)$/);
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
      const match = line.match(/^\s*(\w+):\s*(.+)$/);
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
              <label className="block text-sm text-gray-400 mb-1">
                Repo Owner
              </label>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="vip2810"
                className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Repo Name
              </label>
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="fuzzy-octo"
                className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Branch
            </label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              The branch where your data/ folder lives (e.g. main,
              claude/jamstack-karaoke-site-fCM6p)
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Validating..." : "Connect"}
          </button>
        </form>
        <div className="mt-6 p-4 rounded-xl bg-surface/30 border border-white/5">
          <p className="text-xs text-gray-400">
            <strong className="text-gray-300">How to get a token:</strong>
            <br />
            GitHub &rarr; Settings &rarr; Developer settings &rarr; Personal
            access tokens &rarr; Tokens (classic) &rarr; Generate new token
            with <code className="text-accent">repo</code> scope.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ onSave }: { onSave: () => void }) {
  const config = getRepoConfig();
  const [owner, setOwner] = useState(config.owner);
  const [repo, setRepo] = useState(config.repo);
  const [branch, setBranch] = useState(config.branch);
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [saved, setSaved] = useState(false);

  async function fetchBranches() {
    setLoadingBranches(true);
    const list = await listBranches();
    setBranches(list);
    setLoadingBranches(false);
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  function handleSave() {
    setRepoConfig({ owner, repo, branch });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
  }

  return (
    <div className="max-w-xl">
      <h3 className="text-lg font-bold text-white mb-4">
        Repository Settings
      </h3>
      <p className="text-sm text-gray-400 mb-6">
        Configure which GitHub repository and branch to read/write data from.
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Owner
            </label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Repository
            </label>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Branch
          </label>
          {branches.length > 0 ? (
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
            />
          )}
          {loadingBranches && (
            <p className="text-xs text-gray-500 mt-1">Loading branches...</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold"
          >
            Save & Reload Data
          </button>
          {saved && (
            <span className="text-green-400 text-sm">Settings saved!</span>
          )}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-surface/20 border border-white/5">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-400">Current config:</strong>{" "}
            {config.owner}/{config.repo} @ {config.branch}
          </p>
        </div>
      </div>
    </div>
  );
}

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
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Image URL (leave empty for default)
        </label>
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://... or /images/artists/name.svg"
          className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-600 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold"
        >
          {artist ? "Update" : "Add"} Artist
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

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
  const [artistId, setArtistId] = useState(
    song?.artistId || artists[0]?.id || ""
  );
  const [youtube, setYoutube] = useState(song?.youtube || "");
  const [order, setOrder] = useState(song?.order || 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: song?.id || slugify(title),
      artistId,
      title,
      youtube,
      order,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Song Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Artist</label>
        <select
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none"
        >
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">YouTube URL</label>
        <input
          value={youtube}
          onChange={(e) => setYoutube(e.target.value)}
          required
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-gray-600 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Order (display position)
        </label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
          min={1}
          className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-white focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold"
        >
          {song ? "Update" : "Add"} Song
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

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
    setTimeout(() => setMessage(""), 3000);
  }

  async function saveArtists(updated: Artist[]) {
    setSaving(true);
    try {
      const yaml = artistsToYaml(updated);
      await updateFile(
        "data/artists.yaml",
        yaml,
        artistsSha,
        `Update artists via dashboard`
      );
      setArtists(updated);
      const fresh = await getFileContent("data/artists.yaml");
      setArtistsSha(fresh.sha);
      showMsg("Artists saved & committed!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveSongs(updated: Song[]) {
    setSaving(true);
    try {
      const yaml = songsToYaml(updated);
      await updateFile(
        "data/songs.yaml",
        yaml,
        songsSha,
        `Update songs via dashboard`
      );
      setSongs(updated);
      const fresh = await getFileContent("data/songs.yaml");
      setSongsSha(fresh.sha);
      showMsg("Songs saved & committed!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveArtist(artist: Artist) {
    const idx = artists.findIndex((a) => a.id === artist.id);
    const updated = [...artists];
    if (idx >= 0) {
      updated[idx] = artist;
    } else {
      updated.push(artist);
    }
    setEditingArtist(null);
    setShowNewArtist(false);
    saveArtists(updated);
  }

  function handleDeleteArtist(id: string) {
    if (!confirm(`Delete artist "${id}" and all their songs?`)) return;
    const updated = artists.filter((a) => a.id !== id);
    const updatedSongs = songs.filter((s) => s.artistId !== id);
    saveArtists(updated);
    saveSongs(updatedSongs);
  }

  function handleSaveSong(song: Song) {
    const idx = songs.findIndex((s) => s.id === song.id);
    const updated = [...songs];
    if (idx >= 0) {
      updated[idx] = song;
    } else {
      updated.push(song);
    }
    setEditingSong(null);
    setShowNewSong(false);
    saveSongs(updated);
  }

  function handleDeleteSong(id: string) {
    if (!confirm(`Delete song "${id}"?`)) return;
    saveSongs(songs.filter((s) => s.id !== id));
  }

  function handleMoveSong(songId: string, direction: "up" | "down") {
    const artistSongs = songs
      .filter(
        (s) =>
          s.artistId === songs.find((x) => x.id === songId)?.artistId
      )
      .sort((a, b) => a.order - b.order);
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
    const updated = songs.map((s) => {
      const changed = artistSongs.find((x) => x.id === s.id);
      return changed || s;
    });
    saveSongs(updated);
  }

  if (!authed) {
    return (
      <TokenForm
        onSuccess={() => {
          setAuthed(true);
          loadData();
        }}
      />
    );
  }

  const config = getRepoConfig();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <button
          onClick={() => {
            clearToken();
            setAuthed(false);
          }}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 text-sm"
        >
          Logout
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Connected to{" "}
        <span className="text-gray-400">
          {config.owner}/{config.repo}
        </span>{" "}
        @ <span className="text-accent">{config.branch}</span>
      </p>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400"
          >
            {message}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
          >
            {error}
            <button
              onClick={() => setError("")}
              className="ml-4 underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-card-bg rounded-xl p-1">
        {(["artists", "songs", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 rounded-lg font-semibold capitalize transition-colors ${
              tab === t
                ? "bg-accent text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "artists"
              ? `Artists (${artists.length})`
              : t === "songs"
                ? `Songs (${songs.length})`
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
          {/* Settings Tab */}
          {tab === "settings" && (
            <SettingsPanel onSave={loadData} />
          )}

          {/* Artists Tab */}
          {tab === "artists" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    setShowNewArtist(true);
                    setEditingArtist(null);
                  }}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold disabled:opacity-50"
                >
                  + Add Artist
                </button>
              </div>

              {showNewArtist && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 bg-card-bg rounded-2xl p-6 border border-white/10"
                >
                  <h3 className="text-lg font-bold text-white mb-4">
                    New Artist
                  </h3>
                  <ArtistForm
                    onSave={handleSaveArtist}
                    onCancel={() => setShowNewArtist(false)}
                  />
                </motion.div>
              )}

              <div className="space-y-3">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="bg-card-bg rounded-xl p-4 border border-white/5 flex items-center gap-4"
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-14 h-14 rounded-xl object-cover bg-surface"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white">
                        {artist.name}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {artist.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {songs.filter((s) => s.artistId === artist.id).length}{" "}
                        songs
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingArtist(artist);
                          setShowNewArtist(false);
                        }}
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-card-bg rounded-2xl p-6 border border-accent/30"
                >
                  <h3 className="text-lg font-bold text-white mb-4">
                    Edit: {editingArtist.name}
                  </h3>
                  <ArtistForm
                    artist={editingArtist}
                    onSave={handleSaveArtist}
                    onCancel={() => setEditingArtist(null)}
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* Songs Tab */}
          {tab === "songs" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    setShowNewSong(true);
                    setEditingSong(null);
                  }}
                  disabled={saving || artists.length === 0}
                  className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white font-semibold disabled:opacity-50"
                >
                  + Add Song
                </button>
              </div>

              {showNewSong && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 bg-card-bg rounded-2xl p-6 border border-white/10"
                >
                  <h3 className="text-lg font-bold text-white mb-4">
                    New Song
                  </h3>
                  <SongForm
                    artists={artists}
                    onSave={handleSaveSong}
                    onCancel={() => setShowNewSong(false)}
                  />
                </motion.div>
              )}

              {/* Group songs by artist */}
              {artists.map((artist) => {
                const artistSongs = songs
                  .filter((s) => s.artistId === artist.id)
                  .sort((a, b) => a.order - b.order);
                if (artistSongs.length === 0) return null;
                return (
                  <div key={artist.id} className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-3">
                      {artist.name}
                    </h3>
                    <div className="space-y-2">
                      {artistSongs.map((song, idx) => (
                        <div
                          key={song.id}
                          className="bg-card-bg rounded-xl p-4 border border-white/5 flex items-center gap-4"
                        >
                          <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">
                            {song.order}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white">
                              {song.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {song.youtube}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleMoveSong(song.id, "up")
                              }
                              disabled={idx === 0 || saving}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors flex items-center justify-center"
                            >
                              &#8593;
                            </button>
                            <button
                              onClick={() =>
                                handleMoveSong(song.id, "down")
                              }
                              disabled={
                                idx === artistSongs.length - 1 || saving
                              }
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors flex items-center justify-center"
                            >
                              &#8595;
                            </button>
                            <button
                              onClick={() => {
                                setEditingSong(song);
                                setShowNewSong(false);
                              }}
                              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSong(song.id)}
                              className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 transition-colors"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {editingSong && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-card-bg rounded-2xl p-6 border border-accent/30"
                >
                  <h3 className="text-lg font-bold text-white mb-4">
                    Edit: {editingSong.title}
                  </h3>
                  <SongForm
                    song={editingSong}
                    artists={artists}
                    onSave={handleSaveSong}
                    onCancel={() => setEditingSong(null)}
                  />
                </motion.div>
              )}
            </div>
          )}
        </>
      )}

      {saving && (
        <div className="fixed bottom-6 right-6 bg-card-bg border border-accent/30 rounded-xl px-6 py-3 flex items-center gap-3 shadow-2xl">
          <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
          <span className="text-white">Saving to GitHub...</span>
        </div>
      )}
    </div>
  );
}
