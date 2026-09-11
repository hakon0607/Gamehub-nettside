/**
 * GameHub releases, straight from GitHub's public API.
 *
 * Nothing is stored here. The Release workflow in the app repository builds
 * and publishes every version; this site shows the newest one and how many
 * times the installer has been downloaded — GitHub counts every download of
 * a release asset, so the counter is real and needs no database, token or
 * login. Everything is cached for two minutes.
 */
export interface Release {
  version: string;
  notes: string;
  publishedAt: string;
  url: string;
  size: number;
  page: string;
  /** Installer downloads for this version, as counted by GitHub. */
  downloads: number;
  /** Marked as a pre-release on GitHub: still counted, not offered. */
  prerelease: boolean;
}

export interface Releases {
  latest: Release | null;
  /** Newest first, latest included. */
  all: Release[];
  /** Installer downloads across every version. */
  totalDownloads: number;
}

const REPO = process.env.GITHUB_REPO?.trim() || 'hakon0607/Gamehub';
// Optional. Without it GitHub allows 60 requests an hour per IP, which is
// plenty at one request every two minutes; with it, 5 000.
const TOKEN = process.env.GITHUB_TOKEN?.trim();
// The last answer that worked, so a hiccup at GitHub never blanks the page.
let lastGood: Releases | null = null;
const API = process.env.GITHUB_API?.trim() || 'https://api.github.com';

function toRelease(raw: any): Release | null {
  const assets: any[] = raw.assets ?? [];
  const installer = assets.find((a) => a.name === 'GameHub-Setup.exe') ?? assets.find((a) => String(a.name).toLowerCase().endsWith('setup.exe'));
  if (!installer || raw.draft) return null;
  // The notes the workflow writes are followed by a generic "download below"
  // block; only the part above the rule is the human-written part.
  const body = String(raw.body ?? '');
  const notes = body.includes('\n---') ? body.split('\n---')[0]!.trim() : body.trim();
  return {
    version: String(raw.tag_name ?? '').replace(/^v/, ''),
    notes,
    publishedAt: raw.published_at ?? '',
    url: installer.browser_download_url,
    size: installer.size ?? 0,
    page: raw.html_url,
    downloads: Number(installer.download_count ?? 0),
    prerelease: Boolean(raw.prerelease),
  };
}

export async function releases(): Promise<Releases> {
  const empty: Releases = { latest: null, all: [], totalDownloads: 0 };
  let raw: any[];
  try {
    const res = await fetch(`${API}/repos/${REPO}/releases?per_page=100`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'gamehub-website',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      console.error('GitHub releases:', res.status);
      return lastGood ?? empty;
    }
    raw = (await res.json()) as any[];
  } catch (error) {
    // A network hiccup must not take the page down; it tries again in two minutes.
    console.error('GitHub releases:', error);
    return lastGood ?? empty;
  }
  const list = raw.map(toRelease).filter((r): r is Release => r !== null && !r.version.includes('-'));
  list.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  const visible = list.filter((r) => !r.prerelease);
  const result: Releases = {
    latest: visible[0] ?? null,
    all: visible,
    totalDownloads: list.reduce((sum, r) => sum + r.downloads, 0),
  };
  if (result.latest) lastGood = result;
  return result;
}
