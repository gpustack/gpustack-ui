import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { queryPDModes } from '../apis';
import { PD_MODE_CUSTOM } from '../config';
import { PDMode, PDModeEligibility } from '../config/types';

export interface PDModeOption {
  label: string;
  value: string;
  disabled?: boolean;
  // Why the option is unselectable. Shown rather than hidden: an option the
  // user cannot pick still tells them the capability exists and what it would
  // take to reach it.
  reason?: string;
  data: PDMode;
}

/**
 * The PD-mode catalog, fetched when the deploy drawer opens.
 *
 * Read from the server, never mirrored here: the catalog exists so that adding
 * an engine is a YAML change, and a hardcoded list in the frontend would spend
 * exactly that benefit.
 *
 * Action-driven, per the repo's request conventions — the caller invokes
 * `getPDModes()` from the drawer's open handler, not from an effect.
 */
/**
 * The transport alone, for both the picker's rows and the derived one-liner.
 *
 * The engine is already chosen and named in a field above, and the picker
 * hides recipes that do not fit it — so a list can never hold both
 * "vLLM + NIXL" and "SGLang + NIXL", which is the only reason the engine was
 * ever in this label.
 *
 * 🔑 **Falls back by splitting `display_name`, not by using it whole.** The
 * `transport` field is newer than some running servers, and an older one
 * simply omits it; taking `display_name` verbatim there would quietly put the
 * engine back ("vLLM + NIXL") and look like the change never landed. Every
 * shipped `display_name` is "<engine> + <transport>", and `Custom` has no
 * separator, so the split is correct for both.
 */
export const transportLabel = (mode?: PDMode) =>
  mode?.transport || mode?.display_name?.split(' + ').pop() || mode?.name || '';

/**
 * The catalog, fetched at most once per page load.
 *
 * 🔴 It used to be fetched per hook instance, and turning PD on issued four
 * identical requests: `PDDisaggregation` mounts twice (the `toggle` and the
 * `body` share no state by design — see its `variant` prop), and each of them
 * asks from three places — the enable handler, the `[active, backend,
 * clusterId]` effect once `active` flips, and its own mount effect. The
 * in-instance guard (`pdModes.length ? pdModes : ...`) cannot see across
 * instances, and none of the three had resolved before the others fired.
 *
 * Safe to hold for the whole page: the catalog is a YAML asset shipped in the
 * server image, so it cannot change without a restart — and a restart is a
 * reload. `inflight` is the half that actually fixes the count; the four calls
 * are concurrent, so a value-only cache would still have let all four through.
 *
 * A failure is not cached. `catalog` stays null, so the next caller retries
 * rather than inheriting an empty list for the rest of the session — which
 * would render the mode picker permanently empty after one flaky request.
 */
let catalog: PDMode[] | null = null;
let inflight: Promise<PDMode[]> | null = null;

const fetchCatalog = async (): Promise<PDMode[]> => {
  if (catalog) {
    return catalog;
  }
  if (inflight) {
    return inflight;
  }
  inflight = queryPDModes()
    .then((res) => {
      catalog = res?.items || [];
      return catalog;
    })
    .catch(() => [])
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export default function useQueryPDModes() {
  const intl = useIntl();
  // Seeded from the cache so a second instance mounting after the first has
  // resolved renders with the catalog already in hand, rather than blank until
  // its own call returns.
  const [pdModes, setPDModes] = useState<PDMode[]>(catalog || []);

  const getPDModes = async () => {
    const list = await fetchCatalog();
    setPDModes(list);
    return list;
  };

  /**
   * The server's verdict, in this catalog's language.
   *
   * The code is looked up and the prose is the fallback — for a server older
   * than the code, and for a code newer than this client. `formatMessage` on
   * an id the catalog does not hold logs and echoes the id, which reads worse
   * than an English sentence that at least says what happened.
   *
   * The ids are the ones the local evaluation below already renders, and the
   * server names its params after their placeholders (the contract
   * `unresolved_params` established). One wording per refusal, whichever path
   * produced it — two would drift the first time either is reworded.
   */
  const INELIGIBLE_MESSAGE: Record<string, string> = {
    backend_mismatch: 'models.form.pd.mode.backend.mismatch',
    vendor_mismatch: 'models.form.pd.mode.runtime.mismatch'
  };

  const ineligibleText = (verdict: PDModeEligibility): string | undefined => {
    if (verdict.eligible) {
      return undefined;
    }
    const id = verdict.ineligible_code
      ? INELIGIBLE_MESSAGE[verdict.ineligible_code]
      : undefined;
    if (!id || !intl.messages[id]) {
      return verdict.ineligible_reason || undefined;
    }
    const params: Record<string, string> = {
      ...(verdict.ineligible_params || {})
    };
    // The engine is optional on the request, and the server sends '' rather
    // than wording "this engine" itself — that half-sentence is the client's.
    // Left empty it would render as a hole mid-sentence.
    if (params.backend === '') {
      params.backend = intl.formatMessage({
        id: 'models.form.pd.unresolved.thisEngine'
      });
    }
    return intl.formatMessage({ id }, params);
  };

  /**
   * The options for one engine on one cluster's accelerators.
   *
   * A mode the combination cannot run is disabled with a reason rather than
   * dropped: an option the user cannot pick still tells them the capability
   * exists and what it would take to reach it. Two independent constraints:
   *
   * - `backends` — injecting one engine's connector config into another fails
   *   silently at run time, so the server refuses the combination.
   * - `gpu_filters.vendor` — every built-in recipe is accelerator-specific:
   *   `vllm-ascend-mooncake` injects an Ascend-only connector plus HCCL
   *   variables, and the NVIDIA recipes inject connectors no other runtime
   *   can read. `PDModeRuntimeFilter` drops the mismatched workers
   *   server-side; disabling it here is what makes the refusal visible
   *   before submit.
   *
   * `vendors` is the manufacturer slug set the cluster's workers report, from
   * `status.gpu_devices[].vendor`. Undefined or empty means unknown (options
   * still loading, no cluster picked, or no worker has reported devices yet)
   * and must not disable anything — absence of evidence is not a mismatch.
   *
   * `custom` declares neither constraint and is therefore always available: it
   * injects nothing, which is also what makes it the only mode under which a
   * group may mix engines.
   *
   * 🔴 **The verdict is the server's; this only renders it.** Both sides used
   * to evaluate the two constraints — the resolver filled `ineligible_reason`
   * that nobody read, and this recomputed the same thing from `backends` and
   * `gpu_filters.vendor`. Two answers to one question drift the first time a
   * third constraint is added on one side only. `verdicts` now carries the
   * server's per-entry answer, keyed by mode name.
   *
   * The local evaluation stays as the fallback for the moment before the
   * resolution has arrived (the dropdown renders on the first paint, the
   * resolve call is a round trip later) and for a server that sends no
   * verdicts at all. It is never used to *contradict* one.
   */
  const buildOptions = (
    backend?: string,
    vendors?: string[],
    verdicts?: Record<string, PDModeEligibility>
  ): PDModeOption[] =>
    pdModes.map((mode) => {
      const targets = mode.backends || [];
      const backendOk =
        !targets.length || !backend || targets.includes(backend);
      // Absent on `custom` alone, and that is the mechanism that keeps the
      // DIY path open on an accelerator we ship no recipe for.
      const wanted = (mode.gpu_filters?.vendor || []).map((v) =>
        v.toLowerCase()
      );
      const vendorOk =
        !wanted.length ||
        !vendors?.length ||
        wanted.some((v) => vendors.includes(v));

      const verdict = verdicts?.[mode.name];
      const disabled = verdict ? !verdict.eligible : !backendOk || !vendorOk;
      let reason: string | undefined;

      if (verdict) {
        reason = ineligibleText(verdict);
      } else if (!backendOk) {
        reason = intl.formatMessage(
          { id: 'models.form.pd.mode.backend.mismatch' },
          { backend, targets: targets.join(' / ') }
        );
      } else if (!vendorOk) {
        reason = intl.formatMessage(
          { id: 'models.form.pd.mode.runtime.mismatch' },
          {
            runtime: wanted.join(' / '),
            vendors: vendors!.join(' / '),
            // This path only ever knows the cluster's accelerators; the
            // partition wording exists for the server's verdict, which knows
            // whether one was chosen.
            scope: 'cluster'
          }
        );
      }

      return {
        label: transportLabel(mode),
        value: mode.name,
        disabled,
        reason,
        data: mode
      };
    });

  const findMode = (name?: string | null) =>
    name ? pdModes.find((mode) => mode.name === name) : undefined;

  const isCustomMode = (name?: string | null) => name === PD_MODE_CUSTOM;

  return {
    pdModes,
    getPDModes,
    buildOptions,
    findMode,
    isCustomMode
  };
}
