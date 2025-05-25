import { useEffect, useRef } from 'react';

export default function useEmbeddingWorker() {
  const workerRef = useRef<Worker | null>(null);

  const createWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    workerRef.current = new Worker(
      new URL('../config/embedding-worker.worker.ts', import.meta.url),
      {
        type: 'module'
      }
    );
  };

  const postMessage = (params: {
    embeddings: any[];
    textList: { text: string; name: string; uid: number | string }[];
    fileList: { text: string; name: string; uid: number | string }[];
  }) => {
    if (workerRef.current) {
      workerRef.current.postMessage(params);
    }
  };

  const terminateWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, []);

  return { workerRef, createWorker, postMessage, terminateWorker };
}
