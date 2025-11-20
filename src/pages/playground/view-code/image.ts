import _ from 'lodash';
import { MODEL_PROXY, OPENAI_COMPATIBLE } from '../apis';
import { fomatNodeJsParams, formatCurlArgs, formatPyParams } from './utils';

export const generateImageCurlCode = ({
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

export const generateImageCode = ({
  api: url,
  parameters,
  isFormdata = false,
  edit = false
}: Record<string, any>) => {
  const host = window.location.origin;
  const api = url;

  // ========================= Curl =========================
  let curlCode = generateImageCurlCode({
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
print(response.json()['data'][0]['b64_json'])`.trim();

  // ========================= Node.js =========================
  const nodeJsCode = `
const axios = require('axios');

const url = "${host}/${OPENAI_COMPATIBLE}/images/generations";
const headers = {
  "Content-type": "application/json",
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
};
const data = ${fomatNodeJsParams(parameters)};

axios.post(url, data, { headers }).then((response) => {
  console.log(response.data.data[0].b64_json);
});`.trim();

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};

export const generateOpenaiImageCode = ({
  api: url,
  parameters,
  isFormdata = false,
  edit = false
}: Record<string, any>) => {
  const host = window.location.origin;
  const api = url;

  // ========================= Curl =========================
  let curlCode = `
curl ${host}${api} \\
-H "Content-Type: multipart/form-data" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
${formatCurlArgs(parameters, isFormdata)}`.trim();
  if (edit) {
    curlCode = `
curl ${host}${api} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
-F image="@image.png" \\
-F mask="@mask.png" \\
${formatCurlArgs(_.omit(parameters, ['mask', 'image']), isFormdata)}`
      .trim()
      .replace(/\\$/, '');
  }

  // ========================= Python =========================
  const pythonCode = `
from openai import OpenAI\n
client = OpenAI(
  base_url="${host}/${OPENAI_COMPATIBLE}", 
  api_key="YOUR_GPUSTACK_API_KEY"
)

response = client.images.generate(\n${formatPyParams({ ...parameters })})\n
print(response.data[0].b64_json)`.trim();

  // ========================= Node.js =========================
  const params = fomatNodeJsParams({
    ...parameters
  });

  const nodeJsCode = `
const OpenAI = require("openai");

const openai = new OpenAI({
  "apiKey": "YOUR_GPUSTACK_API_KEY",
  "baseURL": "${host}/${OPENAI_COMPATIBLE}"
});

async function main() {
  const params = ${params}; 
  const response = await openai.images.generate(params);
  console.log(response.data[0].b64_json);
}
main();`.trim();

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};
