import { MODEL_PROXY } from '../apis';
import { formatCurlArgs, formatPyObject } from './utils';

// Extra request headers rendered in every sample (e.g. the System One
// opt-in image header). `parameters` may already carry a stubbed `assets`
// map / top-level `images` array — base64 payloads are replaced by a
// readable `<base64-image-data>` placeholder before rendering.
export const generateDecisionCurlCode = ({
  api,
  modelProxy,
  routeID,
  parameters,
  headers = []
}: Record<string, any>) => {
  const host = window.location.origin;
  const apiUrl = modelProxy
    ? `${MODEL_PROXY}/${routeID}/\${YOUR_API_PATH}`
    : api;
  const extraHeaderLines = headers
    .map(([name, value]: [string, string]) => `-H "${name}: ${value}" \\`)
    .join('\n');

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${apiUrl} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
${extraHeaderLines ? `${extraHeaderLines}\n` : ''}${formatCurlArgs(parameters, false)}`.trim();

  return curlCode;
};

export const generateDecisionCode = ({
  api,
  parameters,
  headers = []
}: Record<string, any>) => {
  const host = window.location.origin;

  // ========================= Curl =========================
  const curlCode = generateDecisionCurlCode({ api, parameters, headers });
  const headerEntries = [
    ['Content-type', 'application/json'],
    ['Authorization', 'Bearer $\{YOUR_GPUSTACK_API_KEY}'],
    ...headers
  ];

  // ========================= Python =========================
  const pythonCode = `
import requests
url="${host}${api}"
headers = {
${headerEntries.map(([name, value]: [string, string]) => `  "${name}": "${value}",`).join('\n')}
}
data = ${formatPyObject(parameters)}
response = requests.post(url, headers=headers, json=data)
print(response.json())`.trim();

  // ========================= Node.js =========================
  const nodeJsCode = `
const axios = require('axios');

const url = "${host}${api}";
const headers = {
${headerEntries.map(([name, value]: [string, string]) => `  "${name}": "${value}",`).join('\n')}
};
const data = ${JSON.stringify(parameters, null, 2)};

axios.post(url, data, { headers }).then((response) => {
  console.log(response.data);
});`.trim();

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};
