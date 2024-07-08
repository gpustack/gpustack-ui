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
    // 确保波动不太大
    let newValue = prevValue + Math.floor(Math.random() * 21) - offset; // 波动范围 [-10, 10]
    newValue = Math.max(min, Math.min(max, newValue)); // 保证在 [10, 100] 范围内
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
    // 生成一个基本的线性趋势，使用正弦函数
    const phaseShift = Math.random() * 2 * Math.PI;
    const trend =
      max * Math.sin((3 * Math.PI * i + phaseShift) / total) + max / 2;

    // 生成噪声
    const noise = (Math.random() * 2 - 1) * noiseLevel;

    // 叠加趋势和噪声
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
   * 生成一组用于折线图的数据,具有自然且美观的趋势。
   *
   * 参数:
   * total (number): 生成数据点的数量
   * trendType (string): 数据趋势类型, 可选'linear', 'sine', 'exponential'
   * max (number): 波动幅度
   * f (number): 波动频率
   * phase (number): 波动相位
   * min (number): 数据的最小值
   *
   * 返回:
   * x (number[]): x轴数据
   * y (number[]): y轴数据
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
        '无效的trendType参数,请选择"linear", "sine"或"exponential".'
      );
  }

  // 将数据调整到最小值
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
