import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  // @ts-ignore
  import.meta.url
).href;

const readPDFContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e: any) {
      try {
        const arrayBuffer = e.target.result;
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        const pagePromises = [];

        for (let i = 1; i <= numPages; i++) {
          const pagePromise = pdf.getPage(i).then(function (page) {
            return page.getTextContent().then(function (textContent) {
              return textContent.items
                .map(function (item: any) {
                  return item.str;
                })
                .join(' ');
            });
          });
          pagePromises.push(pagePromise);
        }

        const pageTexts = await Promise.all(pagePromises);
        const result = pageTexts?.join(' ');
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export default readPDFContent;
