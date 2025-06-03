import { convertFileSize } from './index';

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const loadAudioData = async (
  data: any,
  type: string
): Promise<{
  data: Blob;
  size: number | string;
  type: string;
  duration: number;
  url: string;
}> => {
  return new Promise((resolve, reject) => {
    try {
      const audioBlob = new Blob([data], { type: type });
      const fileSize = convertFileSize(audioBlob.size);

      const audio = document.createElement('audio');
      const url = URL.createObjectURL(audioBlob);
      audio.src = url;

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        resolve({
          data: audioBlob,
          size: fileSize,
          type: type,
          duration: Math.ceil(duration),
          url: url
        });
      });

      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audio.src);
      });
    } catch (error) {
      console.log('error====', error);
      reject(error);
    }
  });
};

export const readAudioFile = async (
  file: File
): Promise<{ url: string; name: string; duration: number }> => {
  console.log('file====', file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e: any) {
      try {
        console.log('file====', file);
        const arrayBuffer = e.target.result;
        const audioData = await loadAudioData(arrayBuffer, file.type);
        resolve({
          ...(audioData || {}),
          name: file.name
        });
      } catch (error) {
        console.log('error====', error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
