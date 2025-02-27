import { throttle } from 'lodash';
import qs from 'query-string';

const extractStreamRegx = /data:\s*({.*?})(?=\n|$)/g;

const extractJSON = (dataStr: string) => {
  let match;
  const results: any[] = [];

  if (!dataStr) {
    return results;
  }
  while ((match = extractStreamRegx.exec(dataStr)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      results.push(jsonData);
    } catch (error) {
      console.error('JSON parse error:', error, 'for match:', match[1]);

      continue;
    }
  }

  return results;
};

const errorHandler = async (res: any) => {
  try {
    const data = await res.json();
    console.log('errorHandler:', data);
    return {
      error: true,
      data: data
    };
  } catch (error) {
    return {
      error: true,
      message: res.statusText
    };
  }
};

/**
 *
 * @param params data: for post request, params: for get request
 * @returns
 */
export const fetchChunkedData = async (params: {
  data?: any;
  url: string;
  params?: any;
  signal?: AbortSignal;
  method?: string;
  headers?: any;
}) => {
  const method = params.method || 'POST';
  let url = params.url;
  if (params.params) {
    url = `${url}?${qs.stringify(params.params)}`;
  }
  const response = await fetch(url, {
    method,
    body: method === 'POST' ? JSON.stringify(params.data) : null,
    signal: params.signal,
    headers: {
      'Content-Type': 'application/json',
      ...params.headers
    }
  });

  if (!response.ok) {
    return await errorHandler(response);
  }
  const reader = response?.body?.getReader();
  const decoder = new TextDecoder('utf-8', {
    fatal: true
  });
  return {
    reader,
    decoder
  };
};

const createFormData = (data: any): FormData => {
  const formData = new FormData();

  const appendToFormData = (key: string, value: any) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  };

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      appendToFormData(key, data[key]);
    }
  }

  return formData;
};

export const fetchChunkedDataPostFormData = async (params: {
  data?: any;
  url: string;
  params?: any;
  signal?: AbortSignal;
  method?: string;
  headers?: any;
}) => {
  const { url } = params;
  const response = await fetch(url, {
    method: 'POST',
    body: createFormData(params.data),
    signal: params.signal
  });
  if (!response.ok) {
    return await errorHandler(response);
  }
  const reader = response?.body?.getReader();
  const decoder = new TextDecoder('utf-8', {
    fatal: true
  });
  return {
    reader,
    decoder
  };
};

export const readStreamData = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  callback: (data: any[]) => void,
  throttleDelay = 200
) => {
  class BufferManager {
    private buffer: any[] = [];

    public add(data: any) {
      this.buffer.push(data);
    }

    public flush() {
      if (this.buffer.length > 0) {
        const currentBuffer = [...this.buffer];
        this.buffer = [];
        currentBuffer.forEach((item) => callback(item));
      }
    }

    public getBuffer() {
      return this.buffer;
    }
  }

  const bufferManager = new BufferManager();

  const throttledCallback = throttle(() => {
    bufferManager.flush();
  }, throttleDelay);

  let isReading = true;

  while (isReading) {
    const { done, value } = await reader.read();

    if (done) {
      isReading = false;
      bufferManager.flush();
      break;
    }

    try {
      const chunk = decoder.decode(value, { stream: true });

      if (chunk.startsWith('error:')) {
        const errorStr = chunk.slice(7).trim();
        const jsonData = JSON.parse(errorStr);
        bufferManager.add({ error: jsonData });
      } else {
        extractJSON(chunk).forEach((data) => {
          bufferManager.add(data);
        });
      }

      throttledCallback();
    } catch (error) {
      bufferManager.add({ error });
    }
  }
};

// Process the remainder of the buffer
const processBuffer = async (buffer: string, callback: (data: any) => void) => {
  if (!buffer) return;

  const lines = buffer.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('data: ')) {
      const jsonStr = trimmedLine.slice(6).trim();
      try {
        if (jsonStr !== '[DONE]') {
          const jsonData = JSON.parse(jsonStr);
          callback(jsonData);
        }
      } catch (e) {
        console.error('Failed to parse JSON from line:', jsonStr, e);
      }
    } else if (trimmedLine.startsWith('error:')) {
      const errorStr = trimmedLine.slice(7).trim();
      try {
        const jsonData = JSON.parse(errorStr);
        callback({ error: jsonData });
      } catch (e) {
        console.error('Failed to parse error JSON from line:', errorStr, e);
      }
    }
  }
};

export const readLargeStreamData = async (
  reader: any,
  decoder: TextDecoder,
  callback: (data: any) => void,
  throttleDelay = 200
) => {
  let buffer = ''; // cache incomplete line

  class BufferManager {
    private buffer: any[] = [];
    private failed: boolean = false;
    private isFlushing: boolean = false;
    private callback: (data: any) => void;

    constructor(callback: (data: any) => void) {
      this.callback = callback;
    }

    public add(data: any) {
      this.buffer.push(data);
    }

    public async flush() {
      if (this.buffer.length === 0 || this.isFlushing) {
        return;
      }
      this.failed = false;
      this.isFlushing = true;

      while (this.buffer.length > 0) {
        const data = this.buffer.shift();

        try {
          processBuffer(data, this.callback);
        } catch (error) {
          console.error('Error processing buffer:', error);
          this.failed = true;
          this.buffer.unshift(data);
          break;
        }
      }
      this.isFlushing = false;
    }

    public getBuffer() {
      return this.buffer;
    }
  }

  const bufferManager = new BufferManager(callback);

  const throttledCallback = throttle(async () => {
    bufferManager.flush();
  }, throttleDelay);

  let isReading = true;

  while (true) {
    const { done, value } = await reader?.read?.();

    if (done) {
      isReading = false;
      // Process remaining buffered data
      if (buffer) {
        bufferManager.add(buffer);
      }
      bufferManager.flush();
      break;
    }

    try {
      // Decode new chunk of data and append to buffer
      buffer += decoder.decode(value, { stream: true });

      // Try to process the complete line in the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep last line (may be incomplete)

      console.log('buffer>>>>>>>>>>>>>:', buffer);

      for (const line of lines) {
        bufferManager.add(line);
      }

      throttledCallback();
    } catch (error) {
      console.log('Error reading stream data:', error);
      // do nothing
    }
  }
};
