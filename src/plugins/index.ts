import { GPUStackPluginManager } from './manager';
import { AppPlugin } from './types';

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
