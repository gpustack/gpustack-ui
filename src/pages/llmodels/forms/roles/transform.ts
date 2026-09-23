import _ from 'lodash';
import {
  ManualGPUModeMap,
  OverrideGroupFields,
  OverrideGroupMap,
  RoleOrder,
  RoleValueMap,
  ROUTER_DEFAULT_CPU,
  ROUTER_DEFAULT_MEMORY,
  ScheduleValueMap,
  WORKER_NAME_LABEL
} from '../../config';
import { RoleFormItem, RoleSpec } from '../../config/types';
import { generateGPUIds, generateGPUSelector } from '../../utils';

/**
 * Whether a stored `worker_selector` means the router was scheduled by hand.
 *
 * 🔴 Exactly one pair, keyed `worker-name`, is «手动»; anything else — two
 * pairs, or one pair keyed something else — is «自动». A selector the user
 * typed in «自动» that happens to be that one pair therefore reopens as «手动»,
 * showing the same machine: the label differs, the placement does not.
 *
 * Shared by the scheduling section (which renders the mode) and by
 * `rolesSpecToForm` (which seeds it when an edit drawer opens), because those
 * two disagreeing is what made a hand-pinned router reopen as «自动».
 */
export const isManualWorkerSelector = (
  selector?: Record<string, any> | null
): boolean => {
  const keys = Object.keys(selector || {});
  return keys.length === 1 && keys[0] === WORKER_NAME_LABEL;
};

// The keys a role carries only so the form can render it. None of them exists
// on `RoleSpec`, so all of them have to come off before submit — the same job
// `handleOk` does for the model-level `scheduleType` / `manualGpuMode` pair.
const UI_ONLY_KEYS = [
  'overrides',
  'managed',
  'scheduleType',
  'manualGpuMode',
  // `RoleSpec` has no `placement_strategy`; a role always runs the model's.
  'placement_strategy'
];

// Every field the payload may carry, in `RoleSpec` order. Anything outside
// this list is dropped rather than passed through, which is what keeps the
// transform total: a field added to the form by mistake cannot reach the API.
const PAYLOAD_FIELDS = _.flatten(Object.values(OverrideGroupFields));

/**
 * Whether an override group is switched on for a role, derived from the spec.
 *
 * A group is "custom" exactly when at least one of its fields carries a value:
 * `null` is the wire's word for inherit, so a group of nulls is a group left
 * on "same as model" and the switch must come back off.
 *
 * Exported because the seeding effect in `override-section` has to ask the
 * same question at the other end of the round trip — see the note there. The
 * two disagreeing is what let a role open seeded over its own stored values.
 */
export const isGroupOverridden = (role: RoleSpec, group: string) =>
  OverrideGroupFields[group].some((field) => {
    const value = (role as Record<string, any>)[field];
    if (value == null) {
      return false;
    }
    // An empty array/object round-trips as "nothing set". Treating `[]` as an
    // override would turn an untouched role into a custom one that submits an
    // empty parameter list, i.e. it would erase the model's parameters.
    if (_.isArray(value) || _.isPlainObject(value)) {
      return !_.isEmpty(value);
    }
    return true;
  });

/**
 * `RoleSpec[]` (the wire) → `RoleFormItem[]` (the form).
 *
 * Adds the UI-only keys the role tabs need and nothing else: the override
 * switches (derived, never stored), the router's managed flag, and the same
 * `scheduleType` / `manualGpuMode` pair `generateFormValues` derives for the
 * model level — without them a stored per-role GPU selection would render as
 * "Auto" and be submitted away.
 *
 * `gpuOptions` is the cascader's option tree. When it has entries, each role's
 * stored flat GPU ids are lifted back into the `[worker, gpu]` pairs the
 * cascader shows, mirroring what `update-modal` does for the model level. An
 * EMPTY tree means the inventory has not loaded yet, and the ids are left flat
 * for `rehydrateRoleGpuIds` to lift once it has — the caller that opens the
 * edit drawer passes `[]` on purpose, because the options are fetched after
 * the drawer is open.
 *
 * 🔴 The emptiness check is the whole of a bug this had: `[]` is truthy, so an
 * empty tree took the lifting branch, every id failed to find its parent and
 * was dropped, and the role opened with its GPU selector blank while the
 * `gpus_per_replica` beside it still showed. Submitting then wrote that
 * emptiness back.
 */
export const rolesSpecToForm = (
  roles?: RoleSpec[] | null,
  gpuOptions?: any[]
): RoleFormItem[] => {
  if (!roles?.length) {
    return [];
  }
  return roles.map((role) => {
    const overrides = Object.values(OverrideGroupMap).reduce(
      (acc: Record<string, boolean>, group) => {
        // The cache group has no switch, so its flag is never read back; keep
        // it out rather than seeding a control that does not exist.
        if (group !== OverrideGroupMap.Cache) {
          acc[group] = isGroupOverridden(role, group);
        }
        return acc;
      },
      {}
    );

    const isVGPU = !!role.gpu_type_selector?.type;
    const hasGPUSelection = isVGPU || !!role.gpu_selector;
    const gpuSelector = gpuOptions?.length
      ? {
          ...generateGPUSelector(role, gpuOptions).gpu_selector,
          // `generateGPUSelector` only rebuilds the ids; keep the replica
          // width beside them or an edit would silently drop it.
          gpus_per_replica: role.gpu_selector?.gpus_per_replica ?? null
        }
      : role.gpu_selector;

    return {
      ...role,
      gpu_selector: role.gpu_selector
        ? (gpuSelector as any)
        : role.gpu_selector,
      overrides,
      // The router is system-managed unless it carries an image or a command
      // of its own — those two are the whole of what the catalog derives, so
      // their presence IS the user having taken it over.
      ...(role.name === RoleValueMap.Router
        ? {
            // 🔴 No `managed` flag. It was derived here as «carries neither an
            // image nor a command» and read by `roleFormToPayload` to decide
            // the engine group — which is now forced off for every role, so
            // the flag had one reader and it stopped asking. `UI_ONLY_KEYS`
            // still lists it, to strip it off anything that still carries one.
            //
            // Seeded so the two inputs read like ordinary filled fields
            // instead of empty ones whose meaning the user has to know.
            // `stripDefaultResources` takes them back off at submit while
            // they still equal the floor, so an untouched router keeps
            // following the server's default rather than freezing today's.
            resources: {
              cpu: role.resources?.cpu ?? ROUTER_DEFAULT_CPU,
              memory: role.resources?.memory ?? ROUTER_DEFAULT_MEMORY
            }
          }
        : {}),
      // 🔴 The router is decided by a different field, and deciding it by
      // `gpu_selector` like every other role is a bug this carried: that role
      // never has one — it holds no cards — so a group deployed with the
      // router pinned to a host reopened as «自动», showing the raw label
      // selector instead of the machine the operator picked. The rule is the
      // scheduling section's own, shared rather than restated so the two
      // cannot drift again.
      scheduleType: (
        role.name === RoleValueMap.Router
          ? isManualWorkerSelector(role.worker_selector)
          : hasGPUSelection
      )
        ? ScheduleValueMap.Manual
        : ScheduleValueMap.Auto,
      manualGpuMode: isVGPU ? ManualGPUModeMap.VGPU : ManualGPUModeMap.FullGPU
    } as RoleFormItem;
  });
};

/**
 * One role, form shape → wire shape.
 *
 * A group left on "same as model" writes `null` into every field it owns —
 * that null IS the inherit instruction, so the form and the payload are the
 * same shape and no caller has to guess which fields to drop. A group switched
 * to custom passes its fields through the same normalizers the model level
 * uses, so a role's GPU selection serializes exactly like a model's.
 */
const roleFormToPayload = (role: RoleFormItem): RoleSpec => {
  const isRouter = role.name === RoleValueMap.Router;
  const isGroupOn = (group: string) => {
    /**
     * 🔴 The engine group is never on, for any role.
     *
     * There is no «引擎与镜像» section in the form any more: a prefill or a
     * decode runs the Model's engine (`RoleSpec.backend` &co. are
     * `Optional = None`, and `role_effective_model()` reads that None as
     * "inherit the Model field of the same name"), and a router derives its
     * image and invocation from the mode catalog.
     *
     * Forced here rather than left to `overrides`, so that the wire cannot
     * disagree with the screen. Two ways it could: `rolesSpecToForm` derives
     * the flag from the stored spec, so editing a model saved while the
     * section still existed would pass its frozen engine through invisibly;
     * and the router's flag used to come from `role.managed`, which nothing
     * sets any more.
     *
     * ⚠️ Editing such a model therefore CLEARS its per-role engine override.
     * That is the intent — one engine per deployment — and PD has not shipped,
     * so there is nothing in the field to clear.
     *
     * 🔴 Except for the router, which has an «引擎与镜像» section again. Its
     * fields became editable when that section lost its managed/custom switch,
     * and a blanket `false` here meant a hand-written router image or command
     * was accepted by the form and dropped on the way out. A router is the one
     * role whose engine is genuinely its own — a `vllm-router` is not the
     * model's engine — so it answers the same data question every other group
     * now answers.
     */
    if (group === OverrideGroupMap.Backend) {
      return (
        role.name === RoleValueMap.Router &&
        isGroupOverridden(role as unknown as RoleSpec, group)
      );
    }
    // The cache group is the one that does not inherit (see role-kv-cache):
    // there is no "same as model" switch for it, so nothing writes an override
    // flag and reading one would null a value the user did fill in.
    if (group === OverrideGroupMap.Cache) {
      return true;
    }
    /**
     * 🔴 The DATA decides, not the UI flag.
     *
     * This read `overrides[group]` — a UI-only boolean the managed/custom
     * switch used to own. That switch is gone (every group is `alwaysOpen`
     * now), and what set the flag in its place was an `OverrideSection` mount
     * effect. A mount effect is not a reliable owner of submit semantics: if
     * anything rewrote `roles` after the section had already mounted — turning
     * PD on seeds `createDefaultRoles()`, which sets every flag to false — the
     * effect never ran again and the flag stayed false. `roleFormToPayload`
     * then wrote `null` over whatever the user had typed.
     *
     * Reported as: added `--gpu-memory-utilization=0.3` to prefill and decode
     * at deploy time, reopened the deployment, both gone. Confirmed in the
     * database — the roles' `backend_parameters` were null while the model
     * level held only the catalog's own two parameters.
     *
     * `isGroupOverridden` asks the only question that cannot go stale: does
     * the group hold a value. It is the same predicate `rolesSpecToForm` uses
     * to derive the flag on the way in, so the round trip is symmetric.
     */
    return isGroupOverridden(role as unknown as RoleSpec, group);
  };

  // Normalized once for the whole role: the scheduling group's three fields
  // are mutually exclusive (whole cards vs an InstanceType pool), so they can
  // only be resolved together.
  const scheduling = generateGPUIds(role as any);

  const payload: Record<string, any> = {
    name: role.name,
    // The router is single-replica in this release; everything else is the x
    // and the y of xPyD.
    replicas: isRouter ? 1 : (role.replicas ?? 1)
  };

  Object.entries(OverrideGroupFields).forEach(([group, fields]) => {
    const on = isGroupOn(group);
    fields.forEach((field) => {
      if (!on) {
        payload[field] = null;
        return;
      }
      const value = _.has(scheduling, field)
        ? (scheduling as Record<string, any>)[field]
        : (role as Record<string, any>)[field];
      // 🔴 An empty list or object is `null`, not `[]`/`{}`. A group is "on"
      // as a whole, so setting only the env of the parameter group left its
      // `backend_parameters` as `[]` — and the server reads that as "this role
      // runs NO parameters", overriding the model's with emptiness, rather
      // than as "nothing said here". Only a value that exists is a value.
      const empty =
        value === undefined ||
        value === null ||
        (_.isObject(value) && _.isEmpty(value));
      payload[field] = empty ? null : value;
    });
  });

  // 🔴 No `cpu_only` here any more, and nothing replaces it: the server reads
  // "this role takes no accelerator" off the role's NAME. There used to be a
  // careful dance keeping the stored flag alive across an edit that never
  // touched it, because the checkbox rendered on one branch only — all of it
  // in service of a value whose one non-default setting had no correct
  // implementation.
  if (isRouter) {
    // Role-own, so it is not in any override group and the loop above never
    // reaches it — and this transform is total by construction, which means a
    // field nobody adds here is a field that silently never leaves the form.
    // Emitted only when something was typed: an object of nulls would read as
    // "declared, and both zero" rather than "take the floor".
    const resources = _.omitBy(role.resources || {}, (v: unknown) => v == null);
    payload.resources = _.isEmpty(resources) ? null : resources;
  }
  if (role.dependencies) {
    payload.dependencies = role.dependencies;
  }

  return payload as RoleSpec;
};

/**
 * `RoleFormItem[]` (the form) → `RoleSpec[] | null` (the payload).
 *
 * `null` for an empty list rather than `[]`: an empty array is a group with no
 * members, while `null` is the plain single-role deployment every model is
 * today — and that path has to stay exactly what it is.
 *
 * Total by construction: the output is assembled from `PAYLOAD_FIELDS`, never
 * spread from the form value, so no UI-only key can leak and no field can be
 * forgotten. Feeding the result back through `rolesSpecToForm` and out again
 * returns the same payload.
 */
export const rolesFormToPayload = (
  roles?: RoleFormItem[] | null,
  modelValues?: Record<string, any> | null
): RoleSpec[] | null => {
  if (!roles?.length) {
    return null;
  }
  return _.sortBy(roles, (role: RoleFormItem) => {
    const index = RoleOrder.indexOf(role.name);
    return index === -1 ? RoleOrder.length : index;
  })
    .map(stripUntouchedInjection)
    .map(splitStructuredValues)
    .map(stripDefaultResources)
    .map((role: RoleFormItem) => demoteUntouchedGroups(role, modelValues))
    .map(roleFormToPayload);
};

/**
 * Give the platform's own rows back to the platform, unless the user edited
 * them.
 *
 * The role's parameter and env lists are seeded with what the PD recipe
 * injects, so they can be edited like any other row (see `role-form`). A row
 * that comes back byte-identical was never touched, and sending it would
 * freeze a value that has to stay live: `{{ports.kv_port}}` and
 * `{{net_device}}` resolve on the worker at launch, and
 * `{{roles.*.tensor_parallel_size}}` follows a field the user can still
 * change. Stripping them restores "the server renders this", which is the
 * only state in which those placeholders mean anything.
 *
 * An edited row survives and wins — the launch puts PD's arguments in front of
 * the user's, and argparse keeps the last spelling. A deleted row does NOT
 * stay deleted: the server injects it again, because nothing distinguishes
 * "removed on purpose" from "never seeded" once the list is submitted.
 */
const stripUntouchedInjection = (role: RoleFormItem): RoleFormItem => {
  const injected = (role as Record<string, any>).__injected as
    | { params?: string[]; env?: Record<string, string> }
    | undefined;
  if (!injected) {
    return role;
  }
  const params = (role.backend_parameters || []).filter(
    (line: string) => !(injected.params || []).includes(line)
  );
  const env = Object.fromEntries(
    Object.entries(role.env || {}).filter(
      ([key, value]) => (injected.env || {})[key] !== value
    )
  );
  return { ...role, backend_parameters: params, env } as RoleFormItem;
};

/**
 * `--flag {json}` goes over the wire as TWO elements, not one string.
 *
 * `backend_parameters` is a concatenated argv, and the server's
 * `flatten_to_argv` re-tokenizes any element whose first word looks like a CLI
 * key — through shlex, which eats the quotes. Verified against the real
 * helper:
 *
 *     ['--kv-transfer-config {"kv_connector":"NixlConnector"}']
 *       -> ['--kv-transfer-config', '{kv_connector:NixlConnector}']   ✗
 *     ['--kv-transfer-config', '{"kv_connector":"NixlConnector"}']
 *       -> ['--kv-transfer-config', '{"kv_connector":"NixlConnector"}'] ✓
 *
 * A bare element (one that does not start with a flag) passes through
 * verbatim, which is exactly what a JSON document needs. The form keeps them
 * on one line because that is how a person reads a flag and its value; the
 * split happens here, at the boundary where the shape stops being a display
 * concern.
 *
 * Reported as a launch failure on a freshly created group: «Invalid JSON: key
 * must be a string», with the value shown as `{kv_connector:NixlConnec...}`.
 */
const splitStructuredValues = (role: RoleFormItem): RoleFormItem => {
  const params = role.backend_parameters;
  if (!params?.length) {
    return role;
  }
  const split = params.flatMap((line: string) => {
    const match = /^(--[\w.-]+)\s+([[{].*[\]}])$/.exec(String(line).trim());
    return match ? [match[1], match[2]] : [line];
  });
  return { ...role, backend_parameters: split } as RoleFormItem;
};

/**
 * A resource field still sitting on the server's floor is not an override.
 *
 * The router's CPU / memory inputs are seeded with `ROUTER_DEFAULT_CPU` /
 * `ROUTER_DEFAULT_MEMORY` so they read like ordinary filled fields rather
 * than like empty ones the user has to know the meaning of. Submitting those
 * numbers would freeze today's floor into every deployment: the server reads
 * `declared.cpu if declared and declared.cpu else ROUTER_DEFAULT_CPU`, so a
 * stored 2 keeps winning after the default moves, while a stored `null`
 * follows it. The field exists to move OFF the floor, and that is the only
 * thing worth persisting.
 *
 * Per field, not per object: raising memory while leaving CPU alone has to
 * send the memory and keep inheriting the CPU.
 */
const stripDefaultResources = (role: RoleFormItem): RoleFormItem => {
  const resources = (role as Record<string, any>).resources;
  if (!resources) {
    return role;
  }
  const cpu = resources.cpu === ROUTER_DEFAULT_CPU ? null : resources.cpu;
  const memory =
    resources.memory === ROUTER_DEFAULT_MEMORY ? null : resources.memory;
  return {
    ...role,
    resources:
      cpu == null && memory == null ? null : { ...resources, cpu, memory }
  } as RoleFormItem;
};

/**
 * A group whose every field still equals the model's is inheritance, however
 * it got that way.
 *
 * 🔴 Needed once the engine / parameter groups lost their managed-custom
 * switch: they now open seeded from the model and flagged custom, so without
 * this every role would submit a frozen copy of the model's values and stop
 * following later edits to them. The switch used to carry that meaning; the
 * comparison carries it now.
 *
 * Applies to every group rather than only the two, on purpose. Flipping the
 * old switch to custom and changing nothing produced the same frozen copy and
 * nobody wanted that either — it is the same bug, reachable two ways, and the
 * narrower fix would have left one of them.
 *
 * `null` from `modelValues` is "no model-level form to compare against"
 * (`rolesSpecToForm` round-trips, tests call the transform directly), and then
 * nothing is demoted — the role is taken at its word.
 *
 * 🔴 Demotes by NULLING the group's fields, not by writing `overrides`.
 *
 * The flag stopped being what decides: `roleFormToPayload` asks
 * `isGroupOverridden`, which reads the DATA, precisely so the wire cannot
 * disagree with a UI boolean that went stale. Writing the flag here therefore
 * did nothing at all, and the freeze it exists to prevent was still happening
 * on every save — `override-section` seeds each group from the model on mount
 * (`seedFromModel`, on by default, and `role-form` leaves it on for both the
 * parameter and the scheduling group), so a role nobody touched arrived here
 * carrying a copy of the model's values, `isGroupOverridden` saw values, and
 * five fields went over the wire as per-role overrides. The role then stopped
 * following later edits to the model, silently.
 *
 * Nulling is what `isGroupOverridden` reads as inherit, so the two now agree.
 * Unconditional over the group's fields rather than gated on the old flag,
 * for the same reason: a flag that nothing sets reliably cannot gate anything.
 */
const demoteUntouchedGroups = (
  role: RoleFormItem,
  modelValues?: Record<string, any> | null
): RoleFormItem => {
  if (!modelValues) {
    return role;
  }
  const demoted: Record<string, any> = {};
  Object.values(OverrideGroupMap).forEach((group) => {
    // The cache group never inherits, so there is nothing to demote it to.
    if (group === OverrideGroupMap.Cache) {
      return;
    }
    const fields = OverrideGroupFields[group];
    const identical = fields.every((field) =>
      _.isEqual(
        normalizeForCompare((role as Record<string, any>)[field]),
        normalizeForCompare(modelValues[field])
      )
    );
    if (identical) {
      fields.forEach((field) => {
        demoted[field] = null;
      });
    }
  });
  return Object.keys(demoted).length
    ? ({ ...role, ...demoted } as RoleFormItem)
    : role;
};

/**
 * `null`, `undefined`, `[]` and `{}` all mean "nothing set" here, and a role
 * seeded from a model that had nothing must compare equal to it. Without this
 * an untouched role whose model has no parameters holds `[]` against the
 * model's `undefined` and reads as an override of it.
 */
const normalizeForCompare = (value: any) =>
  value == null || (_.isObject(value) && _.isEmpty(value)) ? null : value;

/**
 * The role set PD starts from: a homogeneous 1P1D plus its router, every
 * override switch off. This is the "flip a switch and type two numbers" path —
 * the roles inherit the engine, the parameters and the resources from the
 * model, so nothing below is a duplicate of a model-level field.
 */
export const createDefaultRoles = (): RoleFormItem[] =>
  RoleOrder.map((name) => ({
    name,
    replicas: 1,
    overrides: {
      [OverrideGroupMap.Backend]: false,
      [OverrideGroupMap.Parameters]: false,
      [OverrideGroupMap.Scheduling]: false,
      [OverrideGroupMap.Cache]: false
    },
    ...(name === RoleValueMap.Router
      ? {
          // Same seeding as `rolesSpecToForm`, for a group being created.
          resources: {
            cpu: ROUTER_DEFAULT_CPU,
            memory: ROUTER_DEFAULT_MEMORY
          }
        }
      : {}),
    scheduleType: ScheduleValueMap.Auto,
    manualGpuMode: ManualGPUModeMap.FullGPU
  })) as RoleFormItem[];

/**
 * The keys the roles module owns inside a role value. Exported for the mount
 * site's submit path, which strips them from anything it forwards outside this
 * transform.
 */
export const ROLE_UI_ONLY_KEYS = UI_ONLY_KEYS;

/**
 * The fields a role may carry on the wire. Exported for the same reason.
 */
export const ROLE_PAYLOAD_FIELDS = PAYLOAD_FIELDS;

/**
 * Lift each role's flat GPU ids into the cascader's `[worker, gpu]` pairs,
 * once the inventory has actually loaded.
 *
 * The edit drawer opens before the GPU inventory is fetched, so the initial
 * values are built with no options and the ids stay flat (see
 * `rolesSpecToForm`). The model level is re-hydrated when the fetch returns;
 * this is the same step for the roles, which otherwise keep ids the cascader
 * cannot match and render an empty selector over a selection that is really
 * there.
 *
 * Idempotent by shape: an id already lifted is an array, and only strings are
 * looked up — so running this over already-hydrated roles changes nothing.
 * Returns `null` when there is nothing to do, which the caller reads as "no
 * write", so a plain model's form is never touched.
 */
export const rehydrateRoleGpuIds = (
  roles?: RoleFormItem[] | null,
  gpuOptions?: any[]
): RoleFormItem[] | null => {
  if (!roles?.length || !gpuOptions?.length) {
    return null;
  }
  let changed = false;
  const hydrated = roles.map((role) => {
    const ids = role.gpu_selector?.gpu_ids;
    if (!ids?.length || !ids.some((id: any) => typeof id === 'string')) {
      return role;
    }
    changed = true;
    return {
      ...role,
      gpu_selector: {
        ...role.gpu_selector,
        ...generateGPUSelector(role, gpuOptions).gpu_selector,
        // Rebuilding the ids must not drop the width beside them.
        gpus_per_replica: role.gpu_selector?.gpus_per_replica ?? null
      }
    };
  });
  return changed ? (hydrated as RoleFormItem[]) : null;
};
