import { InfoCircleOutlined } from '@ant-design/icons';
import { CopyButton, OverlayScroller, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Divider, Flex, Tooltip } from 'antd';
import React from 'react';
import { ModelInstanceListItem } from '../../config/types';

interface InjectedParamsCellProps {
  record: ModelInstanceListItem;
  backendParameters?: string[];
}

const ParamsList: React.FC<{ items: string[] }> = ({ items }) => (
  <Flex gap={4} wrap="wrap">
    {items.map((param, index) => (
      <span
        key={`${param}-${index}`}
        style={{
          backgroundColor: 'var(--ant-color-fill-quaternary)',
          padding: 4,
          borderRadius: 2,
          fontFamily: 'monospace',
          color: 'var(--ant-color-text-secondary)'
        }}
      >
        {param}
      </span>
    ))}
  </Flex>
);

interface TooltipContentProps {
  backendParameters: string[];
  injectedBackendParameters: string[];
}

const TooltipContent: React.FC<TooltipContentProps> = ({
  backendParameters,
  injectedBackendParameters
}) => {
  const intl = useIntl();
  const showBackend = backendParameters.length > 0;
  const showInjected = injectedBackendParameters.length > 0;

  return (
    <OverlayScroller maxHeight={240} style={{ minWidth: 280 }}>
      <Flex
        vertical
        gap={12}
        style={{
          padding: 4
        }}
      >
        {showBackend && (
          <Flex vertical gap={4}>
            <span
              style={{
                fontWeight: 500,
                fontSize: 13
              }}
            >
              {intl.formatMessage({ id: 'models.instance.params.configured' })}
            </span>
            <ParamsList items={backendParameters} />
          </Flex>
        )}
        {showInjected && (
          <Flex vertical gap={4}>
            <span
              style={{
                fontWeight: 500,
                fontSize: 13
              }}
            >
              {intl.formatMessage({
                id: 'models.instance.params.autoInjected'
              })}
            </span>
            <ParamsList items={injectedBackendParameters} />
          </Flex>
        )}
      </Flex>
    </OverlayScroller>
  );
};

const InjectedParamsCell: React.FC<InjectedParamsCellProps> = ({
  record,
  backendParameters
}) => {
  const intl = useIntl();
  const injectedBackendParameters = record?.injected_backend_parameters || [];
  console.log('InjectedParamsCell record:', record);

  if (!injectedBackendParameters.length) {
    return null;
  }
  return null;
  return (
    <Tooltip
      color="var(--ant-color-bg-elevated)"
      styles={{
        container: {
          color: 'var(--ant-color-text)',
          boxShadow: 'var(--ant-box-shadow-secondary)',
          paddingInline: 0
        }
      }}
      title={
        <div>
          <Flex
            align="center"
            justify="space-between"
            style={{ paddingInline: 4 }}
          >
            <div
              style={{
                padding: '8px 8px',
                fontWeight: 500,
                fontSize: 14
              }}
            >
              {intl.formatMessage({
                id: 'models.form.backend_parameters'
              })}
            </div>
            <CopyButton
              type="link"
              text={[
                ...(backendParameters || []),
                ...injectedBackendParameters
              ].join('\n')}
              style={{ marginLeft: 'auto' }}
            />
          </Flex>
          <Divider style={{ margin: '0 0 8px 0' }} />
          <TooltipContent
            backendParameters={backendParameters || []}
            injectedBackendParameters={injectedBackendParameters}
          />
        </div>
      }
    >
      <span>
        <ThemeTag
          opacity={0.75}
          color="cyan"
          style={{
            display: 'flex',
            alignItems: 'center',
            maxWidth: '100%',
            minWidth: 50,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            borderRadius: 12
          }}
        >
          <InfoCircleOutlined className="m-r-5" />
          {intl.formatMessage({
            id: 'models.form.backend_parameters'
          })}
        </ThemeTag>
      </span>
    </Tooltip>
  );
};

export default InjectedParamsCell;
