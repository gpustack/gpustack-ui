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
const SLICE_PERCENT_TICKS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

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
  onGPUCountChange
}) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { isGPUType } = useContext(FormContext);

  const maxComputeUnitCount = useMemo(() => {
    if (action === PageAction.EDIT) {
      const description = parseJsonSafe(
        currentData?.description || '{}',
        {} as any
      );
      return description.spec?.maxComputeUnitCount || 0;
    }
    return selectedInstanceType?.spec?.maxComputeUnitCount || 0;
  }, [action, currentData, selectedInstanceType]);

  const isGPU = useMemo(() => {
    if (action === PageAction.EDIT) {
      return _.toNumber(currentData?.spec?.resources?.accelerator) > 0;
    }
    return selectedInstanceType?.spec?.acceleratable;
  }, [selectedInstanceType, action]);

  const handleOnGPUCountChange = (value: number) => {
    onGPUCountChange?.(value);
  };

  // Sliced mode is only offered for sliceable accelerator types, and only when
  // the section is editable (create / recreate; edit renders a readonly card).
  const showModeSwitch =
    action !== PageAction.EDIT &&
    isGPUType &&
    !!selectedInstanceType?.spec?.sliceable;

  const handleModeChange = (value: string) => {
    onSliceModeChange?.(value as 'whole' | 'sliced');
  };

  // Memory (VRAM) percentage changed via the slider/input — forward the new
  // value so the parent writes the field and rescales CPU / RAM.
  const handleMemoryPercentageChange = (value: number) => {
    onSliceMemoryPercentageChange?.(value);
  };

  // Max selectable ratio in sliced mode: status.onceMaxRequest.acceleratorSliced
  // (a percentage). Ticks above it stay visible but disabled.
  const slicedMaxPercentage =
    _.toNumber(
      selectedInstanceType?.status?.onceMaxRequest?.acceleratorSliced
    ) || 0;

  const modeSegmented = showModeSwitch ? (
    <Segmented
      size="small"
      shape="round"
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
  const sliceTicks =
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
    if (isGPUType || action === PageAction.EDIT || !onceMaxRequest?.memory) {
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
              ? `${description.product} x ${currentData?.spec?.resources?.accelerator}`
              : 'CPU'}
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
          {action === PageAction.CREATE && (
            <InstanceTypePicker
              selectedInstanceType={selectedInstanceType}
              noAvailable={noAvailableTypes}
            />
          )}
          {action === PageAction.EDIT && renderInstanceType()}
        </Form.Item>
      </FieldBlock>
      {!noAvailableTypes && (
        <Form.Item<FormData>
          key={isGPUType ? 'accelerator' : 'cpu'}
          name={
            isGPUType
              ? ['spec', 'resources', 'accelerator']
              : ['spec', 'resources', 'cpu']
          }
          preserve
          hidden={action === PageAction.EDIT || isSliced}
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
            labelExtra={sliceMode === 'whole' ? modeSegmented : undefined}
            disabled={disabled || action === PageAction.EDIT}
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
        <FieldBlock>
          <Form.Item<FormData>
            name={['spec', 'resources', 'acceleratorSlicedMemoryPercentage']}
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
              onChange={handleMemoryPercentageChange}
              labelExtra={modeSegmented}
              label={intl.formatMessage({
                id: 'gpuservice.instance.slice.memoryPercentage'
              })}
            />
          </Form.Item>
          {/* Compute (cores) percentage is fixed at 100. Kept in the form via a
              hidden item so it rides along on submit. */}
          <Form.Item<FormData>
            name={['spec', 'resources', 'acceleratorSlicedCoresPercentage']}
            hidden
          >
            <InputNumber />
          </Form.Item>
        </FieldBlock>
      )}
      {/* Edit renders a readonly card (no sliced UI), so register the slice
          percentages as hidden fields — otherwise their persisted values are
          dropped from the submit payload. */}
      {action === PageAction.EDIT && (
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
