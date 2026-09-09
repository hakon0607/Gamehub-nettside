import { del, list, put } from '@vercel/blob';

/**
 * A version is a folder in Vercel Blob: `releases/<version>/GameHub-Setup.exe`
 * plus an optional `notes.txt` beside it. Nothing else — no database. The
 * newest version number is what the front page offers.
 */
export interface Version {
  version: string;
  url: string;
  size: number;
  uploadedAt: string;
  notes: string;
  /** Every blob under the folder, so deleting removes all of it. */
  urls: string[];
}

export const INSTALLER = 'GameHub-Setup.exe';

export function isVersion(v: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(v);
}

export function compare(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

export function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function listVersions(): Promise<Version[]> {
  if (!hasBlob()) return [];
  const found = new Map<string, Version>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: 'releases/', cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const match = /^releases\/(\d+\.\d+\.\d+)\/(.+)$/.exec(blob.pathname);
      if (!match) continue;
      const [, version, file] = match;
      const entry = found.get(version!) ?? { version: version!, url: '', size: 0, uploadedAt: '', notes: '', urls: [] };
      entry.urls.push(blob.url);
      if (file === INSTALLER) {
        entry.url = blob.url;
        entry.size = blob.size;
        entry.uploadedAt = blob.uploadedAt instanceof Date ? blob.uploadedAt.toISOString() : String(blob.uploadedAt);
      }
      if (file === 'notes.txt') {
        entry.notes = await fetch(blob.url, { cache: 'no-store' }).then((r) => (r.ok ? r.text() : '')).catch(() => '');
      }
      found.set(version!, entry);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return [...found.values()].filter((v) => v.url).sort((a, b) => compare(b.version, a.version));
}

export async function saveNotes(version: string, notes: string): Promise<void> {
  await put(`releases/${version}/notes.txt`, notes.trim() || ' ', {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'text/plain; charset=utf-8',
    cacheControlMaxAge: 60,
  });
}

export async function deleteVersion(version: string): Promise<void> {
  const versions = await listVersions();
  const target = versions.find((v) => v.version === version);
  if (!target) throw new Error('Fant ikke den versjonen.');
  await del(target.urls);
}
