import { useCallback, useState } from 'react';

const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 3000);
      }
    } catch (error) {
      setCopied(false);
    }
  }, []);

  return { copied, copyToClipboard };
};

export default useCopyToClipboard;
