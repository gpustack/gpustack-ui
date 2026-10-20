import { MODEL_PROXY } from '../apis';
import { formatCurlArgs, formatPyObject } from './utils';

export const generateDecisionCurlCode = ({
  api,
  modelProxy,
  routeID,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;
  const apiUrl = modelProxy
    ? `${MODEL_PROXY}/${routeID}/\${YOUR_API_PATH}`
    : api;

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${apiUrl} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
${formatCurlArgs(parameters, false)}`.trim();

  return curlCode;
};

export const generateDecisionCode = ({
  api,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;

  // ========================= Curl =========================
  const curlCode = generateDecisionCurlCode({ api, parameters });

  // ========================= Python =========================
  const pythonCode = `
import requests
url="${host}${api}"
headers = {
  "Content-type": "application/json",
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
}
data = ${formatPyObject(parameters)}
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
