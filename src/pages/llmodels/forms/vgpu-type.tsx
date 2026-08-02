import NumberSelection from '@/pages/_components/number-selection';
import { queryGPUInstanceTypes } from '@/pages/gpu-service/instance-types/apis';
import { ListItem as InstanceTypeListItem } from '@/pages/gpu-service/instance-types/config/types';
import {
  formatMemoryDisplay,
  getSelectablePartitionProfilesFromResource,
  isLogicalSliceable,
  isPhysicalSliceable
} from '@/pages/gpu-service/instances/config';
import { manufactureColorMap } from '@/pages/gpu-service/templates/config';
import { formatManufacturer } from '@/pages/gpu-service/utils';
import {
  AutoTooltip,
  Select as SealSelect,
  ThemeTag,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Input, InputNumber, Segmented } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { FormData } from '../config/types';

// Percentage presets for the sliced (percentage) mode, mirroring the
// GPU-instance form.
const SLICE_PERCENT_TICKS = [10, 20, 30, 50];

type SliceMode = 'whole' | 'sliced' | 'partitioned';

// Derive the mode from the persisted selector values (edit hydration): a
// partition profile means partitioned, positive percentages mean sliced,
// anything else is a whole card.
const getSliceModeFromValues = (selector: any): SliceMode => {
  if (selector?.accelerator_partitioned_profile) {
    return 'partitioned';
  }
  if (_.toNumber(selector?.accelerator_sliced_memory_percentage) > 0) {
    return 'sliced';
  }
  return 'whole';
};

// Dropdown option for a GPU type: its display name, over the hardware that
// tells two types apart at a glance — vendor, VRAM and architecture. The
// vendor and memory are observed (status.detail), the arch is definitional
// (spec); any of them can be absent on a type the operator has not backfilled.
const GPUTypeOption: React.FC<{ item: InstanceTypeListItem }> = ({ item }) => {
  const detail = item.status?.detail;
  const manufacturer = detail?.manufacturer || '';
  const pieces = [
    formatMemoryDisplay(detail?.memory ?? undefined),
    item.spec?.arch
  ].filter(Boolean);

  return (
    <Flex vertical gap={4} style={{ minWidth: 0, padding: '2px 0' }}>
      <AutoTooltip ghost minWidth={20}>
        {item.spec?.displayName || item.name}
      </AutoTooltip>
      <Flex
        align="center"
        gap={8}
        style={{
          minWidth: 0,
          color: 'var(--ant-color-text-tertiary)',
          fontSize: 12
        }}
      >
        {manufacturer && (
          <ThemeTag
            color={manufactureColorMap[manufacturer] ?? 'purple'}
            style={{ fontWeight: 400, marginInlineEnd: 0 }}
          >
            {formatManufacturer(manufacturer)}
          </ThemeTag>
        )}
        {pieces.map((piece, index) => (
          <React.Fragment key={piece}>
            {(index > 0 || !!manufacturer) && (
              <span style={{ color: 'var(--ant-color-text-quaternary)' }}>
                ·
              </span>
            )}
            <span>{piece}</span>
          </React.Fragment>
        ))}
      </Flex>
    </Flex>
  );
};

/**
 * vGPU scheduling section: pick an InstanceType from the cluster's synced
 * gpu-instance-types (the CRD names the backend validates against), then
 * request a soft slice (ByRatio, memory/cores percentages) or a hardware
 * partition (ByProfile). The mode switch only appears when the selected type
 * offers BOTH modes; a single offered mode renders directly, and a type with
 * no slicing capability requests a whole card with no extra controls.
 */
const VGPUTypeForm: React.FC = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const [typeList, setTypeList] = useState<InstanceTypeListItem[]>([]);
  const [sliceMode, setSliceMode] = useState<SliceMode>(() =>
    getSliceModeFromValues(form.getFieldValue('gpu_type_selector'))
  );

  const clusterId = Form.useWatch('cluster_id', form);
  const typeName = Form.useWatch(['gpu_type_selector', 'type'], form);
  const slicedMemoryPercentage =
    _.toNumber(
      Form.useWatch(
        ['gpu_type_selector', 'accelerator_sliced_memory_percentage'],
        form
      )
    ) || 1;

  useEffect(() => {
    if (clusterId == null) {
      setTypeList([]);
      return;
    }
    let cancelled = false;
    queryGPUInstanceTypes({ cluster_id: clusterId })
      .then((res) => {
        if (cancelled) return;
        // Only accelerator (GPU) types can back a vGPU deployment.
        setTypeList(
          (res?.items || []).filter((item) => item.spec?.acceleratable)
        );
      })
      .catch(() => {
        // leave the list empty; the select shows its not-found content
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  const selectedInstanceType = useMemo(
    () => typeList.find((item) => item.name === typeName),
    [typeList, typeName]
  );

  const slicedDetail = selectedInstanceType?.status?.detail?.slicedDetail;

  // Max selectable ratio in sliced mode: status.acceleratorSliced
  // .onceMaxRequest (a percentage). The sliced mode stays visible but
  // unselectable when there is no sliced capacity.
  const slicedMaxPercentage =
    _.toNumber(
      selectedInstanceType?.status?.acceleratorSliced?.onceMaxRequest
    ) || 0;

  // Whether the compute (cores) ratio may exceed the memory ratio. Without
  // overcommit the cores ratio is locked to the memory ratio and the cores
  // selector is hidden (a hidden field mirrors the memory value).
  const coresOvercommit = !!slicedDetail?.logical?.coresPercentageOvercommit;

  // Profiles this cluster can still BUILD, from its own per-profile ledger.
  //
  // The shape matters: this form queries /gpu-instance-types?cluster_id, so the
  // ledger arrives nested on status.acceleratorPartitioned.remainingProfiles —
  // not as the list-typed acceleratorPartitioned dimension the GPU Instance form
  // gets from the aggregated endpoint. Both envelopes use that same key name, so
  // reading the wrong one yields undefined and silently falls back below.
  //
  // slicedDetail is the static capability catalog: it keeps offering profiles the
  // pool can no longer build, because by design it does not move as partitions
  // are carved and released. It stays the fallback for a server older than the
  // ledger, where an empty list would read as "nothing available" instead of
  // "unknown".
  const partitionOptions = useMemo(
    () =>
      getSelectablePartitionProfilesFromResource(
        selectedInstanceType?.status?.acceleratorPartitioned,
        slicedDetail
      ).map((name) => ({ label: name, value: name })),
    [selectedInstanceType, slicedDetail]
  );

  const supportsSliced = isLogicalSliceable(slicedDetail);
  const supportsPartitioned =
    isPhysicalSliceable(slicedDetail) && partitionOptions.length > 0;
  // Capability present, capacity gone: the type can be sliced, but its pool
  // has no room to slice right now (onceMaxRequest is 0). Distinct from "not
  // sliceable at all" — a partition request may still go through, so this only
  // takes the ByRatio side out of service, never the switch.
  const slicedCapacityExhausted = supportsSliced && slicedMaxPercentage <= 0;
  // The same shape on the partition side: the type can be hardware-partitioned
  // but the pool has no profile left to hand out.
  //
  // These two guards look interchangeable and are NOT — do not fold them into
  // one branch. Both states would serialize as 0/0, i.e. a whole-card request,
  // but the consequence differs:
  //   - sliced: a software-slicing node (logical.count > 0) satisfies a
  //     whole-card request, so the downgrade SUCCEEDS — the user asked for a
  //     percentage and silently gets an entire card, losing the isolation this
  //     feature exists for. That is the severe one.
  //   - partitioned: a MIG-mode node reports logical: {} and does not satisfy
  //     it, so the backend's Devices-based fit refuses the request. No wrong
  //     resource is ever handed out; what is wrong is that the user only finds
  //     out at scheduling time, via a message about no node having software
  //     slicing enabled — the opposite of what they asked for. This guard
  //     exists to surface the real reason early, not to prevent a bad
  //     allocation.
  const partitionProfilesExhausted =
    isPhysicalSliceable(slicedDetail) && partitionOptions.length === 0;
  // Per the vGPU contract: two modes exist (ByRatio / ByProfile). Show the
  // switch only when the type offers both; a single offered mode renders
  // directly, and neither means a whole card with no controls.
  const showModeSwitch = supportsSliced && supportsPartitioned;

  const typeOptions = useMemo(
    () =>
      typeList.map((item) => ({
        label: item.spec?.displayName || item.name,
        value: item.name,
        instanceType: item
      })),
    [typeList]
  );

  // Single commit path for mode switches (form-patterns): write every
  // mode-specific field together so no stale value from the previous mode
  // rides the submit.
  const commitSliceMode = (mode: SliceMode) => {
    setSliceMode(mode);
    const current = form.getFieldValue('gpu_type_selector') || {};
    if (mode === 'sliced') {
      // With no sliceable capacity left, seed no percentage at all: a value
      // here could not validate against a max of 0, and a 0 would silently
      // turn the request into a whole card.
      const memory =
        slicedMaxPercentage > 0 ? Math.min(50, slicedMaxPercentage) : null;
      form.setFieldValue('gpu_type_selector', {
        ...current,
        accelerator_sliced_memory_percentage: memory,
        accelerator_sliced_cores_percentage:
          memory && coresOvercommit ? 100 : memory,
        accelerator_partitioned_profile: null
      });
    } else if (mode === 'partitioned') {
      form.setFieldValue('gpu_type_selector', {
        ...current,
        accelerator_sliced_memory_percentage: 0,
        accelerator_sliced_cores_percentage: 0
        // keep any previously picked profile; the required rule prompts
        // otherwise (no silent fallback to the first profile)
      });
    } else {
      form.setFieldValue('gpu_type_selector', {
        ...current,
        accelerator_sliced_memory_percentage: 0,
        accelerator_sliced_cores_percentage: 0,
        accelerator_partitioned_profile: null
      });
    }
  };

  // Force the mode when the selected type offers exactly one, and clear back
  // to a whole-card request when it offers none. Both-offered keeps the
  // user's current pick (default sliced via handleTypeChange).
  useEffect(() => {
    if (!selectedInstanceType) return;
    if (supportsSliced && !supportsPartitioned && sliceMode !== 'sliced') {
      commitSliceMode('sliced');
    } else if (
      supportsPartitioned &&
      !supportsSliced &&
      sliceMode !== 'partitioned'
    ) {
      commitSliceMode('partitioned');
    } else if (
      !supportsSliced &&
      !supportsPartitioned &&
      sliceMode !== 'whole'
    ) {
      commitSliceMode('whole');
    }
  }, [selectedInstanceType, supportsSliced, supportsPartitioned]);

  // Named rather than inlined into the prop, matching clusterOptionRender in
  // basic.tsx: an inline arrow in a render prop reads to eslint as a component
  // defined during render.
  const typeOptionRender = (option: any) => (
    <GPUTypeOption item={option.data.instanceType} />
  );

  // Picking a type resets the request to the type's primary mode (sliced when
  // offered, else partitioned, else whole): slice capabilities are per-type,
  // so a mode/ratio/profile from another type may not apply.
  const handleTypeChange = (name: string) => {
    const next = typeList.find((item) => item.name === name);
    const nextDetail = next?.status?.detail?.slicedDetail;
    const nextMode: SliceMode = isLogicalSliceable(nextDetail)
      ? 'sliced'
      : isPhysicalSliceable(nextDetail)
        ? 'partitioned'
        : 'whole';
    setSliceMode(nextMode);
    const nextSlicedMax =
      _.toNumber(next?.status?.acceleratorSliced?.onceMaxRequest) || 0;
    // A sliced mode with no capacity left seeds no percentage (see
    // commitSliceMode); the other modes request a whole card / a profile at 0.
    const memory =
      nextMode !== 'sliced'
        ? 0
        : nextSlicedMax > 0
          ? Math.min(50, nextSlicedMax)
          : null;
    form.setFieldValue('gpu_type_selector', {
      type: name,
      accelerator_sliced_memory_percentage: memory,
      accelerator_sliced_cores_percentage:
        memory && nextDetail?.logical?.coresPercentageOvercommit ? 100 : memory,
      accelerator_partitioned_profile: null
    });
  };

  // Memory (VRAM) ratio changed — without cores overcommit the cores ratio is
  // locked to it, so mirror the value into the hidden cores field.
  const handleMemoryPercentageChange = (value: number) => {
    if (!coresOvercommit) {
      form.setFieldValue(
        ['gpu_type_selector', 'accelerator_sliced_cores_percentage'],
        value
      );
    }
  };

  // When the max ratio is below 10%, switch the ticks to a finer 1..10 scale
  // so small slices are still selectable; otherwise use the 10..100 scale.
  const sliceTicks: number[] =
    slicedMaxPercentage < 10
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      : SLICE_PERCENT_TICKS;

  const isSliced = sliceMode === 'sliced' && supportsSliced;
  const isPartitioned = sliceMode === 'partitioned' && supportsPartitioned;

  return (
    <div data-field="gpuTypeSelector">
      <Form.Item<FormData>
        name={['gpu_type_selector', 'type']}
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'models.form.gpuType')
          }
        ]}
      >
        <SealSelect
          showSearch
          label={intl.formatMessage({ id: 'models.form.gpuType' })}
          options={typeOptions}
          optionRender={typeOptionRender}
          onChange={handleTypeChange}
          notFoundContent={intl.formatMessage({
            id: 'gpuservice.instance.type.noAvailable'
          })}
        ></SealSelect>
      </Form.Item>
      {showModeSwitch && (
        <div style={{ marginBlock: 8 }}>
          <Segmented
            size="middle"
            type="rounded"
            style={{ fontSize: 12 }}
            value={sliceMode}
            onChange={(value) => commitSliceMode(value as SliceMode)}
            options={[
              {
                label: intl.formatMessage({
                  id: 'gpuservice.instance.mode.sliced'
                }),
                value: 'sliced',
                disabled: slicedMaxPercentage <= 0
              },
              {
                label: intl.formatMessage({
                  id: 'gpuservice.instance.mode.partitioned'
                }),
                value: 'partitioned',
                disabled: partitionOptions.length === 0
              }
            ]}
          />
        </div>
      )}
      {isSliced && slicedCapacityExhausted && (
        <>
          <div
            style={{
              marginBlock: 8,
              color: 'var(--ant-color-text-tertiary)'
            }}
          >
            {intl.formatMessage({ id: 'models.form.gpuType.noSlicedCapacity' })}
          </div>
          {/* Nothing here can be submitted: with no capacity there is no valid
            percentage, and a 0 would degrade the request to a whole card.
            Seeding null above is NOT enough on its own — generateGPUTypeSelector
            normalizes it straight back with `_.toNumber(...) || 0`, so the
            payload would be 0/0 either way. This rule is what actually stops
            the submit: load-bearing, not belt-and-braces, so don't drop it as
            redundant. Keeping it mounted also makes the failure name the reason
            above instead of "cannot exceed 0%"; it unmounts — and the error
            clears — as soon as the user switches to ByProfile, which stays
            submittable. */}
          <Form.Item<FormData>
            name={['gpu_type_selector', 'accelerator_sliced_memory_percentage']}
            rules={[
              {
                validator: () =>
                  Promise.reject(
                    new Error(
                      intl.formatMessage({
                        id: 'models.form.gpuType.noSlicedCapacity'
                      })
                    )
                  )
              }
            ]}
            hidden
          >
            <InputNumber />
          </Form.Item>
        </>
      )}
      {isSliced && !slicedCapacityExhausted && (
        <>
          <Form.Item<FormData>
            name={['gpu_type_selector', 'accelerator_sliced_memory_percentage']}
            getValueProps={(value) => ({
              value: value != null ? _.toNumber(value) : undefined
            })}
            rules={[
              {
                required: true,
                validator: (_, value) => {
                  const num = Number(value);
                  if (value == null || value === '' || Number.isNaN(num)) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'gpuservice.instance.slice.percentage.required'
                        })
                      )
                    );
                  }
                  if (num > slicedMaxPercentage || num <= 0) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage(
                          { id: 'gpuservice.instance.slice.percentage.max' },
                          { count: slicedMaxPercentage }
                        )
                      )
                    );
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <NumberSelection
              min={1}
              max={slicedMaxPercentage}
              step={1}
              maxCount={sliceTicks.length}
              presetValues={sliceTicks}
              alwaysShowInput
              required
              onChange={handleMemoryPercentageChange}
              label={intl.formatMessage({
                // Without cores overcommit this single ratio drives both VRAM
                // and compute, so drop the "VRAM" qualifier.
                id: coresOvercommit
                  ? 'gpuservice.instance.slice.memoryPercentage'
                  : 'gpuservice.instance.slice.percentage'
              })}
            />
          </Form.Item>
          {/* Compute (cores) ratio — only types with cores overcommit get the
            selector; otherwise it is locked to the memory ratio and carried by
            a hidden field so it still rides the submit. */}
          {coresOvercommit ? (
            <Form.Item<FormData>
              name={[
                'gpu_type_selector',
                'accelerator_sliced_cores_percentage'
              ]}
              getValueProps={(value) => ({
                value: value != null ? _.toNumber(value) : undefined
              })}
              rules={[
                {
                  required: true,
                  validator: (_, value) => {
                    const num = Number(value);
                    if (value == null || value === '' || Number.isNaN(num)) {
                      return Promise.reject(
                        new Error(
                          intl.formatMessage({
                            id: 'gpuservice.instance.slice.percentage.required'
                          })
                        )
                      );
                    }
                    if (num < slicedMemoryPercentage || num > 100) {
                      return Promise.reject(
                        new Error(
                          intl.formatMessage(
                            { id: 'gpuservice.instance.slice.cores.min' },
                            { count: slicedMemoryPercentage }
                          )
                        )
                      );
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <NumberSelection
                min={slicedMemoryPercentage}
                max={100}
                step={10}
                maxCount={SLICE_PERCENT_TICKS.length}
                presetValues={SLICE_PERCENT_TICKS}
                alwaysShowInput
                required
                label={intl.formatMessage({
                  id: 'gpuservice.instance.slice.coresPercentage'
                })}
              />
            </Form.Item>
          ) : (
            <Form.Item<FormData>
              name={[
                'gpu_type_selector',
                'accelerator_sliced_cores_percentage'
              ]}
              hidden
            >
              <InputNumber />
            </Form.Item>
          )}
        </>
      )}
      {isPartitioned && (
        <Form.Item<FormData>
          name={['gpu_type_selector', 'accelerator_partitioned_profile']}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'gpuservice.instance.partition.profile.required'
              })
            }
          ]}
        >
          <SealSelect
            required
            options={partitionOptions}
            label={intl.formatMessage({
              id: 'gpuservice.instance.partition.profile'
            })}
          ></SealSelect>
        </Form.Item>
      )}
      {/* Takes the profile picker's place when the pool has no profile left and
        there is no ratio side to fall back to. Not gated on sliceMode: with no
        profiles `supportsPartitioned` is false, so ByProfile is neither
        selectable (the switch collapses) nor sticky (the mode effect lands on
        `whole`) — gating on the mode would render nothing at all. When ratio
        slicing IS offered the user is already on a working ByRatio, so this
        stays quiet rather than warning about a mode they cannot reach. */}
      {partitionProfilesExhausted && !supportsSliced && (
        <>
          <div
            style={{
              marginBlock: 8,
              color: 'var(--ant-color-text-tertiary)'
            }}
          >
            {intl.formatMessage({
              id: 'models.form.gpuType.noPartitionProfile'
            })}
          </div>
          {/* Same mounted rule as the ByRatio side, load-bearing for the same
            reason: a null profile plus generateGPUTypeSelector's
            `_.toNumber(...) || 0` percentages serialize as 0/0 — a whole card
            the scheduler rejects much later, citing software slicing rather
            than the missing profile. */}
          <Form.Item<FormData>
            name={['gpu_type_selector', 'accelerator_partitioned_profile']}
            rules={[
              {
                validator: () =>
                  Promise.reject(
                    new Error(
                      intl.formatMessage({
                        id: 'models.form.gpuType.noPartitionProfile'
                      })
                    )
                  )
              }
            ]}
            hidden
          >
            <Input />
          </Form.Item>
        </>
      )}
    </div>
  );
};

export default VGPUTypeForm;
