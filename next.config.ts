import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/fuzzy-octo" : "",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GITHUB_OWNER: "vip2810",
    NEXT_PUBLIC_GITHUB_REPO: "fuzzy-octo",
    NEXT_PUBLIC_GITHUB_BRANCH: "claude/jamstack-karaoke-site-fCM6p",
  },
};

export default nextConfig;
