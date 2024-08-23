import HighlightCode from '@/components/highlight-code';
import IconFont from '@/components/icon-font';
import useRequestToken from '@/hooks/use-request-token';
import {
  DownOutlined,
  FileTextOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Empty, Tag, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { downloadModelFile, queryHuggingfaceModelDetail } from '../apis';
import '../style/model-card.less';
import TitleWrapper from './title-wrapper';

const ModelCard: React.FC<{
  repo: string;
  onCollapse: (flag: boolean) => void;
  collapsed: boolean;
  loadingModel?: boolean;
}> = (props) => {
  const { repo, onCollapse, collapsed, loadingModel } = props;
  const intl = useIntl();
  const requestSource = useRequestToken();
  const [modelData, setModelData] = useState<any>({});
  const [readmeText, setReadmeText] = useState<string | null>(null);
  const requestToken = useRef<any>(null);
  const axiosTokenRef = useRef<any>(null);

  const loadFile = async (repo: string, sha: string) => {
    try {
      axiosTokenRef.current?.abort?.();
      axiosTokenRef.current = new AbortController();
      const res = await downloadModelFile(
        {
          repo,
          revision: sha,
          path: 'README.md'
        },
        {
          signal: axiosTokenRef.current.signal
        }
      );
      return res || '';
    } catch (error) {
      return '';
    }
  };

  const getModelCardData = async () => {
    if (!repo) {
      setModelData(null);
      return;
    }
    requestToken.current?.cancel?.();
    requestToken.current = requestSource();
    try {
      const [modelcard, readme] = await Promise.all([
        queryHuggingfaceModelDetail(
          { repo },
          {
            token: requestToken.current.token
          }
        ),
        loadFile(repo, 'main')
      ]);

      setModelData(modelcard);
      setReadmeText(readme);
    } catch (error) {
      setModelData({});
    }
  };

  const handleCollapse = useCallback(() => {
    onCollapse(!collapsed);
  }, [collapsed]);

  useEffect(() => {
    getModelCardData();
  }, [repo]);

  useEffect(() => {
    if (!readmeText) {
      onCollapse(false);
    }
  }, [readmeText]);

  useEffect(() => {
    return () => {
      requestToken.current?.cancel?.();
      axiosTokenRef.current?.abort?.();
    };
  }, []);

  return (
    <>
      <TitleWrapper>
        <div className="title">{modelData?.id} </div>
        {modelData?.id && (
          <Tooltip title={intl.formatMessage({ id: 'models.viewin.hf' })}>
            <Button
              size="small"
              type="link"
              target="_blank"
              href={`https://huggingface.co/${modelData.id}`}
            >
              <IconFont type="icon-external-link"></IconFont>
            </Button>
          </Tooltip>
        )}
      </TitleWrapper>
      <div className="card-wrapper">
        {modelData ? (
          <div className="model-card-wrap">
            <div className="flex-between flex-center">
              {modelData.config?.model_type && (
                <Tag className="tag-item" color="gold">
                  <span style={{ opacity: 0.65 }}>
                    <span className="m-r-5">
                      {intl.formatMessage({ id: 'models.architecture' })}:
                    </span>
                    {modelData.config?.model_type}
                  </span>
                </Tag>
              )}
            </div>
            {readmeText && (
              <div
                style={{
                  borderRadius: 4,
                  marginTop: 16,
                  overflow: 'hidden'
                }}
              >
                <span className="mkd-title" onClick={handleCollapse}>
                  <span>
                    <FileTextOutlined className="m-r-2" /> README.md
                  </span>
                  <span>
                    {collapsed ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </span>
                <SimpleBar
                  style={{
                    maxHeight: collapsed ? 300 : 0
                  }}
                >
                  <HighlightCode
                    code={readmeText}
                    lang="markdown"
                    copyable={false}
                    theme="light"
                  ></HighlightCode>
                </SimpleBar>
              </div>
            )}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>
        )}
      </div>
    </>
  );
};

export default React.memo(ModelCard);
