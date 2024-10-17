export default function readHtmlContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      const fileContent = e.target.result;

      const parser = new DOMParser();
      const doc = parser.parseFromString(fileContent, 'text/html');
      const textContent = doc.body.textContent || '';
      const cleanedTextContent = textContent.replace(/[\t\n]/g, '').trim();
      resolve(cleanedTextContent);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}
