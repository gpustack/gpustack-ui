import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import {
  ClusterStatusLabelMap,
  ClusterStatusValueMap
} from '@/pages/cluster-management/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';
import { sourceOptions } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import CatalogFrom from './catalog';
import LocalPathSource from './local-path-source';
import OnlineSource from './online-source';

interface BasicFormProps {
  fields?: string[];
  sourceDisable?: boolean;
  sourceList?: Global.BaseOption<string>[];
  clusterList: Global.BaseOption<number, { provider: string; state: string }>[];
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
  const { getRuleMessage } = useAppUtils();
  const { onValuesChange } = useFormContext();
  const form = Form.useFormInstance();

  const handleOnSourceChange = (val: string) => {
    onSourceChange?.(val);
  };

  const handleReplicasChange = (val: number) => {
    if (val > 0) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const clusterOptions = useMemo(() => {
    return clusterList?.map((item) => {
      return {
        label:
          item.state === ClusterStatusValueMap.Ready
            ? item.label
            : `${item.label} [${ClusterStatusLabelMap[item.state as string]}]`,
        disabled: item.state !== ClusterStatusValueMap.Ready,
        value: item.value
      };
    });
  }, [clusterList]);

  return (
    <>
      <Form.Item<FormData>
        data-field="name"
        name="name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          }
        ]}
      >
        <SealInput.Input
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
            required
          ></SealSelect>
        }
      </Form.Item>
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
          onChange={handleReplicasChange}
          style={{ width: '100%' }}
          label={intl.formatMessage({
            id: 'models.form.replicas'
          })}
          required
          description={intl.formatMessage(
            { id: 'models.form.replicas.tips' },
            { api: `${window.location.origin}/v1` }
          )}
          min={0}
        ></SealInput.Number>
      </Form.Item>
      <CatalogFrom></CatalogFrom>
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
