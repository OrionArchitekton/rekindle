import type { RepoSnapshot } from "./core";

const GH = "https://api.github.com";

export type SnapshotResult =
  | { ok: true; snapshot: RepoSnapshot }
  | { ok: false; error: "not_found" | "rate_limited" | "upstream" };

function ghHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "rekindle-hackathon-app",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function ghGet(path: string, accept?: string): Promise<Response> {
  const headers = { ...ghHeaders() } as Record<string, string>;
  if (accept) headers.Accept = accept;
  return fetch(`${GH}${path}`, { headers, next: { revalidate: 3600 } });
}

export async function fetchRepoSnapshot(owner: string, repo: string): Promise<SnapshotResult> {
  const metaRes = await ghGet(`/repos/${owner}/${repo}`);
  if (metaRes.status === 404) return { ok: false, error: "not_found" };
  if (metaRes.status === 403 || metaRes.status === 429) return { ok: false, error: "rate_limited" };
  if (!metaRes.ok) return { ok: false, error: "upstream" };
  const meta = await metaRes.json();

  const [readmeRes, commitsRes, contentsRes] = await Promise.all([
    ghGet(`/repos/${owner}/${repo}/readme`, "application/vnd.github.raw+json"),
    ghGet(`/repos/${owner}/${repo}/commits?per_page=10`),
    ghGet(`/repos/${owner}/${repo}/contents/`),
  ]);

  const readmeExcerpt = readmeRes.ok ? (await readmeRes.text()).slice(0, 4000) : "";

  let commitLines: string[] = [];
  if (commitsRes.ok) {
    const commits = (await commitsRes.json()) as Array<{
      commit?: { author?: { date?: string }; message?: string };
    }>;
    commitLines = commits.map((c) => {
      const date = (c.commit?.author?.date ?? "").slice(0, 10);
      const msg = (c.commit?.message ?? "").split("\n")[0].slice(0, 100);
      return `${date} ${msg}`.trim();
    });
  }

  let topFiles: string[] = [];
  if (contentsRes.ok) {
    const contents = (await contentsRes.json()) as Array<{ name?: string; type?: string }>;
    if (Array.isArray(contents)) {
      topFiles = contents
        .map((f) => (f.type === "dir" ? `${f.name}/` : (f.name ?? "")))
        .filter(Boolean)
        .slice(0, 30);
    }
  }

  return {
    ok: true,
    snapshot: {
      owner: String(meta.owner?.login ?? owner),
      repo: String(meta.name ?? repo),
      description: meta.description ?? null,
      language: meta.language ?? null,
      stars: Number(meta.stargazers_count ?? 0),
      createdAt: String(meta.created_at ?? ""),
      pushedAt: String(meta.pushed_at ?? ""),
      readmeExcerpt,
      commitLines,
      topFiles,
    },
  };
}
