import _ from 'lodash';
import { useState } from 'react';

const imageUrlRegex = /(https?:\/\/\S+\.(png|jpg|jpeg))/gi;

const useFindImages = () => {
  function extractImageUrls(text: string) {
    return [...text.matchAll(imageUrlRegex)].map((m) => m[0]);
  }

  const [pendingUrls, setPendingUrls] = useState<string[]>([]);

  const debounceExtract = _.debounce((text: string) => {
    const urls = extractImageUrls(text);
    if (urls.length > 0) {
      setPendingUrls(urls);
    } else {
      setPendingUrls([]);
    }
  }, 200);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    debounceExtract(text);
  };

  return {
    handleInputChange
  };
};
