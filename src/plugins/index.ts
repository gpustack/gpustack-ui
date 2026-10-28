import { GPUStackPluginManager } from './manager';
import { AppPlugin, AppPluginContext } from './types';

/**
 * Hook to access the enterprise plugin instance
 */
export const getGPUStackPlugin = (): AppPlugin | undefined => {
  return GPUStackPluginManager.get('enterprise');
};

/**
 * Hook to access a plugin by its name
 */
export const getPlugin = (name: string): AppPlugin | undefined => {
  return GPUStackPluginManager.get(name);
};

/**
 * Hook to check if a plugin is registered
 */
export const hasPlugin = (name: string): boolean => {
  return GPUStackPluginManager.has(name);
};

/** Keep setup and recovery screens free of protected business requests. */
export const canInitializeConsole = async (
  request: AppPluginContext['request']
): Promise<boolean> => {
  const check = getGPUStackPlugin()?.canInitializeConsole;
  if (!check) return true;
  try {
    return (await check({ request })) === true;
  } catch {
    return false;
  }
};
