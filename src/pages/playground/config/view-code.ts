import _ from 'lodash';

const formatCurlArgs = (args: Record<string, any>, isFormdata?: boolean) => {
  if (isFormdata) {
    return _.keys(args).reduce((acc: string, key: string) => {
      const value = args[key];
      return acc + `-F ${key}="${value}" \\\n`;
    }, '');
  }
  return `-d "${JSON.stringify(args)}" \\\n`;
};

const formatPyParams = (params: Record<string, any>) => {};

export const speechToTextCode = ({
  payload,
  api,
  parameters
}: Record<string, any>) => {
  const host = window.location.origin;
  const curlCode = `curl ${host}}${api} \
-H "Content-Type: multipart/form-data" \
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \
-F file="@/path/to/file/audio.mp3;type=audio/mpeg" \
-F model="${parameters.model}" \
-F language="${parameters.language}"`;

  const pythonCode = `from openai import OpenAI

audio_file = open("audio.mp3", "rb")
client = OpenAI(
  base_url="${host}/v1-openai", 
  api_key="YOUR_GPUSTACK_API_KEY"
)

response = client.audio.transcriptions.create(
  model="${parameters.model}",
  language="${parameters.language}",
  file=audio_file
)
print('response:', response.text)`;

  const nodeJsCode = `const fs = require("fs")
const OpenAI = require("openai");

const openai = new OpenAI({
  "apiKey": "YOUR_GPUSTACK_API_KEY",
  "baseURL": "${host}/v1-openai"
});

async function main(){
  const params = {
    "model": "faster-whisper-large-v3",
    "language": "auto",
    "file": fs.createReadStream("audio.mp3")
};
const response = await openai.audio.transcriptions.create(params);
  console.log(response.text);
}
main();`;
};
