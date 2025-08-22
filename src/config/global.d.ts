declare namespace Global {
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

  interface UserInfo {
    username: string;
    is_admin: boolean;
    full_name: string;
    require_password_change: boolean;
    id: number;
    source: string;
    avatar_url?: string;
  }

  type BaseListItem<T, U extends Record<string, any>> = {
    key: string;
    locale?: boolean;
    value: T;
  } & U;

  type BaseOption<T, U extends Record<string, any>> = {
    label: string;
    locale?: boolean;
    value: T;
    meta?: Record<string, any>;
  } & U;

  interface HintOptions {
    label: string;
    value: string;
    opts?: Array<BaseOption<string | number>>;
  }

  type SearchParams = Pagination & { search?: string };

  type MessageType = 'transition' | 'warning' | 'danger' | 'success' | 'info';
}

interface Window {
  __GPUSTACK_BODY_SCROLLER__?: any;
}
