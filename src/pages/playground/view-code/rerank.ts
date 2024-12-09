import { formatCurlArgs } from './utils';

export const generateRerankCode = ({
  api,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${api} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
${formatCurlArgs(parameters, false)}`.trim();

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
