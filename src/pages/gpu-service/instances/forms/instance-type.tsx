import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import NumberSelection from '@/pages/_components/number-selection';
import { InputNumber } from '@gpustack/core-ui';
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
import { isSliceableDetail } from '../config';
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
  // Whole-card (exclusive) vs sliced (percentage) mode. Owned by the parent
  // form (it drives candidate picking + the fixed accelerator=1 for sliced).
  sliceMode?: 'whole' | 'sliced';
  onSliceModeChange?: (mode: 'whole' | 'sliced') => void;
  // Commit a new sliced memory ratio (writes the field + rescales CPU / RAM).
  onSliceMemoryPercentageChange?: (value: number) => void;
  // Commit a new sliced compute (cores) ratio (writes the field only).
  onSliceCoresPercentageChange?: (value: number) => void;
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

  // Sliced mode is only offered for sliceable accelerator types, and only when
  // the section is editable (create, or edit after re-picking a type; a
  // not-yet-re-typed edit renders a readonly card).
  const showModeSwitch =
    !readonlyType &&
    isGPUType &&
    isSliceableDetail(selectedInstanceType?.status?.detail?.slicedDetail);

  const handleModeChange = (value: string) => {
    onSliceModeChange?.(value as 'whole' | 'sliced');
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
  const coresOvercommit =
    !!selectedInstanceType?.status?.detail?.slicedDetail?.logical
      ?.coresPercentageOvercommit;

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
          value: 'whole'
        },
        {
          label: intl.formatMessage({ id: 'gpuservice.instance.mode.sliced' }),
          value: 'sliced',
          // No sliced capacity → keep the option visible but unselectable.
          disabled: slicedMaxPercentage <= 0
        }
      ]}
    />
  ) : null;

  const isSliced = showModeSwitch && sliceMode === 'sliced';

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
          hidden={readonlyType || isSliced}
          normalize={(value) => (value != null ? _.toString(value) : undefined)}
          getValueProps={(value) => ({
            value: value != null ? _.toNumber(value) : undefined
          })}
          rules={[
            {
              required: true,
              validator: (_, value) => {
                const num = Number(value);
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
      {/* A not-yet-re-typed edit renders a readonly card (no sliced UI), so
          register the slice percentages as hidden fields — otherwise their
          persisted values are dropped from the submit payload. */}
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
