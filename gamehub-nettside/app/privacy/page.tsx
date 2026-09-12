import { legalDocument } from '@/lib/legal';
import { Markdown } from '@/components/Markdown';

export const revalidate = 3600;
export const metadata = {
  title: 'GameHub — Privacy Policy',
  description: 'What GameHub does with data about you. Short answer: it stays on your PC.',
};

export default async function Privacy() {
  const doc = await legalDocument('privacy-policy');
  return (
    <article className="card legal-page">
      <div className="label">Version {doc.version} · {doc.date}</div>
      <Markdown text={doc.text} />
      <p className="meta legal-foot">
        This is the same text that ships inside the app, under Settings → Terms of Service,
        where you can also switch the statistics off and delete what was sent.
      </p>
    </article>
  );
}
