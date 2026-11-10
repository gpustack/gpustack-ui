import _ from 'lodash';
import { MODEL_PROXY } from '../apis';
import { fomatNodeJsParams, formatCurlArgs } from './utils';

export const generateImageCurlCode = ({
  api: url,
  parameters,
  modelProxy,
  routeID,
  isFormdata = false,
  edit = false
}: Record<string, any>) => {
  const host = window.location.origin;
  const api = modelProxy ? `${MODEL_PROXY}/${routeID}/\${YOUR_API_PATH}` : url;

  // ========================= Curl =========================
  let curlCode = `
curl ${host}${api} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
${formatCurlArgs(parameters, isFormdata)}`.trim();

  if (edit) {
    curlCode = `
curl ${host}${api} \\
-H "Content-Type: multipart/form-data" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
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
  const curlCode = generateImageCurlCode({
    api: url,
    parameters,
    isFormdata,
    edit
  });

  // ========================= Python =========================
  let pythonCode = `
import requests\n
url="${host}${api}"
headers = {
  "Content-type": "application/json",
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
}
data = ${JSON.stringify(parameters, null, 2).replace(/null/g, 'None')}\n
response = requests.post(url, headers=headers, json=data)
print(response.json()['data'][0]['b64_json'])`.trim();

  if (edit) {
    const files = {
      image: `open(image.png, 'rb')`,
      mask: `open(mask.png, 'rb')`
    };

    pythonCode = `
import requests\n
url="${host}${api}"
headers = {
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
}
data = ${JSON.stringify(_.omit(parameters, ['mask', 'image']), null, 2).replace(/null/g, 'None')}
files = ${JSON.stringify(files, null, 2).replace(/null/g, 'None')}\n
response = requests.post(url, headers=headers, json=data, files=files)
print(response.json()['data'][0]['b64_json'])`.trim();
  }

  // ========================= Node.js =========================
  let nodeJsCode = `
const axios = require('axios');

const url = "${host}${api}";
const headers = {
  "Content-type": "application/json",
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
};
const data = ${fomatNodeJsParams(parameters)};

axios.post(url, data, { headers }).then((response) => {
  console.log(response.data.data[0].b64_json);
});`.trim();

  if (edit) {
    nodeJsCode = `
const axios = require('axios');
const fs = require('fs');

const url = "${host}${api}";
const headers = {
  "Authorization": "Bearer $\{YOUR_GPUSTACK_API_KEY}"
};
const data = ${fomatNodeJsParams(_.omit(parameters, ['image', 'mask']))};
data.image = fs.createReadStream("image.png");
// Optional mask for inpainting.
// data.mask = fs.createReadStream("mask.png");

axios.postForm(url, data, { headers }).then((response) => {
  console.log(response.data.data[0].b64_json);
});`.trim();
  }

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};
