import { getTenantHeaders } from '@/request.extensions';
import { createTenantFetch } from './tenant-fetch';

let installed = false;

export const installTenantFetch = (): void => {
  if (installed || typeof window === 'undefined' || !window.fetch) {
    return;
  }
  installed = true;

  window.fetch = createTenantFetch(
    window.fetch.bind(window),
    getTenantHeaders,
    window.location.href
  );
};
