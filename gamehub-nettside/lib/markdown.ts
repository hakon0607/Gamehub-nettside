/**
 * Just enough Markdown for release notes: paragraphs, bullet lists, bold,
 * inline code and links. No dependency, no HTML pass-through.
 */
function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(text: string): string {
  return escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener" target="_blank">$1</a>');
}

export function render(markdown: string): string {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (list.length) {
      out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`);
      list = [];
    }
    if (paragraph.length) {
      out.push(`<p>${inline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const level = Math.min(3, heading[1]!.length + 2);
      out.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
      continue;
    }
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      if (paragraph.length) flush();
      list.push(bullet[1]!);
      continue;
    }
    if (list.length) flush();
    paragraph.push(line);
  }
  flush();
  return out.join('\n');
}
