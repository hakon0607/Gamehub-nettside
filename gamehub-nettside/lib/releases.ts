/**
 * The newest GameHub release, straight from GitHub's public API.
 *
 * Nothing is stored here. The Release workflow in the app repository builds
 * and publishes every version; this site simply shows the latest one. No
 * token, no database, nothing to log into.
 */
export interface Release {
  version: string;
  notes: string;
  publishedAt: string;
  url: string;
  size: number;
  page: string;
}

const REPO = process.env.GITHUB_REPO?.trim() || 'hakon0607/Gamehub';

export async function latestRelease(): Promise<Release | null> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'gamehub-nettside' },
    next: { revalidate: 120 },
  });
  if (!res.ok) return null;
  const raw = (await res.json()) as any;
  const assets: any[] = raw.assets ?? [];
  const installer = assets.find((a) => a.name === 'GameHub-Setup.exe') ?? assets.find((a) => String(a.name).endsWith('-setup.exe'));
  if (!installer) return null;
  // The notes the workflow writes are followed by a generic "download below"
  // block; only the part above the rule is the human-written part.
  const body = String(raw.body ?? '');
  const notes = body.includes('\n---') ? body.split('\n---')[0]!.trim() : '';
  return {
    version: String(raw.tag_name ?? '').replace(/^v/, ''),
    notes,
    publishedAt: raw.published_at ?? '',
    url: installer.browser_download_url,
    size: installer.size ?? 0,
    page: raw.html_url,
  };
}
