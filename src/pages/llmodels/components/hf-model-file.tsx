import { convertFileSize } from '@/utils';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Empty, Row, Space, Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { queryHuggingfaceModelFiles } from '../apis';
import FileType from '../config/file-type';
import '../style/hf-model-file.less';
import TitleWrapper from './title-wrapper';

interface HFModelFileProps {
  repo: string;
  onSelectFile?: (file: any) => void;
}
const HFModelFile: React.FC<HFModelFileProps> = (props) => {
  const intl = useIntl();
  const [dataSource, setDataSource] = useState<any>({
    fileList: [],
    loading: false
  });

  const [current, setCurrent] = useState<string>('');

  const handleSelectModelFile = (item: any) => {
    props.onSelectFile?.(item);
    setCurrent(item.path);
  };

  const handleFetchModelFiles = async () => {
    if (!props.repo) {
      setDataSource({ fileList: [], loading: false });
      handleSelectModelFile({});
      return;
    }
    setDataSource({ ...dataSource, loading: true });
    setCurrent('');
    try {
      const res = await queryHuggingfaceModelFiles({ repo: props.repo });
      const list = _.filter(res, (file: any) => {
        return _.endsWith(file.path, '.gguf');
      });
      const sortList = _.sortBy(list, (item: any) => item.size);
      setDataSource({ fileList: sortList, loading: false });
      handleSelectModelFile(list[0]);
    } catch (error) {
      setDataSource({ fileList: [], loading: false });
      handleSelectModelFile({});
    }
  };

  const getModelQuantizationType = (item: any) => {
    const name = _.split(item.path, '.').slice(0, -1).join('.');
    let quanType = _.toUpper(name.split('-').slice(-1)[0]);
    if (quanType.indexOf('.') > -1) {
      quanType = _.split(quanType, '.').pop();
    }
    console.log('quanType', quanType, FileType[quanType]);
    if (FileType[quanType] !== undefined) {
      return <span className="tag-item">{quanType}</span>;
    }
    return null;
  };

  const handleOnEnter = (e: any, item: any) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSelectModelFile(item);
    }
  };

  useEffect(() => {
    handleFetchModelFiles();
  }, [props.repo]);
  return (
    <div>
      <TitleWrapper>
        <span>Available Files ({dataSource.fileList.length || 0})</span>
      </TitleWrapper>
      <div style={{ padding: '16px 20px' }}>
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
                      <Space className="tags">
                        <span className="tag-item">
                          {convertFileSize(item.size)}
                        </span>
                        {getModelQuantizationType(item)}
                      </Space>
                      <div className="btn">
                        {/* <Button size="middle">
                          {item.path === current
                            ? intl.formatMessage({
                                id: 'common.button.selected'
                              })
                            : intl.formatMessage({
                                id: 'common.button.select'
                              })}
                        </Button> */}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            !dataSource.loading && (
              <Empty
                imageStyle={{ height: 'auto', marginTop: '20px' }}
                image={
                  <SearchOutlined
                    className="font-size-16"
                    style={{ color: 'var(--ant-color-text-tertiary)' }}
                  ></SearchOutlined>
                }
                description="No files found"
              />
            )
          )}
        </Spin>
      </div>
    </div>
  );
};

export default HFModelFile;
