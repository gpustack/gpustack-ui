import { formatPyObject } from './utils';

export const generateCode = ({
  api,
  parameters
}: {
  api: string;
  parameters: Record<string, unknown>;
}) => {
  const url = window.location.origin + api;
  const { input_reference, ...formValues } = parameters;
  const reference = input_reference instanceof File ? input_reference : null;
  const referenceType = JSON.stringify(
    reference?.type || 'application/octet-stream'
  );
  const fields = Object.entries(formValues).map(([key, value]) => {
    const field = `${key}=${String(value)}`.replace(/'/g, "'\\''");
    return `  --form-string '${field}' \\\n`;
  });
  const curlUpload = reference
    ? '  --form "input_reference=@\\"${INPUT_REFERENCE_PATH}\\"" \\\n'
    : '';

  const curlCode = `
job=$(curl --fail "${url}" \\
  -H "Authorization: Bearer \${YOUR_GPUSTACK_API_KEY}" \\
${fields.join('')}${curlUpload}  )
video_id=$(printf '%s' "$job" | jq -er '.id')
status=$(printf '%s' "$job" | jq -r '.status')
while [ "$status" != "completed" ]; do
  case "$status" in
    queued|in_progress) sleep 2 ;;
    *) printf '%s\\n' "$job" >&2; exit 1 ;;
  esac
  job=$(curl --fail "${url}/$video_id" \\
    -H "Authorization: Bearer \${YOUR_GPUSTACK_API_KEY}")
  status=$(printf '%s' "$job" | jq -r '.status')
done
curl --fail -L "${url}/$video_id/content" \\
  -H "Authorization: Bearer \${YOUR_GPUSTACK_API_KEY}" \\
  --output output.mp4`.trim();

  const pythonUpload = reference
    ? `reference = Path(os.environ["INPUT_REFERENCE_PATH"])
files["input_reference"] = (reference.name, reference.read_bytes(), ${referenceType})\n`
    : '';

  const pythonCode = `
import os
import time
from pathlib import Path

import requests

params = ${formatPyObject(formValues)}
headers = {"Authorization": "Bearer " + os.environ["YOUR_GPUSTACK_API_KEY"]}
files = {key: (None, str(value)) for key, value in params.items()}
${pythonUpload}response = requests.post(
    "${url}",
    headers=headers,
    files=files,
)
response.raise_for_status()
job = response.json()
video_id = job["id"]
while job["status"] in ("queued", "in_progress"):
    time.sleep(2)
    response = requests.get("${url}/" + video_id, headers=headers)
    response.raise_for_status()
    job = response.json()
    print(job["status"], job.get("progress"))
if job["status"] != "completed":
    raise RuntimeError(job.get("error") or job["status"])
response = requests.get("${url}/" + video_id + "/content", headers=headers)
response.raise_for_status()
Path("output.mp4").write_bytes(response.content)`.trim();

  const nodeUpload = reference
    ? `  const referencePath = process.env.INPUT_REFERENCE_PATH;
  const image = new Blob([await readFile(referencePath)], { type: ${referenceType} });
  form.append("input_reference", image, basename(referencePath));\n`
    : '';
  const nodeJsCode = `
const { ${reference ? 'readFile, ' : ''}writeFile } = require("node:fs/promises");
const { setTimeout: delay } = require("node:timers/promises");
${reference ? 'const { basename } = require("node:path");\n' : ''}

async function main() {
  const params = ${JSON.stringify(formValues, null, 2)};
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) {
    form.append(key, String(value));
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
    await delay(2000);
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
