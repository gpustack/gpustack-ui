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

export function escapeBrackets(text: string) {
  const pattern =
    /(```[\S\s]*?```|`.*?`)|\\\[([\S\s]*?[^\\])\\]|\\\((.*?)\\\)/g;
  return text.replaceAll(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    }
  );
}

export function escapeMhchem(text: string) {
  return text.replaceAll('$\\ce{', '$\\\\ce{').replaceAll('$\\pu{', '$\\\\pu{');
}
