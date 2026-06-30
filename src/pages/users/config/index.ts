export const UserRoles = {
  ADMIN: 'admin',
  USER: 'user'
};

export const UserRolesOptions = [
  { label: 'users.form.admin', value: UserRoles.ADMIN },
  { label: 'users.form.user', value: UserRoles.USER }
];

export const AuthSources = {
  LOCAL: 'Local',
  OIDC: 'OIDC',
  SAML: 'SAML',
  CAS: 'CAS'
};

// ``locale: true`` on Local only — the IdP names (OIDC / SAML / CAS)
// are protocol acronyms and stay unchanged across locales, so they
// render verbatim and don't get a translation key.
export const AuthSourceOptions = [
  { label: 'users.form.source.local', value: AuthSources.LOCAL, locale: true },
  { label: AuthSources.OIDC, value: AuthSources.OIDC },
  { label: AuthSources.SAML, value: AuthSources.SAML },
  { label: AuthSources.CAS, value: AuthSources.CAS }
];
