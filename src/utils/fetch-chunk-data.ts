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
    return {
      error: true,
      data: await errorHandler(response)
    };
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
    return {
      error: true,
      data: await errorHandler(response)
    };
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
const processBuffer = (buffer: string, callback: (data: any) => void) => {
  const lines = buffer.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonStr = line.slice(6).trim();
      try {
        const jsonData = JSON.parse(jsonStr);
        callback(jsonData);
      } catch (e) {
        console.error(
          'Failed to parse JSON from remaining buffer:',
          jsonStr,
          e
        );
      }
    }
  }
};

export const readLargeStreamData = async (
  reader: any,
  decoder: TextDecoder,
  callback: (data: any) => void
) => {
  let buffer = ''; // cache incomplete line

  while (true) {
    const { done, value } = await reader?.read?.();

    if (done) {
      // Process remaining buffered data
      if (buffer.trim()) {
        processBuffer(buffer, callback);
      }
      break;
    }

    // Decode new chunk of data and append to buffer
    buffer += decoder.decode(value, { stream: true });

    // Try to process the complete line in the buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep last line (may be incomplete)

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();

        try {
          if (jsonStr !== '[DONE]') {
            const jsonData = JSON.parse(jsonStr);
            callback(jsonData);
          }
        } catch (e) {
          console.error('Failed to parse JSON:', jsonStr, e);
        }
      }

      if (line.startsWith('error:')) {
        const errorStr = line.slice(7).trim();
        const jsonData = JSON.parse(errorStr);
        callback({ error: jsonData });
      }
    }
  }
};

export const readTextEventStreamData = async (
  reader: any,
  decoder: TextDecoder,
  callback: (data: any) => void
) => {
  const { done, value } = await reader.read();

  if (done) {
    return;
  }

  let chunk = decoder.decode(value, { stream: true });
  callback(chunk);
  await readTextEventStreamData(reader, decoder, callback);
};
