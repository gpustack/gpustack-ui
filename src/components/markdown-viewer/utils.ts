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
