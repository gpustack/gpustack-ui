import IconFont from '@/components/icon-font';
import MarkdownViewer from '@/components/markdown-viewer';
import SimpleOverlay from '@/components/simple-overlay';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import useRequestToken from '@/hooks/use-request-token';
import {
  DownOutlined,
  FileMarkdownOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Empty, Spin, Tooltip } from 'antd';
import { some } from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import styled from 'styled-components';
import {
  downloadModelFile,
  queryHuggingfaceModelDetail,
  queryModelScopeModelDetail
} from '../apis';
import { modelSourceMap } from '../config';
import '../style/model-card.less';
import TitleWrapper from './title-wrapper';

const MkdTitle = styled.span`
  cursor: pointer;
  background-color: var(--ant-color-fill-tertiary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  height: 36px;
`;

const MarkDownTitle: React.FC<{
  collapsed: boolean;
  loading: boolean;
  onCollapse: () => void;
}> = ({ collapsed, loading, onCollapse }) => {
  const intl = useIntl();
  return (
    <MkdTitle onClick={onCollapse}>
      <span>
        <FileMarkdownOutlined className="m-r-2 text-tertiary" /> README.md
      </span>
      <span>
        {collapsed ? (
          <DownOutlined />
        ) : loading ? (
          <Spin spinning={true} size="small"></Spin>
        ) : (
          <RightOutlined />
        )}
      </span>
    </MkdTitle>
  );
};

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
  const loadConfigTokenRef = useRef<any>(null);
  const loadConfigJsonTokenRef = useRef<any>(null);
  const [isGGUFModel, setIsGGUFModel] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const modelTags = useMemo(() => {
    if (modelSource === modelSourceMap.huggingface_value) {
      return modelData?.pipeline_tag ? [modelData?.pipeline_tag] : [];
    }
    if (modelSource === modelSourceMap.modelscope_value) {
      const tasks = modelData?.Tasks || [];
      return tasks.map((task: any) => task?.Name)?.filter((val: string) => val);
    }
    return [];
  }, [modelSource, modelData]);

  const modelType = useMemo(() => {
    if (modelSource === modelSourceMap.huggingface_value) {
      return modelData?.config?.model_type || modelData?.ModelType?.[0];
    }
    if (modelSource === modelSourceMap.modelscope_value) {
      return modelData?.ModelType?.[0];
    }
  }, [modelData, modelSource]);

  const loadFile = useCallback(async (repo: string, sha: string) => {
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
  }, []);

  const handleOnCollapse = (readmeText: any) => {
    if (!readmeText) {
      onCollapse(false);
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
      handleOnCollapse(newReadme);
      const isGGUF = modelcard.tags?.includes('gguf');
      setIsGGUF(isGGUF);
      setIsGGUFModel(isGGUF);
    } catch (error) {
      setModelData(null);
      setReadmeText(null);
      handleOnCollapse(null);
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
      handleOnCollapse(data?.Data?.ReadMeContent);
      const isGGUF = some(
        data?.Data?.Tags,
        (tag: string) => tag?.indexOf('gguf') > -1
      );
      setIsGGUF(isGGUF);
      setIsGGUFModel(isGGUF);
    } catch (error) {
      setModelData(null);
      setReadmeText(null);
      handleOnCollapse(null);
    }
  };

  const getModelCardData = async () => {
    if (!props.selectedModel?.name) {
      setModelData(null);
      setReadmeText(null);
      handleOnCollapse(null);
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
      if (modelSource === modelSourceMap.modelscope_value) {
        return `https://modelscope.cn/api/${GPUSTACK_API_BASE_URL}/models/${modelData?.name}/repo?Revision=${modelData?.Revision}&View=true&FilePath=${imgSrc}`;
      }
      if (modelSource === modelSourceMap.huggingface_value) {
        return `https://huggingface.co/${modelData?.id}/resolve/main/${imgSrc}`;
      }
      return '';
    },
    [modelSource, modelData?.name, modelData?.id, modelData?.Revision]
  );

  useEffect(() => {
    if (!props.selectedModel.name) return;

    getModelCardData();
    setIsGGUFModel(props.selectedModel.isGGUF);
    setModelData(() => ({
      ...modelData,
      id: props.selectedModel.name,
      name: props.selectedModel.name,
      isGGUF: props.selectedModel.isGGUF
    }));
  }, [props.selectedModel?.name, props.selectedModel?.isGGUF]);

  useEffect(() => {
    return () => {
      requestToken.current?.cancel?.();
      axiosTokenRef.current?.abort?.();
      loadConfigTokenRef.current?.abort?.();
      loadConfigJsonTokenRef.current?.abort?.();
    };
  }, []);

  return (
    <>
      <TitleWrapper style={{ paddingInline: 24 }}>
        <div className="title">{modelData?.id || modelData?.name} </div>
        {generateModelLink()}
      </TitleWrapper>
      <div className="card-wrapper">
        {modelData ? (
          <div className="model-card-wrap">
            <div className="flex-center flex-wrap gap-8">
              {modelType && (
                <ThemeTag className="tag-item" color="gold" opacity={0.65}>
                  <span className="m-r-5">
                    {intl.formatMessage({ id: 'models.architecture' })}:
                  </span>
                  {modelType}
                </ThemeTag>
              )}
              {isGGUFModel && (
                <ThemeTag className="tag-item" color="magenta" opacity={0.65}>
                  GGUF
                </ThemeTag>
              )}
              {!!modelTags.length &&
                modelTags.map((tag: string, index: number) => {
                  return (
                    <ThemeTag
                      className="tag-item"
                      color="geekblue"
                      key={index}
                      opacity={0.65}
                    >
                      {tag}
                    </ThemeTag>
                  );
                })}
            </div>
            {readmeText && isGGUFModel && (
              <div
                style={{
                  borderRadius: 4,
                  marginTop: 16,
                  overflow: 'hidden'
                }}
              >
                <MarkDownTitle
                  onCollapse={handleCollapse}
                  collapsed={collapsed}
                  loading={loading}
                ></MarkDownTitle>
                <Spin spinning={loading && collapsed}>
                  <SimpleOverlay
                    style={{
                      paddingTop: collapsed ? 12 : 0,
                      maxHeight: collapsed ? 300 : 0
                    }}
                  >
                    <MarkdownViewer
                      generateImgLink={generateModeScopeImgLink}
                      content={readmeText}
                      theme="light"
                    ></MarkdownViewer>
                  </SimpleOverlay>
                </Spin>
              </div>
            )}
          </div>
        ) : (
          <>
            {!loading && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginBlock: 20 }}
              ></Empty>
            )}
          </>
        )}
      </div>
      {!isGGUFModel && (
        <Spin spinning={loading}>
          <div style={{ minHeight: 200 }}>
            {readmeText && (
              <>
                <TitleWrapper style={{ paddingInline: 24 }}>
                  <span className="title">README.md</span>
                </TitleWrapper>
                <div className="card-wrapper">
                  <MarkdownViewer
                    generateImgLink={generateModeScopeImgLink}
                    content={readmeText}
                    theme="light"
                  ></MarkdownViewer>
                </div>
              </>
            )}
          </div>
        </Spin>
      )}
    </>
  );
};

export default ModelCard;
