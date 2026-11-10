import type { RoleSpec } from '../config/types';

export interface RouterBackendDefinition {
  value: string;
  default_command_version?: string | null;
  default_run_command?: string | null;
  versions?: { value: string; run_command?: string | null }[];
}

export type RouterCommandRole = Partial<
  Pick<RoleSpec, 'name' | 'backend' | 'backend_version' | 'run_command'>
>;

/** Command ownership is independent of backend origin and transport mode. */
export const routerCommandSource = (
  role?: RouterCommandRole,
  definition?: RouterBackendDefinition
) => {
  const backend =
    role?.backend && definition?.value === role.backend
      ? definition
      : undefined;
  const version = role?.backend_version || backend?.default_command_version;
  const versionCommand = backend?.versions?.find(
    (item) => item.value === version
  )?.run_command;
  if (role?.run_command?.trim()) {
    return { source: 'role' as const, command: role.run_command, version };
  }
  if (versionCommand?.trim()) {
    return {
      source: 'backend_version' as const,
      command: versionCommand,
      version
    };
  }
  if (backend?.default_run_command?.trim()) {
    return {
      source: 'backend_default' as const,
      command: backend.default_run_command,
      version
    };
  }
  return { source: 'recipe' as const, command: undefined, version };
};
