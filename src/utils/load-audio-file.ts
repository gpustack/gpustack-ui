import { convertFileSize } from './index';

export const loadAudioData = async (data: any, type: string) => {
  return new Promise((resolve, reject) => {
    try {
      const audioBlob = new Blob([data], { type: type });
      const fileSize = convertFileSize(audioBlob.size);

      const audio = document.createElement('audio');
      const url = URL.createObjectURL(audioBlob);
      audio.src = url;

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        resolve({ size: fileSize, duration: Math.ceil(duration), url: url });
      });

      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audio.src);
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const readAudioFile = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e: any) {
      try {
        // const size = convertFileSize(file.size);
        console.log('file====', file);
        const arrayBuffer = e.target.result;
        const audioData = await loadAudioData(arrayBuffer, file.type);
        resolve({
          ...(audioData || {}),
          name: file.name
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};