/**
 * The legal documents shown on the website.
 *
 * The copy that counts is the one that ships inside the app, so this fetches
 * the markdown straight from the repository and falls back to the copy
 * bundled here when GitHub is unreachable. Two versions of a privacy policy
 * that disagree is itself a problem, so there is only ever one source.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const RAW =
  process.env.LEGAL_RAW_BASE?.trim() ||
  'https://raw.githubusercontent.com/hakon0607/Gamehub/main/apps/desktop/src/legal';

export type Doc = 'terms-of-service' | 'privacy-policy';

export interface LegalDocument {
  text: string;
  /** "1.0" and "12 September 2026", read out of the document itself. */
  version: string;
  date: string;
  /** True when the bundled copy was used because GitHub did not answer. */
  offline: boolean;
}

function header(text: string): { version: string; date: string } {
  const match = /\*\*Version\s+([0-9.]+)\s+—\s+([^*]+)\*\*/.exec(text);
  return { version: match?.[1]?.trim() ?? '', date: match?.[2]?.trim() ?? '' };
}

export async function legalDocument(doc: Doc): Promise<LegalDocument> {
  try {
    const response = await fetch(`${RAW}/${doc}.en.md`, { next: { revalidate: 3600 } });
    if (response.ok) {
      const text = await response.text();
      if (text.includes('# ')) return { text, ...header(text), offline: false };
    }
  } catch {
    // Falls through to the bundled copy.
  }
  const text = await readFile(join(process.cwd(), 'lib', 'legal', `${doc}.en.md`), 'utf8');
  return { text, ...header(text), offline: true };
}
