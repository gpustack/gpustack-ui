import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import NumberSelection from '@/pages/_components/number-selection';
import { InputNumber } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Alert, Flex, Form } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';
import { BasicResourceMax } from '../../templates/forms/basic';
import { parseJsonSafe } from '../../utils';
import InstanceTypeItem from '../components/instance-type-item';
import { getAcceleratorMax } from '../config';
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
        <InstanceTypeItem item={selectedInstanceType} showStatus={false} />
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
  onGPUCountChange?: (value: number) => void;
}

const InstanceTypeFormItem: React.FC<InstanceTypeFormItemProps> = ({
  action,
  disabled,
  currentData,
  selectedInstanceType,
  onceMaxRequest,
  noAvailableTypes,
  onGPUCountChange
}) => {
  const intl = useIntl();

  const maxGpuCount =
    action === PageAction.EDIT
      ? _.toNumber(currentData?.spec?.resources?.accelerator) || 0
      : getAcceleratorMax(selectedInstanceType?.status?.acceleratorTiers);

  const isGPU = useMemo(() => {
    if (action === PageAction.EDIT) {
      return _.toNumber(currentData?.spec?.resources?.accelerator) > 0;
    }
    return selectedInstanceType?.spec?.acceleratable;
  }, [selectedInstanceType, action]);

  const handleOnGPUCountChange = (value: number) => {
    onGPUCountChange?.(value);
  };

  const renderMaxLabel = (
    label: React.ReactNode,
    max?: number | null
  ): React.ReactNode => {
    if (max == null) return label;
    return (
      <Flex gap={4} align="center">
        {label}
        {!isGPU && (
          <span>
            ({intl.formatMessage({ id: 'common.max' }, { count: max })})
          </span>
        )}
      </Flex>
    );
  };

  const renderMemoryLabel = (): React.ReactNode => {
    if (isGPU || action === PageAction.EDIT || !onceMaxRequest?.memory) {
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
        <Flex align="flex-start" orientation="vertical">
          <span
            style={{
              fontWeight: 400
            }}
          >
            {description.acceleratable
              ? `${description.product} x ${currentData?.spec?.resources?.accelerator}`
              : 'CPU'}
          </span>
        </Flex>
      </SelectedCard>
    );
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
      {!noAvailableTypes && isGPU && (
        <Form.Item<FormData>
          name={['spec', 'resources', 'accelerator']}
          hidden={action === PageAction.EDIT}
          normalize={(value) => (value != null ? _.toString(value) : undefined)}
          getValueProps={(value) => ({
            value: value != null ? _.toNumber(value) : undefined
          })}
          rules={[
            {
              required: true,
              validator: (_, value) => {
                const num = Number(value);
                if (num > maxGpuCount) {
                  return Promise.reject(
                    new Error(
                      intl.formatMessage(
                        { id: 'gpuservice.instance.gpuCount.max' },
                        { count: maxGpuCount }
                      )
                    )
                  );
                }
                if (num < 0) {
                  return Promise.reject(
                    new Error(
                      intl.formatMessage(
                        { id: 'gpuservice.instance.gpuCount.min' },
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
            max={maxGpuCount}
            step={1}
            required
            tips={intl.formatMessage({
              id: 'gpuservice.instance.gpuCount.zero'
            })}
            disabled={disabled || action === PageAction.EDIT}
            labelExtra={
              !maxGpuCount &&
              action !== PageAction.EDIT && (
                <Alert
                  showIcon
                  type="warning"
                  title={intl.formatMessage({
                    id: 'gpuservice.instance.gpuCount.noAvailable'
                  })}
                  styles={{
                    root: {
                      marginLeft: 4,
                      paddingBlock: 0
                    }
                  }}
                ></Alert>
              )
            }
            label={`${intl.formatMessage({ id: 'gpuservice.instance.gpuCount' })} (${intl.formatMessage(
              {
                id: 'common.max'
              },
              { count: maxGpuCount }
            )})`}
          />
        </Form.Item>
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
                disabled={isGPU || disabled || action === PageAction.EDIT}
                label={renderMemoryLabel()}
                max={onceMaxRequest?.memory ?? undefined}
              />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item<FormData> name={['spec', 'resources', 'cpu']}>
              <InputNumber
                label={renderMaxLabel('CPU', onceMaxRequest?.cpu)}
                max={onceMaxRequest?.cpu ?? undefined}
                disabled={disabled || isGPU || action === PageAction.EDIT}
              />
            </Form.Item>
          </div>
        </Flex>
      )}
    </div>
  );
};

export default InstanceTypeFormItem;
