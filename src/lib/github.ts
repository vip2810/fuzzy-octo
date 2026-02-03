const REPO_OWNER = "vip2810";
const REPO_NAME = "fuzzy-octo";
const BRANCH = "main";

interface GitHubFileResponse {
  content: string;
  sha: string;
  path: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("github_token");
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

export async function getFileContent(
  path: string
): Promise<{ content: string; sha: string }> {
  const res = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  }
  const data: GitHubFileResponse = await res.json();
  const content = atob(data.content.replace(/\n/g, ""));
  return { content, sha: data.sha };
}

export async function updateFile(
  path: string,
  content: string,
  sha: string,
  message: string
): Promise<void> {
  const res = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        sha,
        branch: BRANCH,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      `Failed to update ${path}: ${err.message || res.statusText}`
    );
  }
}

export async function validateToken(): Promise<boolean> {
  try {
    const res = await githubFetch("/user");
    return res.ok;
  } catch {
    return false;
  }
}
