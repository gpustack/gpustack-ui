type PageActionType = 'create' | 'update' | 'view' | 'edit' | 'copy';
declare namespace Global {
  type WithFalse<T> = T | false;
  interface Pagination {
    page: number;
    perPage?: number;
    watch?: boolean;
  }
  interface PageResponse<T> {
    items: T[];
    pagination: {
      total: number;
      totalPage: number;
      page: number;
      perPage: number;
    };
  }

  interface K8sPageResponse<T> {
    apiVersion: string;
    items: T[];
    kind: string;
    metadata: {
      continue?: string;
      resourceVersion: string;
      selfLink?: string;
      [key: string]: any;
    };
  }

  interface K8sCommonData {
    kind: string;
    apiVersion: string;
    metadata: {
      name: string;
      namespace: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  interface K8sSearchParams {
    allowWatchBookmarks?: boolean;
    continue?: string;
    fieldSelector?: string;
    labelSelector?: string;
    limit?: number;
    resourceVersion?: string;
    resourceVersionMatch?: string;
    sendInitialEvents?: boolean;
    timeoutSeconds?: number;
    watch?: boolean;
    [key: string]: any;
  }

  interface UserInfo {
    username: string;
    is_admin: boolean;
    full_name: string;
    require_password_change: boolean;
    id: number;
    source: string;
    avatar_url: string;
    org_name?: string;
  }
  type EmptyObject = Record<never, never>;

  type BaseListItem<T, U extends object = EmptyObject> = {
    key: string;
    locale?: boolean;
    value: T;
  } & Partial<U>;

  type BaseOption<T, U extends object = EmptyObject> = {
    label: string;
    locale?: boolean;
    value: T;
    meta?: Record<string, any>;
  } & Partial<U>;

  type BaseOptionGroup<T, U extends object = EmptyObject> = {
    label: string;
    options?: BaseOption<T, U>[];
  };

  interface HintOptions {
    label: string;
    value: string;
    opts?: Array<BaseOption<string | number>>;
  }

  interface InitialStateType {
    fetchUserInfo: () => Promise<UserInfo>;
    currentUser?: UserInfo;
  }

  type SearchParams = Pagination & { search?: string; [key: string]: any };

  type MessageType = 'transition' | 'warning' | 'danger' | 'success' | 'info';

  interface ScrollerModalProps<T = unknown, U = unknown> {
    title?: string;
    action?: PageActionType;
    open: boolean;
    currentData?: T | null;
    onOk?: (values: U) => void;
    onCancel: () => void;
  }

  interface ActionItem<T> {
    label: string;
    key: string;
    icon: React.ReactNode;
    locale?: boolean;
    props?: {
      danger?: boolean;
    };
    visible?: (record: T) => boolean;
    disabled?: (record: T) => boolean;
  }
}

interface Window {
  __GPUSTACK_BODY_SCROLLER__?: any;
}
