import { MODEL_PROXY } from '../apis';
import { formatCurlArgs } from './utils';

export const generateRerankCurlCode = ({
  api,
  modelProxy,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;
  const apiUrl = modelProxy ? `${MODEL_PROXY}/\${YOUR_API_PATH}` : api;

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${apiUrl} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\${modelProxy ? `\n-H "X-GPUStack-Model: ${parameters.model}" \\` : ''}
${formatCurlArgs(parameters, false)}`.trim();

  return curlCode;
};

export const generateRerankCode = ({
  api,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;

  // ========================= Curl =========================
  const curlCode = generateRerankCurlCode({ api, parameters });

  // ========================= Python =========================
  const pythonCode = `
import requests\n
url="${host}${api}"
headers = {
  "Content-type": "application/json",
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
}
data = ${JSON.stringify(parameters, null, 2)}\n
response = requests.post(url, headers=headers, json=data)
print(response.json())`.trim();

  // ========================= Node.js =========================
  const nodeJsCode = `
const axios = require('axios');

const url = "${host}${api}";
const headers = {
  "Content-type": "application/json",
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
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
