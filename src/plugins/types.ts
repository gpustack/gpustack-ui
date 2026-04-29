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
 * dependency kit passed from host to plugin's custom login component
 */
export interface LoginKit {
  useLocalAuth: (opts: any) => {
    handleLogin: (values: any) => void;
    submitLoading: boolean;
  };
  useSSOAuth: (opts: any) => {
    options: {
      saml: boolean;
      oidc: boolean;
      first_time_setup: boolean;
      get_initial_password_command: string;
    };
    loginWithOIDC: () => void;
    loginWithSAML: () => void;
  };
  userInfo: any;
  setUserInfo: (info: any) => void;
  fetchUserInfo: () => Promise<any>;
  checkDefaultPage: (userInfo: any, replace: boolean) => Promise<void>;
  initialPassword: string;
  setInitialPassword: (val: string) => void;
  decryptInitialPassword: (encrypted: string) => string;
  updatePassword: (data: any) => Promise<any>;
  passwordReg: RegExp;
  onPasswordChanged: () => void;
  resetPasswordUrl: string;
  formLogoUrl: string;
}

/**
 * login module configuration
 */
export interface LoginPlugin {
  shouldUseCustomLogin?: (enterpriseSettings: any) => boolean;
  CustomLoginComponent?: ComponentType<{ kit: LoginKit }>;
}

/**
 * resolved logo URLs for sidebar and collapsed-state mini icon
 */
export interface LogoSet {
  sidebarLogo?: string;
  miniLogo?: string;
}

/**
 * branding module configuration
 */
export interface BrandingPlugin {
  ConfigPage?: ComponentType;
  resolveLogos?: (userSettings: any, isDarkTheme: boolean) => LogoSet;
}

/**
 * localization configuration
 */
export interface LocalesConfig {
  [locale: string]: Record<string, any>;
}

/**
 * runtime context passed to plugin lifecycle hooks
 */
export interface AppPluginContext {
  request: <T = any>(url: string, options?: Record<string, any>) => Promise<T>;
  setUserSettings?: (value: Record<string, any>) => void;
  setStorageUserSettings?: (value: Record<string, any>) => void;
  defaultColorPrimary?: string;
}

/**
 * application plugin interface
 */
export interface AppPlugin {
  /**
   * application initialization hook
   * called when the application starts, can return initialization data
   */
  onAppInit?: (
    context: AppPluginContext
  ) => Promise<Record<string, any>> | Record<string, any>;

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
  components?: Record<string, ComponentType<any>>;

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
