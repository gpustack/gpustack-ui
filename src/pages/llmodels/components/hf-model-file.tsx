import { convertFileSize } from '@/utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Empty, Row, Select, Spin, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { queryHuggingfaceModelFiles, queryModelScopeModelFiles } from '../apis';
import { modelSourceMap } from '../config';
import { getFileType } from '../config/file-type';
import '../style/hf-model-file.less';
import FileParts from './file-parts';
import TitleWrapper from './title-wrapper';

interface HFModelFileProps {
  selectedModel: any;
  collapsed?: boolean;
  loadingModel?: boolean;
  modelSource: string;
  ref: any;
  onSelectFile?: (file: any) => void;
}

const pattern = /^(.*)-(\d+)-of-(\d+)\.(.*)$/;

const filterReg = /\.(safetensors|gguf)$/i;
const includeReg = /\.(safetensors|gguf)$/i;
const filterRegGGUF = /\.(gguf)$/i;

const HFModelFile: React.FC<HFModelFileProps> = forwardRef((props, ref) => {
  const { collapsed, modelSource } = props;
  const intl = useIntl();
  const [dataSource, setDataSource] = useState<any>({
    fileList: [],
    loading: false
  });
  const [sortType, setSortType] = useState<string>('size');
  const [current, setCurrent] = useState<string>('');
  const modelFilesSortOptions = useRef<any[]>([
    {
      label: intl.formatMessage({ id: 'models.sort.size' }),
      value: 'size'
    },
    {
      label: intl.formatMessage({ id: 'models.sort.name' }),
      value: 'name'
    }
  ]);
  const axiosTokenRef = useRef<any>(null);

  const handleSelectModelFile = (item: any) => {
    console.log('handleSelectModelFile', item);
    props.onSelectFile?.(item);
    setCurrent(item.path);
  };

  const parseFilename = (filename: string) => {
    const match = filename.match(pattern);

    if (match) {
      return {
        filename: match[1],
        part: parseInt(match[2], 10),
        total: parseInt(match[3], 10),
        extension: match[4]
      };
    } else {
      return null;
    }
  };

  const generateGroupByFilename = useCallback((list: any[]) => {
    // general file
    const generalFileList = _.filter(list, (item: any) => {
      const parsed = parseFilename(item.path);
      return !parsed;
    });

    const newGeneralFileList = _.map(generalFileList, (item: any) => {
      return {
        ...item,
        fakeName: item.path
      };
    });

    // shard file

    const shardFileList = _.filter(list, (item: any) => {
      const parsed = parseFilename(item.path);
      return !!parsed;
    });

    const newShardFileList = _.map(shardFileList, (item: any) => {
      const parsed = parseFilename(item.path);
      return {
        ...item,
        ...parsed
      };
    });

    const group = _.groupBy(newShardFileList, 'filename');

    const shardFileListResult = _.map(
      group,
      (value: any[], filename: string) => {
        return {
          path: filename,
          fakeName: `${filename}*.${_.get(value, '[0].extension')}`,
          size: _.sumBy(value, 'size'),
          parts: value
        };
      }
    );

    return [...shardFileListResult, ...newGeneralFileList];
  }, []);

  // hugging face files
  const getHuggingfaceFiles = async () => {
    try {
      const res = await queryHuggingfaceModelFiles(
        { repo: props.selectedModel.name || '' },
        {
          signal: axiosTokenRef.current.signal
        }
      );
      const fileList = _.filter(res, (file: any) => {
        return file.type === 'file';
      });

      const list = _.filter(fileList, (file: any) => {
        return filterRegGGUF.test(file.path) || _.includes(file.path, '.gguf');
      });

      return list;
    } catch (error) {
      return [];
    }
  };

  // modelscope files
  const getModelScopeFiles = async () => {
    try {
      const data = await queryModelScopeModelFiles(
        {
          name: props.selectedModel.name || ''
        },
        {
          signal: axiosTokenRef.current.signal
        }
      );
      const fileList = _.filter(_.get(data, ['Data', 'Files']), (file: any) => {
        return filterRegGGUF.test(file.Path) || _.includes(file.Path, '.gguf');
      });

      const list = _.map(fileList, (item: any) => {
        return {
          path: item.Path,
          size: item.Size
        };
      });
      return list;
    } catch (error) {
      return [];
    }
  };

  const handleFetchModelFiles = async () => {
    if (!props.selectedModel.name) {
      setDataSource({ fileList: [], loading: false });
      handleSelectModelFile({});
      return;
    }
    axiosTokenRef.current?.abort?.();
    axiosTokenRef.current = new AbortController();
    setDataSource({ ...dataSource, loading: true });
    setCurrent('');
    try {
      let list = [];
      if (modelSourceMap.huggingface_value === modelSource) {
        list = await getHuggingfaceFiles();
      } else if (modelSourceMap.modelscope_value === modelSource) {
        list = await getModelScopeFiles();
      }

      const newList = generateGroupByFilename(list);
      const sortList = _.sortBy(newList, (item: any) => {
        return sortType === 'size' ? item.size : item.path;
      });

      handleSelectModelFile(sortList[0]);
      setDataSource({ fileList: sortList, loading: false });
    } catch (error) {
      setDataSource({ fileList: [], loading: false });
      handleSelectModelFile({});
    }
  };

  const handleSortChange = (value: string) => {
    const list = _.sortBy(dataSource.fileList, (item: any) => {
      return value === 'size' ? item.size : item.path;
    });
    setSortType(value);
    setDataSource({ ...dataSource, fileList: list });
  };

  const getModelQuantizationType = useCallback((item: any) => {
    let path = item.path;
    if (item?.parts?.length) {
      path = `${item.path}.gguf`;
    }
    const quanType = getFileType(path);
    if (quanType) {
      return (
        <Tag
          className="tag-item"
          color="cyan"
          style={{
            marginRight: 0
          }}
        >
          {_.toUpper(quanType)}
        </Tag>
      );
    }
    return null;
  }, []);

  const handleOnEnter = (e: any, item: any) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSelectModelFile(item);
    }
  };
  useImperativeHandle(ref, () => ({
    fetchModelFiles: handleFetchModelFiles
  }));

  useEffect(() => {
    if (!props.selectedModel.name) {
      setDataSource({ fileList: [], loading: false });
      handleSelectModelFile({});
    }
  }, [props.selectedModel.name]);

  useEffect(() => {
    return () => {
      axiosTokenRef.current?.abort?.();
    };
  }, []);

  return (
    <div>
      <TitleWrapper>
        <span>
          {intl.formatMessage({ id: 'models.available.files' })} (
          {dataSource.fileList.length || 0})
        </span>
        <Select
          value={sortType}
          onChange={handleSortChange}
          labelRender={({ label }) => {
            return (
              <span>
                {intl.formatMessage({ id: 'model.deploy.sort' })}: {label}
              </span>
            );
          }}
          options={modelFilesSortOptions.current}
          size="middle"
          style={{ width: '120px' }}
        ></Select>
      </TitleWrapper>
      <SimpleBar
        style={{
          height: collapsed ? 'max-content' : 'calc(100vh - 300px)'
        }}
      >
        <div style={{ padding: '16px 24px' }}>
          <Spin spinning={dataSource.loading} style={{ minHeight: 100 }}>
            {dataSource.fileList.length ? (
              <Row gutter={[16, 24]}>
                {_.map(dataSource.fileList, (item: any) => {
                  return (
                    <Col span={24} key={item.path}>
                      <div
                        className={classNames('hf-model-file', {
                          active: item.path === current
                        })}
                        tabIndex={0}
                        onClick={() => handleSelectModelFile(item)}
                        onKeyDown={(e) => handleOnEnter(e, item)}
                      >
                        <div className="title">{item.path}</div>
                        <div className="tags">
                          <Tag
                            className="tag-item"
                            color="green"
                            style={{
                              marginRight: 0
                            }}
                          >
                            <span style={{ opacity: 0.65 }}>
                              {convertFileSize(item.size)}
                            </span>
                          </Tag>
                          {getModelQuantizationType(item)}
                          {item.parts && item.parts.length > 1 && (
                            <Tooltip
                              overlayInnerStyle={{
                                width: 180,
                                padding: 0
                              }}
                              title={
                                <FileParts fileList={item.parts}></FileParts>
                              }
                            >
                              <Tag
                                className="tag-item"
                                color="purple"
                                style={{
                                  marginRight: 0
                                }}
                              >
                                <span style={{ opacity: 1 }}>
                                  <InfoCircleOutlined className="m-r-5" />
                                  {item.parts.length} parts
                                </span>
                              </Tag>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              !dataSource.loading &&
              !dataSource.fileList.length && (
                <Empty
                  imageStyle={{ height: 'auto', marginTop: '20px' }}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={intl.formatMessage({
                    id: 'models.search.nofiles'
                  })}
                />
              )
            )}
          </Spin>
        </div>
      </SimpleBar>
    </div>
  );
});

export default memo(HFModelFile);
