const child_process = require('child_process');

export const getBranchInfo = () => {
  const latestCommit = child_process
    .execSync('git rev-parse HEAD')
    .toString()
    .trim();
  const versionTag = child_process
    .execSync(`git tag --contains ${latestCommit}`)
    .toString()
    .trim();
  return { version: versionTag, commitId: latestCommit };
};
