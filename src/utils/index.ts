export const isNotEmptyValue = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return !!value || value === 0 || value === false;
};

export const handleBatchRequest = async (
  list: any[],
  fn: (args: any) => void
) => {
  return Promise.all(list.map((item) => fn(item)));
};

export const convertFileSize = (sizeInBytes: number, prec?: number) => {
  const precision = prec ?? 1;
  if (!sizeInBytes) {
    return '0';
  }
  if (sizeInBytes < 1024) {
    return `${sizeInBytes.toFixed(precision)} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(precision)} KiB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(precision)} MiB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(precision)} GiB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024 * 1024)).toFixed(precision)} TiB`;
  }
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

export const isHTMLDocumentString = (str: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.documentElement.tagName.toLowerCase() === 'html';
  } catch (e) {
    return false;
  }
};
