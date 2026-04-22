const fs = require('node:fs');
const path = require('node:path');

const workspaceGlobalPath = path.resolve(__dirname, '../../../global.tsx');
const workspaceDependenciesPath = path.resolve(__dirname, '../../../dependencies.json');
const workspaceTsconfigPath = path.resolve(__dirname, '../../../tsconfig.json');
const targetGlobalPath = path.resolve(__dirname, '../src/global.tsx');
const targetPackageJsonPath = path.resolve(__dirname, '../package.json');
const targetTsconfigPath = path.resolve(__dirname, '../tsconfig.json');
const mode = process.argv[2] || 'append';
const blockStart = '// ENTERPRISE_PLUGIN_BLOCK_START';
const blockEnd = '// ENTERPRISE_PLUGIN_BLOCK_END';

const workspaceSource = fs.readFileSync(workspaceGlobalPath, 'utf8').trim();
const blockContent = `\n${blockStart}\n${workspaceSource}\n${blockEnd}\n`;

const stripBlock = (content) => {
  const pattern = new RegExp(`\\n?${blockStart}[\\s\\S]*?${blockEnd}\\n?`, 'g');
  return content.replace(pattern, '\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
};

const currentContent = fs.readFileSync(targetGlobalPath, 'utf8');
const strippedContent = stripBlock(currentContent);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

const syncPackageJson = () => {
  const sourceDependencies =
    readJson(workspaceDependenciesPath).dependencies || {};
  const targetPackageJson = readJson(targetPackageJsonPath);
  const currentDependencies = {
    ...(targetPackageJson.dependencies || {})
  };

  if (mode === 'clean') {
    Object.keys(sourceDependencies).forEach((dependencyName) => {
      delete currentDependencies[dependencyName];
    });
  } else {
    Object.assign(currentDependencies, sourceDependencies);
  }

  targetPackageJson.dependencies = currentDependencies;
  writeJson(targetPackageJsonPath, targetPackageJson);
  console.log(
    `${mode === 'clean' ? 'Cleaned' : 'Synced'} enterprise dependencies in ${targetPackageJsonPath}`,
  );
};

const syncTsconfig = () => {
  const sourcePaths =
    readJson(workspaceTsconfigPath).compilerOptions?.paths || {};
  const targetTsconfig = readJson(targetTsconfigPath);
  const currentPaths = {
    ...(targetTsconfig.compilerOptions?.paths || {})
  };

  if (mode === 'clean') {
    Object.keys(sourcePaths).forEach((pathKey) => {
      delete currentPaths[pathKey];
    });
  } else {
    Object.assign(currentPaths, sourcePaths);
  }

  targetTsconfig.compilerOptions = targetTsconfig.compilerOptions || {};
  targetTsconfig.compilerOptions.paths = currentPaths;

  writeJson(targetTsconfigPath, targetTsconfig);
  console.log(
    `${mode === 'clean' ? 'Cleaned' : 'Synced'} enterprise tsconfig paths in ${targetTsconfigPath}`,
  );
};

if (mode === 'clean') {
  if (strippedContent !== currentContent) {
    fs.writeFileSync(targetGlobalPath, strippedContent);
    console.log(`Cleaned enterprise plugin block from ${targetGlobalPath}`);
  } else {
    console.log(`Enterprise plugin block already absent: ${targetGlobalPath}`);
  }
} else {
  const updatedContent = `${strippedContent.trimEnd()}${blockContent}`;
  if (updatedContent !== currentContent) {
    fs.writeFileSync(targetGlobalPath, updatedContent);
    console.log(`Appended enterprise plugin block to ${targetGlobalPath}`);
  } else {
    console.log(`Enterprise plugin block already up to date: ${targetGlobalPath}`);
  }
}

syncPackageJson();
syncTsconfig();
