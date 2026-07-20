import { hideModalTemporarilyAtom } from '@/atoms/settings';
import { systemConfigAtom } from '@/atoms/system';
import { userAtom } from '@/atoms/user';
import { clearAtomStorage, clearStorageUserSettings } from '@/atoms/utils';
import { request } from '@umijs/max';
import qs from 'query-string';

export const AUTH_API = '/auth';

export const AUTH_CONFIG_API = '/auth/config';

export const CAPTCHA_API = '/auth/captcha';
export const CAPTCHA_AUDIO_API = '/auth/captcha/audio';

export const login = async (
  params: {
    username: string;
    password: string;
    // Present only when the server has ``captcha_enabled``. ``captcha_id`` is
    // the opaque token issued alongside the challenge image; ``captcha`` is
    // the user-typed answer. Sent as extra form fields the backend validates
    // before checking the password.
    captcha_id?: string;
    captcha?: string;
  },
  options?: any
) => {
  return request(`${AUTH_API}/login`, {
    method: 'POST',
    data: qs.stringify(params),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

// Fetch a fresh CAPTCHA challenge. ``image`` is a ready-to-use PNG data URI;
// ``captcha_id`` is the opaque token to send back with the login request.
export const fetchCaptcha = async () => {
  return request<{ captcha_id: string; image: string }>(CAPTCHA_API, {
    method: 'GET'
  });
};

export const fetchCaptchaAudio = async (captchaId: string) => {
  return request<{ audio: string }>(CAPTCHA_AUDIO_API, {
    method: 'POST',
    data: qs.stringify({ captcha_id: captchaId }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

export const logout = async (userInfo?: any) => {
  const res = await request(`${AUTH_API}/logout`, {
    method: 'POST'
  });
  clearStorageUserSettings();
  clearAtomStorage(userAtom);
  clearAtomStorage(hideModalTemporarilyAtom);
  clearAtomStorage(systemConfigAtom);

  if (res?.logout_url) {
    window.location.href = res.logout_url;
  }
  return;
};

export const accessToken = async () => {
  return request(`${AUTH_API}/token`, {
    method: 'POST'
  });
};

export const updatePassword = async (params: any) => {
  return request(`${AUTH_API}/update-password`, {
    method: 'POST',
    data: params
  });
};

export type ExternalAuth = {
  // Provider kind (``OIDC`` / ``SAML`` / ``CAS`` / …). Stays a free-form
  // string so adding a new provider on the backend doesn't require a
  // TypeScript change here.
  type: string;
  // Browser-facing login URL the SSO button should navigate to.
  login_url: string;
};

export const fetchAuthConfig = async () => {
  return request<{
    external_auth: ExternalAuth | null;
    first_time_setup: boolean;
    get_initial_password_command: string;
    // When true, the local login form shows a CAPTCHA row and fetches a
    // challenge. The backend enforces it regardless; this only drives the UI.
    captcha_enabled: boolean;
  }>(AUTH_CONFIG_API);
};
