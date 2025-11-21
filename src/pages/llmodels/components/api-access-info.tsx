import AutoTooltip from '@/components/auto-tooltip';
import CopyButton from '@/components/copy-button';
import IconFont from '@/components/icon-font';
import ScrollerModal from '@/components/scroller-modal';
import { OPENAI_COMPATIBLE } from '@/config/settings';
import {
  AUDIO_SPEECH_TO_TEXT_API,
  AUDIO_TEXT_TO_SPEECH_API,
  CHAT_API,
  CREAT_IMAGE_API,
  EMBEDDING_API,
  MODEL_PROXY,
  RERANKER_API
} from '@/pages/playground/apis';
import { BulbOutlined } from '@ant-design/icons';
import { useIntl, useNavigate } from '@umijs/max';
import { Button, Tag } from 'antd';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { modelCategoriesMap } from '../config';
import { ListItem } from '../config/types';
import useGenericProxy from '../hooks/use-generic-proxy';

const API_MAP: Record<string, { api: string }> = {
  [modelCategoriesMap.embedding]: {
    api: EMBEDDING_API
  },
  [modelCategoriesMap.llm]: {
    api: CHAT_API
  },
  [modelCategoriesMap.image]: {
    api: CREAT_IMAGE_API
  },
  [modelCategoriesMap.text_to_speech]: {
    api: AUDIO_TEXT_TO_SPEECH_API
  },
  [modelCategoriesMap.speech_to_text]: {
    api: AUDIO_SPEECH_TO_TEXT_API
  },
  [modelCategoriesMap.reranker]: {
    api: RERANKER_API
  }
};

const ApiAccessInfoWrapper = styled.div`
  display: grid;
  padding-left: 20px;
  grid-template-columns: max-content 1fr max-content;
  gap: 8px 0px;
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
    margin-bottom: 0;
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
  data: ListItem;
  onClose: () => void;
}

const ApiAccessInfo = ({ open, data, onClose }: ApiAccessInfoProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { GenericProxyCommandCode, openProxyModal } = useGenericProxy();

  const endPoint = useMemo(() => {
    if (!data.generic_proxy) {
      return `${window.location.origin}/${OPENAI_COMPATIBLE}`;
    }
    return `${window.location.origin}${MODEL_PROXY}/<YOUR_API_PATH>`;
  }, [data]);

  const isRanker = useMemo(() => {
    return _.includes(data.categories, modelCategoriesMap.reranker);
  }, [data]);

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (open && data.generic_proxy) {
      openProxyModal(data);
    }
  }, [open, data, openProxyModal]);

  return (
    <ScrollerModal
      open={open}
      style={{
        top: '20%'
      }}
      title={intl.formatMessage({ id: 'models.table.button.apiAccessInfo' })}
      width={600}
      destroyOnHidden
      closable={true}
      maskClosable={false}
      onOk={handleClose}
      onCancel={handleClose}
      footer={null}
    >
      <Tips>
        <dl className="tips">
          <dt>
            <BulbOutlined />
          </dt>
          <dd
            dangerouslySetInnerHTML={{
              __html: data.generic_proxy
                ? intl.formatMessage({
                    id: 'models.table.genericProxy'
                  })
                : intl.formatMessage({
                    id: 'models.table.button.apiAccessInfo.tips'
                  })
            }}
          ></dd>
        </dl>
      </Tips>

      <ApiAccessInfoWrapper>
        <span className="label">
          {intl.formatMessage({ id: 'models.table.apiAccessInfo.endpoint' })}
        </span>
        <span className="value">
          <AutoTooltip ghost maxWidth={data.generic_proxy ? 400 : 240}>
            {endPoint}
          </AutoTooltip>
          {!data.generic_proxy && (
            <APITAG color="geekblue">
              {isRanker
                ? intl.formatMessage({
                    id: 'models.table.apiAccessInfo.jinaCompatible'
                  })
                : intl.formatMessage({
                    id: 'models.table.apiAccessInfo.openaiCompatible'
                  })}
            </APITAG>
          )}
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
      {data.generic_proxy && (
        <div style={{ paddingLeft: 20, marginTop: 12 }}>
          {GenericProxyCommandCode}
        </div>
      )}
    </ScrollerModal>
  );
};
export default ApiAccessInfo;
