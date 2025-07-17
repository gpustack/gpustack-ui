import AutoTooltip from '@/components/auto-tooltip';
import CopyButton from '@/components/copy-button';
import IconFont from '@/components/icon-font';
import ScrollerModal from '@/components/scroller-modal';
import { BulbOutlined } from '@ant-design/icons';
import { useIntl, useNavigate } from '@umijs/max';
import { Button, Tag } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';
import { modelCategoriesMap } from '../config';

const ApiAccessInfoWrapper = styled.div`
  display: grid;
  padding-left: 20px;
  grid-template-columns: max-content 1fr max-content;
  gap: 12px 0px;
  justify-items: start;
  align-items: center;
  .label {
    font-weight: 500;
  }
  .value {
    margin-left: 20px;
    display: flex;
    align-items: center;
    color: var(--ant-color-text-secondary);
  }
  .copy-btn {
    margin-left: 8px;
  }
`;

const Tips = styled.div`
  color: var(--ant-color-text-secondary);
  font-size: var(--font-size-small);
  .tips {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  dd {
    margin-bottom: 16px;
  }
`;

const APITAG = styled(Tag)`
  border-radius: 12px;
  margin: 0;
  margin-left: 8px;
`;

const CreateButton = styled(Button)`
  padding-inline: 0;
`;

interface ApiAccessInfoProps {
  open: boolean;
  data: any;
  onClose: () => void;
}

const ApiAccessInfo = ({ open, data, onClose }: ApiAccessInfoProps) => {
  const intl = useIntl();
  const navigate = useNavigate();

  const endPoint = `${window.location.origin}/v1`;

  const isRanker = useMemo(() => {
    return _.includes(data.categories, modelCategoriesMap.reranker);
  }, [data]);

  const handleClose = () => {
    onClose();
  };
  return (
    <ScrollerModal
      open={open}
      style={{
        top: '20%'
      }}
      title={intl.formatMessage({ id: 'models.table.button.apiAccessInfo' })}
      width={550}
      destroyOnClose
      closable={true}
      maskClosable={false}
      onOk={handleClose}
      onCancel={handleClose}
      styles={{
        content: {
          padding: '0 0 16px 0'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '16px 24px 32px'
        },
        footer: {
          padding: '16px 24px',
          margin: '0'
        }
      }}
      footer={null}
    >
      <Tips>
        <dl className="tips">
          <dt>
            <BulbOutlined />
          </dt>
          <dd>
            {intl.formatMessage({
              id: 'models.table.button.apiAccessInfo.tips'
            })}
          </dd>
        </dl>
      </Tips>
      <ApiAccessInfoWrapper>
        <span className="label">
          {intl.formatMessage({ id: 'models.table.apiAccessInfo.endpoint' })}
        </span>
        <span className="value">
          <AutoTooltip ghost maxWidth={180}>
            {endPoint}
          </AutoTooltip>
          <APITAG color="geekblue">
            {intl.formatMessage({
              id: isRanker
                ? 'models.table.apiAccessInfo.jinaCompatible'
                : 'models.table.apiAccessInfo.openaiCompatible'
            })}
          </APITAG>
        </span>
        <span className="copy-btn">
          <CopyButton text={endPoint} type="link" size="small"></CopyButton>
        </span>
        <span className="label">
          {intl.formatMessage({
            id: 'models.table.apiAccessInfo.modelName'
          })}
        </span>
        <span className="value">
          <AutoTooltip ghost maxWidth={300}>
            {data.name}
          </AutoTooltip>
        </span>
        <span className="copy-btn">
          <CopyButton text={data.name} type="link" size="small"></CopyButton>
        </span>
        <span className="label">
          {intl.formatMessage({ id: 'models.table.apiAccessInfo.apikey' })}
        </span>
        <span className="value">
          <CreateButton
            type="link"
            size="small"
            onClick={() => navigate('/api-keys')}
          >
            {intl.formatMessage({
              id: 'models.table.apiAccessInfo.gotoCreate'
            })}
            <IconFont
              type="icon-external-link"
              className="font-size-14"
            ></IconFont>
          </CreateButton>
        </span>
      </ApiAccessInfoWrapper>
    </ScrollerModal>
  );
};
export default ApiAccessInfo;
