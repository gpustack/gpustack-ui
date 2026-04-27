// Cross-module signaling for enterprise plugin registration.
//
// The enterprise plugin is loaded asynchronously by the block injected into
// global.tsx during enterprise builds. getInitialState() must wait for that
// registration before calling GPUStackPluginManager.initialize, otherwise
// initialize runs with zero plugins.
//
// In open-source builds the block isn't injected, so the promise resolves
// immediately and getInitialState proceeds without delay.

const isEnterpriseMode = process.env.ENABLE_ENTERPRISE === 'true';

let resolveReady: () => void = () => {};

export const enterprisePluginReady: Promise<void> = new Promise<void>(
  (resolve) => {
    if (!isEnterpriseMode) {
      resolve();
    } else {
      resolveReady = resolve;
    }
  }
);

export const markEnterprisePluginReady = (): void => {
  resolveReady();
};
