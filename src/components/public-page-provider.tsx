import useUserSettings from '@/hooks/use-user-settings';
import { ensureLocaleMessages } from '@/locales/load-messages';
import { GPUStackPluginManager } from '@/plugins/manager';
import { isPluginPublicPage } from '@/plugins/public-routes';
import { CoreUIProvider } from '@gpustack/core-ui';
import { history, setLocale, useIntl, useModel } from '@umijs/max';
import { App, ConfigProvider } from 'antd';
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from 'react';
import { getCoreUIProviderProps } from './core-ui-provider-props';

const usePublicUser = () => undefined;

const unavailableTableFetch = (): never => {
  throw new Error('Public pages must use their own data source.');
};

const unavailableRequest = async (): Promise<never> => {
  throw new Error('Public pages must use a credential-free request client.');
};

const setPublicLocale = async (locale: string, reload = false) => {
  if (!(await ensureLocaleMessages(locale))) {
    throw new Error('Locale messages unavailable.');
  }
  setLocale(locale, reload);
};

/** Mounted by innerProvider: inside Umi locale context, outside its Router. */
const PublicPageContext = ({ children }: PropsWithChildren) => {
  const intl = useIntl();
  const { themeData, userSettings } = useUserSettings();
  const coreUIProviderProps = getCoreUIProviderProps(userSettings, intl);

  return (
    <ConfigProvider componentSize="large" theme={themeData}>
      <App>
        <CoreUIProvider
          {...coreUIProviderProps}
          locale={{ ...coreUIProviderProps.locale, setLocale: setPublicLocale }}
          hooks={{
            ...coreUIProviderProps.hooks,
            useCurrentUser: usePublicUser,
            useTableFetch: unavailableTableFetch
          }}
          services={{
            request: unavailableRequest,
            router: {
              push: (path) => history.push(path),
              replace: (path) => history.replace(path),
              goBack: () => history.go(-1)
            }
          }}
        >
          {children}
        </CoreUIProvider>
      </App>
    </ConfigProvider>
  );
};

const subscribePathname = (onChange: () => void) =>
  history.listen(() => onChange());
const getPathname = () => history.location.pathname;

const PublicPageProvider = ({
  children,
  basename
}: PropsWithChildren<{ basename: string }>) => {
  // Keep the snapshot primitive: token-fragment changes belong to the route,
  // and must not become provider state or trigger unrelated context updates.
  const pathname = useSyncExternalStore(subscribePathname, getPathname);
  const isPublicPage = isPluginPublicPage(
    pathname,
    GPUStackPluginManager.getAll().values(),
    basename
  );
  const { initialState, refresh, error } = useModel('@@initialState');
  const needsManagementInit = !!initialState?.isPublicPage && !isPublicPage;
  const inFlight = useRef<{ initialState: typeof initialState } | null>(null);

  useEffect(() => {
    // Umi publishes model updates after the refresh promise settles. Keep the
    // lock until that result (or error) reaches this consumer.
    if (
      inFlight.current &&
      (initialState !== inFlight.current.initialState || error)
    ) {
      inFlight.current = null;
    }
    if (!needsManagementInit || inFlight.current || error) return;
    inFlight.current = { initialState };
    void refresh();
  }, [needsManagementInit, initialState, refresh, error]);

  // Umi only blocks its first initial-state load. Keep the management entry
  // unmounted until its deferred initialization has actually updated the model.
  if (needsManagementInit) {
    if (error) throw error;
    return null;
  }

  return isPublicPage ? (
    <PublicPageContext>{children}</PublicPageContext>
  ) : (
    children
  );
};

export default PublicPageProvider;
