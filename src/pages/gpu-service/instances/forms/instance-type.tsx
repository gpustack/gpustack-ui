import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import NumberSelection from '@/pages/_components/number-selection';
import { Input as CInput, InputNumber, Select } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Segmented } from 'antd';
import _ from 'lodash';
import { useContext, useMemo } from 'react';
import styled from 'styled-components';
import { BasicResourceMax } from '../../templates/forms/basic';
import { parseJsonSafe } from '../../utils';
import InstanceTypeItem, {
  InstanceMetadataSection
} from '../components/instance-type-item';
import {
  getSelectablePartitionProfilesFromOverview,
  getSelectablePartitionProfilesFromResource,
  isLogicalSliceable,
  isPhysicalSliceable
} from '../config';
import { FormContext } from '../config/form-context';
import {
  FormData,
  InstanceTypeItem as InstanceTypeItemModel,
  ListItem
} from '../config/types';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

const SelectedCard = styled.div`
  padding: 14px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius-lg);
  background: var(--ant-color-bg-container);
`;

interface InstanceTypePickerProps {
  selectedInstanceType?: InstanceTypeItemModel;
  noAvailable?: boolean;
}

const InstanceTypePicker: React.FC<InstanceTypePickerProps> = ({
  selectedInstanceType,
  noAvailable
}) => {
  const intl = useIntl();
  return (
    <SelectedCard>
      {selectedInstanceType ? (
        <InstanceTypeItem item={selectedInstanceType} />
      ) : (
        <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
          {intl.formatMessage({
            id: noAvailable
              ? 'gpuservice.instance.type.noAvailable'
              : 'gpuservice.instance.type.required'
          })}
        </span>
      )}
    </SelectedCard>
  );
};

// Fixed 10-tick percentage scale (10..100) for the sliced (percentage) mode.
const SLICE_PERCENT_TICKS = [10, 20, 30, 50];

// The paired VRAM + Compute selectors (cores overcommit) are grouped in a
// bordered card; a lone "Percentage" selector (no overcommit) renders bare so
// it matches the whole-card GPU Count block's styling.
const SliceFieldWrapper: React.FC<{
  withCard: boolean;
  children: React.ReactNode;
}> = ({ withCard, children }) =>
  withCard ? (
    <FieldBlock>
      <SelectedCard style={{ padding: 0 }}>{children}</SelectedCard>
    </FieldBlock>
  ) : (
    <>{children}</>
  );

type SliceMode = 'whole' | 'sliced' | 'partitioned';

interface InstanceTypeFormItemProps {
  action: PageActionType;
  disabled?: boolean;
  currentData?: ListItem;
  selectedInstanceType?: InstanceTypeItemModel;
  onceMaxRequest?: BasicResourceMax;
  // True when the (org-scoped) instance-type list is empty — e.g. the chosen
  // org owns no clusters. Surface a "no available" message instead of the
  // "please select" placeholder + empty CPU / memory inputs.
  noAvailableTypes?: boolean;
  // Whole-card (exclusive) vs sliced (soft, percentage) vs partitioned
  // (hardware profile) mode. Owned by the parent form (it drives candidate
  // picking + the fixed accelerator=1 for both divided modes).
  sliceMode?: SliceMode;
  onSliceModeChange?: (mode: SliceMode) => void;
  // Commit a new sliced memory ratio (writes the field + rescales CPU / RAM).
  onSliceMemoryPercentageChange?: (value: number) => void;
  // Commit a new sliced compute (cores) ratio (writes the field only).
  onSliceCoresPercentageChange?: (value: number) => void;
  // Commit a new hardware partition profile (writes the field, re-picks the
  // candidate offering it + rescales CPU / RAM).
  onPartitionProfileChange?: (value: string) => void;
  onGPUCountChange?: (value: number) => void;
}

const InstanceTypeFormItem: React.FC<InstanceTypeFormItemProps> = ({
  action,
  disabled,
  currentData,
  selectedInstanceType,
  onceMaxRequest,
  noAvailableTypes,
  sliceMode = 'whole',
  onSliceModeChange,
  onSliceMemoryPercentageChange,
  onSliceCoresPercentageChange,
  onPartitionProfileChange,
  onGPUCountChange
}) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { isGPUType } = useContext(FormContext);

  // In edit mode the type card is read-only until a type is re-picked from the
  // instance-type column (stopped instances only); once selected the section
  // behaves like create (editable count / slice controls, live capacity
  // labels).
  const readonlyType = action === PageAction.EDIT && !selectedInstanceType;

  const maxComputeUnitCount = useMemo(() => {
    if (readonlyType) {
      const description = parseJsonSafe(
        currentData?.description || '{}',
        {} as any
      );
      return description.spec?.maxComputeUnitCount || 0;
    }
    return selectedInstanceType?.spec?.maxComputeUnitCount || 0;
  }, [readonlyType, currentData, selectedInstanceType]);

  const handleOnGPUCountChange = (value: number) => {
    onGPUCountChange?.(value);
  };

  const slicedDetail = selectedInstanceType?.status?.detail?.slicedDetail;

  // A type may support soft slicing (logical.count > 0), hardware
  // partitioning (physical.count > 0), both, or neither — each capability
  // contributes its own Segmented option, so unsupported modes never show.
  const supportsSliced = isLogicalSliceable(slicedDetail);
  const supportsPartitioned = isPhysicalSliceable(slicedDetail);

  // The divided modes are only offered for accelerator types, and only when
  // the section is editable (create, or edit after re-picking a type; a
  // not-yet-re-typed edit renders a readonly card).
  const showModeSwitch =
    !readonlyType && isGPUType && (supportsSliced || supportsPartitioned);

  const handleModeChange = (value: string) => {
    onSliceModeChange?.(value as SliceMode);
  };

  const handlePartitionProfileChange = (value: string) => {
    onPartitionProfileChange?.(value);
  };

  // Memory (VRAM) percentage changed via the slider/input — forward the new
  // value so the parent writes the field and rescales CPU / RAM.
  const handleMemoryPercentageChange = (value: number) => {
    onSliceMemoryPercentageChange?.(value);
  };

  // Compute (cores) percentage changed — forward the new value.
  const handleCoresPercentageChange = (value: number) => {
    onSliceCoresPercentageChange?.(value);
  };

  // The cores ratio must be >= the memory ratio, so ticks below the current
  // memory percentage are disabled (min). Cores range is a fixed 10..100.
  const slicedMemoryPercentage =
    _.toNumber(
      Form.useWatch(
        ['spec', 'resources', 'acceleratorSlicedMemoryPercentage'],
        form
      )
    ) || 1;

  // Max selectable ratio in sliced mode: status.onceMaxRequest.acceleratorSliced
  // (a percentage). Ticks above it stay visible but disabled.
  const slicedMaxPercentage =
    _.toNumber(
      selectedInstanceType?.status?.onceMaxRequest?.acceleratorSliced
    ) || 0;

  // Whether the compute (cores) ratio may exceed the memory ratio. When the
  // type doesn't support overcommit, cores are locked to the memory ratio —
  // no cores selector, and the memory selector reads as a plain "Percentage".
  const coresOvercommit = !!slicedDetail?.logical?.coresPercentageOvercommit;

  // Hard-slice profiles the fleet can still BUILD, from the live ledger the
  // aggregated status.remaining carries — not from status.detail.slicedDetail,
  // which is the static capability catalog and by design does not move as
  // partitions are carved, so it keeps offering profiles that can no longer be
  // built. Falls back to the catalog only when no ledger was sent (an older
  // server): there, an empty list would read as "nothing available" rather than
  // "unknown". Still pool-level counts summed across nodes — a hint about what
  // is on offer, not a placement guarantee.
  const partitionProfileNames = getSelectablePartitionProfilesFromOverview(
    selectedInstanceType?.status?.remaining,
    slicedDetail
  );

  // Whether some candidate of the selected type can still build this profile —
  // the fleet-wide list is a Σ across candidates, so it can outlive the last
  // candidate able to serve it.
  const profileHasCandidate = (name: string) =>
    (selectedInstanceType?.status?.tiers ?? []).some((tier) =>
      (tier.candidates ?? []).some((candidate) =>
        getSelectablePartitionProfilesFromResource(
          candidate.acceleratorPartitioned,
          candidate.acceleratorSlicedDetail
        ).includes(name)
      )
    );

  const partitionOptions = partitionProfileNames.map((name) => ({
    label: name,
    value: name
  }));

  const modeSegmented = showModeSwitch ? (
    <Segmented
      size="middle"
      type="rounded"
      style={{ fontSize: 12 }}
      value={sliceMode}
      disabled={disabled}
      onChange={handleModeChange}
      options={[
        {
          label: intl.formatMessage({ id: 'gpuservice.instance.mode.whole' }),
          value: 'whole',
          // No free whole card left → same treatment as the two divided modes.
          // Without this the mode stays selectable and lands the user on
          // "GPU Count (Max 0)" with every count disabled, while the count
          // control still renders 1 as checked — a selected value that cannot
          // be requested. maxComputeUnitCount is the live figure the adapter
          // derives from the tiers, not a static ceiling, so it reaches 0
          // exactly when the fleet has no whole card to give.
          disabled: maxComputeUnitCount <= 0
        },
        ...(supportsSliced
          ? [
              {
                label: intl.formatMessage({
                  id: 'gpuservice.instance.mode.sliced'
                }),
                value: 'sliced',
                // No sliced capacity → keep the option visible but
                // unselectable.
                disabled: slicedMaxPercentage <= 0
              }
            ]
          : []),
        ...(supportsPartitioned
          ? [
              {
                label: intl.formatMessage({
                  id: 'gpuservice.instance.mode.partitioned'
                }),
                value: 'partitioned',
                // Every profile exhausted → nothing to request.
                disabled: partitionOptions.length === 0
              }
            ]
          : [])
      ]}
    />
  ) : null;

  const isSliced = showModeSwitch && sliceMode === 'sliced';
  const isPartitioned = showModeSwitch && sliceMode === 'partitioned';

  // When the max ratio is below 10%, switch the ticks to a finer 1..10 scale
  // so small slices are still selectable; otherwise use the 10..100 scale.
  const sliceTicks: number[] =
    slicedMaxPercentage < 10
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      : SLICE_PERCENT_TICKS;

  const renderMaxLabel = (
    label: React.ReactNode,
    max?: number | null
  ): React.ReactNode => {
    if (max == null) return label;
    return (
      <Flex gap={4} align="center">
        {label}
        {!isGPUType && (
          <span>
            ({intl.formatMessage({ id: 'common.max' }, { count: max })})
          </span>
        )}
      </Flex>
    );
  };

  const renderMemoryLabel = (): React.ReactNode => {
    if (isGPUType || readonlyType || !onceMaxRequest?.memory) {
      return intl.formatMessage({ id: 'gpuservice.template.memory' });
    }

    return intl.formatMessage(
      { id: 'gpuservice.instance.memory.remaining' },
      { count: onceMaxRequest?.memory }
    );
  };

  const renderInstanceType = () => {
    const description =
      parseJsonSafe<any>(currentData?.description || '{}', {}).spec || {};
    return (
      <SelectedCard
        style={{
          background: 'var(--ant-color-bg-container-disabled)',
          color: 'var(--ant-color-text-disabled)'
        }}
      >
        <Flex
          align="flex-start"
          orientation="vertical"
          justify="space-between"
          gap={16}
        >
          <span
            style={{
              fontWeight: 400
            }}
          >
            {description.acceleratable
              ? `${description.displayName || description.product} x ${currentData?.spec?.resources?.accelerator}`
              : description.displayName || 'CPU'}
          </span>
          <InstanceMetadataSection spec={description}></InstanceMetadataSection>
        </Flex>
      </SelectedCard>
    );
  };

  const numberSelectionLabel = isGPUType
    ? {
        label: 'GPU',
        maxLabel: 'gpuservice.instance.gpuCount.max',
        minLabel: 'gpuservice.instance.gpuCount.min'
      }
    : {
        label: 'CPU',
        maxLabel: 'gpuservice.instance.cpuCount.max',
        minLabel: 'gpuservice.instance.cpuCount.min'
      };
  return (
    <div data-field="instanceType">
      <FieldBlock>
        <Form.Item
          name={['spec', 'type']}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'gpuservice.instance.type.required'
              })
            }
          ]}
        >
          {readonlyType ? (
            renderInstanceType()
          ) : (
            <InstanceTypePicker
              selectedInstanceType={selectedInstanceType}
              noAvailable={noAvailableTypes}
            />
          )}
        </Form.Item>
      </FieldBlock>
      {showModeSwitch && (
        <div>
          <div style={{ marginBlock: 8 }}>{modeSegmented}</div>
        </div>
      )}
      {!noAvailableTypes && (
        <Form.Item<FormData>
          key={isGPUType ? 'accelerator' : 'cpu'}
          name={
            isGPUType
              ? ['spec', 'resources', 'accelerator']
              : ['spec', 'resources', 'cpu']
          }
          preserve
          hidden={readonlyType || isSliced || isPartitioned}
          normalize={(value) => (value != null ? _.toString(value) : undefined)}
          getValueProps={(value) => ({
            value: value != null ? _.toNumber(value) : undefined
          })}
          rules={[
            {
              required: true,
              validator: (_, value) => {
                const num = Number(value);
                // Both divided modes pin the count to a single card and hide
                // this field; a slice-only type reports a whole-card max of 0,
                // so keep the ceiling check out of their way.
                if (isSliced || isPartitioned) {
                  return Promise.resolve();
                }
                if (num > maxComputeUnitCount) {
                  return Promise.reject(
                    new Error(
                      intl.formatMessage(
                        { id: numberSelectionLabel.maxLabel },
                        { count: maxComputeUnitCount }
                      )
                    )
                  );
                }
                if (num < 0) {
                  return Promise.reject(
                    new Error(
                      intl.formatMessage(
                        { id: numberSelectionLabel.minLabel },
                        { count: 0 }
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
            onChange={handleOnGPUCountChange}
            max={maxComputeUnitCount}
            step={1}
            required
            disabled={disabled || readonlyType}
            label={`${intl.formatMessage({ id: 'common.max.count' }, { label: numberSelectionLabel.label })} (${intl.formatMessage(
              {
                id: 'common.max'
              },
              { count: maxComputeUnitCount }
            )})`}
          />
        </Form.Item>
      )}
      {!noAvailableTypes && isSliced && (
        <SliceFieldWrapper withCard={coresOvercommit}>
          <>
            <Form.Item<FormData>
              name={['spec', 'resources', 'acceleratorSlicedMemoryPercentage']}
              // Grouped with the compute selector inside one card — tighten
              // the default 24px gap between the pair.
              style={coresOvercommit ? { marginBottom: 0 } : undefined}
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
                            {
                              id: 'gpuservice.instance.slice.percentage.max'
                            },
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
                disabled={disabled}
                // Inside the card the selector drops its own border; the bare
                // (no-overcommit) variant keeps it, like the GPU Count block.
                style={coresOvercommit ? { border: 'none' } : undefined}
                onChange={handleMemoryPercentageChange}
                label={intl.formatMessage({
                  // Without cores overcommit this single ratio drives both
                  // VRAM and compute, so drop the "VRAM" qualifier.
                  id: coresOvercommit
                    ? 'gpuservice.instance.slice.memoryPercentage'
                    : 'gpuservice.instance.slice.percentage'
                })}
              />
            </Form.Item>
            {/* Compute (cores) percentage. Fixed 10..100 ticks; ticks below the
              chosen memory ratio are disabled (cores must be >= memory). Only
              types with cores overcommit get the selector — without it the
              ratio is locked to the memory percentage (the parent mirrors it),
              carried by a hidden field so it still rides the submit. */}
            {coresOvercommit ? (
              <Form.Item<FormData>
                name={['spec', 'resources', 'acceleratorSlicedCoresPercentage']}
                style={{ marginBottom: 0 }}
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
                  disabled={disabled}
                  onChange={handleCoresPercentageChange}
                  style={{ border: 'none' }}
                  label={intl.formatMessage({
                    id: 'gpuservice.instance.slice.coresPercentage'
                  })}
                />
              </Form.Item>
            ) : (
              <Form.Item<FormData>
                name={['spec', 'resources', 'acceleratorSlicedCoresPercentage']}
                style={{ marginBottom: 0 }}
                hidden
              >
                <InputNumber />
              </Form.Item>
            )}
          </>
        </SliceFieldWrapper>
      )}
      {!noAvailableTypes && isPartitioned && (
        <FieldBlock>
          <Form.Item<FormData>
            name={['spec', 'resources', 'acceleratorPartitionedProfile']}
            style={{ marginBottom: 0 }}
            rules={[
              {
                required: true,
                validator: (_rule, value) => {
                  if (!value) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'gpuservice.instance.partition.profile.required'
                        })
                      )
                    );
                  }
                  // The offered list is the type-level union across candidates,
                  // so a profile can be exhausted everywhere it actually runs.
                  // Say so here instead of letting the blanked-out candidate
                  // surface as a bare "select an instance type".
                  if (!profileHasCandidate(value)) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'gpuservice.instance.partition.profile.unavailable'
                        })
                      )
                    );
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Select
              required
              disabled={disabled}
              options={partitionOptions}
              onChange={handlePartitionProfileChange}
              label={intl.formatMessage({
                id: 'gpuservice.instance.partition.profile'
              })}
            />
          </Form.Item>
        </FieldBlock>
      )}
      {/* A not-yet-re-typed edit renders a readonly card (no slice UI), so
          register the slice fields as hidden — otherwise their persisted
          values are dropped from the submit payload. */}
      {readonlyType && (
        <>
          <Form.Item<FormData>
            name={['spec', 'resources', 'acceleratorSlicedMemoryPercentage']}
            hidden
          >
            <InputNumber />
          </Form.Item>
          <Form.Item<FormData>
            name={['spec', 'resources', 'acceleratorSlicedCoresPercentage']}
            hidden
          >
            <InputNumber />
          </Form.Item>
          <Form.Item<FormData>
            name={['spec', 'resources', 'acceleratorPartitionedProfile']}
            hidden
          >
            <CInput.Input />
          </Form.Item>
        </>
      )}
      {!noAvailableTypes && (
        <Flex gap={12}>
          <div style={{ flex: 1 }}>
            <Form.Item<FormData>
              name={['spec', 'resources', 'ram']}
              normalize={(value) => (value ? `${value}Gi` : null)}
              getValueProps={(value) => ({
                value: _.toString(value).replace(/Gi$/, '')
              })}
            >
              <InputNumber
                disabled={true}
                label={intl.formatMessage({ id: 'gpuservice.template.memory' })}
                max={onceMaxRequest?.memory ?? undefined}
              />
            </Form.Item>
          </div>
          {isGPUType && (
            <div style={{ flex: 1 }}>
              <Form.Item<FormData>
                name={['spec', 'resources', 'cpu']}
                key="cpu_input"
                preserve
              >
                <InputNumber label={'CPU'} disabled={true} />
              </Form.Item>
            </div>
          )}
        </Flex>
      )}
    </div>
  );
};

export default InstanceTypeFormItem;
