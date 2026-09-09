/**
 * GitHub is the database.
 *
 * Every version of GameHub is a GitHub Release, built and signed by the
 * Release workflow in the app repository. This site never stores a file of
 * its own: the download button points at the release asset, the version list
 * is the release list, and "publish a new version" is one commit that bumps
 * the version number — the same thing the owner would do by hand in the
 * GitHub editor.
 *
 * Release notes live in `release-notes/<version>.md` in the app repository,
 * written by /admin. The Release workflow reads that file when it publishes,
 * so the same text ends up in the release and in the update popup inside the
 * app.
 */

// Overridable so the site can be exercised against a local stand-in.
const API = process.env.GITHUB_API?.trim() || 'https://api.github.com';

export function repo(): string {
  return process.env.GITHUB_REPO?.trim() || 'hakon0607/Gamehub';
}

function headers(write = false): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'gamehub-nettside',
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  // Reads work without a token on a public repo, but rate limits are far
  // kinder with one, so it is sent whenever it exists.
  if (token) h.Authorization = `Bearer ${token}`;
  if (write && !token) throw new Error('GITHUB_TOKEN mangler. Legg den inn under Environment Variables i Vercel.');
  return h;
}

export interface Asset {
  name: string;
  size: number;
  downloadUrl: string;
  downloads: number;
}

export interface Release {
  id: number;
  tag: string;
  version: string;
  name: string;
  body: string;
  publishedAt: string | null;
  prerelease: boolean;
  draft: boolean;
  url: string;
  assets: Asset[];
  /** The stable installer, when the release has one. */
  installer: Asset | null;
}

function toRelease(raw: any): Release {
  const assets: Asset[] = (raw.assets ?? []).map((a: any) => ({
    name: a.name,
    size: a.size,
    downloadUrl: a.browser_download_url,
    downloads: a.download_count ?? 0,
  }));
  const installer =
    assets.find((a) => a.name === 'GameHub-Setup.exe') ??
    assets.find((a) => a.name.endsWith('-setup.exe')) ??
    null;
  return {
    id: raw.id,
    tag: raw.tag_name,
    version: String(raw.tag_name ?? '').replace(/^v/, ''),
    name: raw.name || raw.tag_name,
    body: raw.body ?? '',
    publishedAt: raw.published_at ?? raw.created_at ?? null,
    prerelease: Boolean(raw.prerelease),
    draft: Boolean(raw.draft),
    url: raw.html_url,
    assets,
    installer,
  };
}

/** Every release, newest first. Drafts are never shown to anyone. */
export async function listReleases(): Promise<Release[]> {
  const res = await fetch(`${API}/repos/${repo()}/releases?per_page=50`, {
    headers: headers(),
    next: { revalidate: 60 },
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub svarte ${res.status} på release-listen.`);
  const raw = (await res.json()) as any[];
  return raw.map(toRelease).filter((r) => !r.draft);
}

/** What the public sees: the newest release that is not hidden. */
export function pickLatest(releases: Release[]): Release | null {
  return releases.find((r) => !r.prerelease && r.installer) ?? null;
}

/* ------------------------------------------------------------------ write */

interface FileInfo {
  content: string;
  sha: string;
}

async function readFile(path: string): Promise<FileInfo | null> {
  const res = await fetch(`${API}/repos/${repo()}/contents/${path}`, { headers: headers(), cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Kunne ikke lese ${path}: GitHub svarte ${res.status}.`);
  const json = (await res.json()) as { content: string; sha: string };
  return { content: Buffer.from(json.content, 'base64').toString('utf8'), sha: json.sha };
}

async function writeFile(path: string, content: string, message: string, sha?: string): Promise<void> {
  const res = await fetch(`${API}/repos/${repo()}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(true), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: Buffer.from(content, 'utf8').toString('base64'), sha }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error('GitHub avviste tokenet. Sjekk at GITHUB_TOKEN i Vercel har «Contents: Read and write» på repoet.');
    }
    throw new Error(`Kunne ikke skrive ${path}: GitHub svarte ${res.status}. ${text.slice(0, 200)}`);
  }
}

const CONFIG_PATH = 'apps/desktop/src-tauri/tauri.conf.json';

/** The version the app repository currently declares. */
export async function currentVersion(): Promise<string> {
  const file = await readFile(CONFIG_PATH);
  if (!file) throw new Error(`Fant ikke ${CONFIG_PATH} i ${repo()}.`);
  const match = /"version"\s*:\s*"(\d+\.\d+\.\d+)"/.exec(file.content);
  if (!match) throw new Error('Fant ingen versjon i tauri.conf.json.');
  return match[1]!;
}

export function isVersion(value: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(value);
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

export function nextPatch(version: string): string {
  const [a, b, c] = version.split('.').map(Number);
  return `${a}.${b}.${(c ?? 0) + 1}`;
}

/**
 * Publishes a version: writes the notes, then bumps the version number.
 *
 * Two commits, because the Contents API writes one file at a time. The notes
 * go first so they exist by the time the workflow — triggered by the second
 * commit — looks for them.
 */
export async function publish(version: string, notes: string): Promise<void> {
  if (!isVersion(version)) throw new Error('Versjonen må se ut som 1.2.3 — tre tall med punktum mellom.');
  const current = await currentVersion();
  if (compareVersions(version, current) <= 0) {
    throw new Error(`Versjonen må være høyere enn ${current}, som er den som ligger der nå.`);
  }

  const notesPath = `release-notes/${version}.md`;
  const trimmed = notes.trim();
  if (trimmed) {
    const existing = await readFile(notesPath);
    await writeFile(notesPath, `${trimmed}\n`, `Notater for ${version}`, existing?.sha);
  }

  const config = await readFile(CONFIG_PATH);
  if (!config) throw new Error(`Fant ikke ${CONFIG_PATH}.`);
  const updated = config.content.replace(/"version"\s*:\s*"\d+\.\d+\.\d+"/, `"version": "${version}"`);
  await writeFile(CONFIG_PATH, updated, `Versjon ${version}`, config.sha);
}

/** Rewrites a release's notes on GitHub. */
export async function setReleaseNotes(id: number, body: string): Promise<void> {
  const res = await fetch(`${API}/repos/${repo()}/releases/${id}`, {
    method: 'PATCH',
    headers: { ...headers(true), 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`Kunne ikke lagre notatene: GitHub svarte ${res.status}.`);
}

/**
 * Hides or shows a release by flipping its pre-release flag. A pre-release is
 * left out of `releases/latest`, which is what both this site and the app's
 * updater read — so hiding a version here also stops the app offering it.
 */
export async function setHidden(id: number, hidden: boolean): Promise<void> {
  const res = await fetch(`${API}/repos/${repo()}/releases/${id}`, {
    method: 'PATCH',
    headers: { ...headers(true), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prerelease: hidden, make_latest: hidden ? 'false' : 'true' }),
  });
  if (!res.ok) throw new Error(`Kunne ikke endre synligheten: GitHub svarte ${res.status}.`);
}

/** The most recent workflow runs, so /admin can say "building…". */
export interface Run {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
}

export async function recentRuns(): Promise<Run[]> {
  const res = await fetch(`${API}/repos/${repo()}/actions/workflows/release.yml/runs?per_page=5`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { workflow_runs?: any[] };
  return (json.workflow_runs ?? []).map((r) => ({
    id: r.id,
    name: r.display_title ?? r.name,
    status: r.status,
    conclusion: r.conclusion,
    url: r.html_url,
    createdAt: r.created_at,
  }));
}
