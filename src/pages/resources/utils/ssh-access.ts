import { ListItem } from '../config/types';

const DEFAULT_SSH_PORT = 22;
const DEFAULT_SSH_USER = 'root';

export interface SSHAccess {
  host: string;
  port: number;
  user: string;
}

/**
 * Where SSH actually answers for a cloud-provisioned worker, or `null` when
 * nothing on the row says how to reach it.
 *
 * `provider_config.ssh_endpoint` wins whenever the provider recorded one:
 * Shuihua publishes every instance behind a single shared public IP on an
 * instance-specific port, so port 22 of `advertise_address` — the private
 * per-instance address that identifies the worker — answers nothing there, and
 * the mapping is the only reachable endpoint.
 *
 * A provider that serves SSH on the instance itself records nothing (the
 * backend's `None`; DigitalOcean reports nothing), so the fallback is
 * `advertise_address:22` as root. Returning `null` when even that is missing is
 * what lets the row action hide instead of offering a connection that cannot
 * work — which is why the menu gate and the dialog share this one function.
 */
export const resolveSSHAccess = (worker: ListItem): SSHAccess | null => {
  const endpoint = worker.provider_config?.ssh_endpoint;
  const host = endpoint?.host || worker.advertise_address;
  if (!host) {
    return null;
  }
  return {
    host,
    port: endpoint?.port || DEFAULT_SSH_PORT,
    // The backend omits the key rather than storing "" when the provider does
    // not report a login user, so a falsy check is enough.
    user: endpoint?.user || DEFAULT_SSH_USER
  };
};

/**
 * The name the `/workers/{id}/privatekey` endpoint puts in its
 * Content-Disposition — the connection hint has to name the same file the user
 * just saved.
 */
export const workerPrivateKeyFilename = (id: string | number) =>
  `worker-${id}-private_key.pem`;
