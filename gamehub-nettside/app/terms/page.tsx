import { legalDocument } from '@/lib/legal';
import { Markdown } from '@/components/Markdown';

export const revalidate = 3600;
export const metadata = {
  title: 'GameHub — Terms of Service',
  description: 'The terms you accept when you install GameHub.',
};

export default async function Terms() {
  const doc = await legalDocument('terms-of-service');
  return (
    <article className="card legal-page">
      <div className="label">Version {doc.version} · {doc.date}</div>
      <Markdown text={doc.text} />
      <p className="meta legal-foot">
        This is the same text that ships inside the app, under Settings → Terms of Service.
        The Norwegian translation is in the app; English is the version that counts.
      </p>
    </article>
  );
}
