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
curl --fail "${url}" \\
  -H "Authorization: Bearer \${YOUR_GPUSTACK_API_KEY}" \\
${fields.join('')}${curlUpload}  --output output.mp4`.trim();

  const pythonUpload = reference
    ? `reference = Path(os.environ["INPUT_REFERENCE_PATH"])
files["input_reference"] = (reference.name, reference.read_bytes(), ${referenceType})\n`
    : '';

  const pythonCode = `
import os
from pathlib import Path

import requests

params = ${formatPyObject(formValues)}
files = {key: (None, str(value)) for key, value in params.items()}
${pythonUpload}response = requests.post(
    "${url}",
    headers={"Authorization": "Bearer " + os.environ["YOUR_GPUSTACK_API_KEY"]},
    files=files,
)
response.raise_for_status()
Path("output.mp4").write_bytes(response.content)`.trim();

  const nodeUpload = reference
    ? `  const referencePath = process.env.INPUT_REFERENCE_PATH;
  const image = new Blob([await readFile(referencePath)], { type: ${referenceType} });
  form.append("input_reference", image, basename(referencePath));\n`
    : '';
  const nodeJsCode = `
const { ${reference ? 'readFile, ' : ''}writeFile } = require("node:fs/promises");
${reference ? 'const { basename } = require("node:path");\n' : ''}

async function main() {
  const params = ${JSON.stringify(formValues, null, 2)};
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) {
    form.append(key, String(value));
  }
${nodeUpload}
  const response = await fetch("${url}", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.YOUR_GPUSTACK_API_KEY },
    body: form
  });
  if (!response.ok) throw new Error(await response.text());
  await writeFile("output.mp4", Buffer.from(await response.arrayBuffer()));
}

main();`.trim();

  return { curlCode, pythonCode, nodeJsCode };
};
