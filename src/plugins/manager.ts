import { AppPlugin, IPluginManager } from './types';

class PluginManager implements IPluginManager {
  private plugins = new Map<string, AppPlugin>();
  private initialized = false;

  /**
   * register a plugin
   */
  register(name: string, plugin: AppPlugin) {
    if (this.plugins.has(name)) {
      console.warn(`Plugin "${name}" is already registered. Overwriting...`);
    }
    this.plugins.set(name, plugin);
  }

  /**
   * get a plugin
   */
  get(name: string): AppPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * check if a plugin exists
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * get all plugins
   */
  getAll(): Map<string, AppPlugin> {
    return this.plugins;
  }

  /**
   * initialize all plugins
   */
  async initialize(): Promise<Record<string, any>> {
    if (this.initialized) {
      return {};
    }

    const initData: Record<string, any> = {};

    for (const [name, plugin] of this.plugins.entries()) {
      if (plugin.onAppInit) {
        try {
          const data = await plugin.onAppInit();
          if (data) {
            initData[name] = data;
          }
        } catch (error) {
          console.error(`Failed to initialize plugin "${name}":`, error);
        }
      }
    }

    this.initialized = true;
    return initData;
  }

  /**
   * 通知所有插件应用已就绪
   */
  async notifyReady(): Promise<void> {
    for (const [name, plugin] of this.plugins.entries()) {
      if (plugin.onAppReady) {
        try {
          await plugin.onAppReady();
        } catch (error) {
          console.error(`Plugin "${name}" onAppReady failed:`, error);
        }
      }
    }
  }
}

export const GPUStackPluginManager = new PluginManager();
