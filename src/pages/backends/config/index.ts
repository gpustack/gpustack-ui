import icons from '@/components/icon-font/icons';

export const backendActions = [
  {
    label: 'Edit Versions',
    value: 'version',
    key: 'version',
    icon: icons.EditContent,
    locale: false
  },
  {
    label: 'Edit Parameters',
    value: 'parameter',
    key: 'parameter',
    icon: icons.Parameter,
    locale: false
  },
  {
    label: 'Edit by Yaml',
    value: 'yaml',
    key: 'edit',
    icon: icons.Yaml,
    locale: false
  },
  {
    label: 'Delete',
    value: 'delete',
    key: 'delete',
    icon: icons.DeleteOutlined,
    locale: false,
    danger: true
  }
];

export const yamlTemplate = `
name: SGLang
default_version: v0.5.1
health_check_path: /health
allowed_proxy_uris:
  - api/chat
  - api/v1
versions:
  v0.0.1:
    image: lm/sglang
    command: run sglang
  v0.0.2:
    image: lm/sglang
    command: run sglang
default_backend_parameters:
  - --host
  `;
