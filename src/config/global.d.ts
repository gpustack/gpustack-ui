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
  }

  interface BaseListItem<T> {
    key: string;
    locale?: boolean;
    value: T;
  }

  interface BaseOption<T> {
    label: string;
    locale?: boolean;
    value: T;
    title?: string;
    options?: BaseOption<T>[];
    meta?: Record<string, any>;
  }

  interface HintOptions {
    label: string;
    value: string;
    opts?: Array<BaseOption<string>>;
  }

  type SearchParams = Pagination & { search?: string };
}

interface Window {
  __GPUSTACK_BODY_SCROLLER__?: any;
}
