import { execSync } from 'child_process';

export const getBranchInfo = () => {
  // git may be absent (source archive, bare container) or this tree may
  // not be a git checkout. Swallow the failure and fall back to the env
  // overrides below — losing build info shouldn't fail the build.
  let latestCommit = '';
  let versionTag = '';
  try {
    latestCommit = execSync('git rev-parse HEAD').toString().trim();
    versionTag = execSync(`git tag --contains ${latestCommit}`)
      .toString()
      .trim();
  } catch {
    // Not a git checkout / git unavailable; rely on env overrides.
  }
  // Respect explicit GPUSTACK_UI_* overrides so a wrapping build that
  // checks this source tree out as a sub-package can stamp its own
  // release tag and commit id onto the UI (otherwise the panel reports
  // the host tree's git HEAD, which the wrapper doesn't control).
  const overrideVersion = process.env.GPUSTACK_UI_VERSION?.trim();
  const overrideCommitId = process.env.GPUSTACK_UI_COMMIT_ID?.trim();
  return {
    version: overrideVersion || versionTag || '',
    commitId: overrideCommitId || latestCommit.slice(0, 7)
  };
};
