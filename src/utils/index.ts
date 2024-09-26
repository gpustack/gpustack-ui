import _ from 'lodash';
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

export const generateRandomArray = (config?: {
  min: number;
  max: number;
  length: number;
  offset: number;
}) => {
  const { min, max, length, offset } = config || {
    min: 10,
    max: 80,
    length: 10,
    offset: 10
  };

  const data = [];
  let prevValue = Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 0; i < length; i++) {
    let newValue = prevValue + Math.floor(Math.random() * 21) - offset; // Fluctuation range [-10, 10]
    newValue = Math.max(min, Math.min(max, newValue)); // Ensure within [10, 100]
    data.push(newValue);
    prevValue = newValue;
  }

  return data;
};

export const generateFluctuatingData2 = ({
  total = 100,
  noiseLevel = 10,
  max = 50,
  min = 5
}) => {
  const x = [];
  const y = [];

  for (let i = 0; i < total; i++) {
    // Generate a basic linear trend using a sine function
    const phaseShift = Math.random() * 2 * Math.PI;
    const trend =
      max * Math.sin((3 * Math.PI * i + phaseShift) / total) + max / 2;

    // Generate noise
    const noise = (Math.random() * 2 - 1) * noiseLevel;

    // Add trend and noise
    const value = trend + noise;
    x.push(i);
    y.push(Math.max(min, value));
  }

  return y;
};

export const generateFluctuatingData = ({
  total = 50,
  trendType = 'linear',
  max = 1,
  f = 1,
  phase = 0,
  min = 0
}) => {
  /**
   * Generate a set of data for a line chart with a natural and aesthetically pleasing trend.
   *
   * Parameters:
   * total (number): Number of data points to generate
   * trendType (string): Type of data trend, options are 'linear', 'sine', 'exponential'
   * max (number): Fluctuation amplitude
   * f (number): Fluctuation frequency
   * phase (number): Fluctuation phase
   * min (number): Minimum value of the data
   *
   * Returns:
   * x (number[]): x-axis data
   * y (number[]): y-axis data
   */
  const x = Array.from({ length: total }, (_, i) => (i * 10) / (total - 1));

  let y;
  switch (trendType) {
    case 'linear':
      y = x.map(
        (val) => val * (Math.random() * 2 - 1) * 3 + Math.random() * 8 - 4
      );

      break;
    case 'sine':
      y = x.map(
        (val) =>
          max * Math.sin(2 * Math.PI * f * val + phase) + Math.random() * 2 - 1
      );
      break;
    case 'exponential':
      y = x.map(
        (val) => Math.exp(val * Math.random() * 0.2) + Math.random() * 4 - 2
      );
      break;
    default:
      throw new Error(
        'Invalid trendType parameter. Please choose "linear", "sine", or "exponential".'
      );
  }

  // Adjust the data to the minimum value
  const minY = Math.min(...y);
  y = y.map((val) => _.round(val - minY + min, 2));

  return y;
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
  const requireContext = require.context(`./${language}`, false, /\.ts$/);

  const languageConfig: Record<string, string> = {};

  requireContext.keys().forEach((fileName: any) => {
    const moduleConfig = requireContext(fileName).default;

    const moduleName = fileName.replace(/(\.\/|\.ts)/g, '');

    languageConfig[moduleName] = moduleConfig;
  });

  return languageConfig;
}
