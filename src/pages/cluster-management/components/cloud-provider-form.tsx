import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { regionList } from '../config';
import { ClusterFormData as FormData } from '../config/types';

type OptionData = {
  label: string;
  datacenter: string;
  value: string;
  icon: string;
};

const OptionItem = styled.div`
  display: flex;
  align-items: center;
  .label {
    font-weight: 500;
  }
  .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--ant-color-text);
    margin: 0 8px;
  }
  .datacenter,
  .value {
    color: var(--ant-color-text-secondary);
  }
  .icon {
    margin-right: 8px;
  }
`;

interface CloudProviderProps {
  provider: string; // 'kubernetes' | 'digitalocean';
  credentialList: Global.BaseOption<number>[];
}

const optionRender = (
  option: Global.BaseOption<
    number,
    {
      data: OptionData;
    }
  >
): React.ReactNode => {
  const { value } = option;
  const data = option.data!;

  return (
    <OptionItem className="flex-center">
      <span className="icon">{data.icon}</span>
      <span className="label">{data.label}</span> <span className="dot"></span>
      <span className="datacenter">{data.datacenter}</span>{' '}
      <span className="dot"></span>{' '}
      <span className="value">{_.toUpper(value)}</span>
    </OptionItem>
  );
};

const labelRender = (props: {
  label: string;
  value: string;
}): React.ReactNode => {
  const data = regionList.find((item) => item.value === props.value);
  return (
    <OptionItem className="flex-center">
      <span className="icon">{data?.icon}</span>
      <span className="label">{data?.label}</span> <span className="dot"></span>
      <span className="datacenter">{data?.datacenter}</span>{' '}
      <span className="dot"></span>
      <span className="value">{_.toUpper(data?.value)}</span>
    </OptionItem>
  );
};

const CloudProvider: React.FC<CloudProviderProps> = (props) => {
  const { credentialList } = props;
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();

  return (
    <>
      <Form.Item<FormData>
        name="credential_id"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'clusters.credential.title')
          }
        ]}
      >
        <SealSelect
          label={intl.formatMessage({ id: 'clusters.credential.title' })}
          required
          options={credentialList}
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="region"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'clusters.workerpool.region')
          }
        ]}
      >
        <SealSelect
          label={intl.formatMessage({ id: 'clusters.workerpool.region' })}
          required
          options={regionList}
          labelRender={labelRender}
          optionRender={optionRender}
        ></SealSelect>
      </Form.Item>
    </>
  );
};

export default CloudProvider;
