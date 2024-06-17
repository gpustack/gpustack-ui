export const isNotEmptyValue = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

export const handleBatchRequest = async (
  list: any[],
  fn: (args: any) => void
) => {
  return Promise.all(list.map((item) => fn(item)));
};

export const convertFileSize = (sizeInBytes: number) => {
  if (!sizeInBytes) {
    return '0 B';
  }
  if (sizeInBytes < 1024) {
    return `${sizeInBytes.toFixed(2)} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
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
    // 确保波动不太大
    let newValue = prevValue + Math.floor(Math.random() * 21) - offset; // 波动范围 [-10, 10]
    newValue = Math.max(min, Math.min(max, newValue)); // 保证在 [10, 100] 范围内
    data.push(newValue);
    prevValue = newValue;
  }

  return data;
};
