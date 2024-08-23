import { convertFileSize } from '@/utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Empty, Row, Select, Spin, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { queryHuggingfaceModelFiles } from '../apis';
import FileType from '../config/file-type';
import '../style/hf-model-file.less';
import FileParts from './file-parts';
import TitleWrapper from './title-wrapper';

interface HFModelFileProps {
  repo: string;
  collapsed?: boolean;
  loadingModel?: boolean;
  onSelectFile?: (file: any) => void;
}

const pattern = /^(.*)-(\d+)-of-(\d+)\.gguf$/;

const HFModelFile: React.FC<HFModelFileProps> = (props) => {
  const { collapsed, loadingModel } = props;
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
    props.onSelectFile?.(item);
    setCurrent(item.path);
  };

  const parseFilename = (filename: string) => {
    const match = filename.match(pattern);

    if (match) {
      return {
        filename: match[1],
        part: parseInt(match[2], 10),
        total: parseInt(match[3], 10)
      };
    } else {
      return null;
    }
  };

  const generateGroupByFilename = useCallback((list: any[]) => {
    const data = _.find(list, (item: any) => {
      const parsed = parseFilename(item.path);
      return !!parsed;
    });

    // general file
    if (!data) {
      return list;
    }

    const newList = _.map(list, (item: any) => {
      const parsed = parseFilename(item.path);
      return {
        ...item,
        ...parsed
      };
    });

    const group = _.groupBy(newList, 'filename');

    return _.map(group, (value: any[], key: string) => {
      return {
        path: key,
        size: _.sumBy(value, 'size'),
        parts: value
      };
    });
  }, []);

  const handleFetchModelFiles = async () => {
    if (!props.repo) {
      setDataSource({ fileList: [], loading: false });
      handleSelectModelFile({});
      return;
    }
    axiosTokenRef.current?.abort?.();
    axiosTokenRef.current = new AbortController();
    setDataSource({ ...dataSource, loading: true });
    setCurrent('');
    try {
      const res = await queryHuggingfaceModelFiles(
        { repo: props.repo },
        {
          signal: axiosTokenRef.current.signal
        }
      );
      const fileList = _.filter(res, (file: any) => {
        return file.type === 'file';
      });

      const list = _.filter(fileList, (file: any) => {
        return _.endsWith(file.path, '.gguf') || _.includes(file.path, '.gguf');
      });

      const newList = generateGroupByFilename(list);

      console.log('newList==========', newList);
      const sortList = _.sortBy(newList, (item: any) => {
        return sortType === 'size' ? item.size : item.path;
      });
      setDataSource({ fileList: sortList, loading: false });
      handleSelectModelFile(sortList[0]);
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
    let itemPath = item.path;
    let path = _.split(itemPath, '/').pop();

    if (!_.endsWith(path, '.gguf') && !_.includes(path, '.gguf')) {
      path = `${path}.gguf`;
    }
    const name = _.split(path, '.').slice(0, -1).join('.');
    let quanType = _.toUpper(name.split('-').slice(-1)[0]);
    if (quanType.indexOf('.') > -1) {
      quanType = _.split(quanType, '.').pop();
    }
    if (FileType[quanType] !== undefined) {
      return (
        <Tag
          className="tag-item"
          color="cyan"
          style={{
            marginRight: 0
          }}
        >
          {quanType}
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

  useEffect(() => {
    handleFetchModelFiles();
  }, [props.repo]);

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
        style={{ maxHeight: collapsed ? 'max-content' : 'calc(100vh - 300px)' }}
      >
        <div style={{ padding: '16px 24px' }}>
          <Spin
            spinning={dataSource.loading || loadingModel}
            style={{ minHeight: 100 }}
          >
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
                              color="var(--color-white-1)"
                              overlayInnerStyle={{
                                width: 150,
                                color: 'var(--ant-color-text-secondary)'
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
              !loadingModel && (
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
};

export default HFModelFile;
