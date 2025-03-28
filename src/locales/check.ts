import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import langConfigMap from './lang-config-map';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, './');

const existingEntries = new Set(fs.readdirSync(localesDir));

const errors: string[] = [];

// ================ check if all locales are correctly named  start ====================
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

// ================ check if all locales are correctly named  end ====================

const baseLang = 'en-US'; // standard language
const fileExt = '.ts';

function parseLangFile(filePath: string): Record<string, any> {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf-8').trim();

  try {
    // 1. extract the default export object
    const match = content.match(/export\s+default\s+({[\s\S]*});?/);
    if (match) {
      let jsonString = match[1];

      // 2. remove trailing commas
      jsonString = jsonString.replace(/,\s*}/g, '}');

      // 3. parse the object
      return new Function(`return ${jsonString}`)();
    }
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error);
  }

  return {};
}

// get all modules in a language directory
function getLangFiles(lang: string): Record<string, Record<string, any>> {
  const langPath = path.join(localesDir, lang);
  if (!fs.existsSync(langPath)) return {};

  return fs
    .readdirSync(langPath)
    .filter((file) => file.endsWith(fileExt))
    .reduce(
      (acc, file) => {
        const filePath = path.join(langPath, file);
        acc[file] = parseLangFile(filePath);
        return acc;
      },
      {} as Record<string, Record<string, any>>
    );
}

function compareKeys(
  base: Record<string, any>,
  target: Record<string, any>
): { missing: string[]; extra: string[] } {
  const baseKeys = new Set(Object.keys(base));
  const targetKeys = new Set(Object.keys(target));

  return {
    missing: [...baseKeys].filter((key) => !targetKeys.has(key)),
    extra: [...targetKeys].filter((key) => !baseKeys.has(key))
  };
}

//  varify all locales base on en-US
function validateLocales() {
  const baseFiles = getLangFiles(baseLang); // en-US as base
  const languages = fs
    .readdirSync(localesDir)
    .filter(
      (dir) =>
        fs.statSync(path.join(localesDir, dir)).isDirectory() &&
        dir !== baseLang
    );

  let hasErrors = false;

  languages.forEach((lang) => {
    console.log(`🔍 Checking ${lang}...`);
    const targetFiles = getLangFiles(lang);

    Object.entries(baseFiles).forEach(([fileName, baseData]) => {
      const targetData = targetFiles[fileName] || {};

      const { missing, extra } = compareKeys(baseData, targetData);

      if (missing.length || extra.length) {
        hasErrors = true;
        console.log(`❌ [${lang}] ${fileName}:`);
        if (missing.length)
          console.log(`   ===== Missing keys: =====   \n`, missing);
        if (extra.length) console.log('   ===== Extra keys: =====   \n', extra);
      }
    });
  });

  return !hasErrors;
}

if (errors.length) {
  console.error('❌ Errors found:');
  errors.forEach(console.error);
  process.exit(1);
} else if (!validateLocales()) {
  process.exit(1);
} else {
  console.log('✅ All keys are consistent!');
}
