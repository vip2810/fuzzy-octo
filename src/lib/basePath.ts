const basePath = process.env.NODE_ENV === "production" ? "/fuzzy-octo" : "";

export function assetPath(path: string): string {
  return `${basePath}${path}`;
}
