import IconFont from '@/components/icon-font';
import MarkdownViewer from '@/components/markdown-viewer';
import useRequestToken from '@/hooks/use-request-token';
import {
  DownOutlined,
  FileTextOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Empty, Spin, Tag, Tooltip } from 'antd';
import { some } from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
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
  onCollapse: (flag: boolean) => void;
  setIsGGUF: (flag: boolean) => void;
  selectedModel: any;
  collapsed: boolean;
  loadingModel?: boolean;
  modelSource: string;
}> = (props) => {
  const { onCollapse, setIsGGUF, collapsed, modelSource } = props;
  const intl = useIntl();
  const requestSource = useRequestToken();
  const [modelData, setModelData] = useState<any>(null);
  const [readmeText, setReadmeText] = useState<string | null>(null);
  const requestToken = useRef<any>(null);
  const axiosTokenRef = useRef<any>(null);
  const [isGGUFModel, setIsGGUFModel] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

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

  const removeMetadata = useCallback((str: string) => {
    let indexes = [];
    let index = str.indexOf('---');

    while (index !== -1) {
      indexes.push(index);
      if (indexes.length >= 2) {
        break;
      }
      index = str.indexOf('---', index + 1);
    }
    if (indexes.length >= 2) {
      return str.slice(indexes[1] + 3);
    }
    return str;
  }, []);

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
      // remove the meta data from readme
      const newReadme = removeMetadata(readme);

      setReadmeText(newReadme);
      const isGGUF = modelcard.tags?.includes('gguf');
      setIsGGUF(isGGUF);
      setIsGGUFModel(isGGUF);
    } catch (error) {
      setModelData(null);
      setReadmeText(null);
      setIsGGUF(false);
      setIsGGUFModel(false);
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
      setModelData({
        ...data?.Data,
        name: `${data.Data?.Path}/${data.Data?.Name}`
      });
      setReadmeText(data?.Data?.ReadMeContent);
      const isGGUF = some(
        data?.Data?.Tags,
        (tag: string) => tag?.indexOf('gguf') > -1
      );
      setIsGGUF(isGGUF);
      setIsGGUFModel(isGGUF);
    } catch (error) {
      setModelData(null);
      setReadmeText(null);
      setIsGGUF(false);
      setIsGGUFModel(false);
    }
  };

  const getModelCardData = async () => {
    if (!props.selectedModel.name) {
      setModelData(null);
      setReadmeText(null);
      return;
    }
    requestToken.current?.cancel?.();
    requestToken.current = requestSource();
    setLoading(true);
    if (modelSource === modelSourceMap.huggingface_value) {
      await getHuggingfaceModelDetail();
    } else if (modelSource === modelSourceMap.modelscope_value) {
      await getModelScopeModelDetail();
    }
    setLoading(false);
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
            href={`https://huggingface.co/${modelData?.id}`}
          >
            <IconFont
              type="icon-external-link"
              className="font-size-14"
            ></IconFont>
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
            href={`https://modelscope.cn/models/${modelData?.name}`}
          >
            <IconFont
              type="icon-external-link"
              className="font-size-14"
            ></IconFont>
          </Button>
        </Tooltip>
      );
    }
    return null;
  };

  const generateModeScopeImgLink = useCallback(
    (imgSrc: string) => {
      if (!imgSrc) {
        return '';
      }
      return `https://modelscope.cn/api/v1/models/${modelData?.name}/repo?Revision=${modelData?.Revision}&View=true&FilePath=${imgSrc}`;
    },
    [modelData]
  );

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
            <div className="flex-center">
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
              {isGGUFModel && (
                <Tag className="tag-item" color="magenta">
                  <span style={{ opacity: 0.65 }}>GGUF</span>
                </Tag>
              )}
            </div>
            {readmeText && isGGUFModel && (
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
                    paddingTop: collapsed ? 12 : 0,
                    maxHeight: collapsed ? 300 : 0
                  }}
                >
                  <MarkdownViewer
                    generateImgLink={
                      modelSource === modelSourceMap.modelscope_value
                        ? generateModeScopeImgLink
                        : undefined
                    }
                    content={readmeText}
                    theme="light"
                  ></MarkdownViewer>
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
      {!isGGUFModel && readmeText && (
        <div>
          <TitleWrapper>
            <div className="title">README.md</div>
          </TitleWrapper>
          <div className="card-wrapper">
            <Spin spinning={loading}>
              <MarkdownViewer
                generateImgLink={
                  modelSource === modelSourceMap.modelscope_value
                    ? generateModeScopeImgLink
                    : undefined
                }
                content={readmeText}
                theme="light"
              ></MarkdownViewer>
            </Spin>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(ModelCard);
