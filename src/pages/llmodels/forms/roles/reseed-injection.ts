import type { FormInstance } from 'antd';

/** The snapshot `stripUntouchedInjection` compares against at submit. */
export interface InjectionSnapshot {
  params?: string[];
  env?: Record<string, string>;
}

/**
 * Re-seed one role's parameter and env lists after the PD recipe behind them
 * changed, and write the new snapshot.
 *
 * The lists are SEEDED with what the recipe injects so the rows can be edited
 * like any other (see `role-form`), and `__injected` records what was seeded so
 * `stripUntouchedInjection` can give the untouched ones back to the server at
 * submit. Both halves have to move together when the recipe does, and that is
 * the whole of what this function is for.
 *
 * 🔴 Writing only the new snapshot — which is what each call site did — is
 * wrong in both directions, and the two failures are mirror images:
 *
 * - **Recipe A → recipe B.** A's rows stay in `backend_parameters`; the
 *   snapshot now describes B, so `stripUntouchedInjection` gives B's rows back
 *   and leaves A's, which reach the engine as if the user had typed them:
 *   `{{ports.kv_port}}` unrendered, and a second `--kv-transfer-config` beside
 *   B's.
 * - **Recipe A → `custom`.** `custom` injects nothing, so an early return on
 *   an empty injection left `__injected` describing A. The user can still see
 *   A's rows and expects them submitted; instead they are silently stripped as
 *   "the server renders these" — and under `custom` the server renders nothing,
 *   so the group launches with no KV transport configured at all.
 *
 * Nothing here touches a row the user edited: only lines still byte-identical
 * to the OLD snapshot are removed, which is the same test that decides what is
 * given back at submit. An edited row is the user's and survives the switch.
 */
export const reseedRoleInjection = (
  form: FormInstance,
  index: number,
  next: InjectionSnapshot
) => {
  const path = (field: string) => ['roles', index, field];
  const previous: InjectionSnapshot =
    form.getFieldValue(path('__injected')) || {};

  const nextParams = next.params || [];
  const nextEnv = next.env || {};
  const staleParams = (previous.params || []).filter(
    (line) => !nextParams.includes(line)
  );
  const staleEnv = Object.entries(previous.env || {}).filter(
    ([key, value]) => nextEnv[key] !== value
  );

  const params: string[] = form.getFieldValue(path('backend_parameters')) || [];
  const keptParams = staleParams.length
    ? params.filter((line: string) => !staleParams.includes(line))
    : params;
  const missingParams = nextParams.filter((line) => !keptParams.includes(line));
  if (missingParams.length || keptParams.length !== params.length) {
    form.setFieldValue(path('backend_parameters'), [
      ...missingParams,
      ...keptParams
    ]);
  }

  const env: Record<string, string> =
    form.getFieldValue(path('env')) || ({} as Record<string, string>);
  const keptEnv = staleEnv.length
    ? Object.fromEntries(
        Object.entries(env).filter(
          ([key, value]) =>
            !staleEnv.some(([sk, sv]) => sk === key && sv === value)
        )
      )
    : env;
  const addedEnv = Object.entries(nextEnv).filter(([key]) => !(key in keptEnv));
  if (
    addedEnv.length ||
    Object.keys(keptEnv).length !== Object.keys(env).length
  ) {
    form.setFieldValue(path('env'), {
      ...Object.fromEntries(addedEnv),
      ...keptEnv
    });
  }

  // Cleared rather than left behind when the new recipe injects nothing —
  // `custom` is the case, and a stale snapshot there strips rows the server
  // will not put back.
  form.setFieldValue(
    path('__injected'),
    nextParams.length || Object.keys(nextEnv).length
      ? { params: nextParams, env: nextEnv }
      : undefined
  );
};
