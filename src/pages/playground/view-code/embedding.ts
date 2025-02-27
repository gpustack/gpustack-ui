import { GPUSTACK_API, OPENAI_COMPATIBLE } from '../apis';
import { fomatNodeJsParams, formatCurlArgs, formatPyParams } from './utils';

export const generateEmbeddingCode = ({
  api: url,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;
  const api = url.replace(OPENAI_COMPATIBLE, GPUSTACK_API);

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${api} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
${formatCurlArgs(parameters, false)}`.trim();

  // ========================= Python =========================
  const pythonCode = `
from openai import OpenAI\n
client = OpenAI(
  base_url="${host}/${GPUSTACK_API}", 
  api_key="YOUR_GPUSTACK_API_KEY"
)

response = client.embeddings.create(\n${formatPyParams({ ...parameters })})\n
print(response.data[0].embedding)`.trim();

  // ========================= Node.js =========================
  const params = fomatNodeJsParams({
    ...parameters
  });

  const nodeJsCode = `
const OpenAI = require("openai");

const openai = new OpenAI({
  "apiKey": "YOUR_GPUSTACK_API_KEY",
  "baseURL": "${host}/${GPUSTACK_API}"
});

async function main() {
  const params = ${params}; 
  const response = await openai.embeddings.create(params);
  console.log(response.data[0].embedding);
}
main();`.trim();

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};
