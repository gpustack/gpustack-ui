import { ComponentType } from 'react';

/**
 * routes
 */
export interface RouteConfig {
  path: string;
  component?: ComponentType;
  routes?: RouteConfig[];
  [key: string]: any;
}

/**
 * login module configuration
 */
export interface LoginPlugin {
  shouldUseCustomLogin?: () => boolean;
  CustomLoginComponent?: ComponentType;
}

/**
 * branding module configuration
 */
export interface BrandingPlugin {
  ConfigPage?: ComponentType;
}

/**
 * localization configuration
 */
export interface LocalesConfig {
  [locale: string]: Record<string, any>;
}

/**
 * application plugin interface
 */
export interface AppPlugin {
  /**
   * application initialization hook
   * called when the application starts, can return initialization data
   */
  onAppInit?: () => Promise<Record<string, any>> | Record<string, any>;

  /**
   * application ready hook
   * called when the application is fully loaded
   */
  onAppReady?: () => void | Promise<void>;

  /**
   * login module
   */
  login?: LoginPlugin;

  /**
   * branding module
   */
  branding?: BrandingPlugin;

  /**
   * localization configuration
   */
  locales?: LocalesConfig;

  /**
   * routes extension
   */
  routes?: RouteConfig[];

  /**
   * components extension
   */
  components?: Record<string, ComponentType>;

  /**
   * Hooks extension
   */
  hooks?: Record<string, (...args: unknown[]) => unknown>;

  /**
   * other custom fields for future extensions
   */
  [key: string]: any;
}

/**
 * plugin manager interface
 */
export interface IPluginManager {
  register(name: string, plugin: AppPlugin): void;
  get(name: string): AppPlugin | undefined;
  has(name: string): boolean;
  getAll(): Map<string, AppPlugin>;
}
