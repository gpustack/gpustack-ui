import ePub from 'epubjs';

export default function readEpubContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      const arrayBuffer = e.target.result;
      const book = ePub(arrayBuffer);

      book.loaded?.spine?.then?.((spine: any) => {
        const chapterPromises = spine.spineItems?.map?.((chapter: any) => {
          return book.load(chapter.href).then((content: any) => {
            return content.body?.textContent || '';
          });
        });
        Promise.all(chapterPromises)
          .then((chaptersText) => {
            const result = chaptersText.join('');
            resolve(result);
          })
          .catch((error) => {
            reject(error);
          });
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
