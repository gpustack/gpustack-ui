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
  console.log('response====', response);
  if (!response.ok) {
    return {
      error: true,
      data: await response.json()
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
  reader: any,
  decoder: TextDecoder,
  callback: (data: any) => void
) => {
  const { done, value } = await reader.read();
  if (done) {
    return;
  }

  let chunk = decoder.decode(value, { stream: true });

  extractJSON(chunk).forEach((data) => {
    callback?.(data);
  });
  await readStreamData(reader, decoder, callback);
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
    const { done, value } = await reader.read();
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
          const jsonData = JSON.parse(jsonStr);
          callback(jsonData);
        } catch (e) {
          console.error('Failed to parse JSON:', jsonStr, e);
        }
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
