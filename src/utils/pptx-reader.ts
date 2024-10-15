import JSZip from 'jszip';

const readPptxContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      const arrayBuffer = e.target.result;
      JSZip.loadAsync(arrayBuffer).then(function (zip: any) {
        const slideFiles = Object.keys(zip.files).filter(function (fileName) {
          return (
            fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
          );
        });

        let slideText = '';
        const slidePromises = slideFiles.map((slideFile) =>
          zip
            .file(slideFile)
            .async('string')
            .then(function (content: any) {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(content, 'application/xml');
              const texts = xmlDoc.getElementsByTagName('a:t');
              for (let i = 0; i < texts.length; i++) {
                slideText += texts[i].textContent + '\n';
              }
            })
        );

        Promise.all(slidePromises).then(() => {
          resolve(slideText);
        });
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export default readPptxContent;
