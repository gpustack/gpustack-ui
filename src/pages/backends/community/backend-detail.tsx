import AutoTooltip from '@/components/auto-tooltip';
import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tag, Typography } from 'antd';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { generateIcon } from '../components/backend-card';

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  .text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }
`;

const Subtitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ant-color-text);
  font-weight: 500;
  margin-top: 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--ant-color-split);
  padding-bottom: 8px;
  .icon {
    color: var(--ant-color-text-tertiary);
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  padding: 0px 8px;
  border-radius: var(--ant-border-radius);
`;

const UL = styled.ul`
  margin: 0;
  padding-left: 16px;
  list-style-type: disc;
  display: flex;
  flex-direction: column;
  gap: 12px;
  .label {
    font-weight: 500;
    font-size: 14px;
  }
`;

const BackendDetail: React.FC<{
  onEnable: (checked: boolean, data: any) => void;
  onDisable?: () => void;
  currentData?: any;
}> = ({ onEnable, onDisable, currentData }) => {
  const intl = useIntl();

  const renderSupportedFrameworks = () => {
    const frameworks = currentData?.framework_index_map || {};
    if (Object.keys(frameworks).length === 0) {
      return null;
    }
    return (
      <UL>
        {Object.entries(frameworks as Record<string, string[]>).map(
          ([key, value]) => {
            return (
              <li key={key}>
                <div className="label">{_.upperCase(key)}</div>
                {/* <Flex gap={8} wrap="wrap" style={{ marginBlock: 8 }}>
                  {value?.map?.((v: string, index: number) => (
                    <Tag key={index} style={{ margin: 0 }}>
                      {v}
                    </Tag>
                  ))}
                </Flex> */}
              </li>
            );
          }
        )}
      </UL>
    );
  };
  return (
    <div>
      <Title>
        <span className="text">
          {generateIcon(currentData || {}, 32)}
          <AutoTooltip ghost>{currentData?.backend_name}</AutoTooltip>
        </span>
        {currentData && (
          <span>
            {currentData?.enabled ? (
              <Tag color="geekblue" variant="filled">
                {intl.formatMessage({ id: 'common.status.enabled' })}
              </Tag>
            ) : (
              <Button
                type="primary"
                size="middle"
                onClick={() => onEnable(true, currentData)}
              >
                {intl.formatMessage({ id: 'common.button.enable' })}
              </Button>
            )}
          </span>
        )}
      </Title>
      {Object.keys(currentData?.framework_index_map || {}).length > 0 && (
        <Section>
          <Subtitle>
            <BulbOutlined className="icon" />
            <span>
              {intl.formatMessage({ id: 'backend.availableFrameworks' })}
            </span>
          </Subtitle>
          <Content>{renderSupportedFrameworks()}</Content>
        </Section>
      )}
      {/* <Section>
        <Subtitle>
          <BulbOutlined className="icon" />
          <span>
            {intl.formatMessage({
              id: 'backend.form.defaultExecuteCommand'
            })}
          </span>
        </Subtitle>
        <Content style={{ padding: 0, border: 'none' }}>
          <HighlightCode
            code={currentData?.default_run_command}
          ></HighlightCode>
        </Content>
      </Section> */}
      {currentData?.description && (
        <Section>
          <Subtitle>
            <BulbOutlined className="icon" />
            <span>
              {intl.formatMessage({ id: 'common.table.description' })}
            </span>
          </Subtitle>
          <Content>
            <Typography.Text>{currentData?.description}</Typography.Text>
          </Content>
        </Section>
      )}
    </div>
  );
};

export default BackendDetail;
