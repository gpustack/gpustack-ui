import _ from 'lodash';
import { MODEL_PROXY } from '../apis';
import { fomatNodeJsParams, formatCurlArgs } from './utils';

export const generateCurlCode = ({
  api: url,
  parameters,
  modelProxy,
  isFormdata = false,
  edit = false
}: Record<string, any>) => {
  const host = window.location.origin;
  const api = modelProxy ? `${MODEL_PROXY}/\${YOUR_API_PATH}` : url;

  // ========================= Curl =========================
  let curlCode = `
curl ${host}${api} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\${modelProxy ? `\n-H "X-GPUStack-Model: ${parameters.model}" \\` : ''}
${formatCurlArgs(parameters, isFormdata)}`.trim();

  if (edit) {
    curlCode = `
curl ${host}${api} \\
-H "Content-Type: multipart/form-data" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\${modelProxy ? `\n-H "X-GPUStack-Model: ${parameters.model}" \\` : ''}
-F image="@image.png" \\
-F mask="@mask.png" \\
${formatCurlArgs(_.omit(parameters, ['mask', 'image']), isFormdata)}`
      .trim()
      .replace(/\\$/, '');
  }

  return curlCode;
};

export const generateCode = ({
  api: url,
  parameters,
  isFormdata = false,
  edit = false
}: Record<string, any>) => {
  const host = window.location.origin;
  const api = url;

  // ========================= Curl =========================
  let curlCode = generateCurlCode({
    api: url,
    parameters,
    isFormdata,
    edit
  });

  // ========================= Python =========================
  const pythonCode = `
import requests\n
url="${host}${api}"
headers = {
  "Content-type": "application/json",
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
}
data = ${JSON.stringify(parameters, null, 2).replace(/null/g, 'None')}\n
response = requests.post(url, headers=headers, json=data)
print(response.json()['data']['object'])`.trim();

  // ========================= Node.js =========================
  const nodeJsCode = `
const axios = require('axios');

const url = "${host}${api}";
const headers = {
  "Content-type": "application/json",
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
};
const data = ${fomatNodeJsParams(parameters)};

axios.post(url, data, { headers }).then((response) => {
  console.log(response.data.object);
});`.trim();

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};
