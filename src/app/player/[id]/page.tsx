import { getSongs, getSong, getArtist, getYoutubeId } from "@/lib/data";
import Player from "@/components/Player";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getSongs().map((song) => ({ id: song.id }));
}

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const song = getSong(id);

  if (!song) {
    notFound();
  }

  const artist = getArtist(song.artistId);

  if (!artist) {
    notFound();
  }

  const youtubeId = getYoutubeId(song.youtube);

  if (!youtubeId) {
    notFound();
  }

  return (
    <Player
      youtubeId={youtubeId}
      title={song.title}
      artistName={artist.name}
      artistId={artist.id}
    />
  );
}
