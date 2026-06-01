import { Input as CInput } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Divider } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { ImageCredential } from '../config/types';

const Wrapper = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .row {
    display: flex;
    gap: 12px;

    > * {
      flex: 1;
      min-width: 0;
    }
  }
`;

interface CredentialItemProps {
  item: ImageCredential;
  validated: boolean;
  index: number;
  onChange: (partial: Partial<ImageCredential>) => void;
}

const CredentialItem: React.FC<CredentialItemProps> = ({
  item,
  index,
  validated,
  onChange
}) => {
  const intl = useIntl();

  const registryEmpty = !item.registry?.trim();
  const registryStatus =
    validated && registryEmpty ? ('error' as const) : ('success' as const);

  return (
    <Wrapper>
      {index !== 0 && (
        <Divider style={{ marginBlock: 8 }} variant="dashed"></Divider>
      )}
      <CInput.Input
        required
        status={registryStatus}
        value={item.registry}
        onChange={(e) => onChange({ registry: e.target.value })}
        label={intl.formatMessage({
          id: 'clusters.imageCredentials.registry'
        })}
      />
      <div className="row">
        <CInput.Input
          value={item.username}
          status="success"
          onChange={(e) => onChange({ username: e.target.value })}
          label={intl.formatMessage({
            id: 'clusters.imageCredentials.username'
          })}
        />
        <CInput.Password
          status="success"
          value={item.password}
          onChange={(e) => onChange({ password: e.target.value })}
          label={intl.formatMessage({
            id: 'clusters.imageCredentials.password'
          })}
        />
      </div>
    </Wrapper>
  );
};

export default CredentialItem;
