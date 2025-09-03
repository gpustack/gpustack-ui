import { saveAs } from 'file-saver';

export const downloadFile = (blob: Blob, filename: string) => {
  saveAs(blob, filename);
};
