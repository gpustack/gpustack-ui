import { workerListAtom } from '@/atoms/models';
import { InfoCircleFilled } from '@ant-design/icons';
import {
  AlertBlockInfo,
  LabelInfo,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Alert, Flex, Form, Modal, Switch, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useAtomValue } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { queryModelSpanningRoles, resolvePDMode } from '../apis';
import {
  PD_CAPABLE_BACKENDS,
  PDEnableValueMap,
  RoleLabelMap,
  RoleValueMap
} from '../config';
import { useFormContext } from '../config/form-context';
import {
  FormData,
  PDMode,
  PDModeResolution,
  RoleFormItem,
  SpanningPreview
} from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';
import useQueryPDModes, { transportLabel } from '../hooks/use-query-pd-modes';
import { pdBackendVersionWarning } from '../utils/pd-cache-services';
import { membershipUpdateNotice } from '../utils/pd-membership';
import { createDefaultRoles, rolesFormToPayload } from './roles/transform';

// Form.Item must receive the change only after the user accepts any cache
// cleanup, otherwise it hides the cache controls before confirmation.
const PDTransportSelect: React.FC<
  React.ComponentProps<typeof SealSelect> & {
    onModeChange: (value: string, commit: () => void) => void;
  }
> = ({ onChange, onModeChange, ...props }) => (
  <SealSelect
    {...props}
    onChange={(value, option) =>
      onModeChange(value, () => onChange?.(value, option))
    }
  />
);

// Bordered block whose switch sits in the title row, like the Scheduled Scaling
// and GPU-allocation sections of the same form.
const useStyles = createStyles(({ css }) => ({
  /* 🔴 No frame of its own any more. This block used to be a standalone
     section and drew its own card; the transport picker inside it already
     draws the standard field frame, so its border made «传输方案» a box inside
     a box. (It was briefly a box inside a box inside a box, while the
     «组级设置» card was still wrapped around this and «拓扑亲和性» — that card
     is gone too.) The class stays because the `.note` rules below hang off
     it. */
  sectionCard: css`
    margin-bottom: 8px;
    .section-title {
      font-size: 14px;
      color: var(--ant-color-text);
    }
    .note {
      font-size: 12px;
      line-height: 1.7;
      color: var(--ant-color-text-tertiary);
    }
    .note-warning {
      color: var(--ant-color-warning);
    }
  `,
  // One switch, not two cards. The earlier version was a two-card radio, on
  // the argument that "PD off / on" hides a trade-off two labelled shapes
  // carry in the choice itself. In review that argument lost to a simpler
  // one: the second card only ever restated what every non-PD deployment
  // already is, and it did so at the top of the form where it cost a third of
  // the visible height. The trade-off now lives in the switch's own
  // description plus the notes below it.
  /**
   * The switch row, framed like a field.
   *
   * 🔴 It used to be a bare row with a top padding and no border, from when it
   * lived between «后端版本» and the replica count in Basic Info — a plain row
   * among plain rows. Inside the «PD 分离配置» panel it sits next to «传输方案»
   * and «拓扑亲和», both of which draw the standard field frame, and an
   * unframed row beside them read as a caption rather than as the control it
   * is. The padding-for-margin trick went with the move: that worked around
   * «后端版本»'s 78px control eating the gap below it, and it is no longer the
   * element above this one.
   */
  toggleRow: css`
    border: 1px solid var(--ant-color-border);
    border-radius: var(--ant-border-radius-lg, 8px);
    padding: 12px 16px;
    min-height: 54px;
  `,
  modeId: css`
    font-size: 12px;
    font-family: var(--ant-font-family-code);
    color: var(--ant-color-text-tertiary);
  `
}));

/**
 * What turning PD on does to the REST of the form.
 *
 * These are effects on sections this component does not own, so they are
 * reported rather than written: the mount site applies them. Every one of them
 * carries its reason, because a control that is disabled or pinned without an
 * explanation is the silent-failure mode this whole feature is trying to beat.
 */
export interface PDEffects {
  // The block is on: the payload carries `disaggregation` and the role section
  // is in play.
  enabled: boolean;
  // The selected pd mode; null while off or not yet picked.
  mode: string | null;
  // The selected mode's catalog entry. The roles section needs it to show what
  // a system-managed router derives — this block already holds the catalog, so
  // resolving it twice would be two sources for one answer.
  modeData?: PDMode;
  // `custom` injects nothing, so the per-role cache dropdowns are illegal under
  // it and the router cannot be system-managed.
  isCustomMode: boolean;
  // 🆕 Every GPU-bearing role has its own "Resources and scheduling" override,
  // so the model-level card would show the same two fields a second time — and
  // the role card's "Same as model" would point at it. Removed under PD, and
  // the fields *cleared* rather than only hidden: a hidden value that still
  // projects onto every role is worse than a cluttered form, because nothing
  // on screen explains why all three members landed on the same labelled
  // workers.
  clearModelScheduling?: boolean;
  // 🆕 Same argument as `clearModelScheduling`, applied to the other pair the
  // role card duplicates: every role carries its own backend parameters and
  // env, so the model-level copies in "Advanced" showed the same two controls
  // a second time. Removed under PD, and *cleared* rather than hidden —
  // `role_effective_model` projects a model-level value onto any role that has
  // none, so a leftover `--tensor-parallel-size` would silently constrain all
  // three members with nothing on screen saying where it came from.
  clearModelParams?: boolean;
  // GPUStack does not support LoRA under PD. Clear the hidden adapter field
  // so it cannot conflict with the disaggregated deployment on submit.
  clearModelLora?: boolean;
  // Model-level `replicas` is a 0/1 deployment switch under PD, never a group
  // count: pin the field to 1 and make it read-only.
  replicasLocked: boolean;
  replicasLockReason?: string;
  // The backend rejects `roles` + `scaling_schedule`, so the section has to be
  // unavailable rather than reject a filled-in form.
  scalingDisabled: boolean;
  scalingDisabledReason?: string;
  // One-shot instruction, true only on the transition that needs it: clear
  // `extended_kv_cache` — under PD the cache is a per-role choice.
  clearModelKVCache: boolean;
  /**
   * Notices about configuration removed when enabling PD.
   * The toggle and body are separate component instances, so their parent
   * holds these notices and passes them to the body.
   */
  cacheCleared?: boolean;
  modeCleared?: boolean;
  loraCleared?: boolean;
}

interface PDDisaggregationProps {
  /**
   * Which half of this block to render.
   *
   * `toggle` is the switch alone, mounted in the replica field's label row;
   * `body` is everything the switch reveals (vendor, transport picker, notes),
   * mounted at the top of Roles, above the role tabs and beside «拓扑亲和性».
   * Two instances, one truth: `enabled` is derived from `roles`, so neither
   * owns it.
   *
   * Only the `toggle` instance runs the enable sequence and publishes effects —
   * the body would publish the same thing a second time.
   */
  variant?: 'toggle' | 'body';
  /**
   * A precondition this section cannot see (hostNetwork once it becomes a
   * field, a tenant quota, ...). Non-empty disables the whole block and is
   * shown as the reason; it wins over the conditions derived here.
   */
  disabledReason?: string;
  onEffectsChange?: (effects: PDEffects) => void;
  /**
   * The transport choice alone, for the `body` mount point.
   *
   * Deliberately not `onEffectsChange`: see `handleModeChange`. The body knows
   * which recipe was picked and nothing else about the form's PD state.
   */
  onModeChange?: (mode: string | null, data?: PDMode) => void;
  /**
   * Notices held by the parent form about configuration removed by PD.
   * They arrive as props because the body does not handle the enable action.
   */
  cacheCleared?: boolean;
  modeCleared?: boolean;
  loraCleared?: boolean;
}

const PDDisaggregation: React.FC<PDDisaggregationProps> = (props) => {
  const {
    disabledReason,
    onEffectsChange,
    onModeChange,
    variant = 'toggle'
  } = props;
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  const { getRuleMessage } = useAppUtils();
  const [modal, modalContext] = Modal.useModal();
  const { isGGUF, flatBackendOptions, onValuesChange } = useFormContext();
  const { pdModes, getPDModes, buildOptions, isCustomMode, findMode } =
    useQueryPDModes();
  const workerList = useAtomValue(workerListAtom);

  // useWatch subscribes after the first render. Read the saved inputs now so
  // that subscription hydration is not mistaken for a user changing them.
  const backend =
    Form.useWatch('backend', form) ?? form.getFieldValue('backend');
  const clusterId =
    Form.useWatch('cluster_id', form) ?? form.getFieldValue('cluster_id');
  // Model-level only, and that is the whole story rather than a shortcut: the
  // engine override group is forced off for prefill and decode (see
  // `isGroupOn` in roles/transform), so both inherit this field, and the one
  // role that does own its engine — the router — runs a `vllm-router` image
  // whose version the recipe's engine range does not describe.
  const backendVersion = Form.useWatch('backend_version', form);
  const imageName = Form.useWatch('image_name', form);
  const mode = Form.useWatch(['disaggregation', 'mode'], form);
  // Read-only reads of other sections: the role ratio and the model-level cache
  // are owned elsewhere, this block only reflects them.
  // See the note in forms/roles/index.tsx: without `preserve` this reads only
  // registered fields, and `roles` is written straight into the store.
  const roles = Form.useWatch('roles', { form, preserve: true });
  const membershipRoles = rolesFormToPayload(roles, form.getFieldsValue(true));
  const membershipNotice = membershipUpdateNotice(
    findMode(mode),
    membershipRoles
  );

  /**
   * On/off is DERIVED from `roles`, not held in local state.
   *
   * The earlier version kept a `useState`, on the argument that the toggle must
   * not write anything to the form store while off. That argument still holds
   * — and `roles` already satisfies it: turning PD on seeds it, turning PD off
   * sets it back to `null`, and a plain model never had it. So the store is
   * untouched either way and there is nothing to keep in sync.
   *
   * 🔑 What forced the change: the switch now lives in the replica field's
   * label row (`basic.tsx`) while the transport picker lives down in the group
   * settings card, so «PD 开着吗» is asked from two places. Two components
   * cannot share one `useState`, but they can read one field.
   */
  const enabled =
    // The watch, for re-renders...
    !!(roles as RoleFormItem[] | undefined)?.length ||
    // ...and a synchronous store read, for the FIRST render. `useWatch`
    // subscribes after the initial render, so on that render it answers
    // `undefined` even when the store holds a seeded group. Deriving from the
    // watch alone therefore reported «PD off» once, and the mount effect
    // published that — which is what made an edit drawer on an existing group
    // open with its roles tab missing.
    !!form.getFieldValue('roles')?.length ||
    !!form.getFieldValue(['disaggregation', 'mode']);
  // 🔴 `isPDModel({ roles: initialValues?.roles })` used to be a third clause
  // here, as a further fallback for that first render. It made the switch
  // impossible to turn OFF while editing an existing group: `initialValues`
  // never changes, so however thoroughly `handleEnableChange` cleared the
  // store, this clause answered "still on" and the switch snapped back. The
  // symptom was exactly the contradiction the comment above `active`
  // describes — blue switch, everything else in the off state — but reached
  // from the other direction, and only on edit, which is why turning PD *on*
  // during a create always looked fine.
  //
  // It was redundant as well as wrong: `roles` reaches the form through
  // `use-form-initial-values`, so the store read one line up already answers
  // for an edit on the first render.
  //
  // Notices are held by the parent because the enable action and the body
  // that shows its effects belong to separate component instances.
  //
  // `modeCleared`: turning PD off drops `disaggregation` entirely, mode
  // included. Coming back in therefore lands on an empty required field with
  // nothing to explain it, which reads as the form having lost the value by
  // accident. Remembered on the way out so the way in can say so.
  const { cacheCleared, modeCleared, loraCleared } = props;
  // What the switch's handler last produced, so its own next notification can
  // carry it forward rather than re-deriving it.
  const noticesRef = React.useRef<{ cache: boolean; mode: boolean }>({
    cache: false,
    mode: false
  });

  // ---- the disable matrix (§2.1): every entry carries its reason ----------

  // GGUF is served by llama-box, which has no PD recipe at all — so the whole
  // block goes rather than offering a mode that cannot run.
  const ggufBlocked = !!isGGUF || backend === backendOptionsMap.llamaBox;

  /**
   * Reasons PD *cannot* run at all, which is the only thing that may disable
   * the switch. Both are statements about capability, not about today's
   * occupancy: llama-box has no PD recipe in existence, and `disabledReason`
   * is passed in by a caller that knows the form cannot offer it.
   * Capacity comes from the backend's per-member resource evaluation;
   * prefill and decode can share a physical GPU.
   */
  const blockedReason =
    disabledReason ||
    (ggufBlocked
      ? intl.formatMessage({ id: 'models.form.pd.disabled.gguf' })
      : '');
  const blocked = !!blockedReason;

  // Recipes, not eligibility. Whether the engine can be disaggregated at all
  // was decided before this block rendered — `PD_ELIGIBLE_BACKENDS` at the
  // mount site, mirroring the backend's own refusal — and what is left to ask
  // here is whether a built-in recipe targets it. A BYO engine reaches this
  // point and has none, so it runs PD through `custom` (#5663 — users do want
  // their own engines here). The mode dropdown already disables the recipes
  // that do not target this engine; this note is what tells the user why only
  // Custom is left.
  const selectedBackend = flatBackendOptions?.find(
    (item) => item.value === backend
  );
  const pdCapableBackend =
    !!selectedBackend?.isBuiltIn &&
    PD_CAPABLE_BACKENDS.includes(backend as string);

  /**
   * 🔴 `blocked` no longer un-sets the displayed state.
   *
   * It used to: `active = enabled && !blocked`, on the argument that a blocked
   * cluster must not leave a «PD is on» form behind. That conflates two
   * different things — «你不能打开它» and «它没有打开» — and the edit path is
   * where the difference shows. A cluster whose workers are all offline
   * reports zero usable GPUs, so opening an existing 1P1D group on it rendered
   * every piece of PD config (role chips, the Roles tab, the group settings
   * card) with the switch showing OFF. The form contradicted itself, and the
   * half that was wrong was the one control the user would reach for.
   *
   * So the displayed state is the truth, and `blocked` only governs what the
   * user may *do*: it disables turning PD ON, never turning it off (greying
   * out the way back would trap a deployment in a state its backend cannot
   * serve), and it carries its reason next to the switch.
   */
  const active = enabled;

  // ---- cross-field effects ------------------------------------------------

  const notifyEffects = (next: {
    enabled: boolean;
    mode: string | null;
    clearModelKVCache: boolean;
    clearModelScheduling?: boolean;
    cacheCleared?: boolean;
    modeCleared?: boolean;
    /**
     * The catalog to resolve `modeData` against, when the caller has just
     * fetched it.
     *
     * Needed because `findMode` closes over `pdModes` state: awaiting the
     * fetch does not re-render inside the same tick, so a caller that awaits
     * and then notifies would still resolve against the empty list it started
     * with — and `modeData` would stay undefined for the life of the form.
     */
    modes?: PDMode[];
  }) => {
    const resolve = (name: string | null) =>
      next.modes
        ? next.modes.find((mode) => mode.name === name)
        : findMode(name);
    onEffectsChange?.({
      enabled: next.enabled,
      mode: next.enabled ? next.mode : null,
      modeData: next.enabled ? resolve(next.mode) : undefined,
      isCustomMode: next.enabled && isCustomMode(next.mode),
      clearModelParams: next.enabled,
      // Published on every notification while PD is on, exactly like
      // `clearModelParams`: the edit path never runs the switch's handler, and
      // an existing group that arrives carrying `lora_list` has to shed it
      // here or its next save is a 400.
      clearModelLora: next.enabled,
      replicasLocked: next.enabled,
      replicasLockReason: next.enabled
        ? intl.formatMessage({ id: 'models.form.pd.replicas.moved' })
        : undefined,
      scalingDisabled: next.enabled,
      scalingDisabledReason: next.enabled
        ? intl.formatMessage({ id: 'models.form.pd.disabled.schedule' })
        : undefined,
      clearModelKVCache: next.clearModelKVCache,
      clearModelScheduling: next.clearModelScheduling,
      cacheCleared: next.cacheCleared,
      modeCleared: next.modeCleared
    });
  };

  // Keep each resolution with its backend, cluster and catalog. Validation can
  // run before React renders new rules, so it also needs a synchronous snapshot.
  const [derived, setDerived] = useState<{
    resolution: PDModeResolution | null;
    backend?: string;
    clusterId?: number;
    modes?: PDMode[];
  }>({ resolution: null });
  const derivedRef = useRef(derived);

  const updateResolution = (
    resolution: PDModeResolution | null,
    modes?: PDMode[]
  ) => {
    const next = { resolution, backend, clusterId, modes };
    derivedRef.current = next;
    setDerived(next);
  };

  const revalidateMode = () => {
    // Sibling fields and programmatic writes do not trigger the mode's rules.
    // Leave an untouched empty mode to the required rule at submit time.
    if (form.getFieldValue(['disaggregation', 'mode'])) {
      form.validateFields([['disaggregation', 'mode']]).catch(() => {});
    }
  };

  // A resolve in flight is invalidated by any later change to its inputs.
  // Without this a slow answer for the previous engine lands after the fast
  // answer for the current one and silently overwrites the mode field.
  const resolveSession = useRef(0);
  const toggleSession = useRef(0);
  const resolutionInputs = useRef({ backend, clusterId });

  /**
   * One atomic write: local state, the form field, and the published effects.
   *
   * 🔑 **No fallback.** When the server derives nothing the field is left
   * empty and the picker opens — never quietly set to `custom`. Choosing
   * `custom` means "I will supply the connection parameters myself", which is
   * not a decision the platform can make on the user's behalf.
   */
  const applyResolution = (
    resolution: PDModeResolution,
    modes?: PDMode[],
    preserveMode = false
  ) => {
    updateResolution(resolution, modes);
    const currentMode = form.getFieldValue(['disaggregation', 'mode']);
    const selectedMode =
      preserveMode && currentMode ? currentMode : resolution.mode;
    if (!selectedMode) {
      return;
    }
    // Opening an edit/copy form asks for eligibility, not a replacement for
    // its saved choice. Only an empty mode or changed inputs select the recipe.
    if (!preserveMode || !currentMode) {
      form.setFieldsValue({
        disaggregation: {
          ...(form.getFieldValue('disaggregation') || {}),
          mode: selectedMode,
          vendor: resolution.vendor ?? undefined
        }
      });
      // Programmatic writes do not fire Form.onValuesChange. Evaluate again
      // once the automatic transport arrives, with its placement constraints.
      onValuesChange?.(
        { disaggregation: { mode: selectedMode } },
        form.getFieldsValue()
      );
    }
    // Through `onModeChange`, the same narrow channel `handleModeChange` uses,
    // rather than `notifyEffects`.
    //
    // 🔴 This runs in the `body` only (the effect below is guarded), and the
    // body is mounted without `onEffectsChange` — so `notifyEffects` here
    // reached nobody. It used to reach the parent because BOTH instances ran
    // this effect, which is precisely the duplication the guard removes: the
    // toggle re-resolved the same recipe over the same inputs, sent a second
    // identical request, and wrote the answer into the same
    // `disaggregation.mode` the body had just written.
    //
    // A narrow publish is also the correct one. The switch owns `enabled` and
    // the body owns `mode`; `notifyEffects` carries both, and its `enabled:
    // active` was only ever echoing back what the switch had already said.
    onModeChange?.(
      selectedMode,
      modes
        ? modes.find((mode) => mode.name === selectedMode)
        : findMode(selectedMode)
    );
  };

  /**
   * @param modes The catalog the caller has just fetched, when it has.
   *
   * 🔴 Load-bearing, and its absence was a silent defect. `applyResolution`
   * resolves the recipe name it publishes into the catalog ENTRY, and without
   * this it falls back to `findMode`, which closes over the `pdModes` state of
   * the render it was created in. `resolveWithCatalog` awaits `getPDModes()`
   * and then calls this — but awaiting does not re-render inside the same
   * tick, so that closure still saw the empty list it started with. Result:
   * `modeData` published as `undefined` on every path, and every consumer of
   * it rendered nothing — the roles' system-managed rows most visibly, which
   * showed an empty «引擎参数与环境变量» card for a mode that injects six
   * things.
   */
  const runResolve = async (
    overrides?: { vendor?: string },
    modes?: PDMode[],
    preserveMode = false
  ) => {
    const session = ++resolveSession.current;
    try {
      const resolution = await resolvePDMode({
        cluster_id: clusterId,
        backend,
        vendor:
          overrides?.vendor ?? form.getFieldValue(['disaggregation', 'vendor'])
      });
      if (resolveSession.current !== session) {
        return;
      }
      applyResolution(resolution, modes, preserveMode);
    } catch (error) {
      // An older server has no /resolve. Fall back to the full picker rather
      // than to a field that renders nothing: the catalog is already loaded,
      // so the dropdown still works — only the derivation is missing.
      if (resolveSession.current !== session) {
        return;
      }
      updateResolution(null, modes);
    }
    // Includes vendor changes and unresolved answers that retain the mode.
    // The synchronous snapshot is already updated even before new rules render.
    revalidateMode();
  };

  // The inputs the answer is a function of. Not a request-function
  // dependency (which the repo's conventions forbid) — these are the values
  // whose change *is* the action, and this component only watches them
  // because the engine and cluster fields belong to a sibling section.
  useEffect(() => {
    // 🔴 The body resolves; the toggle does not.
    //
    // Hooks run before the `variant` split below, so without this BOTH
    // instances ran the whole thing: two identical `resolvePDMode` requests on
    // every cluster or engine change, two writers into one
    // `disaggregation.mode`, and the toggle then discarding the `derived` it
    // had just paid for — only the body renders it. Same shape as the
    // duplication `use-query-pd-modes` already had to defuse with a
    // module-level catalog, one layer up.
    //
    // Body-only is safe because it only exists while PD is on, and `active`
    // gates this anyway: with PD off the branch below already resolves
    // nothing.
    if (variant !== 'body') {
      return;
    }
    if (!active) {
      resolveSession.current += 1;
      updateResolution(null);
      return;
    }
    /**
     * 🔴 The catalog is fetched HERE, not only on mount.
     *
     * The mount-only fetch below was written for one instance of this block.
     * With the switch and the body split across two mount points, the body
     * mounts inside Roles — and on its first render `Form.useWatch('roles')`
     * has not subscribed yet, so `active` is still false and the mount-only
     * fetch skips. It never re-runs, so `pdModes` stayed empty for the life of
     * the form: the transport line fell back to the raw recipe name
     * («vllm-ascend-mooncake» instead of «Mooncake») and the picker had no
     * options at all — `custom` included.
     *
     * `active` flipping false→true IS the action here, which is why this
     * belongs on this effect rather than on a fetch-function dependency.
     */
    const inputsChanged =
      resolutionInputs.current.backend !== backend ||
      resolutionInputs.current.clusterId !== clusterId;
    resolutionInputs.current = { backend, clusterId };
    let cancelled = false;
    const session = resolveSession.current;
    const resolveWithCatalog = async () => {
      // Held in a local, not read back off state: the fetch below does not
      // re-render before the next line runs.
      const modes = pdModes.length ? pdModes : await getPDModes();
      if (cancelled || resolveSession.current !== session) {
        return;
      }
      await runResolve(undefined, modes, !inputsChanged);
    };
    resolveWithCatalog();
    return () => {
      cancelled = true;
      // A backend change can unmount the body while resolution is in flight.
      // Its response must not recreate the disaggregation value just cleared.
      resolveSession.current += 1;
    };
  }, [active, backend, clusterId]);

  // Mount is the one transition no handler can report: editing a model that is
  // already disaggregated arrives with its replicas locked and its mode
  // dropdown already open, so the catalog is fetched here too. Mount only (a
  // lifecycle entry point, not a dependency) — every later change comes from a
  // handler below, and a form that opens with PD off fetches nothing.
  useEffect(() => {
    let cancelled = false;
    const session = toggleSession.current;
    // The catalog has to land *before* the effects that read it are published:
    // an edit drawer opens with the mode already chosen, so `modeData` is
    // resolved exactly once here. Notifying first and fetching after left the
    // managed router with no derived image, command or health path — rendered
    // as "-", which reads as "the system derived nothing" rather than as
    // "the catalog has not arrived".
    const seed = async () => {
      const modes = active ? await getPDModes() : undefined;
      if (cancelled || toggleSession.current !== session) {
        return;
      }
      notifyEffects({
        enabled: active,
        mode: form.getFieldValue(['disaggregation', 'mode']) ?? null,
        clearModelKVCache: false,
        modes
      });
    };
    seed();
    return () => {
      cancelled = true;
      toggleSession.current += 1;
    };
  }, []);

  const handleEnableChange = async (value: string) => {
    const session = ++toggleSession.current;
    const next = value === PDEnableValueMap.Disaggregated;
    // The model-level cache does not survive the switch: its benefit is
    // asymmetric between prefill and decode, so a model-level setting would
    // hand decode a cost it cannot use. The mount site clears it; the notice
    // below is what makes that visible.
    const clearModelKVCache =
      next && !!form.getFieldValue(['extended_kv_cache', 'enabled']);
    // Only on the way in. Turning PD off leaves the roles behind too, so
    // re-clearing would wipe values the user is about to see again.
    const clearModelScheduling = next;
    let modes: PDMode[] | undefined;
    if (next) {
      // Opening the branch IS the action, so this is where the catalog request
      // belongs — the drawer's open is not this component's to hook. Awaited
      // and carried, for the same reason `runResolve` carries it: the
      // notification below resolves a recipe name against it.
      modes = await getPDModes();
      if (
        toggleSession.current !== session ||
        form.getFieldValue('backend') !== backend ||
        form.getFieldValue('cluster_id') !== clusterId
      ) {
        return;
      }
    }
    // Commit the layout before the final clears below. preserve={false}
    // restores saved initialValues when conditional fields unregister.
    // Only this user action flushes; mount notifications remain asynchronous.
    flushSync(() => {
      // Seed the role set here, not in the roles section's mount effect: that
      // section only mounts when its panel is expanded, so a user who turns PD
      // on and submits without opening it would send `disaggregation` with no
      // roles — which the backend refuses, and rightly so. The value has to
      // exist the moment PD does.
      if (next && !form.getFieldValue('roles')?.length) {
        form.setFieldValue('roles', createDefaultRoles());
      }
      if (!next) {
        // Off means a plain model again: leave no group behind for the payload
        // to pick up.
        noticesRef.current.mode = !!form.getFieldValue([
          'disaggregation',
          'mode'
        ]);
        form.setFieldValue('roles', null);
        form.setFieldValue('disaggregation', null);
      }
      // No `setEnabled`: `roles` above IS the state, and the watch re-renders
      // both the switch and this body from it.
      noticesRef.current.cache = clearModelKVCache;
      notifyEffects({
        enabled: next,
        mode: form.getFieldValue(['disaggregation', 'mode']) ?? null,
        clearModelKVCache,
        clearModelScheduling,
        cacheCleared: noticesRef.current.cache,
        modeCleared: noticesRef.current.mode,
        modes
      });
    });
    if (next) {
      form.setFieldValue('extended_kv_cache', { enabled: false });
      form.setFieldValue('speculative_config', { enabled: false });
    } else {
      form.setFieldValue('roles', null);
      form.setFieldValue('disaggregation', null);
    }
    onValuesChange?.({}, form.getFieldsValue());
  };

  const clearKVCache = () => {
    form.setFieldValue('extended_kv_cache', { enabled: false });
    const currentRoles: RoleFormItem[] = form.getFieldValue('roles') || [];
    currentRoles.forEach((_role, index) => {
      form.setFieldValue(['roles', index, 'extended_kv_cache'], {
        enabled: false
      });
    });
  };

  const applyModeChange = async (value: string, commit: () => void) => {
    const clearCache = isCustomMode(value);
    if (clearCache) {
      clearKVCache();
    }
    commit();
    // The notice has done its job once a mode is chosen again. Cleared through
    // the same channel it arrived on — this runs in the body, whose
    // `notifyEffects` reaches nobody, so `onModeChange` below is what the
    // parent acts on.
    noticesRef.current.mode = false;
    notifyEffects({
      enabled: true,
      mode: value ?? null,
      clearModelKVCache: false
    });
    /**
     * 🔴 The picker lives in the BODY, and the body is mounted without
     * `onEffectsChange` — so the line above reaches nobody and choosing a
     * transport published nothing at all.
     *
     * Wiring the full callback here is what one reaches for and it is wrong:
     * the body's mount effect publishes `enabled` too, and on its first render
     * `Form.useWatch('roles')` has not subscribed yet, so it would publish
     * `enabled: false` — unmounting the panel it lives in. This narrow one
     * carries only the choice that was just made, which is the only thing this
     * mount point knows better than the switch does.
     */
    onModeChange?.(value ?? null, findMode(value));
    if (clearCache) {
      // preserve={false} restores saved initialValues when cache fields
      // unmount. Clear again after that cleanup, before closing the dialog.
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (form.getFieldValue(['disaggregation', 'mode']) !== value) {
        return;
      }
      clearKVCache();
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleModeChange = (value: string, commit: () => void) => {
    // A pending automatic resolution must not overwrite the user's choice.
    resolveSession.current += 1;
    const currentRoles: RoleFormItem[] = form.getFieldValue('roles') || [];
    const hasCache =
      form.getFieldValue(['extended_kv_cache', 'enabled']) ||
      currentRoles.some((role) => role.extended_kv_cache?.enabled);
    if (isCustomMode(value) && hasCache) {
      modal.confirm({
        width: 520,
        title: intl.formatMessage({
          id: 'models.form.pd.mode.custom.confirm.title'
        }),
        content: (
          <Flex vertical gap="middle">
            <Typography.Text strong>
              {intl.formatMessage({
                id: 'models.form.pd.mode.custom.confirm.reason'
              })}
            </Typography.Text>
            <Flex vertical gap="small">
              <Typography.Text>
                {intl.formatMessage({
                  id: 'models.form.pd.mode.custom.confirm.effects'
                })}
              </Typography.Text>
              <ul
                style={{
                  marginBlock: 0,
                  paddingInlineStart: 'var(--ant-padding-lg)'
                }}
              >
                <li>
                  {intl.formatMessage({
                    id: 'models.form.pd.mode.custom.confirm.disable'
                  })}
                </li>
                <li>
                  {intl.formatMessage({
                    id: 'models.form.pd.mode.custom.confirm.clear'
                  })}
                </li>
              </ul>
            </Flex>
            <Typography.Text style={{ fontSize: 'var(--ant-font-size-sm)' }}>
              {intl.formatMessage({
                id: 'models.form.pd.mode.custom.confirm.save'
              })}
            </Typography.Text>
          </Flex>
        ),
        okText: intl.formatMessage({
          id: 'models.form.pd.mode.custom.confirm.ok'
        }),
        cancelText: intl.formatMessage({ id: 'common.button.cancel' }),
        onOk: () => applyModeChange(value, commit)
      });
      return;
    }
    void applyModeChange(value, commit);
  };

  // ---- role-derived reflections -----------------------------------------

  // Different GPU types across prefill and decode is a product-visible
  // capability boundary (no gang admission), so it is flagged in the form
  // rather than waiting for the backend to refuse the group.
  const roleList: RoleFormItem[] = Array.isArray(roles) ? roles : [];
  /**
   * The share of requests whose prefill and decode land on the same host, as a
   * percentage — or null when the group is small enough that nobody is
   * surprised.
   *
   * `P(same host) = 1/x` where x is the prefill count, and it depends on
   * neither the topology nor the gather choice: the router pairs a request with
   * some prefill and some decode, and only one of x prefills is the one sitting
   * next to the chosen decode. So a perfectly declared fabric still pairs
   * on-host 1/8 of the time at 8P8D. Surfaced above the threshold only, because
   * at 1P1D or 2P2D the number is high enough to need no comment and a notice
   * on every deployment is a notice nobody reads.
   */
  const largeGroupPairing = (() => {
    const prefillReplicas = Number(
      (roles || []).find((r: RoleFormItem) => r.name === RoleValueMap.Prefill)
        ?.replicas ?? 0
    );
    if (!prefillReplicas || prefillReplicas < 4) {
      return null;
    }
    return Math.round((1 / prefillReplicas) * 100);
  })();

  /**
   * ...unless a member is too wide for any single machine, which does not
   * loosen that floor — it inverts it.
   *
   * 🔴 A member that cannot fit one machine takes WHOLE machines (the engine
   * selectors allocate every GPU of every worker they pick), so no machine ever
   * holds both a prefill and a decode and the true figure is exactly 0. «At
   * least about 25%» printed beside a real 0 is worse than printing nothing.
   *
   * Asked of the server, not computed here: the width is the engine's own
   * arithmetic — vLLM spells it `--tensor-parallel-size`, SGLang `--tp-size`,
   * and both fold in pipeline and data parallelism. A second reading of those
   * flags in TypeScript would be a second answer to one question.
   *
   * Shown at ANY group size, unlike the floor above it. The floor is hidden
   * below 4 prefills because there the number is high enough to need no
   * comment; this one is the opposite — at 1P1D the operator's expectation is
   * 100% on-host and the truth is 0, which is the largest gap this note ever
   * has to close.
   */
  const [spanning, setSpanning] = useState<SpanningPreview | null>(null);
  const spanningSessionRef = useRef(0);
  const modelParams = Form.useWatch('backend_parameters', form);

  /**
   * Everything the answer depends on, and nothing else — so a form being typed
   * elsewhere does not re-ask, and these four changing always does.
   */
  const spanningSignature = JSON.stringify([
    clusterId,
    backend,
    modelParams,
    (roles || []).map((role: RoleFormItem) => [
      role?.name,
      role?.backend,
      role?.backend_parameters
    ])
  ]);

  useEffect(() => {
    // Body-only, same reason as the resolve effect above — and here the cost is
    // the one worth naming: `spanningSignature` includes every role's
    // `backend_parameters`, so the toggle fired a second copy of this request
    // each time the user paused half a second in a role's parameter box. It is
    // not a cheap GET: the server folds TP/PP/DP to compute each role's width.
    // `spanning` is read only by the note this effect feeds, which is body-only
    // markup.
    if (variant !== 'body') {
      return;
    }
    const session = ++spanningSessionRef.current;
    if (!clusterId || !roles?.length) {
      setSpanning(null);
      return;
    }
    // Debounced because the inputs include a text field the user types into.
    // Nothing downstream of this blocks, so a late answer only ever adds a
    // note; there is no state it can arrive too late for.
    const timer = setTimeout(async () => {
      const values = form.getFieldsValue(true) as Record<string, any>;
      try {
        // Assembled field by field rather than spread, and that is the point:
        // half-typed values elsewhere in this form 422 the whole request — a
        // vGPU selector mid-switch carries a cores percentage without a memory
        // one, an in-progress scaling rule is incomplete — and a rejected
        // request means this note silently never appears. Nothing outside
        // these fields can change the answer, so nothing else is sent. The
        // source block is here only because the API requires it.
        const result = await queryModelSpanningRoles({
          name: values.name,
          source: values.source,
          huggingface_repo_id: values.huggingface_repo_id,
          huggingface_filename: values.huggingface_filename,
          model_scope_model_id: values.model_scope_model_id,
          model_scope_file_path: values.model_scope_file_path,
          local_path: values.local_path,
          cluster_id: values.cluster_id,
          backend: values.backend,
          backend_parameters: values.backend_parameters,
          roles: rolesFormToPayload(values.roles, values)
        });
        if (spanningSessionRef.current === session) {
          setSpanning(result);
        }
      } catch (e) {
        // 🔴 Never an error state, and never a third «unknown» rendering. A
        // half-typed draft the API rejects, a fleet that cannot be read and a
        // width that was never stated all mean the same thing here: show what
        // this form showed before the question could be asked at all.
        if (spanningSessionRef.current === session) {
          setSpanning(null);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [spanningSignature]);

  const spanningNote = (() => {
    const first = spanning?.roles?.[0];
    if (!first) {
      return null;
    }
    const labelId = RoleLabelMap[first.name as keyof typeof RoleLabelMap];
    return intl.formatMessage(
      { id: 'models.form.gather.spanning' },
      {
        role: labelId ? intl.formatMessage({ id: labelId }) : first.name,
        gpus: first.gpus,
        widest: spanning?.widest_worker_gpus
      }
    );
  })();

  // Options come from the catalog, gated by engine *and* by the accelerators
  // the picked cluster actually has: a recipe that targets another engine or
  // another accelerator stays visible but disabled, carrying why.
  const getCurrentResolution = (
    snapshot: typeof derived,
    currentBackend = backend,
    currentClusterId = clusterId
  ) =>
    snapshot.backend === currentBackend &&
    snapshot.clusterId === currentClusterId
      ? snapshot.resolution
      : null;

  const getModeOptions = (
    snapshot: typeof derived,
    currentBackend = backend,
    currentClusterId = clusterId
  ) => {
    const clusterVendors = Array.from(
      new Set(
        workerList
          .filter((worker) => worker.cluster_id === currentClusterId)
          .flatMap((worker) => worker.vendors || [])
          .map((vendor) => vendor.toLowerCase())
      )
    );
    const selectedVendor = form
      .getFieldValue(['disaggregation', 'vendor'])
      ?.toLowerCase();
    // A selected partition narrows a mixed cluster. If it is absent from a
    // known new cluster, keep checking that cluster's actual accelerators.
    const usePartition =
      selectedVendor &&
      (!clusterVendors.length || clusterVendors.includes(selectedVendor));
    // A previous engine/cluster's verdict must not override the local checks
    // while the next resolution is pending.
    const resolution = getCurrentResolution(
      snapshot,
      currentBackend,
      currentClusterId
    );
    const modeVerdicts = resolution?.options?.length
      ? Object.fromEntries(
          resolution.options.map((option) => [option.name, option])
        )
      : undefined;
    return buildOptions(
      currentBackend,
      usePartition ? [selectedVendor] : clusterVendors,
      modeVerdicts,
      snapshot.modes,
      usePartition ? 'partition' : 'cluster'
    );
  };
  const currentResolution = getCurrentResolution(derived);
  const modeOptions = getModeOptions(derived);

  // Every built-in recipe is unavailable for this engine × accelerator pair,
  // leaving only Custom. The per-option reasons already say *why* each one is
  // out; this is the summary that tells the user the DIY path is still open —
  // without it the dropdown reads as "PD is broken here".
  //
  // 🔑 Deliberately NOT a block-level gate: an unsupported pair means "no
  // built-in recipe", not "no PD". Custom injects nothing, so writing the
  // connector, ports and handshake variables by hand stays available on any
  // accelerator (see the note on `custom` in the mode catalog).
  /**
   * What the picker actually lists.
   *
   * Ineligible recipes are hidden rather than shown disabled. They used to be
   * kept visible on the reasoning that an unpickable option still tells you
   * the capability exists — but once the mode is *derived*, the picker is an
   * escape hatch, and three greyed rows with explanations are noise in it.
   * The one case that reasoning was protecting is covered by the summary note
   * below: when nothing built-in fits, it says so and points at Custom.
   *
   * 🔑 **The selected value is never hidden.** Editing a model deployed on
   * Ascend from a context whose cluster is NVIDIA would otherwise drop its
   * mode from the list, leaving the Select empty and silently discarding what
   * is actually deployed. Kept — and it is exactly the row where the
   * ineligible reason is worth reading.
   */
  const visibleModeOptions = modeOptions.filter(
    (option) => !option.disabled || option.value === mode
  );

  /**
   * Why the server derived nothing, in the reader's language.
   *
   * 🔴 `unresolved_reason` used to be rendered verbatim, and it is assembled
   * in English by `pd_mode_resolver.py` — so this one warning came out in
   * English inside a form that is otherwise fully localized. The server now
   * sends a `unresolved_code` plus pre-joined `unresolved_params` alongside
   * the prose, and the lookup happens here.
   *
   * The prose stays as the fallback, for a server older than the code (and
   * for a code newer than this client — `formatMessage` on an id the catalog
   * does not hold logs and echoes the id, which would be worse than an
   * English sentence that at least says what happened).
   */
  const unresolvedNote = (() => {
    const resolution = currentResolution;
    if (!resolution?.unresolved_reason && !resolution?.unresolved_code) {
      return null;
    }
    const id = `models.form.pd.unresolved.${resolution.unresolved_code}`;
    if (!resolution.unresolved_code || !intl.messages[id]) {
      return resolution.unresolved_reason;
    }
    const params = { ...(resolution.unresolved_params || {}) };
    // `backend` is optional on the request, and the server sends `''` rather
    // than its own "this engine" — that half-sentence is the client's to
    // word. Left empty it would render as a hole mid-sentence.
    if (params.backend === '') {
      params.backend = intl.formatMessage({
        id: 'models.form.pd.unresolved.thisEngine'
      });
    }
    return intl.formatMessage({ id }, params);
  })();

  const engineRange = findMode(mode)?.backend_versions;
  const engineVersionNote = pdBackendVersionWarning(
    flatBackendOptions.find((item) => item.value === backend),
    backendVersion,
    engineRange,
    imageName
  )
    ? intl.formatMessage(
        { id: 'models.form.pd.engineVersion.below' },
        { version: backendVersion, range: engineRange }
      )
    : null;

  const onlyCustomLeft =
    modeOptions.length > 0 &&
    modeOptions
      .filter((option) => !isCustomMode(option.value))
      .every((option) => option.disabled);
  /**
   * The reason renders *inline*, not in a Tooltip.
   *
   * A disabled antd option carries `pointer-events: none`, so it never
   * receives the hover a Tooltip needs — the reason would exist in the tree
   * and be unreachable, which reads to the user exactly like the greying-out
   * having no explanation at all. Inline also matches what the reason is for:
   * "kept visible but disabled, carrying why" only pays off if the why is
   * visible without a discovery step.
   */
  /**
   * The closed control: the transport, then the recipe id as an annotation.
   *
   * The transport is what the reader is choosing between — «Mooncake» vs
   * «NIXL» is the decision. The recipe id (`vllm-ascend-mooncake`) is the
   * platform's identifier for the whole injected bundle, and it earns its
   * place only as a subordinate note: two recipes can share a transport, so
   * without it «Mooncake» alone would not say which one is deployed. Grey and
   * monospaced so it reads as an id rather than as a second label.
   */
  const modeLabelRender = (option: any) => {
    const mode = findMode(option?.value);
    const transport = transportLabel(mode);
    return (
      <Flex align="baseline" gap={8}>
        <span>{transport || option?.value}</span>
        {!!transport && option?.value !== transport && (
          <span className={styles.modeId}>{option.value}</span>
        )}
      </Flex>
    );
  };

  const modeOptionRender = (option: any) => {
    const reason = option?.data?.reason;
    const label = option?.data?.label ?? option?.label;
    if (!reason) {
      return label;
    }
    return (
      <Flex vertical gap={2}>
        <span>{label}</span>
        <span
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: 'var(--ant-color-text-tertiary)',
            whiteSpace: 'normal'
          }}
        >
          {reason}
        </span>
      </Flex>
    );
  };

  /**
   * The switch, and nothing else.
   *
   * Rendered as the first row of the «PD 分离配置» panel, above everything it
   * turns on. Sized for that row: no title, no card, the label carrying the
   * name of the decision.
   *
   * ⚠️ The caller must keep this mounted across a flip — in practice, an
   * unconditional collapse item with `forceRender`. Its mount effect
   * publishes `enabled` from a first render whose `roles` watch has not
   * resolved (i.e. `false`), so a toggle that remounts when PD turns on
   * immediately turns it back off, leaving the switch blue and the rest of
   * the form in the off state.
   */
  if (variant === 'toggle') {
    const toggle = (
      // A row of its own, label left and switch right, like every other
      // full-width field around it. It used to be an inline pair overlaid on
      // the replica input's label line — that read as a property *of* the
      // replica count rather than as the deployment-shape decision it is.
      <Flex
        align="center"
        justify="space-between"
        gap={8}
        className={styles.toggleRow}
        data-field="pdMode"
      >
        <LabelInfo
          label={intl.formatMessage({ id: 'models.form.pd.enable' })}
          // 🔴 The engine-support sentence used to be a standing `.note` line
          // of its own down in the body. It is a fact about whether this
          // switch can be turned on at all, so it belongs to the switch —
          // and as a permanent row it cost a line of the form to say
          // something most deployments never need to hear.
          description={[
            intl.formatMessage({ id: 'models.form.pd.enable.tips' }),
            !pdCapableBackend && backend
              ? intl.formatMessage({ id: 'models.form.pd.disabled.backend' })
              : null
          ]
            .filter(Boolean)
            .join(' ')}
        ></LabelInfo>
        <Switch
          size="small"
          checked={active}
          // Blocked only bars the way IN. An existing group must always be
          // able to turn itself off.
          disabled={blocked && !enabled}
          onChange={(next) =>
            handleEnableChange(
              next ? PDEnableValueMap.Disaggregated : PDEnableValueMap.Off
            )
          }
        />
      </Flex>
    );
    // Wrap the label too so a disabled switch's capability reason stays reachable.
    const withHint = blockedReason ? (
      <Tooltip title={blockedReason}>{toggle}</Tooltip>
    ) : (
      toggle
    );
    /* Wrapped in a `Form.Item` with no `name`, purely for layout.
     *
     * 🔴 Hand-written margins did not work here. Every neighbour is a
     * `Form.Item` spacing itself with `margin-bottom: 24px`, and that worked
     * between any two of them — but «后端版本» renders 24px taller than the
     * rest and its bottom margin produced *no* space against a plain `div`
     * (measured: gap 0 above this row, while every other gap was exactly 24).
     * Rather than chase which margin was being eaten, this row became the
     * same kind of box as its neighbours, which is the only way it cannot
     * drift from them again.
     *
     * ⚠️ Unconditional, like the row it wraps. A wrapper that appeared and
     * disappeared would remount the switch and refire its mount effect —
     * see `pdToggle` in `basic.tsx` for what that costs. */
    // 12, matching every other gap in this panel: measured, the section cards
    // below (Group settings, Engine and image, Parameters, Resources, Shared
    // KV cache, Speculative Decoding) all sit 12px apart. The 3 was from when
    // this row lived in Basic Info among plain form rows.
    return <Form.Item style={{ marginBottom: 12 }}>{withHint}</Form.Item>;
  }

  return (
    <div className={styles.sectionCard} data-field="pdMode">
      {modalContext}
      {active && (
        <>
          {/* The toggle's own state, registered only while on so the off
              path leaves the store untouched. Self-seeding on (re)mount, and
              removed again by the form's `preserve={false}` on unmount. */}
          <Form.Item
            name="pdMode"
            initialValue={PDEnableValueMap.Disaggregated}
            hidden
            noStyle
          >
            <input />
          </Form.Item>
          {/* The vendor is a *placement* constraint, not a preference: a PD
              group cannot span accelerator vendors, so a mixed cluster has to
              be told which partition to use. Kept out of sight in the common
              single-vendor case, where the server derives it. */}
          <Form.Item name={['disaggregation', 'vendor']} hidden noStyle>
            <input />
          </Form.Item>
          {currentResolution &&
            currentResolution.candidate_vendors.length > 1 && (
              <Form.Item>
                <SealSelect
                  required
                  label={intl.formatMessage({
                    id: 'models.form.pd.vendor'
                  })}
                  description={intl.formatMessage({
                    id: 'models.form.pd.vendor.tips'
                  })}
                  value={form.getFieldValue(['disaggregation', 'vendor'])}
                  options={currentResolution.candidate_vendors.map(
                    (vendor) => ({ label: vendor, value: vendor })
                  )}
                  onChange={(vendor: string) => {
                    const previous = getCurrentResolution(derivedRef.current);
                    if (previous) {
                      // Candidates still describe this engine/cluster, but its
                      // old partition's verdicts and warning no longer apply.
                      updateResolution(
                        {
                          ...previous,
                          options: [],
                          unresolved_reason: undefined,
                          unresolved_code: undefined,
                          unresolved_params: undefined
                        },
                        derivedRef.current.modes
                      );
                    }
                    form.setFieldsValue({
                      disaggregation: {
                        ...(form.getFieldValue('disaggregation') || {}),
                        vendor
                      }
                    });
                    revalidateMode();
                    runResolve({ vendor });
                  }}
                ></SealSelect>
              </Form.Item>
            )}
          {/* The derived answer, shown as a conclusion rather than asked as a
              question. Phase 1 ships recipes for three engine × accelerator
              cells; two have a single candidate and the third has a declared
              preference, so none of them needs the user to choose. The picker
              below stays one click away — and opens by itself when the server
              derives nothing. */}
          {/* 🔴 The read-only line and the «更换传输方案» link are gone.
              They existed to keep a derived answer from looking like a
              question: a Select on a value the platform decided invites
              second-guessing. But it cost two controls where the form has one
              everywhere else, and the affinity field right below it — the same
              kind of choice at a finer grain — was already a Select. Two
              controls for one topic, in two different shapes, read as two
              topics. The Select IS the picker now. */}
          {unresolvedNote && (
            <div className="note note-warning" style={{ marginBottom: 8 }}>
              {unresolvedNote}
            </div>
          )}
          {/* The single entry point for every connection-state parameter:
              connector, ports and peer addresses are all derived from the
              mode, and none of them is a field. Registered even while
              collapsed: the field carries the derived value, so unmounting it
              would drop what `applyResolution` just wrote. */}
          <Form.Item
            name={['disaggregation', 'mode']}
            rules={[
              {
                required: true,
                message: getRuleMessage('select', 'models.form.pd.mode')
              },
              /**
               * The selected recipe, against the engine × accelerator pair the
               * rest of the form now describes.
               *
               * 🔴 `required` cannot catch this and was the only rule here: the
               * value is not empty, it is unrunnable. Switching the cluster to
               * one whose accelerators no built-in recipe covers leaves the
               * previous transport in the field — `applyResolution` returns
               * without writing when the server derives nothing — and the
               * "never hide the selected value" rule keeps it on screen, greyed
               * and explained but perfectly submittable. The server does not
               * catch it either: `gpu_filters.vendor` is enforced by
               * `PDModeRuntimeFilter` at schedule time, so the group is created
               * and then waits forever for a worker that cannot exist. This
               * field is the last gate in front of that.
               *
               * Looked up in `modeOptions` rather than `visibleModeOptions`:
               * the disabled rows are precisely what the latter filters out.
               * The message is the option's own reason, so the error says the
               * same sentence as the dropdown row it came from — and needs no
               * copy of its own.
               *
               * 🔑 A value the catalog does not hold passes. A recipe can be
               * retired from `pd-modes.yaml` while a group still runs it, and
               * an unknown name is also what an empty catalog looks like (the
               * fetch is in flight, or it failed). Refusing either would lock a
               * deployed group out of every other edit on the form.
               */
              {
                validator: async (_rule: any, value: string) => {
                  const option = getModeOptions(
                    derivedRef.current,
                    form.getFieldValue('backend'),
                    form.getFieldValue('cluster_id')
                  ).find((item) => item.value === value);
                  if (value && option?.disabled) {
                    throw new Error(option.reason);
                  }
                }
              }
            ]}
          >
            <PDTransportSelect
              required
              // No placeholder: this field's label floats *inside* the input,
              // so an empty value renders the label and the placeholder on
              // top of each other. Every other SealSelect in this form passes
              // label alone for the same reason.
              label={intl.formatMessage({ id: 'models.form.pd.mode' })}
              description={[
                intl.formatMessage({ id: 'models.form.pd.mode.tips' }),
                membershipNotice
                  ? intl.formatMessage({ id: membershipNotice })
                  : null
              ]
                .filter(Boolean)
                .join(' ')}
              options={visibleModeOptions}
              optionRender={modeOptionRender}
              labelRender={modeLabelRender}
              onModeChange={handleModeChange}
            ></PDTransportSelect>
          </Form.Item>
          <Flex vertical gap={4}>
            {isCustomMode(mode) && (
              <AlertBlockInfo
                type="info"
                icon={
                  <InfoCircleFilled
                    style={{ color: 'var(--ant-color-info-text)' }}
                  />
                }
                // core-ui's current block has no default palette for info.
                style={{
                  backgroundColor: 'var(--ant-color-info-bg)',
                  borderColor: 'var(--ant-color-info-border)'
                }}
                ellipsis={false}
                contentStyle={{ maxHeight: 'none', paddingLeft: 0 }}
                message={intl.formatMessage({
                  id: 'models.form.pd.mode.custom.tips'
                })}
              />
            )}

            {/* §2.5.4: P(same host) = 1/x, and it depends on neither the
                topology nor the gather choice — so at 8P8D even a perfectly
                declared fabric pairs on-host about 12% of the time. Told here
                because the alternative is finding out from a latency graph a
                week later. Non-blocking on purpose: the deployment is fine,
                it is the expectation that needs correcting. */}
            {/* One or the other, never both: the floor is a statement about
                this group's pairing and the span note replaces it with the
                true one. Printing both would leave «at least 25%» on screen
                beside «pairing is 0». */}
            {spanningNote ? (
              <div className="note">{spanningNote}</div>
            ) : (
              largeGroupPairing !== null && (
                <div className="note">
                  {intl.formatMessage(
                    { id: 'models.form.gather.largeGroup' },
                    { percent: largeGroupPairing }
                  )}
                </div>
              )
            )}
            {pdCapableBackend && onlyCustomLeft && (
              <div className="note">
                {intl.formatMessage({ id: 'models.form.pd.mode.only.custom' })}
              </div>
            )}
            {cacheCleared && (
              <div className="note">
                {intl.formatMessage({ id: 'models.form.pd.cache.cleared' })}
              </div>
            )}
            {loraCleared && (
              <Alert
                type="warning"
                showIcon
                message={intl.formatMessage({
                  id: 'models.form.pd.lora.cleared'
                })}
              />
            )}
            {modeCleared && !mode && (
              <div className="note">
                {intl.formatMessage({ id: 'models.form.pd.mode.cleared' })}
              </div>
            )}
            {engineVersionNote && (
              <Alert type="warning" showIcon message={engineVersionNote} />
            )}
          </Flex>
        </>
      )}
    </div>
  );
};

export default PDDisaggregation;
