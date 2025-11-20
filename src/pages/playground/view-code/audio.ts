import _ from 'lodash';
import { MODEL_PROXY, OPENAI_COMPATIBLE } from '../apis';
import { fomatNodeJsParams, formatCurlArgs, formatPyParams } from './utils';

export const generateSpeechToTextCurlCode = ({
  api: url,
  modelProxy,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;
  // replace url OPENAI_COMPATIBLE with GPUSTACK
  const api = modelProxy ? `${MODEL_PROXY}/\${YOUR_API_PATH}` : url;

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${api} \\
-H "Content-Type: multipart/form-data" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\${modelProxy ? `\n-H "X-GPUStack-Model: ${parameters.model}" \\` : ''}
-F model="${parameters.model}" \\
-F file="@/path/to/file/audio.mp3;type=audio/mpeg" \\
${formatCurlArgs(_.omit(parameters, 'model'), true)}`
    .trim()
    .replace(/\\$/g, '');

  return curlCode;
};

export const speechToTextCode = ({
  api: url,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;

  // ========================= Curl =========================
  const curlCode = generateSpeechToTextCurlCode({ api: url, parameters });

  // ========================= Python =========================
  const pythonCode = `
from openai import OpenAI\n
audio_file = open("audio.mp3", "rb")
client = OpenAI(
  base_url="${host}/${OPENAI_COMPATIBLE}", 
  api_key="YOUR_GPUSTACK_API_KEY"
)

response = client.audio.transcriptions.create(\n${formatPyParams({
    ...parameters,
    file: 'audio_file'
  }).replace(/"audio_file"/, 'audio_file')})\n
print('response:', response.text)`.trim();

  // ========================= Node.js =========================
  const jsonParams = fomatNodeJsParams({
    ...parameters,
    file: `fs.createReadStream(audio.mp3)`
  });
  const params = jsonParams.replace(
    /"fs.createReadStream\(audio.mp3\)"/g,
    'fs.createReadStream("audio.mp3")'
  );
  const nodeJsCode = `
const fs = require("fs")
const OpenAI = require("openai");

const openai = new OpenAI({
  "apiKey": "YOUR_GPUSTACK_API_KEY",
  "baseURL": "${host}/${OPENAI_COMPATIBLE}"
});

async function main() {
  const params = ${params}; 
  const response = await openai.audio.transcriptions.create(params);
  console.log(response.text);
}

main();`.trim();

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};

export const generateTextToSpeechCurlCode = ({
  api: url,
  modelProxy,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;
  const api = modelProxy ? `${MODEL_PROXY}/\${YOUR_API_PATH}` : url;

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${api} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\${modelProxy ? `\n-H "X-GPUStack-Model: ${parameters.model}" \\` : ''}
${formatCurlArgs(parameters, false)} \\\n--output output.${parameters.response_format}`.trim();

  return curlCode;
};

export const TextToSpeechCode = ({
  api: url,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;

  // ========================= Curl =========================
  const curlCode = generateTextToSpeechCurlCode({ api: url, parameters });

  // ========================= Python =========================
  const pythonCode = `
from pathlib import Path
from openai import OpenAI\n
output_file_path = Path(__file__).parent / "output.mp3"
client = OpenAI(
  base_url="${host}/${OPENAI_COMPATIBLE}", 
  api_key="YOUR_GPUSTACK_API_KEY"
)

response = client.audio.speech.create(\n${formatPyParams({ ...parameters })})\n
with open(output_file_path, "wb") as f:
    for chunk in response.iter_bytes(): 
        f.write(chunk)

print(f"Audio saved to {output_file_path}")`.trim();

  // ========================= Node.js =========================
  const params = fomatNodeJsParams({
    ...parameters
  });

  const nodeJsCode = `
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const ouptFile = path.resolve("./output.mp3");

const openai = new OpenAI({
  "apiKey": "YOUR_GPUSTACK_API_KEY",
  "baseURL": "${host}/${OPENAI_COMPATIBLE}"
});

async function main() {
  const params = ${params}; 
  const response = await openai.audio.speech.create(params);
  console.log(ouptFile);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(ouptFile, buffer);
}
main();`.trim();

  return {
    curlCode,
    pythonCode,
    nodeJsCode
  };
};
