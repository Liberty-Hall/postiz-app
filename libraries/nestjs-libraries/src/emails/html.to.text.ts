// A plain-text version of an email's HTML, for the text/plain part: the
// words, one line per block, and each link as "text (address)".
export function htmlToText(html: string): string {
  const text = html
    .replace(/<(head|style|script)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/\s+/g, ' ')
    .replace(
      /<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      (_, href: string, label: string) => {
        const words = label.replace(/<[^>]+>/g, '').trim();
        return words && words !== href ? `${words} (${href})` : href;
      }
    )
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|table|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  const lines = decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .filter((line) => line);
  return lines.join('\n') + '\n';
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(+dec))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
