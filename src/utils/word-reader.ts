import mammoth from 'mammoth';

export default function readWordContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      const arrayBuffer = e.target.result;
      mammoth
        .extractRawText({ arrayBuffer })
        .then((result) => {
          resolve(result.value);
        })
        .catch((error) => reject(error));
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
