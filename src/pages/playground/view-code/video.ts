import _ from 'lodash';
import { MODEL_PROXY, OPENAI_COMPATIBLE } from '../apis';
import { fomatNodeJsParams, formatCurlArgs, formatPyParams } from './utils';

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

  const curlCode = `
curl ${host}${api} \\
-H "Content-Type: multipart/form-data" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\${modelProxy ? `\n-H "X-GPUStack-Model: ${parameters.model}" \\` : ''}
${formatCurlArgs(_.omit(parameters, ['mask', 'image']), isFormdata)}`
    .trim()
    .replace(/\\$/, '');

  return curlCode;
};

export const generateCode = ({
  api: url,
  parameters,
  isFormdata = false
}: Record<string, any>) => {
  const host = window.location.origin;
  const api = url;

  // ========================= Curl =========================
  let curlCode = generateCurlCode({
    api: url,
    parameters,
    isFormdata
  });

  // ========================= Python =========================
  const pythonCode = `
from openai import OpenAI\n
client = OpenAI(
  base_url="${host}/${OPENAI_COMPATIBLE}", 
  api_key="YOUR_GPUSTACK_API_KEY"
)

video = client.videos.create(\n${formatPyParams({ ...parameters })})\n
print(video.id)`.trim();

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
  const video = await openai.videos.create(params);
  console.log(video.id);
}
main();`.trim();

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};
