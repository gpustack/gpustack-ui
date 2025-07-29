import _ from 'lodash';

export const isNotEmptyValue = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return !!value || value === 0 || value === false;
};

export const isNotEmptyValueAllowNull = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return !!value || value === 0 || value === false || value === null;
};

export const handleBatchRequest = async (
  list: any[],
  fn: (args: any) => void
) => {
  return Promise.allSettled(list.map((item) => fn(item)));
};

export const convertFileSize = (
  sizeInBytes: number,
  prec = 1,
  allowEmpty = false
): string | number => {
  if (!sizeInBytes) return allowEmpty ? '' : 0;

  const fmt = 1024;

  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const precs = [0, 1, 1, 2, 2]; // precision for each unit
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= fmt && unitIndex < units.length - 1) {
    size /= fmt;
    unitIndex++;
  }

  return `${_.round(size, precs[unitIndex])} ${units[unitIndex]}`;
};

export const platformCall = () => {
  const platform = navigator.userAgent;
  const isMac = () => {
    return platform.indexOf('Mac') !== -1;
  };
  const isWin = () => {
    return platform.indexOf('Win') !== -1;
  };
  return {
    isMac: isMac(),
    isWin: isWin()
  };
};

export const formatTime = (seconds: number) => {
  if (isNaN(seconds) || !seconds || seconds === Infinity) {
    return '00:00';
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formatted = [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ];

  if (hrs > 0) {
    return `${formatted[0]}:${formatted[1]}:${formatted[2]}`;
  }
  return `${formatted[1]}:${formatted[2]}`;
};

export const formatNumber = (num: number) => {
  if (!num) {
    return '0';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'k';
  } else {
    return num.toString();
  }
};

export const formatLargeNumber = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return value;
  }

  if (value >= 1e9) {
    return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (value >= 1e6) {
    return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (value >= 1e3) {
    return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return value;
  }
};

export function loadLanguageConfig(language: string) {
  // @ts-ignore
  const requireContext = require.context(`./${language}`, false, /\.ts$/);

  const languageConfig: Record<string, string> = {};

  requireContext.keys().forEach((fileName: any) => {
    const moduleConfig = requireContext(fileName).default;

    const moduleName = fileName.replace(/(\.\/|\.ts)/g, '');

    languageConfig[moduleName] = moduleConfig;
  });

  return languageConfig;
}

export function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      resolve(e.target.result);
    };
    reader.readAsText(blob, 'utf-8');
  });
}

export const cosineSimilarity = (vec1: number[], vec2: number[]) => {
  if (vec1.length !== vec2.length) {
    throw new Error('both vectors must have the same length');
  }

  const dotProduct = vec1.reduce(
    (sum, value, index) => sum + value * vec2[index],
    0
  );

  const magnitudeA = Math.sqrt(
    vec1.reduce((sum, value) => sum + value * value, 0)
  );
  const magnitudeB = Math.sqrt(
    vec2.reduce((sum, value) => sum + value * value, 0)
  );

  if (magnitudeA === 0 || magnitudeB === 0) {
    throw new Error('both vectors must have a length greater than 0');
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

const htmlSpecialTags = /^<html>(.|\n|\r)*<\/html>$/i;

export const isHTMLDocumentString = (str: string) => {
  return htmlSpecialTags.test(str?.trim());
};

// generate a random number between 0 and 64 bit

export const generateRandomNumber = () => {
  // 16: 0x1000；32:0x100000000
  return Math.floor(Math.random() * 0x100000000);
};

function base64ToBlob(base64: string, contentType = '', sliceSize = 512) {
  try {
    const base64Content = base64.replace(/^data:image\/[^;]+;base64,/, '');
    const byteCharacters = atob(base64Content);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  } catch (error) {
    return null;
  }
}

export const base64ToFile = (base64String: string, fileName: string) => {
  try {
    if (!base64String) {
      return null;
    }
    console.log('base64String:', base64String);
    const match = base64String.match(/data:(.*?);base64,/);
    if (!match) {
      throw new Error('Invalid base64 string');
    }
    const contentType = match[1];
    const blob = base64ToBlob(base64String, contentType);
    if (!blob) {
      throw new Error('Failed to convert base64 to blob');
    }
    return new File([blob], fileName || contentType, { type: contentType });
  } catch (error) {
    return null;
  }
};

// check onlinestatus
export const isOnline = () => {
  return window.navigator.onLine;
};
