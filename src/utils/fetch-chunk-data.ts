import { throttle } from 'lodash';
import qs from 'query-string';

const extractStreamRegx = /(data|error):\s*({.*?})(?=\n|$)/g;

const extractJSON = (
  dataStr: string
): { results: any[]; remaining: string } => {
  const results: any[] = [];
  if (!dataStr) return { results, remaining: '' };

  const parts = dataStr.split(/\n\n/);
  let remaining = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    if (!part.startsWith('data:') && !part.startsWith('error:')) {
      remaining += part;
      continue;
    }

    const jsonStr = part.slice(5).trim();
    try {
      const parsed = JSON.parse(jsonStr);
      results.push(parsed);
    } catch {
      remaining += part;
    }
  }

  return { results, remaining };
};

export const errorHandler = async (res: any) => {
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

export const createFormData = (data: any): FormData => {
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
  let textBuffer = ''; // cache incomplete line

  while (isReading) {
    const { done, value } = await reader.read();

    try {
      textBuffer += decoder.decode(value, { stream: true });

      if (textBuffer.startsWith('error:')) {
        const errorStr = textBuffer.slice(7).trim();
        const jsonData = JSON.parse(errorStr);
        bufferManager.add({ error: jsonData });
        textBuffer = ''; // Clear buffer after processing error
      } else {
        const { results, remaining } = extractJSON(textBuffer);
        results.forEach((data) => {
          bufferManager.add(data);
        });
        textBuffer = remaining; // Clear buffer after processing
      }

      throttledCallback();
    } catch (error) {
      bufferManager.add({ error });
    }

    if (done) {
      textBuffer += decoder.decode();
      if (textBuffer) {
        const { results, remaining } = extractJSON(textBuffer);
        results.forEach((data) => bufferManager.add(data));
      }
      bufferManager.flush();
      isReading = false;
      break;
    }
  }
};

// Process the remainder of the buffer
const processBuffer = async (
  buffer: string,
  callback: (data: any, done?: boolean) => void,
  done?: boolean
) => {
  if (!buffer) return;

  const lines = buffer.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('data: ')) {
      const jsonStr = trimmedLine.slice(6).trim();
      try {
        if (jsonStr !== '[DONE]') {
          const jsonData = JSON.parse(jsonStr);
          callback(jsonData, done);
        }
      } catch (e) {
        console.error('Failed to parse JSON from line:', jsonStr, e);
      }
    } else if (trimmedLine.startsWith('error:')) {
      const errorStr = trimmedLine.slice(7).trim();
      try {
        const jsonData = JSON.parse(errorStr);
        callback({ error: jsonData, done });
      } catch (e) {
        console.error('Failed to parse error JSON from line:', errorStr, e);
      }
    }
  }
};

export const readLargeStreamData = async (
  reader: any,
  decoder: TextDecoder,
  callback: (data: any, done?: boolean) => void,
  throttleDelay = 200
) => {
  let buffer = ''; // cache incomplete line

  class BufferManager {
    private buffer: any[] = [];
    private failed: boolean = false;
    private isFlushing: boolean = false;
    private callback: (data: any, done?: boolean) => void;

    constructor(callback: (data: any, done?: boolean) => void) {
      this.callback = callback;
    }

    public add(data: any) {
      this.buffer.push(data);
    }

    public async flush(done?: boolean) {
      if (this.buffer.length === 0 && done) {
        // If buffer is empty and done is true, we can call the callback with an empty object
        this.callback({}, done);
        return;
      }
      if (this.buffer.length === 0 || this.isFlushing) {
        return;
      }
      this.failed = false;
      this.isFlushing = true;

      while (this.buffer.length > 0) {
        const data = this.buffer.shift();

        try {
          processBuffer(data, this.callback, done);
        } catch (error) {
          console.error('Error processing buffer:', error);
          this.failed = true;
          this.buffer.unshift(data);
          break;
        }
      }
      if (done) {
        // If done is true, we should call the callback with an empty object
        this.callback({}, done);
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

    console.log('done:', done, 'value:', value);

    if (done) {
      isReading = false;
      // Process remaining buffered data
      if (buffer) {
        bufferManager.add(buffer);
      }
      bufferManager.flush(done);
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
