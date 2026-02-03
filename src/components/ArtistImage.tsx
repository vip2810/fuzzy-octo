"use client";

interface ArtistImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ArtistImage({ src, alt, className }: ArtistImageProps) {
  const initial = alt.charAt(0) || "?";
  const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#111128"/><text x="200" y="220" font-size="120" fill="#e94560" text-anchor="middle" font-family="sans-serif">${initial}</text></svg>`
  )}`;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (!img.src.startsWith("data:")) {
          img.src = fallbackSvg;
        }
      }}
    />
  );
}
