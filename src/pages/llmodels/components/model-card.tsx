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
import {
  downloadModelFile,
  queryHuggingfaceModelDetail,
  queryModelScopeModelDetail
} from '../apis';
import { modelSourceMap } from '../config';
import '../style/model-card.less';
import TitleWrapper from './title-wrapper';

const ModelCard: React.FC<{
  selectedModel: any;
  onCollapse: (flag: boolean) => void;
  collapsed: boolean;
  loadingModel?: boolean;
  modelSource: string;
}> = (props) => {
  const { onCollapse, collapsed, modelSource } = props;
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

  // huggingface model card data
  const getHuggingfaceModelDetail = async () => {
    try {
      const [modelcard, readme] = await Promise.all([
        queryHuggingfaceModelDetail(
          { repo: props.selectedModel.name },
          {
            token: requestToken.current.token
          }
        ),
        loadFile(props.selectedModel.name, 'main')
      ]);

      setModelData(modelcard);
      setReadmeText(readme);
    } catch (error) {
      setModelData({});
      setReadmeText(null);
    }
  };

  const getModelScopeModelDetail = async () => {
    try {
      const data = await queryModelScopeModelDetail(
        {
          name: props.selectedModel.name
        },
        {
          token: requestToken.current.token
        }
      );
      console.log('detaildata==========', data);
      setModelData({
        ...data?.Data,
        name: `${data.Data?.Path}/${data.Data?.Name}`
      });
      setReadmeText(data?.Data?.ReadMeContent);
    } catch (error) {
      setModelData({});
      setReadmeText(null);
    }
  };

  const getModelCardData = async () => {
    if (!props.selectedModel.name) {
      setModelData(null);
      return;
    }
    requestToken.current?.cancel?.();
    requestToken.current = requestSource();
    if (modelSource === modelSourceMap.huggingface_value) {
      getHuggingfaceModelDetail();
    } else if (modelSource === modelSourceMap.modelscope_value) {
      getModelScopeModelDetail();
    }
  };

  const handleCollapse = useCallback(() => {
    onCollapse(!collapsed);
  }, [collapsed]);

  const generateModelLink = () => {
    const name = modelData?.id || modelData?.name;
    if (!name) {
      return null;
    }
    if (modelSource === modelSourceMap.huggingface_value) {
      return (
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
      );
    }

    if (modelSource === modelSourceMap.modelscope_value) {
      return (
        <Tooltip title={intl.formatMessage({ id: 'models.viewin.modelscope' })}>
          <Button
            size="small"
            type="link"
            target="_blank"
            href={`https://modelscope.cn/models/${modelData.name}`}
          >
            <IconFont type="icon-external-link"></IconFont>
          </Button>
        </Tooltip>
      );
    }
    return null;
  };

  useEffect(() => {
    getModelCardData();
  }, [props.selectedModel.name]);

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
        <div className="title">{modelData?.id || modelData?.name} </div>
        {generateModelLink()}
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
                    <FileTextOutlined className="m-r-2 text-tertiary" />{' '}
                    README.md
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
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginBlock: 20 }}
          ></Empty>
        )}
      </div>
    </>
  );
};

export default React.memo(ModelCard);
