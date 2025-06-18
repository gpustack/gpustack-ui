const htmlUnescapes: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'"
};

const reEscapedHtml = /&(?:amp|lt|gt|quot|#(?:0+)?39);/g;
const reHasEscapedHtml = RegExp(reEscapedHtml.source);

export const unescape = (str = '') => {
  return reHasEscapedHtml.test(str)
    ? str.replace(reEscapedHtml, (entity) => htmlUnescapes[entity] || "'")
    : str;
};

export function escapeDollarNumber(text: string) {
  let escapedText = '';

  for (let i = 0; i < text.length; i += 1) {
    let char = text[i];
    const nextChar = text[i + 1] || ' ';

    if (char === '$' && nextChar >= '0' && nextChar <= '9') {
      char = '\\$';
    }

    escapedText += char;
  }

  return escapedText;
}

export function escapeBrackets(text: string): string {
  const codeRegex = /```[\s\S]*?```|`[^`\n]+`/g;

  const codeBlocks: string[] = [];
  const placeholder = '%%CODE_BLOCK%%';

  // 1. replace code blocks with a placeholder
  //    and store them in an array
  const temp = text.replace(codeRegex, (match) => {
    codeBlocks.push(match);
    return placeholder;
  });

  // 2. repace \[...\] with $$...$$，and replace \(...\) with $...$
  const replaced = temp
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$${inner}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`);

  // 3. restore code blocks from the placeholder
  let i = 0;
  return replaced.replace(
    new RegExp(placeholder, 'g'),
    () => codeBlocks[i++] || ''
  );
}

export function escapeMhchem_2(text: string) {
  return text.replaceAll('$\\ce{', '$\\\\ce{').replaceAll('$\\pu{', '$\\\\pu{');
}

export function escapeMhchem(text: string): string {
  const codeRegex = /```[\s\S]*?```|`[^`\n]+`/g;
  const codeBlocks: string[] = [];
  const placeholder = '%%CODE_BLOCK%%';

  // 1. Replace code blocks with a placeholder
  const temp = text.replace(codeRegex, (match) => {
    codeBlocks.push(match);
    return placeholder;
  });

  // 2. Only perform \ce{} / \pu{} escaping inside $...$ (to avoid incorrect escaping outside math environments)
  const mathRegex = /\$(.+?)\$/gs;
  const escaped = temp.replace(mathRegex, (_, content) => {
    const fixed = content
      .replace(/(?<!\\)\\ce\{/g, '\\\\ce{')
      .replace(/(?<!\\)\\pu\{/g, '\\\\pu{');
    return `$${fixed}$`;
  });

  // 3. Restore code blocks
  let i = 0;
  return escaped.replace(
    new RegExp(placeholder, 'g'),
    () => codeBlocks[i++] || ''
  );
}
