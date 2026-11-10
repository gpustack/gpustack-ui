import type { PDModeResolution, RoleSpec } from '../config/types';

interface DeploymentBackend {
  backend?: string | null;
  backend_version?: string | null;
  image_name?: string | null;
}

/** Consume API-shaped roles so the form's override markers have been applied. */
export const pdEngineConfigs = (
  roles: readonly RoleSpec[] | null | undefined,
  deployment: DeploymentBackend
) =>
  (roles || [])
    .filter((role) => role.name === 'prefill' || role.name === 'decode')
    .map((role) => {
      const independent = !!role.backend?.trim();
      return {
        name: role.name,
        backend: role.backend?.trim() || deployment.backend || 'vLLM',
        backend_version: independent
          ? role.backend_version
          : (role.backend_version ?? deployment.backend_version),
        image_name: independent
          ? role.image_name
          : (role.image_name ?? deployment.image_name)
      };
    });

/** Custom images carry the selected recipe's contract without naming an engine. */
export const pdResolverBackends = (
  roles: readonly RoleSpec[] | null | undefined,
  deployment: DeploymentBackend
): (string | undefined)[] => {
  const engines = pdEngineConfigs(roles, deployment);
  const backends = engines.length
    ? engines.map((engine) => engine.backend)
    : [deployment.backend || 'vLLM'];
  const known = [
    ...new Set(backends.filter((backend) => backend !== 'Custom'))
  ].sort();
  return known.length ? known : [undefined];
};

/** Intersect server verdicts instead of choosing one engine's recommendation. */
export const intersectPDResolutions = (
  resolutions: PDModeResolution[]
): PDModeResolution => {
  const first = resolutions[0];
  if (!first) throw new Error('PD resolution needs at least one engine result');
  if (resolutions.length === 1) return first;
  const mode = resolutions.every((result) => result.mode === first.mode)
    ? first.mode
    : null;
  return {
    ...first,
    mode,
    vendor: resolutions.every((result) => result.vendor === first.vendor)
      ? first.vendor
      : null,
    candidate_vendors: first.candidate_vendors.filter((vendor) =>
      resolutions.every((result) => result.candidate_vendors.includes(vendor))
    ),
    options:
      first.options.length &&
      resolutions.every((result) =>
        first.options.every((option) =>
          result.options.some((item) => item.name === option.name)
        )
      )
        ? first.options.map((option) => ({
            ...(resolutions
              .map((result) =>
                result.options.find((item) => item.name === option.name)
              )
              .find((item) => item && !item.eligible) || option),
            recommended: option.name === mode
          }))
        : []
  };
};
