import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import langConfigMap from './lang-config-map';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, './');

const existingEntries = new Set(fs.readdirSync(localesDir));

const errors: string[] = [];

Object.values(langConfigMap).forEach(({ lang }) => {
  const expectedDir = lang;
  const expectedFile = `${lang}.ts`;

  const dirExists = existingEntries.has(expectedDir);
  const fileExists = existingEntries.has(expectedFile);

  if (dirExists || fileExists) {
    if (!dirExists) errors.push(`❌ Missing directory: '${expectedDir}/'`);
    if (!fileExists) errors.push(`❌ Missing file: '${expectedFile}'`);
  }
});

if (errors.length) {
  console.error('❌ Errors found:');
  errors.forEach(console.error);
  process.exit(1);
} else {
  console.log('✅ All locales are correctly named.');
}
