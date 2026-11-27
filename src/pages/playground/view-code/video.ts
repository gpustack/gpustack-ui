import { createFormData } from '@/utils/fetch-chunk-data';
import { CREATE_VIDEO_API } from '../apis';
import {
  adaptVideoRequestForCode,
  type VideoCapabilities
} from '../video/request-adapter';
import { formatPyObject } from './utils';

export const generateVideoCurlCode = ({
  api,
  parameters,
  modelProxy,
  videoMeta
}: {
  api: string;
  parameters: Record<string, unknown>;
  modelProxy?: boolean;
  routeID?: string | number;
  videoMeta?: VideoCapabilities;
}) => {
  return generateCode({
    api: modelProxy ? CREATE_VIDEO_API : api,
    parameters,
    videoMeta
  }).curlCode;
};

export const generateCode = ({
  api,
  parameters,
  videoMeta
}: {
  api: string;
  parameters: Record<string, unknown>;
  videoMeta?: VideoCapabilities;
}) => {
  const url = window.location.origin + api;
  const { parameters: adaptedParameters, inlineMedia } =
    adaptVideoRequestForCode(parameters, videoMeta);
  const entries = Array.from(createFormData(adaptedParameters).entries());
  const uploads = entries
    .filter((entry): entry is [string, File] => entry[1] instanceof File)
    .map(([key, file]) => ({ key, file, env: `${key.toUpperCase()}_PATH` }));
  const hasInlineMedia = inlineMedia.length > 0;
  const reference = uploads.length > 0 || hasInlineMedia;
  const formEntries = entries.filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  );

  const curlPrelude: string[] = [];
  for (const media of inlineMedia) {
    curlPrelude.push(
      `${media.field}_uri="data:${media.mime};base64,$(base64 < "\${${media.env}}" | tr -d '\\n')"`
    );
  }
  const fields = formEntries.map(([key, value]) => {
    const matched = inlineMedia.filter((media) =>
      value.includes(media.placeholder)
    );
    if (matched.length > 0) {
      const varName = `field_${key.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      const escaped = value.replace(/'/g, "'\\''");
      curlPrelude.push(`${varName}='${escaped}'`);
      for (const media of matched) {
        curlPrelude.push(
          `${varName}="\${${varName}//${media.placeholder}/$${media.field}_uri}"`
        );
      }
      return `  --form-string "${key}=\${${varName}}"`;
    }
    const field = `${key}=${value}`.replace(/'/g, "'\\''");
    return `  --form-string '${field}'`;
  });
  for (const upload of uploads) {
    fields.push(`  --form "${upload.key}=@\\"\${${upload.env}}\\""`);
  }
  const createCommand = [
    `curl --fail "${url}"`,
    '  -H "Authorization: Bearer ${YOUR_GPUSTACK_API_KEY}"',
    ...fields
  ].join(' \\\n');

  const curlPrefix = curlPrelude.length ? `${curlPrelude.join('\n')}\n` : '';
  const curlCode = `
${curlPrefix}job=$(${createCommand})
video_id=$(printf '%s' "$job" | jq -er '.id')
status=$(printf '%s' "$job" | jq -r '.status')
while [ "$status" != "completed" ]; do
  case "$status" in
    queued|in_progress) sleep 5 ;;
    *) printf '%s\\n' "$job" >&2; exit 1 ;;
  esac
  job=$(curl --fail "${url}/$video_id" \\
    -H "Authorization: Bearer \${YOUR_GPUSTACK_API_KEY}")
  status=$(printf '%s' "$job" | jq -r '.status')
done
curl --fail -L "${url}/$video_id/content" \\
  -H "Authorization: Bearer \${YOUR_GPUSTACK_API_KEY}" \\
  --output output.mp4`.trim();

  const pythonInlineMedia = inlineMedia
    .map(
      (media) =>
        `${media.field}_uri = ${JSON.stringify(`data:${media.mime};base64,`)} + base64.b64encode(Path(os.environ[${JSON.stringify(media.env)}]).read_bytes()).decode("ascii")
params = {key: value.replace(${JSON.stringify(media.placeholder)}, ${media.field}_uri) for key, value in params.items()}\n`
    )
    .join('');

  const pythonUpload = uploads
    .map(
      (upload, index) =>
        `upload_${index} = Path(os.environ[${JSON.stringify(upload.env)}])
files[${JSON.stringify(upload.key)}] = (upload_${index}.name, upload_${index}.read_bytes(), ${JSON.stringify(upload.file.type || 'application/octet-stream')})\n`
    )
    .join('');

  const pythonCode = `
${hasInlineMedia ? 'import base64\n' : ''}import os
import time
from pathlib import Path

import requests

params = ${formatPyObject(Object.fromEntries(formEntries))}
${pythonInlineMedia}headers = {"Authorization": "Bearer " + os.environ["YOUR_GPUSTACK_API_KEY"]}
files = {key: (None, value) for key, value in params.items()}
${pythonUpload}response = requests.post(
    "${url}",
    headers=headers,
    files=files,
)
response.raise_for_status()
job = response.json()
video_id = job["id"]
while job["status"] in ("queued", "in_progress"):
    time.sleep(5)
    response = requests.get("${url}/" + video_id, headers=headers)
    response.raise_for_status()
    job = response.json()
    print(job["status"], job.get("progress"))
if job["status"] != "completed":
    raise RuntimeError(job.get("error") or job["status"])
response = requests.get("${url}/" + video_id + "/content", headers=headers)
response.raise_for_status()
Path("output.mp4").write_bytes(response.content)`.trim();

  const nodeInlineMedia = inlineMedia
    .map(
      (media, index) =>
        `  const inlineMedia${index} = ${JSON.stringify(`data:${media.mime};base64,`)} + (await readFile(process.env.${media.env})).toString("base64");\n`
    )
    .join('');
  const nodeInlineReplace = inlineMedia
    .map(
      (media, index) =>
        `    value = value.replaceAll(${JSON.stringify(media.placeholder)}, inlineMedia${index});\n`
    )
    .join('');
  const nodeUpload = uploads
    .map(
      (upload, index) =>
        `  const referencePath${index} = process.env.${upload.env};
  const media${index} = new Blob([await readFile(referencePath${index})], { type: ${JSON.stringify(upload.file.type || 'application/octet-stream')} });
  form.append(${JSON.stringify(upload.key)}, media${index}, basename(referencePath${index}));\n`
    )
    .join('');
  const nodeJsCode = `
const { ${reference ? 'readFile, ' : ''}writeFile } = require("node:fs/promises");
const { setTimeout: delay } = require("node:timers/promises");
${uploads.length > 0 ? 'const { basename } = require("node:path");\n' : ''}

async function main() {
  const params = ${JSON.stringify(formEntries, null, 2)};
${nodeInlineMedia}  const form = new FormData();
  for (let [key, value] of params) {
${nodeInlineReplace}    form.append(key, value);
  }
${nodeUpload}
  const headers = { Authorization: "Bearer " + process.env.YOUR_GPUSTACK_API_KEY };
  let response = await fetch("${url}", {
    method: "POST",
    headers,
    body: form
  });
  if (!response.ok) throw new Error(await response.text());
  let job = await response.json();
  const id = encodeURIComponent(job.id);
  while (["queued", "in_progress"].includes(job.status)) {
    await delay(5000);
    response = await fetch("${url}/" + id, { headers });
    if (!response.ok) throw new Error(await response.text());
    job = await response.json();
    console.log(job.status, job.progress);
  }
  if (job.status !== "completed") {
    throw new Error(JSON.stringify(job.error || job.status));
  }
  response = await fetch("${url}/" + id + "/content", { headers });
  if (!response.ok) throw new Error(await response.text());
  await writeFile("output.mp4", Buffer.from(await response.arrayBuffer()));
}

main();`.trim();

  return { curlCode, pythonCode, nodeJsCode };
};
