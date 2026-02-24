import AutoTooltip from '@/components/auto-tooltip';
import FullMarkdown from '@/components/markdown-viewer/full-markdown';
import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tag } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { generateIcon } from '../components/backend-card';

const Title = styled.div`
  position: sticky;
  top: 0;
  padding-bottom: 16px;
  background-color: var(--ant-color-bg-elevated);
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
    font-size: 14px;
  }
`;

const BackendDetail: React.FC<{
  onEnable: (checked: boolean, data: any) => void;
  onDisable?: () => void;
  data?: any;
}> = ({ onEnable, onDisable, data }) => {
  const intl = useIntl();
  const [currentData, setCurrentData] = React.useState<any>(data);

  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  const handleOnEnable = async (checked: boolean) => {
    await onEnable(true, currentData);
    setCurrentData({
      ...currentData,
      enabled: checked
    });
  };

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
                onClick={() => handleOnEnable(true)}
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
      {currentData?.description && (
        <Section>
          <Subtitle>
            <BulbOutlined className="icon" />
            <span>
              {intl.formatMessage({ id: 'common.table.description' })}
            </span>
          </Subtitle>
          <Content>
            <FullMarkdown content={currentData?.description}></FullMarkdown>
          </Content>
        </Section>
      )}
    </div>
  );
};

export default BackendDetail;
