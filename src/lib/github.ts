const DEFAULTS = {
  owner: "vip2810",
  repo: "fuzzy-octo",
  branch: "claude/jamstack-karaoke-site-fCM6p",
};

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
}

interface GitHubFileResponse {
  content: string;
  sha: string;
  path: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("github_token");
}

export function getRepoConfig(): RepoConfig {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const saved = localStorage.getItem("github_repo_config");
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return DEFAULTS;
}

export function setRepoConfig(config: RepoConfig) {
  localStorage.setItem("github_repo_config", JSON.stringify(config));
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function setToken(token: string) {
  localStorage.setItem("github_token", token);
}

export function clearToken() {
  localStorage.removeItem("github_token");
}

async function githubFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error("GitHub token not configured");

  return fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

function base64ToUtf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export async function getFileContent(
  path: string
): Promise<{ content: string; sha: string }> {
  const { owner, repo, branch } = getRepoConfig();
  const res = await githubFetch(
    `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch ${path}: ${body.message || res.statusText} (branch: ${branch})`
    );
  }
  const data: GitHubFileResponse = await res.json();
  const content = base64ToUtf8(data.content);
  return { content, sha: data.sha };
}

export async function updateFile(
  path: string,
  content: string,
  sha: string,
  message: string
): Promise<{ commitSha: string }> {
  const { owner, repo, branch } = getRepoConfig();
  const res = await githubFetch(
    `/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: utf8ToBase64(content),
        sha,
        branch,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to update ${path}: ${err.message || res.statusText}`
    );
  }
  const data = await res.json();
  return { commitSha: data.commit?.sha || "" };
}

export async function validateToken(): Promise<boolean> {
  try {
    const res = await githubFetch("/user");
    return res.ok;
  } catch {
    return false;
  }
}

export async function listBranches(): Promise<string[]> {
  const { owner, repo } = getRepoConfig();
  try {
    const res = await githubFetch(`/repos/${owner}/${repo}/branches?per_page=100`);
    if (!res.ok) return [];
    const data: Array<{ name: string }> = await res.json();
    return data.map((b) => b.name);
  } catch {
    return [];
  }
}
