const basePath = process.env.NODE_ENV === "production" ? "/fuzzy-octo" : "";

export function assetPath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${basePath}${path}`;
}
