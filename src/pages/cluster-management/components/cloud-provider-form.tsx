import { fromClusterCreationAtom } from '@/atoms/clusters';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { LoadingOutlined } from '@ant-design/icons';
import { Link, useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ClusterFormData as FormData } from '../config/types';
import { useProviderRegions } from '../hooks/use-provider-regions';

type OptionData = {
  label: string;
  datacenter: string;
  value: string | number;
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

const NoContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-block: 12px;
`;

interface CloudProviderProps {
  provider: string; // 'kubernetes' | 'digitalocean';
  credentialList: Global.BaseOption<number>[];
  action: PageActionType;
  credentialID?: number;
}

const NotFoundContent: React.FC<{ loading: boolean }> = ({ loading }) => {
  const intl = useIntl();
  if (loading) {
    return (
      <NoContent>
        <LoadingOutlined />
      </NoContent>
    );
  }
  return (
    <NoContent>
      {intl.formatMessage({ id: 'clusters.create.noRegions' })}
    </NoContent>
  );
};

const NotFoundCredentialContent: React.FC = () => {
  const [, setFromClusterCreation] = useAtom(fromClusterCreationAtom);
  const intl = useIntl();
  const handleOnClick = () => {
    console.log('click add credential');
    setFromClusterCreation(true);
  };

  return (
    <NoContent>
      <Link to={'/cluster-management/credentials'} onClick={handleOnClick}>
        {intl.formatMessage({ id: 'clusters.button.addCredential' })}
      </Link>
    </NoContent>
  );
};

const optionRender = (option: any): React.ReactNode => {
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

const CloudProvider: React.FC<CloudProviderProps> = (props) => {
  const { credentialList, action, credentialID } = props;
  const intl = useIntl();

  const {
    getRegions,
    getOSImages,
    updateOSImages,
    updateInstanceTypes,
    getInstanceTypes,
    setLoading,
    loading,
    regions
  } = useProviderRegions();

  const { getRuleMessage } = useAppUtils();

  const handleCredentialChange = async (value: number) => {
    setLoading(true);
    await Promise.all([getOSImages(value), getInstanceTypes(value)]);
    await getRegions(value);
  };

  const handleRegionChange = (value: string) => {
    updateInstanceTypes(value);
    updateOSImages(value);
  };

  useEffect(() => {
    if (credentialID && action !== PageAction.CREATE) {
      getRegions(credentialID);
    }
  }, [credentialID]);

  const labelRender = (props: {
    label: React.ReactNode;
    value: string | number;
  }): React.ReactNode => {
    const data = regions.find((item) => item.value === props.value);
    if (!data) return props.label;
    return (
      <OptionItem className="flex-center">
        <span className="icon">{data?.icon}</span>
        <span className="label">{data?.label}</span>{' '}
        <span className="dot"></span>
        <span className="datacenter">{data?.datacenter}</span>{' '}
        <span className="dot"></span>
        <span className="value">{_.toUpper(data?.value)}</span>
      </OptionItem>
    );
  };

  const filterRegionOption = (inputValue: string, option: any) => {
    return (
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.datacenter.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.value.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

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
          notFoundContent={<NotFoundCredentialContent />}
          disabled={action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'clusters.credential.title' })}
          required
          options={credentialList}
          onChange={handleCredentialChange}
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
          showSearch
          disabled={action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'clusters.workerpool.region' })}
          required
          options={regions}
          loading={loading}
          filterOption={filterRegionOption}
          labelRender={labelRender}
          optionRender={optionRender}
          onChange={handleRegionChange}
          notFoundContent={<NotFoundContent loading={loading} />}
        ></SealSelect>
      </Form.Item>
    </>
  );
};

export default CloudProvider;
