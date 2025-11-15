import { useIntl } from '@umijs/max';
import { Input, Switch } from 'antd';
import React from 'react';
import { SwitchWrapper, Tips } from './constainers';

const NetworkConfig = () => {
  const intl = useIntl();
  const [networkInterface, setNetworkInterface] = React.useState<{
    enable: boolean;
    name?: string;
  }>({
    enable: false,
    name: ''
  });
  return (
    <SwitchWrapper>
      <div className="button">
        <span style={{ color: 'var(--ant-color-text)', fontWeight: 500 }}>
          Network Interface
        </span>
        <Switch
          checked={networkInterface.enable}
          onChange={(checked) =>
            setNetworkInterface({
              ...networkInterface,
              enable: checked
            })
          }
        ></Switch>
      </div>
      <Tips>
        Enter the NIC name to use for distributed inference (e.g., mlx5_0).
      </Tips>
      {networkInterface.enable && (
        <>
          <Input
            style={{ width: '100%' }}
            placeholder="Enter network interface"
            onChange={(e) =>
              setNetworkInterface({
                ...networkInterface,
                name: e.target.value
              })
            }
          />
        </>
      )}
    </SwitchWrapper>
  );
};

export default NetworkConfig;
