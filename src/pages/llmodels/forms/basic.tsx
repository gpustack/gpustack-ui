import AutoTooltip from '@/components/auto-tooltip';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { modelNameReg, PageAction } from '@/config';
import { OPENAI_COMPATIBLE } from '@/config/settings';
import useAppUtils from '@/hooks/use-app-utils';
import {
  ClusterStatusLabelMap,
  ClusterStatusValueMap
} from '@/pages/cluster-management/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';
import { sourceOptions } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import BackendForm from './backend';
import CatalogFrom from './catalog';
import CustomBackend from './custom-backend';
import LocalPathSource from './local-path-source';
import ModeField from './mode-field';
import OnlineSource from './online-source';

const ClusterOption = styled.span`
  display: flex;
  padding: 8px 0;
  width: 100%;
  flex-direction: column;
  border-bottom: 1px solid var(--ant-color-split);
  gap: 4px;
  .label {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .dot {
    display: flex;
    width: 6px;
    height: 6px;
    background-color: var(--ant-color-warning);
    border-radius: 50%;
    &.ready {
      background-color: var(--ant-color-success);
    }
  }
  .item {
    width: max-content;
    display: flex;
    align-items: center;
    padding: 2px 0px;
    border-radius: 4px;
    font-weight: 400;
    gap: 8px;
  }
  .s-dot {
    width: 4px;
    height: 4px;
    margin: 0 4px;
    background-color: var(--ant-color-text-quaternary);
    border-radius: 50%;
  }
`;

interface BasicFormProps {
  fields?: string[];
  sourceDisable?: boolean;
  sourceList?: Global.BaseOption<string>[];
  clusterList: Global.BaseOption<
    number,
    {
      provider: string;
      state: string;
      is_default: boolean;
      workers: number;
      ready_workers: number;
      gpus: number;
    }
  >[];
  handleClusterChange: (value: number) => void;
  onSourceChange?: (value: string) => void;
}

const BasicForm: React.FC<BasicFormProps> = (props) => {
  const {
    fields = [],
    sourceList,
    clusterList,
    sourceDisable,
    handleClusterChange,
    onSourceChange
  } = props;
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { onValuesChange, action } = useFormContext();

  const handleOnSourceChange = (val: string) => {
    onSourceChange?.(val);
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (action === PageAction.EDIT) {
      const value = e.target.value;
      onValuesChange?.({ name: value }, form.getFieldsValue());
    }
  };

  const clusterOptions = useMemo(() => {
    return clusterList?.map((item) => {
      return {
        label:
          item.state === ClusterStatusValueMap.Ready
            ? item.label
            : `${item.label} [${ClusterStatusLabelMap[item.state as string]}]`,
        value: item.value,
        workers: item.workers,
        ready_workers: item.ready_workers,
        gpus: item.gpus
      };
    });
  }, [clusterList]);

  const clusterOptionRender = (option: any) => {
    const { data } = option;

    return (
      <ClusterOption>
        <span className="label">
          <AutoTooltip ghost maxWidth={'100%'}>
            {data.label}
          </AutoTooltip>
        </span>
        <span className={`item ${data.ready_workers > 0 ? 'ready' : ''}`}>
          <span
            className={`dot ${data.ready_workers > 0 ? 'ready' : ''}`}
          ></span>
          <span className="flex-center gap-8">
            <span className="flex-center gap-4 text-tertiary">
              <span>{intl.formatMessage({ id: 'resources.nodes' })}:</span>
              <span>
                {data.ready_workers}/{data.workers}
              </span>
            </span>
            <span className="s-dot"></span>
            <span className="flex-center gap-4 text-tertiary">
              <span>GPUs:</span>
              <span>{data.gpus}</span>
            </span>
          </span>
        </span>
      </ClusterOption>
    );
  };

  return (
    <>
      <Form.Item<FormData>
        data-field="name"
        name="name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          },
          {
            pattern: modelNameReg,
            message: intl.formatMessage({ id: 'models.form.rules.name' })
          }
        ]}
      >
        <SealInput.Input
          onBlur={handleNameBlur}
          description={intl.formatMessage({ id: 'models.form.rules.name' })}
          label={intl.formatMessage({
            id: 'common.table.name'
          })}
          required
        ></SealInput.Input>
      </Form.Item>
      {fields.includes('source') && (
        <Form.Item<FormData>
          name="source"
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'models.form.source')
            }
          ]}
        >
          {
            <SealSelect
              onChange={handleOnSourceChange}
              disabled={sourceDisable}
              label={intl.formatMessage({
                id: 'models.form.source'
              })}
              options={sourceList ?? sourceOptions}
              required
            ></SealSelect>
          }
        </Form.Item>
      )}

      <OnlineSource></OnlineSource>
      <LocalPathSource></LocalPathSource>
      <Form.Item<FormData>
        name="cluster_id"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'clusters.title')
          }
        ]}
      >
        {
          <SealSelect
            onChange={handleClusterChange}
            label={intl.formatMessage({ id: 'clusters.title' })}
            options={clusterOptions}
            optionRender={clusterOptionRender}
            required
          ></SealSelect>
        }
      </Form.Item>
      <ModeField></ModeField>
      <CatalogFrom></CatalogFrom>
      <BackendForm></BackendForm>
      <CustomBackend></CustomBackend>
      <Form.Item<FormData>
        name="replicas"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'models.form.replicas')
          }
        ]}
      >
        <SealInput.Number
          style={{ width: '100%' }}
          label={intl.formatMessage({
            id: 'models.form.replicas'
          })}
          required
          description={intl.formatMessage(
            { id: 'models.form.replicas.tips' },
            { api: `${window.location.origin}/${OPENAI_COMPATIBLE}` }
          )}
          min={0}
        ></SealInput.Number>
      </Form.Item>
      <Form.Item<FormData> name="description">
        <SealInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></SealInput.TextArea>
      </Form.Item>
    </>
  );
};

export default BasicForm;
